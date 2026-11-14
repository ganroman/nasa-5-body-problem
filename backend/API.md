# Cargo Passport API: guide for the frontend

How to build the cargo → component → environment → evidence screen ([build plan §2 and §4](../docs/build-plan.md#2-the-complete-user-journey)) on top of this API. Full endpoint list: [README](README.md#api). Interactive docs: `<API_URL>/docs`.

- **Base URL:** `http://localhost:8000` locally (`uv run uvicorn app.main:app --reload` in `backend/`), the Vercel URL (`https://<project>.vercel.app`) once deployed. Keep it in one constant.
- **CORS:** the API accepts requests from `https://ganroman.github.io` and `http://localhost:8000`. Tell the backend owner if the page is served from another origin.
- **Units in requests and responses:** O₂ as a fraction (`0.21`), pressure kPa, airflow m/s. Convert for display: O₂ × 100 → %, airflow × 100 → cm/s.
- **Cold start:** the first request after an idle period can take a few seconds while the function starts. Show a loading state.

## 1. Load the pickers

```js
const API = "http://localhost:8000";
const get = (path) => fetch(API + path).then((r) => r.json());
const post = (path, body) => fetch(API + path, {
  method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify(body),
}).then((r) => r.json());

const cargo = await get("/cargo");               // [{slug, name, purpose, provenance}]
const environments = await get("/environments"); // [{id, name, domain, gravity_regime, maturity, spaces: {...}}]
const item = await get("/cargo/portable-science-instrument");
// item.components: [{name, original_label, material_id, identity_confidence, mass_share}]
```

`environments[i].spaces` maps a space name (`cabin`, `hold`, `rack`, `room`, `classroom`, `compartment`...) to its conditions:

```json
"cabin": {
  "o2_fraction": {"min": 0.21, "max": 0.21, "status": "sourced", "source_id": "doc-env-iss",
                  "locator": "§5 ... bullet 2", "note": "'roughly 21% oxygen'; nominal ..."},
  "airflow_ms":  {"min": null, "max": null, "status": "unknown", ...}
}
```

Most environments only have `cabin`. Offer a space picker when there is more than one.

## 2. Compare (the main call)

Call it whenever the cargo, environment, space, use state or an override changes.

```js
const body = {
  cargo_slug: "portable-science-instrument",   // or cargo: {name, components: [...]} for edited cargo
  scenario: {
    environment_id: "iss",
    space: "cabin",                             // optional, default "cabin"
    use_state: "stowed",                        // stowed | operating | charging | maintenance
    overrides: { airflow_ms: 0.1 },             // optional; only what the user changed
  },
};
const res = await post("/scenarios/compare", body);
```

Gravity cannot be overridden; it follows the environment. Reset = send `overrides: {}`.

**Response, top level:** `cargo, environment, use_state, route_id, conditions, incomplete_dimensions, components, coverage, observations, findings, sources, tolerances, limitations`.

**`conditions[dim]`**: suggested value, its provenance, the user's override and the effective value.

```json
"airflow_ms": {
  "suggested_min": null, "suggested_max": null, "suggested_status": "unknown",
  "suggested_source_id": "doc-env-dimensions", "locator": "§1 ISS dimension profile, row Airflow",
  "note": "Forced ventilation; local speeds ... per module.",
  "override": 0.1,
  "effective": {"min": 0.1, "max": 0.1, "status": "override"}
}
```

Show `effective.status` as a badge: `sourced`, `estimate`, `assumption`, `derived`, `unknown` or `override`.

**`incomplete_dimensions`**: e.g. `["airflow_ms"]`. Show the scenario as incomplete and do not place the scenario marker on an axis with an unknown value.

**`components[i]`**: the manifest entry plus `component_index` and `ranked`, the relevant observations in browsing order:

```json
{
  "observation_id": 298,
  "evidence_class": "exact",               // exact | related | analogue
  "counts": {"match": 0, "differs": 1, "unknown": 3},
  "reasons": ["same material identity (pmma-cast-sheet)", "O2 unknown (observation not recorded)", ...,
              "gravity earth vs scenario microgravity"],
  "comparison": {
    "o2": {"result": "unknown", "delta": null, "unit": "points", "text": "O2 unknown (observation not recorded)",
           "tolerance": {"value": 1.5, "unit": "points"}},
    "pressure": {...}, "airflow": {...}, "gravity": {...}
  },
  "navigation_rank": 1
}
```

**`observations[id]`**: the record itself, with normalized and raw values: `source_id, investigation_accession, locator, test_method, material_id, is_summary_row, o2_min/max/raw, pressure_kpa_min/max/raw, airflow_ms_min/max/raw, flow_direction, gravity_regime, geometry, outcome, raw`. Keys are strings in JSON.

**`coverage[hazard]`** for `fire`, `toxicity`, `biological`:

```json
{
  "components": [{"component_id": 0, "name": "Enclosure", "status": "evidence_found",
                  "counts": {"exact": 1, "related": 0, "analogue": 18}, "reason": "..."}],
  "summary": {"evidence_found": 4, "gap": 1, "unassessed": 0, "attributed_no_hazard": 0,
              "denominator": 5, "denominator_label": "components in manifest"},
  "assembly": {"component_id": null, "status": "gap", "evidence_count": 0,
               "reason": "component evidence does not establish assembly performance"}
}
```

**`sources[id]`**: `{title, kind, doi, url, revision}` for every source referenced by observations, findings and conditions. Link DOIs as `https://doi.org/<doi>`.

**`tolerances`, `limitations`**: show both near the evidence list and include them in any export.

## 3. Rendering rules (from the build plan)

- **Unknown is not a match or a mismatch.** Use three distinct styles for `match`, `differs` and `unknown`.
- **Measurements never move.** Plot observations at their recorded O₂ × pressure. The user's scenario is a separate marker. Records with a missing coordinate go in a separate "not plottable" count, never at zero.
- **No continuous region** around points and no interpolated boundary.
- **Analogues** (`evidence_class: "analogue"`, the ACME BRE gas burner) appear in their own group, never mixed into material evidence.
- **Coverage is not a score.** Show statuses and counts with their denominator; never a percentage, "safe" or a verdict. `unassessed` is shown as "not assessed", not "no hazard".
- **Assembly gap** stays visible on the cargo summary.
- **Raw values:** offer "Open source" with `observation.raw` and the source link next to every normalized value.

## 4. SI explanation

```js
const ex = await post("/scenarios/explain", { ...body, component_index: 0, hazard: "fire", question: null });
// ex = {explanation, sources, disclosure}
```

`explanation.status` is one of:

| status | Show |
|---|---|
| `ok` | `explanation.sentences[]`, each `{text, source_ids}`. Render each id as a citation link to the matching entry in `ex.sources` (`{source_id, excerpt, locator}`) |
| `unavailable` | "SI explanation unavailable" plus the computed comparisons, which still work |
| `rejected` | The model cited something it was not given; show "explanation withheld" and the comparisons |
| `error` | Provider error or timeout; offer a retry |

Citation ids: `obs-<id>` (an observation), `finding-<id>`, `scenario-conditions`, `computed-coverage`, or a source id such as `psi-26-bass`.

When a `question` is sent, the model may look up more records with read-only tools (search observations, get a source, list findings; at most 3 rounds). Those records are appended to `ex.sources`, so every citation still resolves there. Without a question, explain is a single provider request. `explanation.cached` is true when served from the cache. Always show `ex.disclosure` near the text.

Eustella allows 20 requests per minute for the whole team. Call explain on demand (a button), not on every slider move.

## 5. Download the passport

```js
const { id, passport } = await post("/passports/export", { ...body, share_slug: maybeSlug });
// passport = the compare response + passport_version, generated_at, scenario, si_disclosure
// Save it: new Blob([JSON.stringify(passport, null, 2)], {type: "application/json"})
// Reopen later: GET /passports/{id}
```

## 6. Share links (no login)

```js
const created = await post("/shares", { cargo: {...}, scenario: {...}, forked_from_slug: "portable-science-instrument" });
// created = {slug, edit_token, cargo, scenario, config_version, updated_at}
localStorage.setItem(`share:${created.slug}`, created.edit_token); // returned once only

const shared = await get(`/shares/${slug}`);  // anyone with the link; no edit_token in the reply
await fetch(`${API}/shares/${slug}`, {
  method: "PUT",
  headers: { "content-type": "application/json", "x-edit-token": localStorage.getItem(`share:${slug}`) },
  body: JSON.stringify({ cargo, scenario }),
});                                           // 403 without the right token; each save bumps config_version
```

`shares` takes an inline `cargo` (not a slug): seeded items are copied, never edited. `shared.cargo` and `shared.scenario` can be sent straight back to compare as `{cargo, scenario}`.

## 7. Errors

- `422`: invalid request. `detail` explains it, e.g. O₂ override 21 instead of 0.21, unknown `material_id`, both `cargo_slug` and `cargo`.
- `404`: unknown cargo, environment, space, share or passport.
- `material_id` must be `null` exactly when `identity_confidence` is `unmatched`. Use `GET /materials` for valid ids.
