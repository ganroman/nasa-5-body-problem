import json
from types import SimpleNamespace

import pytest

from app.config import Settings
from app.si import explain as si

KEY = "sk-test-secret-123"

INPUTS = {
    "cargo": "Science kit",
    "component": "Nomex pouch",
    "hazard": "fire",
    "scenario": "ISS cabin, 21% O2, 101 kPa",
    "comparisons": [{"field": "oxygen", "status": "within_tolerance"}],
    "sources": [
        {"source_id": "psi-bass-1", "excerpt": "Flame spread observed at 21% O2.", "locator": "Table 3"},
        {"source_id": "nasa-std-6001", "excerpt": "Materials shall be tested.", "locator": "4.2"},
    ],
}


def settings(**over):
    base = dict(database_url="postgresql://x", si_base_url="https://eustella.example/v1", si_api_key=KEY, si_model="m1")
    return Settings(**{**base, **over})


@pytest.fixture(autouse=True)
def configured(monkeypatch):
    monkeypatch.setattr(si, "get_settings", lambda: settings())


class FakeClient:
    def __init__(self, content=None, exc=None):
        self.content, self.exc, self.calls = content, exc, []
        self.chat = SimpleNamespace(completions=SimpleNamespace(create=self._create))

    def _create(self, **kw):
        self.calls.append(kw)
        if self.exc:
            raise self.exc
        return SimpleNamespace(choices=[SimpleNamespace(message=SimpleNamespace(content=self.content))])


def reply(*sentences):
    return json.dumps({"sentences": [{"text": t, "source_ids": ids} for t, ids in sentences]})


def test_unavailable_when_settings_missing(monkeypatch):
    monkeypatch.setattr(si, "get_settings", lambda: settings(si_api_key=None))
    client = FakeClient(reply(("x", ["psi-bass-1"])))
    out = si.explain(INPUTS, client)
    assert out["status"] == "unavailable" and "SI_API_KEY" in out["reason"]
    assert client.calls == []


def test_happy_path():
    client = FakeClient(reply(("Flame spread was observed at 21% O2.", ["psi-bass-1"]), ("Testing is required.", ["nasa-std-6001", "psi-bass-1"])))
    out = si.explain(INPUTS, client)
    assert out["status"] == "ok"
    assert out["cited_source_ids"] == ["nasa-std-6001", "psi-bass-1"]
    assert out["model"] == "m1" and len(out["sentences"]) == 2
    call = client.calls[0]
    assert call["model"] == "m1" and call["response_format"] == {"type": "json_object"}
    assert call["messages"][0]["role"] == "system" and si.NO_FINDING in call["messages"][0]["content"]
    assert "psi-bass-1" in call["messages"][1]["content"]


def test_hallucinated_source_rejected():
    out = si.explain(INPUTS, FakeClient(reply(("Real.", ["psi-bass-1"]), ("Made up.", ["nasa-fake-9"]))))
    assert out["status"] == "rejected" and out["invalid_source_ids"] == ["nasa-fake-9"]


def test_uncited_sentence_rejected():
    out = si.explain(INPUTS, FakeClient(reply(("Real.", ["psi-bass-1"]), ("It will be fine.", []))))
    assert out["status"] == "rejected" and out["uncited_sentence_indexes"] == [1]


def test_no_finding_sentence_allowed_without_citation():
    out = si.explain(INPUTS, FakeClient(reply((si.NO_FINDING, []))))
    assert out["status"] == "ok" and out["cited_source_ids"] == []


def test_no_sources_short_circuits():
    client = FakeClient(reply(("x", ["y"])))
    out = si.explain({**INPUTS, "sources": []}, client)
    assert out["status"] == "ok" and out["sentences"][0]["text"] == si.NO_FINDING
    assert client.calls == []


def test_non_json_wrapper_parsed():
    text = "Sure! Here you go:\n```json\n" + reply(("Observed at 21% O2.", ["psi-bass-1"])) + "\n```"
    out = si.explain(INPUTS, FakeClient(text))
    assert out["status"] == "ok" and out["cited_source_ids"] == ["psi-bass-1"]


def test_garbage_response_is_error():
    out = si.explain(INPUTS, FakeClient("I cannot help with that."))
    assert out["status"] == "error"


def test_provider_exception_is_error_without_key():
    out = si.explain(INPUTS, FakeClient(exc=RuntimeError(f"401 bad key {KEY}")))
    assert out["status"] == "error"
    assert KEY not in json.dumps(out)


def test_cache_key_stable_under_ordering():
    reordered = dict(reversed(list(INPUTS.items())))
    assert si.cache_key(INPUTS, "m1") == si.cache_key(reordered, "m1")
    assert si.cache_key(INPUTS, "m1") != si.cache_key(INPUTS, "m2")
    assert len(si.cache_key(INPUTS)) == 64


class FakeSession:
    def __init__(self):
        self.rows, self.commits = [], 0

    def scalar(self, stmt):
        key = stmt.whereclause.right.value
        return next((r for r in self.rows if r.cache_key == key), None)

    def add(self, row):
        self.rows.append(row)

    def commit(self):
        self.commits += 1


def test_explain_cached_stores_ok_and_hits():
    session = FakeSession()
    client = FakeClient(reply(("Observed.", ["psi-bass-1"])))
    first = si.explain_cached(session, INPUTS, client)
    second = si.explain_cached(session, INPUTS, client)
    assert first["status"] == "ok" and first["cached"] is False
    assert second["cached"] is True and second["sentences"] == first["sentences"]
    assert len(client.calls) == 1 and len(session.rows) == 1
    assert session.rows[0].citations_valid is True


def test_explain_cached_does_not_store_rejected():
    session = FakeSession()
    out = si.explain_cached(session, INPUTS, FakeClient(reply(("Bad.", ["nope"]))))
    assert out["status"] == "rejected" and session.rows == []


class ToolClient:
    """Returns scripted messages in order: tool calls first, then a final JSON reply."""

    def __init__(self, *messages):
        self.messages, self.calls = list(messages), []
        self.chat = SimpleNamespace(completions=SimpleNamespace(create=self._create))

    def _create(self, **kw):
        self.calls.append(kw)
        return SimpleNamespace(choices=[SimpleNamespace(message=self.messages.pop(0))])


def tool_call(name, args, id="c1"):
    return SimpleNamespace(content="", tool_calls=[SimpleNamespace(id=id, function=SimpleNamespace(name=name, arguments=json.dumps(args)))])


def final(text):
    return SimpleNamespace(content=text, tool_calls=None)


LOOKUP = {
    "name": "search_observations", "description": "d", "parameters": {"type": "object", "properties": {}},
    "fn": lambda **kw: [{"source_id": "obs-7", "excerpt": "O2 30%.", "locator": "t#row=7"}],
}


def test_tool_records_become_citable():
    client = ToolClient(tool_call("search_observations", {"o2_min_percent": 30}), final(reply(("A test reached 30% O2.", ["obs-7"]))))
    out = si.explain(INPUTS, client, tools=[LOOKUP])
    assert out["status"] == "ok" and out["cited_source_ids"] == ["obs-7"]
    assert out["tool_records"][0]["source_id"] == "obs-7"
    assert client.calls[1]["messages"][-1]["role"] == "tool"


def test_ids_never_returned_are_still_rejected():
    client = ToolClient(tool_call("search_observations", {}), final(reply(("Made up.", ["obs-999"]))))
    assert si.explain(INPUTS, client, tools=[LOOKUP])["status"] == "rejected"


def test_tool_rounds_are_capped_and_last_round_forbids_tools():
    msgs = [tool_call("search_observations", {}, id=f"c{i}") for i in range(si.MAX_TOOL_ROUNDS)]
    client = ToolClient(*msgs, final(reply(("A test reached 30% O2.", ["obs-7"]))))
    out = si.explain(INPUTS, client, tools=[LOOKUP])
    assert out["status"] == "ok"
    assert len(client.calls) == si.MAX_TOOL_ROUNDS + 1
    assert "tools" not in client.calls[-1] and client.calls[-1]["response_format"] == {"type": "json_object"}


def test_bad_tool_arguments_go_back_to_the_model():
    bad = {**LOOKUP, "fn": lambda **kw: (_ for _ in ()).throw(TypeError("unexpected argument"))}
    client = ToolClient(tool_call("search_observations", {"nope": 1}), final(reply(("Flame spread was observed at 21% O2.", ["psi-bass-1"]))))
    out = si.explain(INPUTS, client, tools=[bad])
    assert out["status"] == "ok"
    assert "error" in json.loads(client.calls[1]["messages"][-1]["content"])


def test_prose_after_tools_gets_one_json_retry():
    client = ToolClient(tool_call("search_observations", {}), final("A test reached 30% O2."),
                        final(reply(("A test reached 30% O2.", ["obs-7"]))))
    out = si.explain(INPUTS, client, tools=[LOOKUP])
    assert out["status"] == "ok" and len(client.calls) == 3
    assert client.calls[-1]["response_format"] == {"type": "json_object"} and "tools" not in client.calls[-1]
