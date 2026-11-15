# The whole-vehicle view (a concept)

`<fleet-view>` draws one habitat module in plan view with every cargo item as a tag at its place. It is marked "Concept" on screen.
It shows what could be watched, not what is watched today. Nothing here names a tagging or tracking technology.

## What is real today
- The Cargo Passport of one item: its components, the fire-safety evidence that applies to each material in the air it is going to,
  and what is untested (`data/passport.json`, the live app).
- The evidence rules: `assess()` in `assets/js/passport-rules.js` returns "evidence applies", "conditions differ" or "no evidence"
  for each component, the air of a place and the flags of the places. This view calls it once per item and stores no status.
- The cited records in `data/evidence.json`, each with a verbatim quote and a link to its source.
- The tests in `data/fleet.json`: each carries a `gravity` or `form` only when its cited record states it (otherwise `null`), checked by `tests/unit/fleet.test.mjs`. The item and component names and the material labels are illustrative.

## What this view assumes that does not exist
- Registration at the hatch: an item without a passport is not admitted. Here "Register" only switches on a passport that
  `data/fleet.json` already holds.
- Tags that report where an item is. Here the place of each item is a field in `data/fleet.json`, set by the reader or the scenario.
- A watch that runs the rules on every change and raises a flag for a person. Here the scenario calls `assess()` after each step,
  and the message is assembled from the cited records by fixed rules.
- The items, their places and the story are illustrative. `data/fleet.json` marks every item `"illustrative"`.

## How the rules and the place fit
- The rules treat "power" as the only powered place (the charging shelf), so a step cannot plug the instrument in at the airlock.
  The scenario therefore moves the instrument locker, airlock, locker and says so on the page.
- A flag is what `assess()` reports for the place in that air, or a component that was covered where the item last was and is not now.
  An item that is stowed with gaps already known in its passport raises nothing by moving to a place with no flag.
- The overview marks an item with a flag when the place is flagged or any component is not "evidence applies".

## What it would take
1. A registration step at the hatch that writes the passport and refuses an item without one.
2. A tag on each item that reports its place to a store, with a stated precision and a stated failure mode.
3. A service that runs `assess()` whenever a place, an air or a passport changes, and delivers the flag to a person with its evidence.
4. A decision record: who decided, what they saw, what they did. The watch flags evidence and gaps; people decide.
5. Evidence for more materials: a material with no verified test stays "no evidence" and is never filled in by the watch.

## Files
`data/fleet.json` (items, places, scenario) · `assets/js/fleet-view.js` · `assets/css/fleet.css` · `tools/site/fleet.mjs` (build-time markup) ·
`tests/unit/fleet.test.mjs`.
