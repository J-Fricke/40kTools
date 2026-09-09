# Plan: Re-architect BSData integration — consume BSData faithfully, model rules not schema

## Status

**Coordination spine.** P1 (Discovery) is **done** — see
`scripts/bsdata-import/v2/DISCOVERY.md` + `FINDINGS.md`, reviewed at S1
(2026-09-08/09). Per Joshua's 2026-09-08 note, the lanes after P1 are being
executed as their **own Story + Plan pairs** (smaller, independently
reviewable), listed below. This document keeps only the cross-cutting
coordination: the lane graph, the shared interfaces, the sync points, and
the risks. The detailed P2–P10 task specs further down are **superseded by
the child plans** and kept for reference / until each child plan lands.

## Child Stories / Plans

| Lane | Story | Plan | Status |
|---|---|---|---|
| P1 Discovery | (this plan, P1) | (this plan) | **done**, S1 reviewed |
| A — BSData ingester (was P2+P3) | `stories/bsdata-ingester.md` | `plans/bsdata-ingester.md` | Story ready; Plan next |
| B — Keyword dictionary + combat engine (was P4+P5) | _tbd_ | _tbd_ | not started |
| C — Ability / effect layer + detachment port (was P6+P7) | _tbd_ | _tbd_ | not started |
| D — Evaluator wiring (was P8) | _tbd_ | _tbd_ | not started |
| E — Parity + retire old pipeline (was P9+P10) | _tbd_ | _tbd_ | not started |

Shared interfaces the child plans must agree on (frozen at **S2**):
`UnitRecord` + wargear `node` shape (Story A), keyword-effect vocabulary
(B), `resolveAttack` / `effectiveWounds` engine signatures (B),
`applyAbilities` (C).

## Source Story

`stories/bsdata-verbatim-rearchitecture.md`

## Objective

Replace the heuristic BSData→`composableUnit` reshaping pipeline
(`scripts/bsdata-import/` + hand-authored `src/factions/*.js`) with a thin
ingester that produces unit records mirroring BSData's own structure
(stats, keywords, abilities, points, and a faithful wargear
selection/constraint tree), plus three faction-agnostic modelling layers —
a weapon-keyword dictionary, a unit ability/effect layer, and a
restructured combat engine that reads them. Make every BSData faction
importable with zero hand-authoring. Keep the 4 current factions'
Evaluator numbers at parity, then delete the old pipeline.

## Story Requirements Covered

| Requirement | Plan Coverage |
|---|---|
| R1 Faithful unit record | P2 (ingester: stats, keywords, abilities, points) |
| R2 Wargear as BSData tree | P1 (shape census), P3 (tree builder + constraint evaluator) |
| R3 Size / per-size points / scaled limits | P2 (size + costs), P3 (size-scaled constraints) |
| R4 Weapon-keyword dictionary | P1 (keyword census), P4 (dictionary) |
| R5 Unit ability layer (off/def/reactive) | P1 (ability census), P6 (effect layer), P8 (per-unit toggles UI) |
| R6 Engine reads keywords + full profiles | P5 (engine restructure) |
| R7 One model; meta tab = real units | P8 (rebind `targets.js` meta rows to unit records) |
| R8 All factions importable, BSData stats/points | P2, P3 (no `src/factions/*.js` dependency) |
| R9 Override table for BSData errors | P2 (override hook + table module) |
| R10 Retire old pipeline | P10 |
| R11 Evaluator UI walks the tree | P8 |
| R12 Legal units + detachment port | P3 (legal builds), P7 (detachment port) |
| R13 Feed Fight Simulator | P2 (carry range/M/phase keywords); wiring is a follow-up, not this Plan |

## Current-System Notes

- **Pipeline**: `scripts/bsdata-import/sync.mjs` fetches 4 named catalogue
  files, `convertFaction.mjs` walks each with `extractSlots.mjs`'s 4 shape
  heuristics + `extractBase.mjs`, pulls stats/points from `src/factions/
  *.js` via `ourSizeTiers.mjs`, applies `hardpointMap.mjs` /
  `wargearPoints.mjs`, writes `src/core/composableData/<faction>.json`.
- **Runtime**: `src/core/composableRegistry.js` imports the 4 JSON files;
  `src/core/registry.js` (`FACTIONS`) merges them with `src/factions/*.js`
  `chars` / `dets` / `uc` / `defense`. `composableUnit.js` `resolveBuild()`
  turns `{modelCount, slotChoices}` into `{sWs, mWs, pts}`.
- **Engine**: `src/core/engine.js` — `calcW()` takes
  `[shots, skill, S, AP, D, tags]` + a `{T, sv, inv, fnp, veh, mon}` target;
  `tags` is a compressed vocabulary (`sustained, let, dev, tl, ai, sowf`…).
  `ewCalc()` computes effective wounds. Math is sound; inputs are the
  problem.
- **Keywords**: `scripts/bsdata-import/keywordMap.mjs` — partial
  BSData-keyword → tag table + `diceAverage()`.
- **Buffs**: `src/core/buffs.js` `getDetBuff()` resolves per-faction
  `DETACHMENTS` arrays (id, `dp`, `affects:{...}`) against toggled
  detachments; `src/components/DetachmentPanel.jsx` is the picker
  (DP-capped at 3).
- **Targets**: `src/core/targets.js` `TARGETS` — `std` generic bands +
  `meta` group of ~13 real units as hand-abstracted
  `{T, sv, inv, fnp, veh, mon, wounds}` rows, no abilities.
- **Consumers**: `src/tools/FactionUnitEvaluator.jsx` (table + meta
  columns), `src/tools/FightSimulator.jsx` (side-by-side, richer needs),
  `src/components/UnitBuilder.jsx` (slot UI), `ComposableFactionPicker.jsx`.
- **BSData structure** (verified — see Story "BSData structure findings"):
  unit stats in a `typeName:"Unit"` profile; points in `costs[name=="pts"]`;
  weapon profiles `typeName` `Ranged/Melee Weapons` with a comma-joined
  `Keywords` string; wargear = nested `selectionEntryGroups`/
  `selectionEntries`/`entryLinks` with `constraints`
  (`{type, value, field:"selections", scope:"parent"}`); explicit
  `defaultSelectionEntryId` on groups; size scaling via base constraint +
  conditional `modifier`; Crusade/Legends carry `hidden`. Link resolution
  helpers already exist in `weaponHelpers.mjs`
  (`resolveEntry`, `resolveProfiles`, `directWeaponEntries`).

## Proposed Approach

New code lives under `scripts/bsdata-import/v2/` (ingester) and
`src/core/model/` (runtime model + dictionaries + engine), built alongside
the old pipeline. The old pipeline keeps running and the app keeps working
until P9 confirms parity; P10 deletes the old code.

**Ingester (`scripts/bsdata-import/v2/`)** — pure functions:
BSData catalogue JSON → `UnitRecord[]`. One catalogue file per faction from
a single `CATALOGUES` map (all ~28). Filter non-matched-play subtrees by
`hidden` + a name blocklist. Resolve links (reuse `weaponHelpers`). Emit
`src/core/data/<faction>.json`, committed. Emit a `sync-report.json` /
console summary: unrecognised keywords, un-typed abilities, uninterpretable
modifiers, missing-data suspects.

**Runtime model (`src/core/model/`)**:
- `unitRecord` shape (Story R1/R2).
- `wargearTree.js` — walk a record's wargear tree, apply the constraint
  evaluator against `{modelCount, selections}`, yield the selected weapon
  leaves + which nodes are at their limit (for the UI).
- `constraintEval.js` — BattleScribe condition vocabulary interpreter.
- `keywords.js` — the dictionary (R4): `keyword string → {effect}` with
  parametric parsing.
- `abilities.js` — ability-text → typed `effect` table (R5), covering
  offensive / defensive / reactive; `one-use`/`situational` effects flagged
  for the per-unit toggle.
- `engine.js` (restructured) — `resolveAttack(attackerSelection, defender,
  context)` reading weapon fields + keyword effects + abilities + the
  defender's full profile. Preserve the probability model and dice
  conventions from today's `engine.js`.

**Detachment port (P7)** — keep `getDetBuff` conceptually; re-express each
faction's detachment effects as `abilities.js` entries so one resolver
handles unit abilities + detachment + army rules. Detachment list from
BSData where exposed.

**UI (P8)** — `UnitBuilder` renders the wargear tree (nested groups, pick
limits, defaults pre-filled, size-scaled) instead of slots; per-unit
one-use toggles listed with the wargear; `FactionUnitEvaluator` meta
columns read from real unit records.

## Affected Areas

- `scripts/bsdata-import/v2/` — **new** ingester (fetch, filter, unit
  record, wargear tree extraction, sync report).
- `src/core/data/<faction>.json` — **new** generated unit records (~28
  files), committed.
- `src/core/model/{unitRecord,wargearTree,constraintEval,keywords,abilities,engine}.js`
  — **new** runtime model + modelling layers.
- `src/core/registry.js` — faction list becomes data-driven from
  `src/core/data/`; `label` from catalogue name; `uc` palette generated;
  `DEFENSE`/`chars`/`dets` sourced from records / `abilities.js`.
- `src/core/targets.js` — `meta` rows point at real unit records; `std`
  bands kept as lightweight synthetic defenders or dropped.
- `src/core/buffs.js` — folded into `src/core/model/abilities.js` (P7).
- `src/components/UnitBuilder.jsx`, `ComposableFactionPicker.jsx` — tree
  walker UI.
- `src/tools/FactionUnitEvaluator.jsx` — consume unit records + new engine;
  per-unit toggles; meta columns.
- `src/tools/FightSimulator.jsx` — consume unit records + new engine
  (behavioural parity only; positional features are a follow-up).
- **Deleted in P10**: `scripts/bsdata-import/{extractSlots,extractBase,
  buildFamily,hardpointMap,wargearPoints,ourSizeTiers,convertFaction,
  KNOWN_GAPS}.*`, `src/core/composableUnit.js`,
  `src/core/composableData/*`, `src/core/composableRegistry.js`, most of
  `src/factions/*.js`.

## Data / API / State Changes

- **New generated data**: `src/core/data/<faction>.json` = `UnitRecord[]`.
  Replaces `src/core/composableData/*.json`.
- **Persisted UI state** (`usePersistedState` keys in the Evaluator /
  Fight Sim): the compare-list entry shape changes from
  `{uid, modelCount, slotChoices, …}` to
  `{faction, unitId, modelCount, selections, toggles, detachment, …}`.
  Bump the storage key version; no migration of old saved state (single
  user, acceptable — note in Work file).
- **Override table**: `scripts/bsdata-import/v2/overrides.js` — keyed by
  `faction/unitId` (+ optional weapon name), each entry commented with the
  datasheet citation.

## Compatibility / Migration Considerations

- Old and new pipelines coexist through P1–P9; `App.jsx` routes unchanged.
- No user-data migration (persisted compare lists reset on the key bump).
- Parity gate (P9) before deletion (P10) — no flag-day.
- `sync.mjs` (old) stays until P10; `v2` ingester is a separate entry
  point during the transition.

# Execution Graph

## Parallelization Summary

P1 (Discovery) is the single hard gate — it produces the shape/keyword/
ability/modifier census that sizes everything else. After P1, four lanes
run in parallel:

- **Ingest lane**: P2 (unit record) → P3 (wargear tree + constraints)
- **Combat lane**: P4 (keyword dictionary) → P5 (engine restructure)
- **Ability lane**: P6 (ability/effect layer) → P7 (detachment port)
- (P4 and P6 both start straight after P1 and only read the census.)

They converge at P8 (UI + wiring), then P9 (parity verification), then P10
(delete old pipeline).

```text
P1 ──┬──> P2 ──> P3 ──┐
     ├──> P4 ──> P5 ───┤
     ├──> P6 ──> P7 ───┼──> P8 ──> P9 ──> P10
     └──────────────────┘
```

Critical path: **P1 → P2 → P3 → P8 → P9 → P10**.

## Tasks

### P1 — Structural discovery pass over all ~28 BSData catalogues

**Type:** Independent
**Can run in parallel:** No (gate)
**Depends on:** None
**Blocks:** P2, P3, P4, P5, P6, P7
**Likely files/components:**

- `scripts/bsdata-import/v2/discover.mjs` (new, throwaway-ok tooling)
- reference: `weaponHelpers.mjs`, existing `sync.mjs` fetch

**Objective**

Fetch every `BSData/wh40k-11e` faction catalogue and produce a structural
report so P2–P6 are built to cover the real data by construction:

1. **Catalogue inventory** — filename per faction, library-catalogue splits
   (Chaos Knights-style), shared-file dependencies.
2. **Wargear shape census** — every distinct structural pattern of
   `selectionEntryGroup` / `selectionEntry` / `entryLink` nesting +
   constraint combination that carries weapons. Confirm/extend the two
   known shapes (`min=max=N` pick-group; `min=max=1` replace-group with
   `defaultSelectionEntryId`). Capture: combo wrappers, per-model links,
   ability-only options, mixed groups, deep nesting.
3. **Constraint / modifier census** — every `constraint` type and every
   `modifier` + `condition` shape actually used, with counts and an example
   `faction/unit` for each. Classify: model-count-scaled, sibling-dependent,
   roster-scope (ignore by design), cosmetic (ignore).
4. **Keyword census** — the full set of weapon `Keywords` strings across all
   catalogues, with counts.
5. **Ability census** — unit/army/detachment ability `name`s + a sample of
   text, grouped by apparent effect class (defensive / offensive /
   reactive / display-only), with counts.
6. **Stat & points census** — where the `Unit` profile lives (unit entry
   vs. model sub-entry), how per-size costs are encoded, damage-bracket
   profiles.
7. **Filter census** — the exact markers on non-matched-play subtrees
   (`hidden` static vs. via modifier; the name set to blocklist).
8. **Fixture set** — save ~15 real units spanning the awkward cases as
   JSON fixtures under `scripts/bsdata-import/v2/fixtures/` for P2/P3 tests.

**Expected output**

`scripts/bsdata-import/v2/DISCOVERY.md` (the report) + `fixtures/`. Master
Agent reviews with Joshua before starting P2–P7; findings recorded in the
Work file, and any that change task scope are noted against that task.

**Verification**

- Report accounts for every faction catalogue in the repo.
- Every keyword / constraint-type / modifier-condition-shape has a count
  and a cited example.
- Fixtures parse and cover each census category.

**Coordination notes**

This is the gate. No P2–P7 work starts until the Master Agent has read
DISCOVERY.md and confirmed (with Joshua) that the tree-walker / dictionary
/ evaluator designs in this Plan still hold. Write a "P1 findings vs. Plan"
delta into the Work file.

---

### P2 — Ingester core: UnitRecord (stats, keywords, abilities, points, weapons)

**Type:** Dependency
**Can run in parallel:** Yes (with P4, P6)
**Depends on:** P1
**Blocks:** P3, P5, P8
**Likely files/components:**

- `scripts/bsdata-import/v2/{ingest,catalogues,filter,overrides}.mjs`
- `src/core/model/unitRecord.js` (shape + JSDoc typedef)
- reuse `weaponHelpers.mjs`

**Objective**

Catalogue JSON → `UnitRecord[]` minus the wargear tree (P3 adds that):

- resolve unit entries; filter non-matched-play subtrees (P1 §7 markers);
- `stats` from the `Unit` profile (check model sub-entries per P1 §6);
- `keywords` from `categoryLinks`;
- `abilities` as `{name, text}` (typing is P6);
- `points` per fielded size from `costs` + cost modifiers (P1 §6);
- `size {min,max}`;
- flat `weapons[]` (name, kind, chars, `range`, `keywords[]` split from the
  string) for every weapon profile in the unit's matched-play tree —
  including `range` and phase keywords for R13;
- apply `overrides.mjs` last;
- write `src/core/data/<faction>.json`; accumulate the sync report.

**Expected output**

Committed `src/core/data/*.json` for all factions (wargear tree empty until
P3). `UnitRecord` typedef stable for P3/P5/P8. Sync report format defined.

**Verification**

- Fixture units (P1) produce records with correct stats/points/size vs.
  their datasheets (spot-check ~10 across factions incl. the 4 current).
- `node` run over all catalogues completes; sync report lists only
  expected residue.
- Points for the 4 current factions match `src/factions/*.js` MFM values
  within rounding, or the diff is explained.

**Coordination notes**

Owns the `UnitRecord` typedef and `src/core/data/` — P3 extends the same
records in place; sequence P3 after P2. Publish the typedef + a sample
record to the Work file when stable.

---

### P3 — Wargear selection tree + constraint evaluator

**Type:** Dependency
**Can run in parallel:** No (extends P2's records/files)
**Depends on:** P2 (and P1)
**Blocks:** P8
**Likely files/components:**

- `scripts/bsdata-import/v2/wargear.mjs` (extraction)
- `src/core/model/{wargearTree,constraintEval}.js` (runtime)

**Objective**

- **Extraction**: walk each unit's selection tree, emit the Story R2 node
  shape (`name, kind, min, max, perModels?, defaultSelected?, weapon?,
  children?`), constraints verbatim, `defaultSelectionEntryId` →
  `defaultSelected`. Resolve every link/nesting shape P1 §2 found. Attach
  each `modifier`+`condition` to its node.
- **`constraintEval.js`**: interpret BattleScribe's closed condition
  vocabulary (`atLeast, atMost, equalTo, greaterThan, lessThan, instanceOf,
  notInstanceOf`) over `{modelCount, selections}` — resolves a node's
  effective `min`/`max` for the current build state (e.g. heavy-weapon max
  1→2 at 10 models).
- **`wargearTree.js`**: given a record + `{modelCount, selections}`, return
  selected weapon leaves (scaled by count/qty) + per-node effective limits
  + validity flags, for the engine and the UI.
- Anything P1 flagged uninterpretable → node marked `unresolved:<reason>` +
  added to the sync report (regression-guard only; should be empty).

**Expected output**

`src/core/data/*.json` records now carry `wargear`. `wargearTree(record,
sel)` is the single API P8 and P5 use to get "the weapons this build
fields."

**Verification**

- Fixture units: default selection matches the datasheet's "equipped with";
  each legal swap yields the right weapon set with nothing lost (#22) and
  nothing double-counted (#26).
- Size scaling: a squad offers the right special-weapon count at min and
  max size (#R3, GK Strike Squad fixture).
- `constraintEval` unit tests over every condition type from P1 §3.

**Coordination notes**

Edits the same `src/core/data/*.json` P2 writes — must run after P2
finishes. `wargearTree` API published to Work file for P5/P8.

---

### P4 — Weapon-keyword dictionary

**Type:** Dependency
**Can run in parallel:** Yes (with P2, P6)
**Depends on:** P1 (keyword census)
**Blocks:** P5
**Likely files/components:**

- `src/core/model/keywords.js`
- port/replace `scripts/bsdata-import/keywordMap.mjs`

**Objective**

An entry for **every** weapon keyword in P1 §4: `keyword → {effect}` or
explicit `{noop:true}`. Parametric parsing (`Sustained Hits X`, `Rapid Fire
N`, `Anti-<kw> N+`, `Melta N`). Effects are declarative (`{rerollWound:
"1s"}`, `{sustainedHits: n}`, `{devastating: true}`, `{apBonus: n}`,
`{extraShotsInRange: n}`, …) — the engine (P5) interprets them. Keep the
existing Torrent shots×6/5 convention and dice-average helper.

**Expected output**

`keywords.js` with 100% coverage of the P1 census. `resolveKeyword(str)` →
effect object. A test asserting no census keyword is unmapped.

**Verification**

- Every P1 §4 keyword resolves (effect or noop).
- Parametric cases parse (`"Anti-Fly 4+"` → `{anti:{kw:"Fly",on:4}}`).
- Existing 4-faction weapons produce effects equivalent to today's `tags`.

**Coordination notes**

Defines the effect-object vocabulary P5 consumes — publish it to the Work
file before P5 starts.

---

### P5 — Combat engine restructure

**Type:** Dependency
**Can run in parallel:** No
**Depends on:** P4 (effect vocab), P2 (UnitRecord shape)
**Blocks:** P8
**Likely files/components:**

- `src/core/model/engine.js` (new, from `src/core/engine.js`)

**Objective**

`resolveAttack({weapons, attackerAbilities, context}, defender)` and an
`effectiveWounds(defender)` — reading weapon chars + resolved keyword
effects + attacker/defender abilities + the defender's full profile
(`T, Sv, InvSv, FNP` + defensive effects: −1 to hit, −1 Damage, ignore
AP1, FNP-granting, invuln-granting). Preserve today's probability model
(`wt()`, hit-prob floor 5/6, Torrent correction) and dice-average
conventions. `context` carries the per-side toggle state (R5 one-use
effects) and phase (shoot/melee) for later Fight-Sim use.

**Expected output**

`engine.js` with the same numeric behaviour as `src/core/engine.js` for
equivalent inputs, plus defender-ability support. Snapshot tests.

**Verification**

- Golden-value tests: for a set of (weapon, target) pairs, new engine
  output == old `calcW` output within rounding.
- New: defender with 4++ / −1 Damage / FNP produces the hand-computed
  figure.

**Coordination notes**

`resolveAttack` / `effectiveWounds` signatures published to Work file for
P7/P8. Do not touch `src/core/engine.js` (old) — P8 swaps consumers over.

---

### P6 — Unit ability / effect layer

**Type:** Dependency
**Can run in parallel:** Yes (with P2, P4)
**Depends on:** P1 (ability census)
**Blocks:** P7, P8
**Likely files/components:**

- `src/core/model/abilities.js`

**Objective**

Table mapping ability `name` (+ text disambiguation) → typed `effect` for
every calc-relevant ability in P1 §5: offensive (rerolls, +1 hit/wound,
lethal/sustained granted, "Anti-" auras), defensive (invuln, FNP, −1 to
hit, −1 Damage, Stealth, ignore-AP1), reactive (Fights First and similar).
Mark `oneUse` / `situational` effects for the P8 per-unit toggle. Emit
`applyAbilities(record, context) → {attackerMods, defenderMods}` consumed
by P5's engine. Un-typed abilities pass through as display text; a
*newly-introduced* one (future data) lands in the sync report.

**Expected output**

`abilities.js` covering the P1 census. `applyAbilities()` API. List of
`oneUse`/`situational` effect ids per faction for P8.

**Verification**

- Every P1 §5 "calc-relevant" ability has an effect entry.
- The 4 current factions' unit/char abilities that today affect numbers
  (Surge of Wrath, Guardian Eternal −1D, etc.) reproduce their effect.

**Coordination notes**

Shares the effect-object vocabulary with P4/P5 — align on it at the P1
review. `applyAbilities` signature to Work file.

---

### P7 — Detachment / army-rule port

**Type:** Dependency
**Can run in parallel:** Yes (after P6)
**Depends on:** P5, P6
**Blocks:** P8
**Likely files/components:**

- `src/core/model/abilities.js` (detachment entries)
- `scripts/bsdata-import/v2/detachments.mjs` (list from BSData where exposed)
- replace `src/core/buffs.js`; keep `DetachmentPanel.jsx` shape

**Objective**

Re-express each of the 4 current factions' `DETACHMENTS` `affects:{…}`
effects as `abilities.js` entries resolved by `applyAbilities`. Pull the
detachment (and enhancement) *list* per faction from BSData where it
exposes them; typed effects stay curated. Enhancements attach to a
character and add points. Persistent detachment effects always-on with the
existing banner; situational ones use the P8 toggle.

**Expected output**

One resolver path for unit + detachment + army-rule effects. `getDetBuff`
removed. `DetachmentPanel` fed from the new data.

**Verification**

- The 4 factions' detachment buffs reproduce today's Evaluator deltas
  (compare with detachments toggled on).

**Coordination notes**

Depends on P6's `applyAbilities` contract. Coordinate with P8 on the
`DetachmentPanel` prop shape.

---

### P8 — Wire the new model into the Evaluator (+ Fight Sim parity)

**Type:** Integration
**Can run in parallel:** No
**Depends on:** P3, P5, P6, P7
**Blocks:** P9
**Likely files/components:**

- `src/core/registry.js` (data-driven faction list; generated `uc`)
- `src/core/targets.js` (meta rows → real records)
- `src/components/{UnitBuilder,ComposableFactionPicker,DetachmentPanel}.jsx`
- `src/tools/FactionUnitEvaluator.jsx`, `src/tools/FightSimulator.jsx`
- `src/hooks/usePersistedState.js` consumers (key bump)

**Objective**

- `registry.js` builds `FACTIONS` from `src/core/data/`; label from
  catalogue; generated colour palette; no `src/factions/*.js` dependency
  for new factions.
- `UnitBuilder` renders the wargear tree (nested groups, effective pick
  limits from `constraintEval`, defaults pre-filled, size-scaled) +
  per-unit one-use toggles.
- Evaluator rows call `wargearTree` → `resolveAttack`; meta columns are
  real unit records via `effectiveWounds` + `resolveAttack` on defence.
- Fight Simulator swapped to the same model/engine for behavioural parity
  (no new positional features).
- Persisted-state shape updated + key bumped.

**Expected output**

App runs entirely on the new model for all imported factions; old
`composableData` path unreferenced.

**Verification**

- `npm run build` clean; both tools load and interact.
- Manual: configure a GK Venerable Dreadnought, a 10-model squad, an Ork
  Deff Dread; meta columns show real-unit-backed numbers.

**Coordination notes**

Big integration surface — single owner, serialize. Read every upstream
task's Work-file API notes first.

---

### P9 — Parity verification for the 4 current factions

**Type:** Final Verification
**Can run in parallel:** No
**Depends on:** P8
**Blocks:** P10
**Likely files/components:**

- `scripts/bsdata-import/v2/parity.mjs` (compare harness)

**Objective**

For every unit in the 4 current factions, compute the Evaluator outputs
(per-target damage/pt, EW/pt, composite) on **both** pipelines for the
default loadout and a sample of non-default loadouts + detachments, and
diff. Every difference is either within rounding tolerance or has a
one-line written explanation (a documented prior bug — #22/#26/#29 cases
expected to *change*).

**Expected output**

`plans/…/parity-report.md` — table of unit × metric × old × new × verdict.
Sign-off gate for P10.

**Verification**

- No unexplained diff above tolerance.
- The #22/#26 fixture loadouts now correct where before they were wrong.

**Coordination notes**

If parity fails for a unit with no good explanation, stop and record in the
Work file — likely an ingester or engine bug, not an accepted change.

---

### P10 — Delete the old pipeline

**Type:** Dependency
**Can run in parallel:** No
**Depends on:** P9 (signed off)
**Blocks:** None
**Likely files/components:**

- delete: `scripts/bsdata-import/{extractSlots,extractBase,buildFamily,
  hardpointMap,wargearPoints,ourSizeTiers,convertFaction,sync,
  KNOWN_GAPS}.*`, `src/core/composableUnit.js`,
  `src/core/composableData/`, `src/core/composableRegistry.js`
- reduce `src/factions/*.js` to any still-needed overrides/char data
- rename `scripts/bsdata-import/v2/` → `scripts/bsdata-import/`

**Objective**

Remove the superseded code and data. Close GitHub issues #22, #26, #29,
#34 as superseded; #21 via R7; #7 folded into R4. Migrate any live
override notes (e.g. #3 LRR flamestorm) into `overrides.js` comments.

**Expected output**

Single pipeline. `npm run build` clean. Issues closed with a pointer to
this work.

**Verification**

- Build + both tools + `node` ingest run clean with the old code gone.
- `grep` finds no live import of a deleted module.

**Coordination notes**

Last task. Tag a commit before deletion for easy rollback.

# Synchronization Points

## S1 — Discovery review

**Waits for:** P1
**Owner:** Master Agent

DISCOVERY.md read and reviewed with Joshua. The tree-node shape, condition
vocabulary, keyword-effect vocabulary, and filter rules in this Plan
confirmed or amended. "P1 findings vs. Plan" delta written to the Work
file. No P2–P7 work before this.

## S2 — Model APIs frozen

**Waits for:** P2 (UnitRecord), P4 (effect vocab), P5 (`resolveAttack`),
P6 (`applyAbilities`)
**Owner:** Master Agent

The shared interfaces are published to the Work file and stable before P8
integration begins.

## S3 — Parity sign-off

**Waits for:** P9
**Owner:** Master Agent + Joshua

Parity report accepted. Only then P10.

# File-Overlap / Conflict Analysis

| Tasks | Overlap | Execution Rule |
|---|---|---|
| P2 / P3 | `src/core/data/*.json`, ingester modules | P3 strictly after P2 |
| P4 / P6 | effect-object vocabulary (shared concept, separate files) | Align at S1; no file overlap |
| P5 / P4 | P5 imports `keywords.js` | P5 after P4 |
| P6 / P7 | `src/core/model/abilities.js` | P7 extends after P6 |
| P7 / P8 | `DetachmentPanel.jsx` prop shape | P8 after P7; agree shape in Work file |
| P8 | `registry.js`, both tools, `targets.js`, builder components | Single owner, no concurrent edits |
| P2 / P4 / P6 | none (separate files, only read P1 output) | May run concurrently |
| P10 | deletes files all prior tasks touched | Only after S3 |

# Testing / Verification Strategy

- **Unit**
  - `constraintEval` over every condition type (P1 census) — P3.
  - `keywords.resolveKeyword` — every census keyword maps; parametric
    parsing — P4.
  - `engine` golden values vs. old `calcW` — P5.
  - `wargearTree` on fixtures: default + swaps, size scaling — P3.
- **Integration**
  - Ingest all ~28 catalogues; sync report residue is only expected items
    — P2/P3.
  - `applyAbilities` + `resolveAttack` for the 4 factions' calc-relevant
    abilities/detachments — P6/P7.
- **End-to-end / manual**
  - Build GK Venerable Dreadnought / a 10-model squad / Ork Deff Dread in
    the UI; verify weapon sets and limits — P8.
  - Meta columns show real-unit-backed defence numbers — P8.
- **Repository health**
  - `npm run build` after P8 and P10.
  - `node` ingester run after P2, P3, P10.
- **Parity**
  - P9 full old-vs-new diff for the 4 current factions.

# Acceptance-Criteria Verification

| Story Acceptance Criterion | Verification Method |
|---|---|
| New faction via one `sync` entry, no `src/factions/` file | P8 manual: add Orks, units appear correct |
| 4 factions within explained tolerance of today's numbers | P9 parity report |
| Non-default legal loadout correct, no weapon lost/double-counted | P3 fixture tests (#22/#26 cases) |
| Special-weapon count scales with squad size | P3 GK Strike Squad fixture test |
| Benchmark unit with a defensive rule evaluated with it | P5 + P8 (meta column with 4++/−1D) |
| `sync` over 28 catalogues completes + lists unrecognised only | P2/P3 integration run |
| Keyword dictionary covers every keyword in 28 catalogues | P4 coverage test vs. P1 census |
| `composableUnit`/`extractSlots`/`hardpointMap` deleted, app works | P10 + build |

# Risks

- **Risk:** P1 uncovers a wargear/constraint shape common enough that the
  faithful-tree model needs a real BattleScribe-style constraint solver,
  not just a per-node evaluator.
  - **Mitigation:** P1 is the gate; if so, S1 re-scopes P3 (and the Story's
    "not a list builder" line keeps roster-scope constraints out, bounding
    it).
- **Risk:** Parity (P9) shows many small diffs from the 4 factions' MFM
  points vs. BSData points.
  - **Mitigation:** R8 allows per-faction MFM point overrides for the
    existing 4; apply them, keep BSData points for new factions.
- **Risk:** Ability-text → effect typing (P6) is more open-ended than the
  keyword table (P4) and could balloon.
  - **Mitigation:** P1 §5 counts them first; only "calc-relevant" is in
    scope; the rest is display text; toggle-gated situational effects don't
    need precise modelling, just on/off.
- **Risk:** Fight Simulator has hidden coupling to the old `resolveBuild`
  shape.
  - **Mitigation:** P8 does behavioural parity only; positional features
    stay a follow-up (R13); budget a spike inside P8 to map its usage.
- **Risk:** 28 committed data files churn noisily on every `sync`.
  - **Mitigation:** deterministic key ordering in the emitter; confirm
    commit-vs-generate at S1 (Story open question).

# Open Technical Questions

- Exact `UnitRecord` / wargear-node field names — settle in P2/P3 against
  P1 fixtures.
- Whether `std` generic target bands survive or are dropped (R7) — decide
  at P8 with Joshua.
- Colour-palette generation for ~28 factions (`uc`) — deterministic hash vs.
  a curated map; P8.
- One-use toggle persistence granularity (per compare-list entry, presumably)
  — P8.

# Execution Instructions

The executing Codex session should:

1. Read `stories/bsdata-verbatim-rearchitecture.md`.
2. Read this Plan.
3. Create `work/bsdata-verbatim-rearchitecture.work.md` from `WORK_TEMPLATE.md`.
4. Run **P1 only**, then stop at **S1** for review with Joshua before any
   other task.
5. After S1, start P2, P4, P6 concurrently (separate subagents ok — no file
   overlap); serialize P3 after P2, P5 after P4, P7 after P6.
6. Hold P8 until S2 (model APIs frozen in the Work file).
7. Run P9; hold P10 until S3 sign-off.
8. Every agent reads + updates the shared Work file; re-read before
   dependency-bound work.
9. Leave the Work file as the durable record.
