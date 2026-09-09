# Story A: BSData ingester — faithful UnitRecords for every faction

## Status

Ready for Planning — pending Joshua's OK.

## Parent

`stories/bsdata-verbatim-rearchitecture.md` (the umbrella). This is the
first build chunk after P1 discovery
(`scripts/bsdata-import/v2/DISCOVERY.md` + `FINDINGS.md`), covering the
umbrella Plan's P2 + P3 (the "ingest lane").

## Summary

Build `scripts/bsdata-import/v2/ingest.mjs`: a pure, testable converter that
turns **any** BSData/wh40k-11e faction catalogue into
`src/core/data/<faction>.json` — an array of `UnitRecord`s that mirror what
BSData already says about each unit (stats, points, keywords, abilities,
weapons, and a faithful wargear selection tree), with **zero hand-authored
`src/factions/*.js` input**. Output is committed data plus a validation
harness. Nothing is wired into the app in this chunk.

## Problem

The current pipeline (`scripts/bsdata-import/sync.mjs` +
`convertFaction.mjs` + `extractSlots.mjs` + hand-authored `src/factions/
*.js`) reshapes BSData into the bespoke `composableUnit` schema and cannot
import a faction that has no hand-authored file. P1 confirmed BSData
already carries everything needed and in a regular shape (recursive
`{min,max}` groups; no exotic structures). This chunk produces the
faithful data layer that the keyword/engine/ability/UI chunks build on.

## User / Product Context

Solo hobbyist project (Joshua). 2000-point matched-play is the frame —
"units must be legal and correct," not a list builder. The app currently
covers 4 of ~28 factions; the goal is all of them. This chunk is
data-only: its deliverable is inspectable JSON and green tests, so its
correctness can be judged without touching the UI or the damage engine.

## Desired Outcome

`node scripts/bsdata-import/v2/ingest.mjs` (optionally `--fetch`):

1. reads every in-scope faction catalogue (the 34 from P1's `FACTIONS`
   list, resolving Space Marine chapter ↔ library and the Chaos
   Knights / Daemons / Imperial Knights / Astra Militarum / Tyranids
   library splits);
2. writes `src/core/data/<faction>.json` = `UnitRecord[]`, deterministically
   ordered so re-runs produce minimal diffs;
3. writes `src/core/data/_sync-report.json` — the "needs a human look" list
   (unresolved anything), expected to be short;
4. exits non-zero if any catalogue fails to parse or a fixture assertion
   regresses.

### `UnitRecord` shape (target — final field names settled in the Plan)

```
{
  id,                       // stable: faction + slugified BSData name
  faction,
  name,
  keywords: [ "vehicle", "walker", "faction: grey knights", "battleline", ... ],  // every categoryLink, lowercased, verbatim
  stats: {
    M, T, Sv, W, OC,
    InvSv: null | "4+" ,                       // char OR from an ability
    FNP:   null | "5+" ,                       // always from an ability
  },
  size: { min, max },                          // model count
  points: [ { models, pts }, ... ],            // one per fielded size
  abilities: [ { name, text } ],               // untyped — Story C types them
  weapons: [
    { id,                                      // stable within the record
      name,
      ranged?: [ { A, BS, S, AP, D, range, keywords: [norm,...] } ],  // modes
      melee?:  [ { A, WS, S, AP, D,        keywords: [norm,...] } ] } // modes
  ],
  wargear: <node>,                             // the selection tree (below)
  provenance: { catalogue, entryId },          // for debugging
  overridden?: [ "field", ... ]                // if overrides.js touched it
}

node = {
  name, kind: "group" | "option" | "model",
  min, max,                                    // BattleScribe constraints, verbatim
  perModels?: N,                               // "1 per N models"
  defaultSelected?: bool,                      // see default resolution
  weaponRefs?: [ <weapon id>, ... ],           // weapons this option grants (by ref, not inline)
  children?: [ node, ... ],
  unresolved?: "<reason>",                     // regression guard only
}
```

Weapons are stored once in `weapons[]`; wargear `node`s reference them by
`id`. A weapon fielded by default (not via any wargear choice) is still in
`weapons[]` and is referenced by the base/default node. This keeps the
record compact and lets the UI render one weapon list.

## Requirements

### R1 — Stats

Populate `stats` from the unit's `Unit` profile. If it is not on the unit
entry, look on model sub-entries (1–2 levels) and via `infoLinks` to
`sharedProfiles` (P1: 303 units carry it on a model, 8 have none →
`overrides.js`). `InvSv`: take the Unit-profile `InvSv`/`InSv` characteristic
if present and non-empty; else parse the first `Invulnerable Save` ability
(`"4+"`, or `"4+ vs ranged"` → record the value and keep the qualifier text
for Story C). `FNP`: parse `"Feel No Pain X+"` from any ability's name/text
(never a Unit characteristic). Multiple `Unit` profiles (5 units, damage
brackets) → take the undamaged/top profile; note in the sync report.

### R2 — Points per fielded size

`points` lists every legal model count with its real matched-play cost,
**always from BSData `costs`** — for every faction, including the current
4. (BSData's `costs` track the MFM the same way our old hand-ingestion
did; re-running the ingester picks up points updates the same way a
BSData re-pull does. No MFM override table.) Base cost from
`costs[name=="pts"]`. Apply `set`/`increment`/`decrement` modifiers whose
`field` is the pts type-id (`51b2-306e-1021-d207`), evaluating their
model-count conditions (P1: 279 units, e.g. SM Terminator Squad 160 →
`set 320 when models ≥ 6` ⇒ `[{5,160},{10,320}]`, expanded to every size
in the range). Ignore all other cost types (Crusade, Detachment,
Enhancement currencies).

### R3 — Keywords & abilities

`keywords` = **every** `categoryLink` name, lowercased, kept verbatim —
nothing stripped, split, or filtered. This includes `faction: grey
knights`, the organizational keywords (`battleline`, `dedicated
transport`, `epic hero`, `character`, `fly`, `titanic`, `psyker`, …), and
anything else BSData tags. The engine (Story B) reads the handful it acts
on (`vehicle`, `monster`, `fly`, `infantry`, `character`, `titanic`,
`psyker`); everything else is preserved for later use (faction-keyword
auras, `battleline`, etc.) rather than discarded at ingest.

`abilities` = `{name, text}` for every non-weapon, non-`Unit` profile on
the unit (embedded + `infoLinks`), plus `Transport` / `Orders` /
faction-specific ability types. No effect typing here — Story C does that.
`Damaged: 1-X` abilities are kept as text but flagged `bracket: true` so
Story C can skip them.

### R4 — Weapons + keyword normalizer

Every weapon profile in the unit's matched-play tree becomes a `weapons[]`
entry. Group a weapon entry's profiles by phase: `Ranged Weapons` →
`ranged[]`, `Melee Weapons` → `melee[]`. A `➤`-prefixed or `- <mode>`
suffixed name is a **mode** — a list entry, not a separate weapon. Same
name across a ranged and a melee profile (Laser Lance) → one weapon
populating both. Each profile's `Keywords` string is split on commas and
each keyword run through a **normalizer**:

- lowercase, trim, collapse ` `/`-`/`‑` to a single separator, strip
  trailing punctuation;
- parse the shape `<name> [<N>+] [: <target qualifier>]` into
  `{ kw, on?: N, vs?: "<qualifier>" }` — covers `anti-infantry 3+`,
  `sustained hits 2`, `rapid fire 1`, `melta 2`, `lethal hits: non-monster/vehicle`,
  `devastating wounds: infantry`, etc.;
- an unrecognised *shape* (not an unrecognised effect — that's Story B)
  passes through as `{ kw: "<raw normalized>" }` and is listed in the sync
  report.

The normalizer's job is *canonicalising strings*, not knowing what they do.

### R5 — Wargear selection tree

Walk the unit's tree (P1 confirmed: recursive `{min,max}` groups only) and
emit `node` (shape above), `min`/`max` verbatim from the `selections`-field
constraints. Resolve `entryLinks`, `infoLinks`, shared entries/groups, and
cross-catalogue links. Filter non-matched-play subtrees: static
`hidden: true`, the P1 cruft name-blocklist, and the Chaos Daemons
"Show <god> Daemons" / sub-faction / Legends unit-level `hidden` gates
(P1 §4: none of these gate real intra-unit wargear). `perModels` comes
from a `set max` modifier conditioned on model count.

### R6 — Constraint evaluator

A `constraintEval` that, given a `node`, a `{modelCount, selections}` state,
and the tree, returns the node's **effective** `min`/`max` — evaluating
BattleScribe's closed condition vocabulary (`none`, `atLeast`, `atMost`,
`equalTo`, `greaterThan`, `lessThan`, `instanceOf`, `notInstanceOf`) over
the `selections` field at `parent` / `self` / `model` / `unit` /
entry-guid scope. `roster` / `force` scoped conditions are **ignored**
(list legality, R12 of the parent). The ~15 real intra-unit "hide X if Y"
`set:hidden` modifiers (P1 §4) resolve through this same evaluator to an
effective `max: 0`.

### R7 — Default resolution

For each multi-child group, set `defaultSelected` on the default option
via, in order: (1) the group's `defaultSelectionEntryId`; (2) for a squad
model group, the model variant whose name has no ` with `/` w/ `; (3) the
option matching the unit's "This model is equipped with:" ability text;
(4) the first child — and add the group to the sync report. P1: 1324
groups have (1); 494 mandatory groups need (2)–(4).

### R8 — Faction resolution & plumbing

A single `CATALOGUES` map drives which files are ingested and their
library deps. Space Marine chapter datasheets resolve through the SM
library; a chapter file contributes its chapter-specific units +
detachment/enhancement data. `id` is stable across runs (faction +
slug). `overrides.js` is applied last: a per-unit / per-weapon patch table,
each entry commented with a datasheet citation, for the P1 "none"-stats
units and genuine BSData data errors (e.g. Land Raider Redeemer flamestorm
cannons, #3).

### R9 — Sync report

`_sync-report.json`: catalogues ingested + unit counts; unresolved keyword
*shapes*; groups that fell through to default-rule (4); units with no
stats; damage-bracket units; anything marked `unresolved`; any override
that was applied.

This chunk is **not done** while the report contains anything unaccounted
for. "Done" means, over all 34 catalogues: **0 parse failures, 0
unresolved keyword shapes** (the normalizer must handle every shape
present in the data today), and every remaining entry is one of — a
deliberate `overrides.js` patch with a datasheet citation, a
damage-bracket note, or a default-rule-(4) group that has been eyeballed
and is correct. There is no "acceptable number of unknowns" — the report
is a clean, explained list or the chunk isn't finished.

### R10 — Validation harness

`node --test` (or a plain script) that:

- ingests every `fixtures/*.json` bundle in isolation and asserts the
  `UnitRecord` shape;
- asserts specific values for ~10 units across factions incl. the current
  4: GK Venerable Dreadnought (assault cannon default; storm-bolter +
  DCW present; twin-lascannon swap keeps the storm bolter — the #22 case),
  GK Strike Squad (5 vs 10 model points; 1 vs 2 special weapons — R2/R6),
  Ork Deff Dread (pick-exactly-4), Ork Boyz (Boss Nob nested combos),
  Knight Despoiler (#22 deep nesting), Custodian Guard (named model
  variants), SM Terminator Squad (per-size points), Aeldari weapon with a
  ranged+melee profile (both present), an Ork `➤`-mode weapon (modes
  listed, one default);
- ingests all 34 catalogues and asserts zero parse failures + a
  sync-report size under an agreed threshold.

## Acceptance Criteria

- [ ] `node scripts/bsdata-import/v2/ingest.mjs` produces
      `src/core/data/<faction>.json` for all 34 factions and a
      `_sync-report.json`, and exits 0.
- [ ] Re-running with no upstream change produces a byte-identical diff
      (deterministic ordering).
- [ ] For GK / Custodes / Votann / Chaos Knights, every unit's
      default-loadout **weapon set** matches the current
      `src/factions/*.js` / `composableData` values, or the difference is
      listed in a short reconciliation note (expected: the #22 / #26 cases
      change — that's the point). Points come straight from BSData `costs`;
      any delta vs. the old MFM values is recorded but not treated as a
      failure (BSData is now the source).
- [ ] Deff Dread cannot be given a 5th weapon; Strike Squad offers 2
      special weapons at 10 models and 1 at 5 (constraint evaluator).
- [ ] A weapon with a ranged and a melee profile (Laser Lance) yields one
      `weapons[]` entry with both `ranged` and `melee` populated.
- [ ] The keyword normalizer maps every casing/format variant of a keyword
      to one canonical form (`twin-linked` / `Twin-Linked` / `TWIN-LINKED`
      → same); parametric keywords parse their `N+` and `: qualifier`.
- [ ] `_sync-report.json` for all 34 catalogues: 0 parse failures, 0
      unresolved keyword shapes, and every other entry accounted for
      (override / bracket / reviewed default) — see R9.
- [ ] The old pipeline still runs and the app still builds (nothing wired
      or deleted yet).

## Edge Cases / Failure Modes

- **Stats on a model sub-entry / via infoLink** (303 units) — R1 checks
  both; the 8 "none" units go in `overrides.js`.
- **`(ref. only)` weapon profiles** (Horrors) — mixed-unit reference
  profiles; keep all, tag `refOnly: true` for Story C/D to decide display.
- **Weapon with two same-name profiles, both ranged** — none found in P1,
  but if one appears, treat as modes and flag.
- **Cross-catalogue link that doesn't resolve** — record as `unresolved`
  on the node, keep the rest of the unit.
- **A catalogue with a shape P1's fixtures didn't cover** — the sync report
  surfaces it; add a fixture and handle it (this is the regression guard
  working as intended, not a modelling backlog).
- **Points modifier with a non-count condition** (character-dependent,
  e.g. Lysander +1W) — not a size tier; ignore for `points`, note it.

## Constraints

- Pure Node, no app imports; output is committed JSON + a test file.
- Reuse P1's cache + `discover.mjs`'s link-resolution helpers where sound;
  `weaponHelpers.mjs`'s `resolveProfiles` is a good seed.
- Deterministic output (sorted keys, stable ordering).
- The old pipeline and the app are untouched — no `src/` changes outside
  the new `src/core/data/` directory and a `UnitRecord` typedef file.

## Non-Goals

- What keywords or abilities *do* (Story B / C).
- Any combat math, any `engine.js` change.
- Any UI, any `registry.js` / Evaluator / Fight Sim change.
- Ability effect typing, detachment effect porting, leader attachment.
- Deleting the old pipeline or `src/factions/*.js` (Story E).
- Damage-bracket modelling.
- Enforcing list legality / roster-scope constraints.

## Existing Behavior

`node scripts/bsdata-import/sync.mjs` converts 4 named catalogues via the
heuristic `extractSlots` shapes, pulling stats/points from `src/factions/
*.js`, into `src/core/composableData/<faction>.json`. This chunk adds a
parallel `v2` path writing `src/core/data/`; both coexist until Story E.

## Examples / Scenarios

### Scenario 1 — a faction with no hand-authored file

**Given:** Orks (no `src/factions/orks.js`).
**When:** `ingest.mjs` runs.
**Then:** `src/core/data/orks.json` contains every Ork unit with stats,
per-size points, weapons (Kustom Shoota with its two modes listed), and a
wargear tree (Deff Dread's exactly-4 group); the sync report lists any Ork
keyword shape the normalizer didn't recognise.

### Scenario 2 — the #22 regression case

**Given:** GK Venerable Dreadnought.
**When:** the harness resolves the build `{assault cannon → twin lascannon}`.
**Then:** the resolved weapon set is `[twin lascannon, storm bolter, DCW]`
— the storm bolter is not lost.

### Scenario 3 — size-scaled points and limits

**Given:** GK Strike Squad.
**When:** the harness sets model count to 5, then 10.
**Then:** points are whatever BSData `costs` gives for 5 and 10 models;
the special-weapon group's effective `max` is 1 then 2.

## Open Questions

Resolved in the 2026-09-09 discussion:

- **Points** — BSData `costs` for every faction incl. the current 4; no MFM
  override table (R2).
- **Keywords** — every `categoryLink`, lowercased, verbatim; nothing
  stripped/split/filtered, so faction and organizational keywords stay
  available for later use (R3).
- **Weapons** — stored once in `weapons[]`, referenced from wargear nodes by
  `id`, not inlined (record shape).
- **Sync report** — no threshold; "done" = the report is a clean, fully
  explained list (R9).

Remaining (Plan-time detail, not blocking):

- Exact `UnitRecord` / `node` field names and `id` slug scheme — settle
  against the fixtures in the Plan.
- Whether `_sync-report.json` is committed alongside the data or is
  run-output only.

## Notes

- P1 artifacts: `scripts/bsdata-import/v2/{DISCOVERY.md, FINDINGS.md,
  census.json, fixtures/, discover.mjs, hidden-analysis.mjs}`.
- FINDINGS.md "Proposed Plan adjustments" 1–4 are folded into R1–R7 here.
- The 15 fixtures were chosen to span: replace-group + default, squad +
  size-scaled limit, pick-N, deep nesting (#22), named model variants,
  per-size points, weapon modes, ranged+melee weapons, per-model wargear.
