# Ingester notes (Story A / A8)

`node scripts/bsdata-import/v2/ingest.mjs` → `src/core/data/<faction>.json`
(34 files) + `src/core/data/_sync-report.json`.
`node --test scripts/bsdata-import/v2/ingest.test.mjs` → 9 tests.

## Current run

- **1342 units**, 34 catalogues, **0 parse failures**.
- **0 unresolved wargear nodes**, **0 unresolved keyword shapes** — the
  normalizer covers every weapon-keyword string present in the data today.
- **1 no-stats**: `ultramarines/Tyrannic War Veterans [Legends]` — BSData
  gives this Legends unit no Unit stat profile anywhere in its tree.
  Not overridden (Legends, low value); listed in the report.
- **5 damage-bracket units** (multiple `Unit` profiles) — matches P1:
  Chaplain Grimaldus, Wolf Guard Headtakers, Marneus Calgar, Wardens of
  Ultramar, Kroot Farstalkers. The ingester takes the top/undamaged
  profile (Story non-goal to model brackets).
- **386 non-count points modifiers** — the "your 3rd+ copy costs more"
  battle-size tax and character-dependent buffs (e.g. Lysander +1W). These
  don't change a unit's own points; logged, not applied. Expected noise.
- **52 default-rule-(4) fallbacks** — a mandatory multi-option group where
  BSData carries no `defaultSelectionEntryId`, the plain-model heuristic
  doesn't apply, and the "equipped with:" text didn't match a child. Almost
  all are a **squad leader's weapon choice** (Sister Superior, Skitarii
  Alpha, Sternguard Sergeant, …) — rule 4 picks the first option, which is
  usually the vanilla loadout. Many are `[Legends]`. These are safe as-is
  for a comparison tool; individual tuning / `overrides.js` entries can
  happen as they come up. Not a correctness blocker.

## Known follow-ups (not blocking S-A3)

- Refresh `fixtures/*.json` from the current cache — several are stale P1
  snapshots (Deff Dread's wargear shape changed upstream). The harness
  asserts against live `loadFaction`, not the fixtures, so tests are green
  regardless; the fixtures just need a re-dump for future offline tests.
- Tune the 52 leader-weapon defaults where a wrong first-pick would
  meaningfully skew a comparison (spot-check during Story D wiring).
- `overrides.js` is empty — populate it as real BSData data errors surface
  (e.g. GK Land Raider Redeemer flamestorm cannons, issue #3 — deferred to
  Story E's migration).

## Points vs. the old MFM data

BSData `costs` is now the single source for every faction (parent-plan R8 /
Story A R2). A spot reconciliation of the 4 previously hand-authored
factions against `src/core/composableData/*.json` is an A8/Story-E task; any
delta is recorded, not treated as a regression.
