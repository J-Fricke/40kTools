# Plan: BSData ingester (Story A)

## Status

Draft — Ready for Execution.

## Source Story

`stories/bsdata-ingester.md` (child of
`stories/bsdata-verbatim-rearchitecture.md`; coordination spine in
`plans/bsdata-verbatim-rearchitecture.md`).

## Objective

Build `scripts/bsdata-import/v2/` — a pure Node converter from BSData/wh40k-11e
faction catalogues to `src/core/data/<faction>.json` (`UnitRecord[]`) for
all 34 in-scope factions, plus `src/core/data/_sync-report.json` and a
`node --test` harness. No app wiring, no deletions, deterministic output.

## Story Requirements Covered

| Req | Tasks |
|---|---|
| R1 stats (incl. ability-derived invuln/FNP) | A2 |
| R2 per-size points | A2 |
| R3 keywords + abilities | A2 |
| R4 weapons + keyword normalizer | A3 |
| R5 wargear selection tree | A5 |
| R6 constraint evaluator | A4 |
| R7 default resolution | A5 |
| R8 faction/library plumbing + overrides | A1, A6 |
| R9 sync report | A6 |
| R10 validation harness | A7, A8 |

## Current-System Notes

- P1 left reusable tooling in `scripts/bsdata-import/v2/`: `discover.mjs`
  (has the `FACTIONS` catalogue map + a `buildIndex` across catalogue+deps
  + `resolveProfiles`/`deref` helpers), `hidden-analysis.mjs`, 15
  `fixtures/*.json` bundles (unit entry + transitively-referenced shared
  entries/groups/profiles, cruft-filtered), `census.json`, `DISCOVERY.md`,
  `FINDINGS.md`. `.cache/` (47 MB, gitignored) holds the raw catalogues.
- `scripts/bsdata-import/weaponHelpers.mjs` — `resolveEntry`,
  `resolveProfiles` (embedded + `sharedProfiles` via `infoLinks`),
  `directWeaponEntries`, `entryLinkQty` (the `min===max>1` "N copies" case).
- BSData facts confirmed in P1 (`FINDINGS.md`):
  - Unit profile: on the unit entry (1033), a model sub-entry (303), or
    none (8 → overrides). `InvSv`/`InSv` char OR an "Invulnerable Save"
    ability. FNP always an ability.
  - Points: `costs[name=="pts"]` base + `set/increment/decrement` modifier
    on field `51b2-306e-1021-d207` conditioned on model count (279 units).
  - Wargear: recursive `{min,max}` `selections`-field constraints, scopes
    `parent`/`self`/`model`/`unit`/entry-guid matter, `roster`/`force`
    ignored. `defaultSelectionEntryId` on 1324 groups; 494 mandatory groups
    need a fallback. Modes = sibling profiles named `➤ …` / `… - <mode>`.
  - Cruft: static `hidden:true` + name blocklist (`CRUFT` regex in
    `discover.mjs`) + Daemons "Show <god>" toggles + sub-faction/Legends
    unit-level `hidden` gates. ~15 real intra-unit `set:hidden` constraints.
  - Condition vocab is closed: `none, atLeast, atMost, equalTo,
    greaterThan, lessThan, instanceOf, notInstanceOf`.
- No target directory `src/core/data/` yet — this Plan creates it.

## Proposed Approach

Everything under `scripts/bsdata-import/v2/`, pure functions, no `src/`
imports. Small modules, each unit-testable against the fixtures:

```
v2/
  catalogues.mjs      # FACTIONS map + library-dep resolution + a global index
  resolve.mjs         # link/profile resolution helpers (port from weaponHelpers + discover)
  filter.mjs          # cruft predicate (hidden + blocklist + Daemons/subfaction gates)
  keywordNormalize.mjs# weapon-keyword string -> canonical {kw, on?, vs?}
  weapons.mjs         # unit tree -> weapons[] ({id,name,ranged?[mode],melee?[mode]})
  wargear.mjs         # unit tree -> wargear node tree (min/max, perModels, defaultSelected, weaponRefs)
  constraintEval.mjs  # BattleScribe condition evaluator over {modelCount, selections}
  unitMeta.mjs        # stats + size + points + keywords + abilities
  overrides.js        # per-unit/per-weapon patch table (data errors, no-stats units)
  emit.mjs            # deterministic JSON writer (recursive sorted keys, stable unit order)
  report.mjs          # sync-report accumulator
  ingest.mjs          # top level: for each faction -> UnitRecord[] -> files
  ingest.test.mjs     # node --test harness (fixtures + all-34 run + determinism)
```

### Key schemes

- **`UnitRecord.id`** = `<factionKey>/<slug(name)>`; `slug` = lowercased,
  `[^a-z0-9]+` → `-`, trim `-`. Within-faction name collision (unit +
  its `[Legends]` twin) → append `-2`, `-3`. Deterministic by source order.
- **`weapon.id`** = `slug(name)` unique within the record (append `-N` on
  collision). Wargear `node.weaponRefs` are these ids.
- **Determinism** — `units` sorted by `id`; `emit.mjs` serialises with a
  recursive key-sorting replacer; arrays keep source order except `units`
  and `keywords` (sorted). A no-change re-run ⇒ byte-identical file.
- **`_sync-report.json`** — committed alongside the data (small, and its
  diff shows what a re-pull changed). Structure: `{ generatedAt, catalogues:
  [{key,file,units}], parseFailures:[], unresolvedKeywordShapes:[{raw,egs}],
  defaultRuleFallback:[{unit,group,rule}], noStats:[], damageBrackets:[],
  unresolvedNodes:[{unit,path,reason}], overridesApplied:[{unit,fields}] }`.

### Points expansion (R2)

Base `pts`. Collect pts-field modifiers with a count condition; each yields
a `(threshold, value)` pair. `points` = for every integer size in
`[size.min, size.max]`, the value of the last modifier whose threshold ≤
size (or base). Typical result: `[{models:5,pts:X},{models:10,pts:Y}]` for
a 5/10 squad, `[{models:1,pts:X}]` for a single model. Non-count pts
modifiers (character-dependent) → ignored for `points`, logged.

### Cruft filter (R5, `filter.mjs`)

`isCruft(node)` = static `hidden === true` OR name matches the `CRUFT`
blocklist OR the node's `set:hidden` modifier is unconditional / gated on
`instanceOf` a catalogue / sub-faction / Legends marker / a Daemons
"Show <god>" toggle / `roster`/`force` scope. The ~15 genuine intra-unit
`set:hidden` (gated on a sibling `selections` count at `parent`/`unit`
scope) are **kept** and carried onto the node as a constraint for
`constraintEval` to turn into an effective `max: 0`.

## Affected Areas

- `scripts/bsdata-import/v2/*` — new modules (list above).
- `src/core/data/<faction>.json` ×34 — **new**, generated, committed.
- `src/core/data/_sync-report.json` — **new**, generated, committed.
- `src/core/model/unitRecord.js` — **new**, JSDoc typedef only (the shape
  Story B/C/D import).
- `.gitignore` — already excludes `scripts/bsdata-import/v2/.cache/`.
- Nothing else. Old pipeline, `src/factions/*`, `src/core/composableData/*`,
  the app: untouched.

## Data / API / State Changes

- New generated data tree `src/core/data/` (does not replace
  `src/core/composableData/` yet — Story E).
- `UnitRecord` + `node` + `weapon` typedefs published in
  `src/core/model/unitRecord.js` — the contract Story B/C/D build on;
  frozen at umbrella-plan **S2**.
- No persisted-state or app changes.

## Compatibility / Migration Considerations

None. Additive only; both pipelines coexist until Story E.

# Execution Graph

## Parallelization Summary

```
A1 ──┬──> A2 ─────────────────┐
     ├──> A3 ──> A5 ──────────┼──> A6 ──> A7 ──> A8
     └──> A4 ──────────────────────────────┘
```

A1 (scaffold + resolution) is the gate. Then **A2 (meta), A3 (weapons),
A4 (constraint eval)** are independent — separate files, only sharing A1's
helpers and the typedef. A5 (wargear) needs A3's weapon ids. A6 integrates
A2+A3+A5 into records + report. A7 is the harness (needs A4 to resolve
builds). A8 is the iterative "run all 34, make the report clean" task.

Critical path: **A1 → A3 → A5 → A6 → A7 → A8**.

## Tasks

### A1 — Scaffold, catalogue map, resolution layer, typedef, emitter

**Type:** Independent · **Parallel:** No (gate) · **Depends on:** none ·
**Blocks:** A2, A3, A4

**Files:** `v2/catalogues.mjs`, `v2/resolve.mjs`, `v2/filter.mjs`,
`v2/emit.mjs`, `src/core/model/unitRecord.js`

**Objective**
- `catalogues.mjs`: the `CATALOGUES` map (port + verify P1's `FACTIONS`),
  a `loadFaction(key)` returning `{catalogue, index}` where `index` merges
  the primary catalogue + its library deps (`sharedSelectionEntries`,
  `sharedSelectionEntryGroups`, `sharedProfiles`) and exposes `deref(id)` /
  `profilesOf(node)`.
- `resolve.mjs`: `resolveEntry`, `resolveProfiles` (embedded + infoLink),
  `directWeaponEntries`, `entryLinkQty`, `walkChildren(node)` yielding
  `{child, viaLink}` for `selectionEntries` + `selectionEntryGroups` +
  `entryLinks` (resolved), skipping cruft.
- `filter.mjs`: `isCruft(node)` per the spec above; `CRUFT` blocklist
  regex + the P1 `hidden-analysis` findings.
- `emit.mjs`: `writeJson(path, obj)` with a recursive key-sorting replacer;
  `slug(str)`; `uniqueId(base, taken)`.
- `unitRecord.js`: JSDoc `@typedef` for `UnitRecord`, `WargearNode`,
  `Weapon`, `WeaponMode`, `SyncReport`.

**Verification:** `loadFaction("greyknights")` and `loadFaction("blacktemplars")`
(chapter→SM library) resolve; `deref` follows a cross-catalogue link;
`isCruft` flags a Crusade node and a Daemons "Show Khorne Daemons" node,
passes a real wargear group; `writeJson` output re-parses equal and is
stable across two calls.

**Coordination:** owns the `index`/`deref` API and the typedef — publish
both to the Work file before A2/A3/A4 start.

---

### A2 — Unit meta: stats, size, points, keywords, abilities

**Type:** Dependency · **Parallel:** yes (with A3, A4) · **Depends on:** A1 ·
**Blocks:** A6

**Files:** `v2/unitMeta.mjs`

**Objective** — `unitMeta(unitEntry, index, faction)` → `{ id, faction,
name, keywords, stats, size, points, abilities, provenance }`:
- **keywords**: every `categoryLink` name, lowercased, verbatim (R3).
- **stats**: Unit profile on the entry → model sub-entry (1–2 deep) →
  `infoLinks`. `M,T,Sv,W,OC` parsed; `InvSv` from char or first
  "Invulnerable Save" ability (keep any qualifier text); `FNP` from a
  "Feel No Pain X+" ability. Multiple Unit profiles → top one + report.
- **size**: the model-count group's `{min,max}`, else `{min:1,max:1}`.
- **points**: per R2 expansion.
- **abilities**: `{name, text}` for every non-weapon non-Unit profile
  (embedded + infoLink) + `Transport`/`Orders`/faction ability types;
  `bracket:true` on `Damaged: 1-X`.

**Verification (fixtures):** GK Venerable Dreadnought (`T7 Sv2+ W8`,
single size, points); GK Strike Squad (`{min:5,max:10}`, points at 5 & 10);
SM Terminator Squad (points `[{5,…},{10,…}]` via the `set 320 when ≥6`
modifier); a unit with an "Invulnerable Save" ability → `InvSv` set;
Custodes unit with FNP → `FNP` set; a damage-bracket unit → top profile +
report entry.

---

### A3 — Weapons + keyword normalizer

**Type:** Dependency · **Parallel:** yes (with A2, A4) · **Depends on:** A1 ·
**Blocks:** A5

**Files:** `v2/weapons.mjs`, `v2/keywordNormalize.mjs`

**Objective**
- `keywordNormalize(raw)` → `{ kw, on?, vs? }`: lowercase, trim, collapse
  ` `/`-`/`‑` separators, strip trailing punctuation, parse
  `<name> [<N>+] [: <qualifier>]`. Unrecognised *shape* → `{ kw: <normalized
  raw> }` + report.
- `collectWeapons(unitEntry, index)` → `Weapon[]`: every weapon-bearing
  entry in the unit's non-cruft tree. Group its profiles by `typeName`
  (`Ranged Weapons` → `ranged[]`, `Melee Weapons` → `melee[]`); each
  profile is a **mode** `{A, BS|WS, S, AP, D, range?, keywords:[normalized]}`.
  A `➤`/`- mode` name is a mode of the same weapon; two same-name profiles
  across phases (Laser Lance) → one weapon with both lists. `_qty` from
  `entryLinkQty` recorded on the weapon (`count: N`). Dedup identical
  weapons; assign `id = uniqueId(slug(name))`.

**Verification:** normalizer collapses `Twin-linked`/`Twin-Linked`/
`TWIN-LINKED`/`Twin Linked` → one; parses `Anti-Fly 4+` → `{kw:"anti-fly",
on:4}`, `Lethal Hits: non-Monster/Vehicle` → `{kw:"lethal hits",
vs:"non-monster/vehicle"}`. Deff Dread → weapons incl. `dread-klaw`,
`big-shoota`, `rokkit-launcha`. Ork Kustom Shoota → one weapon, `ranged`
has 2 modes. Aeldari Laser Lance → one weapon, `ranged` + `melee` both set.

---

### A4 — Constraint evaluator

**Type:** Dependency · **Parallel:** yes (with A2, A3) · **Depends on:** A1 ·
**Blocks:** A7

**Files:** `v2/constraintEval.mjs`

**Objective** — `effectiveLimits(node, { modelCount, selections }, tree)` →
`{ min, max }`. Start from the node's raw `{min,max}`; apply each modifier
whose `field` is `hidden`/`selections`/a limit-guid and whose conditions
all pass, where a condition passes per BattleScribe semantics
(`atLeast/atMost/equalTo/greaterThan/lessThan` compare a counted
`selections` value at the given scope; `instanceOf/notInstanceOf` test
membership; `none` = always). Scopes: `parent`, `self`, `model`, `unit`,
entry-guid → count from `selections`; `roster`/`force` → **treated as
satisfied-and-ignored** (we don't model the list). A `set:hidden` that
passes ⇒ `max: 0`.

**Verification:** GK Strike Squad "Grey Knight with Heavy Weapon" →
`max 1` at modelCount 5, `max 2` at 10. Deff Dread "Wargear Options" group
→ `{min:4,max:4}` regardless. A Desolation Squad mutually-exclusive ammo
node → `max 0` when its sibling is selected. Standalone unit tests for each
condition type.

---

### A5 — Wargear selection tree

**Type:** Dependency · **Parallel:** No · **Depends on:** A1, A3 ·
**Blocks:** A6

**Files:** `v2/wargear.mjs`

**Objective** — `buildWargear(unitEntry, index, weapons)` → root `node`:
- recurse the non-cruft tree; each `selectionEntryGroup`/`selectionEntry`/
  resolved `entryLink` → a `node` with `kind`, `name`, `min`/`max` from its
  `selections` constraints, `children`.
- `perModels` from a `set max` modifier gated on model count.
- `weaponRefs` = ids of the weapons an option grants (match by resolved
  profile identity against A3's `weapons`).
- `defaultSelected` via R7's 4-step chain; step (4) → report.
- carry any kept intra-unit `set:hidden` / limit modifiers on the node
  (raw, for A4 at runtime).
- unresolvable link/profile → `unresolved: "<reason>"` on the node, keep
  the rest; report.

**Verification:** GK Venerable Dreadnought → "Assault Cannon" group
`{min:1,max:1}`, `defaultSelected` on "Assault cannon", `weaponRefs`
correct; the combo group present. Knight Despoiler → the deep nested tree
reproduces (#22 fixture) with every arm's weapons reachable. Custodian
Guard → named model variants as `kind:"model"` children. Boyz → Boss Nob
nested combo groups intact.

---

### A6 — Integrate: records, overrides, report, `ingest.mjs`

**Type:** Integration · **Parallel:** No · **Depends on:** A2, A3, A5 ·
**Blocks:** A7

**Files:** `v2/ingest.mjs`, `v2/overrides.js`, `v2/report.mjs`

**Objective** — for each faction: enumerate unit entries, run A2+A3+A5,
assemble `UnitRecord`, apply `overrides.js` last (record `overridden`),
push to the report. Emit `src/core/data/<faction>.json` (units sorted by
id, via `emit.mjs`) and `src/core/data/_sync-report.json`. Exit non-zero on
a parse failure. `overrides.js` starts with the 8 no-stats units.

**Verification:** `node v2/ingest.mjs` produces 34 files + the report,
exits 0; a second run is byte-identical; an override entry flips a value
and shows in `overridden` + the report.

---

### A7 — Validation harness

**Type:** Final Verification · **Parallel:** No · **Depends on:** A4, A6 ·
**Blocks:** A8

**Files:** `v2/ingest.test.mjs`

**Objective** — `node --test`:
- for each `fixtures/*.json`: build the `UnitRecord` from the bundle
  (a fixture-mode loader) and assert shape;
- the ~10 named assertions from Story R10 (a `resolve(record, selections,
  modelCount)` test helper that walks `wargear` + `constraintEval` and
  returns the weapon set): GK Ven Dread twin-lascannon-keeps-storm-bolter
  (#22), Strike Squad 5/10 points + 1/2 special (R2/R6), Deff Dread no-5th
  (R6), Despoiler deep nesting (#22), Custodian Guard variants, Terminator
  per-size points, Laser Lance dual profile, Kustom Shoota modes;
- ingest all 34 catalogues from `.cache`, assert 0 parse failures.

**Verification:** `npm test` (or `node --test scripts/bsdata-import/v2/`)
green.

---

### A8 — Run all 34, drive the sync report to clean

**Type:** Dependency · **Parallel:** No · **Depends on:** A7 · **Blocks:** none

**Objective** — iterate: run `ingest.mjs` over all 34, read
`_sync-report.json`, and for every entry either fix the code (an
unrecognised keyword shape ⇒ extend the normalizer; a bad default ⇒ tune
R7 / add an override) or record it as a deliberate `overrides.js` entry
(BSData data error, cited) / a bracket note. Repeat until R9's "done" bar
is met: **0 parse failures, 0 unresolved keyword shapes, every other line
accounted for.** Produce a one-page `INGEST-NOTES.md` summarising the
residue (overrides applied, brackets, any BSData errors found — the
seed of Story E's #3 migration).

**Verification:** the R9 bar; `_sync-report.json` reviewed line by line;
`INGEST-NOTES.md` written.

# Synchronization Points

## S-A1 — Resolution API + typedef frozen
**Waits for:** A1 · **Owner:** Master Agent
`index`/`deref`/`walkChildren` signatures and the `UnitRecord`/`node`/
`weapon` typedef published to the Work file before A2/A3/A4.

## S-A2 (umbrella S2) — UnitRecord shape frozen
**Waits for:** A6 (first full record emitted) · **Owner:** Master + Joshua
The committed `UnitRecord` shape is the contract Story B/C/D import — no
field renames after this without a coordination note.

## S-A3 — Story A done
**Waits for:** A8 · **Owner:** Master + Joshua
Harness green, report clean, `src/core/data/` committed, `INGEST-NOTES.md`
written. Gate to start Story B.

# File-Overlap / Conflict Analysis

| Tasks | Overlap | Rule |
|---|---|---|
| A2 / A3 / A4 | none (separate files; read A1) | concurrent OK |
| A3 / A5 | A5 imports A3's `weapons[]` output | A5 after A3 |
| A2·A3·A5 / A6 | A6 imports all three | A6 after all |
| A4 / A7 | A7 imports A4 | A7 after A4 |
| A6 / A8 | A8 edits `overrides.js` + tunes A3/A5/A7 | A8 last, single owner |
| `src/core/data/*` | only A6 writes | — |

# Testing / Verification Strategy

- **Unit:** `keywordNormalize` (every P1 raw variant → canonical);
  `constraintEval` (each condition type); `emit` determinism; points
  expansion.
- **Fixture:** each of the 15 bundles → valid `UnitRecord`; the ~10 named
  assertions.
- **Integration:** all 34 catalogues ingest, 0 parse failures, report
  within the R9 bar.
- **Repo health:** `npm run build` still clean (no `src/` runtime imports
  added); old `sync.mjs` still runs.
- **Determinism:** two consecutive `ingest.mjs` runs → `git diff` empty.

# Acceptance-Criteria Verification

| Story A criterion | Method |
|---|---|
| 34 files + report, exit 0 | A6 / A7 integration run |
| byte-identical re-run | A7 determinism test |
| 4 factions' default weapon sets match today (points delta only recorded) | A8 reconciliation vs. `composableData/*.json` |
| Deff Dread no 5th weapon; Strike Squad 1→2 special by size | A4 + A7 tests |
| Laser Lance one entry, ranged+melee | A3 test |
| normalizer collapses casing variants; parametric parse | A3 unit tests |
| `_sync-report.json` clean for all 34 | A8 |
| old pipeline + app still build | repo-health check |

# Risks

- **A weapon's mode split isn't purely name-based** (a mode encoded as a
  child `selectionEntry` with its own profile, not a sibling profile).
  *Mitigation:* A3 handles both — sibling profiles AND single-weapon child
  entries under one weapon entry; the fixtures (Kustom Shoota, a plasma
  gun) cover it; anything else → report + fixture in A8.
- **`weaponRefs` matching** (option → which `weapons[]` entry) is by
  resolved-profile identity; a shared weapon used by base + an option
  could mis-match. *Mitigation:* match on the resolved entry/profile id,
  not the display name; test with Razorback (twin heavy bolter base +
  storm bolter option).
- **Points modifier semantics** — some `set pts` conditions stack or use
  `repeats`. *Mitigation:* A2 handles the `(threshold,value)` list; log
  anything with `repeats`/multiple count conditions for A8.
- **Determinism across a BSData re-pull** — upstream reorders entries.
  *Mitigation:* sort `units` by `id`, sort object keys; a re-pull diff
  then reflects real data changes only.
- **`src/core/data/` size** — 34 pretty-printed files. *Mitigation:*
  acceptable (comparable to today's `composableData/`); 2-space indent,
  sorted keys keep diffs readable.

# Open Technical Questions

- Fixture-mode loader: reuse `discover.mjs`'s `bundle` format directly, or
  have `ingest.mjs` accept an injected index? (A1 decides.)
- Do we keep `provenance` in the committed data or strip it on emit
  (debug-only)? Lean: keep — it's tiny and useful.

# Execution Instructions

1. Read `stories/bsdata-ingester.md` and this Plan.
2. Update `work/bsdata-verbatim-rearchitecture.work.md` — add the A1–A8
   rows.
3. Run **A1**, publish the API + typedef to the Work file (S-A1).
4. A2, A3, A4 concurrently (subagents OK — disjoint files); A5 after A3.
5. A6 integrate; A7 harness; **stop at S-A2** to freeze the `UnitRecord`
   shape with Joshua.
6. A8 iterate to a clean report; write `INGEST-NOTES.md`; stop at S-A3.
7. Keep the Work file current; nothing in Story B starts before S-A3.
