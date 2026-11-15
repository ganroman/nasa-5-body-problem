"""Grounded SI explanation via an OpenAI-compatible provider (Eustella AI).

Inputs (dict, JSON-serialisable):
  cargo, component, hazard, scenario: short summaries (str or dict)
  comparisons: computed comparison results (list/dict), produced by app.logic
  sources: [{"source_id": str, "excerpt": str, "locator": str}]
  question: optional user question (str)

Optional tools: read-only lookups ([{"name", "description", "parameters", "fn"}]) the model may call
to fetch more records. `fn(**args)` returns records shaped like `sources` (or {"records", "note"});
their ids become citable.
Citations are still validated against records the backend actually supplied or returned.
"""

import hashlib
import json
from typing import Any

from openai import OpenAI
from sqlalchemy import select
from sqlalchemy.exc import IntegrityError

from app.config import get_settings
from app.models import SIExplanation

NO_FINDING = "No applicable finding in our curated sources."
TIMEOUT_S = 30.0
MAX_TOOL_ROUNDS = 3  # each round is one provider request; Eustella allows 20/min for the whole org

SYSTEM_PROMPT = f"""You explain fire-safety evidence for one cargo item in the Cargo Passport tool.

Rules, all mandatory:
1. Explain ONLY the computed comparisons and source excerpts supplied in the user message. Do not use outside knowledge.
2. Every sentence must cite one or more source ids taken from the supplied "sources" list, exactly as written. Never cite an id that is not in that list.
3. If nothing in the supplied sources applies, reply with exactly one sentence: "{NO_FINDING}" with an empty source_ids list.
4. Do not invent outcomes, numbers, units, requirements, emergency instructions or safety verdicts. Do not say the cargo is safe, unsafe, approved or rejected. Only repeat numbers that appear in the supplied comparisons or excerpts.
5. Unknown values stay unknown: do not describe an unknown as a match or a mismatch.
6. If the question asks for a prediction the evidence does not cover (for example "will it burn on the Moon?"), do not predict. State what the supplied evidence does cover and what it does not, citing the sources.
7. Distinguish measured observations from requirements or guidance when the excerpts do.
8. A sentence citing several sources must be true of every one of them; otherwise write separate sentences.
9. Use technical terms exactly as written in the excerpts; do not expand or rename abbreviations.
10. If tools are available, you may call them to look up more records; records they return may be cited like supplied sources. Use them only when the supplied sources do not answer the question. If a tool note says results were truncated, do not generalise beyond the records returned.

Respond with a single JSON object and nothing else:
{{"sentences": [{{"text": "<one sentence>", "source_ids": ["<supplied source id>"]}}]}}"""


def _canonical(inputs: dict) -> str:
    return json.dumps(inputs, sort_keys=True, separators=(",", ":"), ensure_ascii=False)


def cache_key(inputs: dict, model: str | None = None) -> str:
    model = model if model is not None else (get_settings().si_model or "")
    return hashlib.sha256(f"{_canonical(inputs)}\n{model}".encode()).hexdigest()


def build_messages(inputs: dict) -> list[dict[str, str]]:
    return [
        {"role": "system", "content": SYSTEM_PROMPT},
        {"role": "user", "content": "Evidence bundle (JSON):\n" + _canonical(inputs)},
    ]


def _first_json_object(text: str) -> Any:
    try:
        return json.loads(text)
    except (json.JSONDecodeError, TypeError):
        pass
    decoder = json.JSONDecoder()
    i = text.find("{")
    while i != -1:
        try:
            obj, _ = decoder.raw_decode(text, i)
            if isinstance(obj, dict):
                return obj
        except json.JSONDecodeError:
            pass
        i = text.find("{", i + 1)
    return None


def _redact(text: str, secret: str | None) -> str:
    return text.replace(secret, "[redacted]") if secret else text


def _run(client: Any, model: str, messages: list[dict], tools: list[dict], allowed: set[str], fetched: list[dict]) -> str:
    """Chat loop. Tool results add their record ids to `allowed` and records to `fetched`; the last round forbids tools."""
    by_name = {t["name"]: t for t in tools}
    specs = [{"type": "function", "function": {k: t[k] for k in ("name", "description", "parameters")}} for t in tools]
    common = dict(model=model, temperature=0, max_tokens=4096,
                  # Eustella reasoning off: faster and keeps reasoning text out of the JSON reply.
                  extra_body={"chat_template_kwargs": {"enable_thinking": False}})
    for round_ in range(MAX_TOOL_ROUNDS + 1):
        if specs and round_ < MAX_TOOL_ROUNDS:
            resp = client.chat.completions.create(messages=messages, tools=specs, **common)
        else:
            resp = client.chat.completions.create(messages=messages, response_format={"type": "json_object"}, **common)
        msg = resp.choices[0].message
        calls = getattr(msg, "tool_calls", None) or []
        if not calls or not specs or round_ == MAX_TOOL_ROUNDS:
            content = msg.content or ""
            data = _first_json_object(content)
            if specs and round_ < MAX_TOOL_ROUNDS and not (isinstance(data, dict) and "sentences" in data):
                # JSON mode is off while tools are offered; ask once more for the required JSON.
                messages += [{"role": "assistant", "content": content},
                             {"role": "user", "content": "Reply now with the required JSON object only."}]
                resp = client.chat.completions.create(messages=messages, response_format={"type": "json_object"}, **common)
                return resp.choices[0].message.content or ""
            return content
        messages.append({"role": "assistant", "content": msg.content or "", "tool_calls": [
            {"id": c.id, "type": "function", "function": {"name": c.function.name, "arguments": c.function.arguments}}
            for c in calls]})
        for c in calls:
            messages.append({"role": "tool", "tool_call_id": c.id, "content": json.dumps(_call_tool(by_name, c, allowed, fetched))})
    return ""


def _call_tool(by_name: dict, call: Any, allowed: set[str], fetched: list[dict]) -> dict:
    tool = by_name.get(call.function.name)
    if tool is None:
        return {"error": f"unknown tool {call.function.name}"}
    try:
        args = json.loads(call.function.arguments or "{}")
        out = tool["fn"](**args)
    except Exception as e:  # bad arguments from the model go back to it as an error, not a crash
        return {"error": f"{type(e).__name__}: {e}"}
    # A tool returns a list of records, or {"records": [...], "note": "..."} to add context (e.g. truncation).
    records = out["records"] if isinstance(out, dict) else out
    allowed.update(r["source_id"] for r in records)
    fetched += [r for r in records if r not in fetched]
    return out if isinstance(out, dict) else {"records": records}


def explain(inputs: dict, client: Any = None, tools: list[dict] | None = None) -> dict:
    s = get_settings()
    missing = [n for n in ("si_base_url", "si_api_key", "si_model") if not getattr(s, n)]
    if missing:
        return {"status": "unavailable", "reason": "SI not configured: " + ", ".join(m.upper() for m in missing)}

    allowed = {src["source_id"] for src in inputs.get("sources") or []}
    if not allowed:
        # Nothing to ground on; answering without a provider call is the only honest output.
        return {
            "status": "ok",
            "sentences": [{"text": NO_FINDING, "source_ids": []}],
            "cited_source_ids": [],
            "model": s.si_model,
        }

    try:
        client = client or OpenAI(base_url=s.si_base_url, api_key=s.si_api_key, timeout=TIMEOUT_S, max_retries=1)
        fetched: list[dict] = []
        content = _run(client, s.si_model, build_messages(inputs), tools or [], allowed, fetched)
    except Exception as e:  # any provider/network failure becomes an honest error state
        return {"status": "error", "reason": _redact(f"provider error: {type(e).__name__}: {e}", s.si_api_key)}

    data = _first_json_object(content)
    sentences = data.get("sentences") if isinstance(data, dict) else None
    if not isinstance(sentences, list) or not sentences or not all(
        isinstance(x, dict) and isinstance(x.get("text"), str) and isinstance(x.get("source_ids", []), list)
        for x in sentences
    ):
        return {"status": "error", "reason": "malformed provider response", "model": s.si_model}

    invalid: list[str] = []
    uncited: list[int] = []
    for i, sent in enumerate(sentences):
        ids = sent.get("source_ids") or []
        if not ids and sent["text"].strip() != NO_FINDING:
            uncited.append(i)
        invalid += [str(x) for x in ids if x not in allowed and str(x) not in invalid]
    if invalid or uncited:
        return {
            "status": "rejected",
            "invalid_source_ids": invalid,
            "uncited_sentence_indexes": uncited,
            "sentences": sentences,
            "tool_records": fetched,
            "model": s.si_model,
        }

    cited = sorted({x for sent in sentences for x in sent.get("source_ids") or []})
    return {
        "status": "ok",
        "sentences": [{"text": x["text"], "source_ids": list(x.get("source_ids") or [])} for x in sentences],
        "cited_source_ids": cited,
        "tool_records": fetched,
        "model": s.si_model,
    }


def explain_cached(session: Any, inputs: dict, client: Any = None, tools: list[dict] | None = None) -> dict:
    model = get_settings().si_model or ""
    key = cache_key({**inputs, "_tools": sorted(t["name"] for t in tools or [])}, model)
    row = session.scalar(select(SIExplanation).where(SIExplanation.cache_key == key))
    if row is not None:
        return {**row.output, "cached": True}

    result = explain(inputs, client, tools)
    if result["status"] == "ok":
        session.add(
            SIExplanation(
                cache_key=key,
                model=result["model"],
                inputs=inputs,
                output=result,
                cited_source_ids=result["cited_source_ids"],
                citations_valid=True,
            )
        )
        try:
            session.commit()
        except IntegrityError:  # an identical request cached the same answer first; ours is still valid
            session.rollback()
    return {**result, "cached": False}
