# Story: Re-architect BSData integration — consume BSData faithfully, model rules not schema

## Status

Ready for Planning — pending Joshua's OK. Reshaped through the 2026-09-02/03
discussion. One deliberate gate: the Plan's **first task is a structural
discovery pass** over all ~28 BSData catalogues (Open Questions Q1); its
findings size and may reshape later tasks. Leader/character UX (Q5) is
parked for a later discussion and does not block v1.

## Summary

The current BSData integration (`scripts/bsdata-import/`) reshapes the
third-party data into a bespoke schema (`src/core/composableUnit.js`:
`base + exclusive-choice slots`, weapons as fixed-position
`[shots, skill, S, AP, D, tags]` arrays). That reshaping layer —
`extractSlots.mjs`, `extractBase.mjs`, `buildFamily.mjs`, `hardpointMap.mjs`,
`wargearPoints.mjs`, `ourSizeTiers.mjs`, and the hand-authored
`src/factions/*.js` files it depends on — is where essentially every
correctness bug in the project lives (GitHub issues #22, #26, #29, #34, the
21 standing "coverage warnings," and the pre-baked-SKU errors it replaced).

BSData already describes each unit completely and faithfully: every weapon
with its full stat line and GW keywords, every unit with its stats,
keywords, abilities, points, and the **min/max constraints on its wargear
and its unit size**. This Story proposes to **stop inventing our own schema**
and instead consume BSData's own structure — weapons, stats, and the
selection/constraint tree — near-verbatim, and to put the app's actual
intelligence into a small number of finite, faction-agnostic pieces: a
**weapon-keyword dictionary**, a **unit keyword/ability layer** (offensive,
defensive, and reactive effects), and a **combat engine** that reads them.

This also removes the structural blocker that has kept the app at 4
factions when the intent was all ~28: `convertFaction.mjs` cannot import a
faction that has no hand-authored `src/factions/*.js` file.

## Problem

### The schema is fighting the data

The pipeline was built and validated against one unit shape (Grey Knights
Paladin Squad) and declared done when all 74 units of the 4 tracked
factions "converted without erroring." Since then almost every piece of
work on it has been chasing places where the schema misrepresents a unit:

- **#22** — single-model units with multiple fixed weapons: swapping one
  weapon wiped the whole loadout, because the schema stores weapons as a
  flat list with no record of which mount they occupy. The fix so far is a
  hand-verified per-unit "hardpoint tag" table.
- **#26** — dual-profile weapons (strike/sweep) double-counted.
- **#29** — the schema's "a slot swap removes one model's weapons" rule
  misfires on add-on mounts, on `replaces` it over-claims, and on slots the
  extractor invented out of base weapons.
- **21 coverage warnings** — BSData groups that matched none of the
  extractor's ~4 recognised "shapes" and silently produced no wargear.

All of this was found *with* hand-authored data to diff against. Scaling
the same heuristic extraction to ~24 more factions, with no hand data to
check it, would multiply the silent errors.

### The reshape is lossy and adds nothing

The schema discards information BSData provides — weapon names and ranges,
which weapons share a mount, unit Toughness (kept in a *separate* `DEFENSE`
map, the root of #21), unit-level defensive rules entirely — and in
exchange it produces "configurable base + slots," a representation the
Evaluator does not actually need. BSData's own min/max constraint tree
already expresses every wargear rule ("pick 4 of these," "you have X, may
replace with Y or Z," "1 per 5 models") in a single uniform way.

### The app is stuck at 4 factions

The BSData import was, from its first commit, wired for exactly 4 factions
(`sync.mjs` `NAME_MAPS`/`FILES`). Switching to BSData changed the *source*
of the 4 factions' wargear data, not the *breadth*. `convertFaction.mjs`
hard-requires a hand-authored `src/factions/<faction>.js` entry per unit
for stats (`refUnit.sv/inv/fnp/W`), points (`ourSizeTiers.mjs`), and the
unit list (`NAME_MAPS`). A faction with no hand file cannot be imported.

## User / Product Context

Solo hobbyist project (Joshua). Single user, single tester. The app is a
**damage-and-durability comparison tool** — "how does unit A's output and
survivability compare to unit B's" — presented as a side-by-side and as a
table with columns for real "meta" units.

**The frame is 2000-point matched-play** — that is Joshua's focus. It does
**not** mean building lists; it means every unit the tool evaluates is a
**legal, correct** matched-play build:

- real datasheets at the sizes they are actually fielded;
- wargear that obeys the datasheet's rules;
- points that are the real matched-play cost at that size (R3);
- one detachment per faction, its army rule / enhancements / stratagem
  effects applied (the existing `DETACHMENTS` / `getDetBuff` system, ported
  to the new model — not deferred).

A wrong build produces wrong numbers, so "correct" is the bar. There is no
roster, no points total, no list-legality checking beyond the individual
unit.

Joshua has said repeatedly he does not want to be the QA process for the
importer, and wants the tool to cover every 40K faction. BSData's weapon
keywords are GW's own fixed controlled vocabulary — the same ~25–30 named
abilities recur across every datasheet in the game — so a keyword table is
a lookup, not a per-unit judgement call.

Key clarification from the 2026-09-02 discussion: **keywords and rules
attach to units as well as to weapons, and are not only offensive.** Many
are defensive (invulnerable save, Feel No Pain, "-1 to be hit", "reduce
incoming Damage by 1", Stealth) or reactive/conditional (Overwatch, Fights
First, "each time this unit is targeted…"). The model must carry all of
these on the unit, and the engine must apply the calc-relevant ones on the
**defending** side, not just the attacking side.

## Desired Outcome

1. **A unit is stored as BSData describes it**, with as little reshaping as
   is usable:

   ```
   {
     id, name, faction,
     stats:     { M, T, Sv, W, OC, InvSv?, FNP? },      // from the Unit profile
     size:      { min, max },                            // model count range
     points:    [ { models, pts }, ... ],                // per size, from costs
     keywords:  [ "Vehicle", "Walker", "Infantry", ... ],// unit keywords
     abilities: [ { name, text, effect? } ],             // effect present only if calc-relevant
     wargear:   <selection tree>                         // see below — BSData's own structure
   }
   ```

   No `base`, no `slots`, no `choices`, no positional weapon arrays, no
   per-unit hardpoint table.

2. **Wargear is BSData's selection tree, kept faithfully:**

   ```
   node = {
     name, kind: "group" | "option",
     min, max,                 // BattleScribe's own constraints, verbatim
     perModels?: N,            // "1 per N models" scaling, from constraint scope
     defaultSelected?: bool,   // derived from min>=1 / included-by-default
     weapon?: { name, kind: "ranged"|"melee", A, BS|WS, S, AP, D, range, keywords: [...] },
     children?: [ node, ... ]
   }
   ```

   The UI walks this tree directly. "Pick 4 of these" is a group with
   `min=max=4`; "you have a reaper chainsword, may replace it with a
   warpstrike claw" is a group `min=max=1` with the chainsword
   `defaultSelected`. Same uniform representation, no shape classification,
   no base-vs-slot split.

3. **The Evaluator builds a unit by walking that tree** — pick within each
   group up to its `max`, size-scaled limits enforced, default selections
   pre-filled — then runs the engine over the selected weapon leaves plus
   the unit's stats and abilities. Choosing a loadout respects the real
   rules; it is not "tick any weapons you like."

4. **A unit acts as attacker or as defender from the same record.** When a
   unit is the defending piece (the other side of a side-by-side, or a
   benchmark column), its full defensive profile applies: `T`, `Sv`,
   `InvSv`, `FNP`, plus any calc-relevant defensive abilities. The
   Evaluator's benchmark/"meta" columns are **real units from the data with
   all their rules**, not the current hand-abstracted `{T, veh, mon}`
   target profiles (this folds in #21).

5. **Adding a faction is: add its catalogue file to `sync.mjs`, run it.**
   No hand-authoring of units, stats, points, or wargear. A gap becomes
   "this keyword or ability effect isn't mapped yet" — one additive fix
   that helps every faction — not a per-unit repair.

6. **The 4 currently-tracked factions' Evaluator numbers do not regress**
   without a deliberate, documented reason (a genuine prior bug being
   corrected).

## Requirements

### R1 — Faithful unit record

Populate the unit record (shape above) directly from BSData: the `Unit`
profile → `stats` (looking on model sub-entries too — some squads carry
stats there); `categoryLinks` → `keywords`; ability profiles →
`abilities` (`{name, text}`); `costs.pts` → `points`.

### R2 — Wargear as BSData's selection tree

Represent each unit's wargear as its BSData selection/constraint tree
(shape in Desired Outcome §2), with `min`/`max`/scope constraints carried
verbatim. No classification into hand-rolled shapes, no base/slot split.
Weapon leaves carry the real weapon name, characteristics, and keyword
list. Resolve `entryLinks`, `infoLinks`, shared entries/groups, and
cross-catalogue links. Filter out non-matched-play subtrees (Crusade,
Legends, Battle Honours, Enhancements, Detachment, weapon modifications).

### R3 — Unit size, per-size points, size-scaled build rules

Extract the model-count range from BSData constraints and the **correct
points at every fielded size** by resolving BSData's cost modifiers (a base
cost plus conditional `set`/`increment` modifiers keyed on model count) —
not just the min-size cost. Honour size-scaled wargear limits: BSData
encodes "1 per 5 models" as a base `max` constraint plus a conditional
modifier (`set max = 2` `when models atLeast 10`, verified on GK Strike
Squad). The Evaluator must offer the right number of special/heavy weapons
for the chosen squad size.

### R4 — Weapon-keyword dictionary

One reviewed module mapping every standard GW **weapon** keyword to its
engine effect (or to an explicit "no calc effect"). Complete for the
standard vocabulary across all factions, not just the ~12 the 4 current
factions use. Magnitudes are parametric: `Sustained Hits X`, `Rapid Fire
N`, `Anti-<keyword> N+`, `Melta N`, plus `Devastating Wounds`, `Lethal
Hits`, `Twin-linked`, `Torrent`, `Lance`, `Hazardous`, `Blast`, `Heavy`,
`Assault`, `Precision`, `Ignores Cover`, `Indirect Fire`, `One Shot`,
`Pistol`, `Extra Attacks`, `Psychic`, … An unknown keyword is surfaced by
`sync`, never silently dropped, and the weapon still imports.

### R5 — Unit keyword / ability layer (offensive, defensive, reactive)

**Every calc-relevant rule present in the data today is modelled** — unit
abilities, weapon abilities, detachment/army-wide rules — because discovery
(Q1) enumerates them all before implementation. Rules with genuinely no
bearing on the damage/durability exchange are display-only text. The only
thing that reaches the `sync` review list is a *newly-introduced* rule from
a future data update that isn't in the dictionary yet (regression guard,
see Open Questions Q2); such a rule is marked "not modelled" on the unit so
the UI is honest rather than quietly wrong. Coverage must include:

- **Defensive** — invulnerable save, Feel No Pain, "-1 to be hit",
  "reduce incoming Damage by 1", "ignore AP -1", Stealth, Armour of
  Contempt-style effects.
- **Offensive** — reroll hits/wounds (full or 1s), +1 to hit/wound, lethal
  hits granted army-wide, "Anti-" auras.
- **Reactive / conditional** — Fights First and similar that change who
  strikes; also modelled.

**One-use and situational effects** (once-per-battle stratagems, one-use
wargear, conditional buffs like "if it Remained Stationary") are modelled
but gated behind an explicit **"assume used" toggle listed on the unit
itself in the build UI**, alongside its wargear — not silently always-on or
always-off, and not a separate per-side panel. Few of these actually affect
this sim, so contextual placement is fine. Persistent detachment effects
that are always relevant when the detachment is active stay always-on with
the existing high-contrast banner (see project convention).

The ability-text → typed-effect mapping is a reviewed table, additive per
faction as needed.

### R6 — Combat engine reads keywords and full profiles directly

The hit → wound → save → FNP → damage resolution consumes the unit
record's weapon fields + keyword lists, the unit's calc-relevant
abilities, and the **defender's full profile** (stats + defensive
abilities) directly — not a pre-digested `tags` object and not a
`{T, veh, mon}` abstraction. Preserve `engine.js`'s probability model,
Torrent correction, and dice-average conventions where sound; restructure
the inputs.

### R7 — One unit model; the meta tab is real units

There is a single unit representation. A unit is a "target" only when it is
placed in the defending slot.

The Evaluator's **"meta" columns keep their current identities** (`targets.js`
already lists real units — Allarus, C'tan, Defiler, Magnus, Custodians,
Possessed, Bloodcrusher, Rubric, Riptide, Necron Warriors, Keeper, Fiends)
but each is **re-backed by its real BSData unit record**, so its full
defensive rules apply on defence (invuln, FNP, -1 Damage, etc.) instead of
today's hand-abstracted `{T, sv, inv, veh, mon, wounds}` profile. This
closes #21. No change to *how* the meta set is chosen — that's a possible
future refinement, no overhead added now.

The generic `std` toughness/save bands (`grp: "std"`) are secondary — keep
as-is or drop; not the focus. The per-faction `DEFENSE` maps go away
(defensive data now comes from the unit record).

### R8 — All factions importable

`sync.mjs` ingests any BSData/wh40k-11e faction catalogue with no
hand-authored `src/factions/*.js` file. Stats and points for newly-added
factions come from BSData. The 4 existing factions may keep MFM-verified
points if cleaner, but only as an explicit per-faction override, not an
architectural dependency.

### R9 — Override table for BSData errors

A small, explicit per-unit / per-weapon override table for cases where
BSData is wrong, stale, or missing data (e.g. Land Raider Redeemer
flamestorm cannons, #3). Each override cites the real datasheet. Overrides
are the exception, not a parallel dataset.

### R10 — Retire the old pipeline

Once the new path reaches parity on the 4 current factions:
`composableUnit.js`, `extractSlots.mjs`, `extractBase.mjs`,
`buildFamily.mjs`, `hardpointMap.mjs`, `wargearPoints.mjs`,
`ourSizeTiers.mjs`, the `composableData/*.json` schema, the `UnitBuilder`
slot UI, most of `src/factions/*.js`, `KNOWN_GAPS.md`, and the merged #22
hardpoint work are removed. GitHub issues #22, #26, #29, #34 close as
superseded; #21 closes via R7; #7 folds into R4.

### R11 — Evaluator UI walks the selection tree

The faction picker / unit builder render a unit as its stats plus its
wargear tree: nested groups with their pick limits, default selections
pre-filled, size-scaled limits honoured. Selecting weapons updates the
comparison live. No `base`/`slot`/`choice` widgets.

### R12 — Legal, correct units for the 2000-point matched-play spec

The tool is **not an army/list builder** — no roster object, no running
points total, no Detachment-Point or enhancement-slot tracking. The 2k
tournament frame means only that each unit is built **legally and
correctly**:

- wargear selections obey BSData's constraints (R2);
- squad sizes are the real matched-play sizes;
- points are the real matched-play cost at the chosen size (R3) — no
  synthetic or interpolated values.

**Detachment handling stays as it is today, ported forward:** pick one
detachment per faction (`DetachmentPanel`), its effects resolve through
`getDetBuff()` onto the new unit model. Source the detachment/enhancement
*list* from BSData where exposed; keep the typed *effects* hand-curated
(same pattern as R5). Army-wide rules (Oath of Moment, Waaagh!, Votann
judgement token) resolve through the same ability layer.

### R13 — Unit model feeds the Fight Simulator too

`src/tools/FightSimulator.jsx` is a second consumer with richer needs —
weapon ranges, shooting / melee / charge phases, cover, hidden / line of
sight, movement. The new unit record must carry what that tool needs
(weapon `range`, unit `M`, and phase-relevant keywords: Pistol, Assault,
Heavy, Torrent, Rapid Fire, Blast, Indirect Fire, plus unit keywords like
Infantry / Fly / Vehicle). v1 wiring is Evaluator-first, but the model is
designed for both; the Fight Simulator's positional logic (ranges, cover,
LoS) is its own follow-up, not part of this Story.

## Acceptance Criteria

- [ ] A new faction (e.g. Orks) is added by one `sync.mjs` entry + a run —
      no `src/factions/orks.js` — and its units appear in the Evaluator
      with correct weapons, stats, points, and size ranges.
- [ ] For the 4 currently-tracked factions, every unit's default-loadout
      Evaluator output (damage-per-point per target, EW/pt, composite) is
      within a small, explained tolerance of today's numbers, or differs
      only where a documented prior bug is corrected.
- [ ] A multi-weapon unit configured to a non-default legal loadout (Deff
      Dread 2 klaw + 2 rokkit; Venerable Dreadnought twin lascannon;
      10-model squad with 2 special weapons) produces arithmetically
      correct output with no weapon silently lost (#22) and no weapon
      double-counted (#26).
- [ ] A squad's available special/heavy-weapon count scales with the
      chosen model count (#R3).
- [ ] A benchmark column set to a real unit with a defensive rule (e.g.
      a Custodes unit with a 4++ and -1 Damage) is evaluated with that
      rule applied on defence (#21 / R5 / R7).
- [ ] `sync.mjs` over all ~28 BSData catalogues completes and prints the
      finite list of unrecognised keywords and unmapped ability effects.
- [ ] The keyword dictionary has an entry (effect or explicit no-op) for
      every weapon keyword present across all 28 catalogues.
- [ ] `composableUnit.js` / `extractSlots.mjs` / `hardpointMap.mjs` and the
      per-unit hardpoint table are deleted; build and Evaluator still work.

## Edge Cases / Failure Modes

- **BSData data wrong or missing** — R9 override table; each override cites
  the datasheet.
- **Parametric keyword** (`Sustained Hits D3`, `Anti-Fly 4+`, `Rapid Fire
  2`, `Melta 4`) — dictionary entries parse the parameter from the string.
- **Bespoke per-weapon ability text** (GK "Conversion:", Force Edge,
  "Guidance of the Ancients") — surfaced by `sync`, added to the dictionary
  or ability layer deliberately.
- **Non-matched-play subtrees** (Crusade / Legends / Battle Honours /
  Enhancements) make up a large fraction of every unit's tree — a missed
  filter shows up as junk weapons/options.
- **Squad stats on the model entry**, not the unit entry (Ork Boyz) —
  ingestion must check both.
- **Multiple `Unit` profiles** (damage brackets) — take the undamaged/top
  profile; damage-bracket modelling is out of scope for v1.
- **Multi-model units with heterogeneous models** (Boyz + a Boss Nob with
  its own weapon tree) — the selection tree carries each model's options
  under its own subtree with its own `min/max`; the engine scales by count.
- **Conditional constraints / BSData `modifiers`** (a limit that changes
  based on model count or another selection) — evaluated by a real
  interpreter over BattleScribe's closed condition vocabulary (`atLeast`,
  `atMost`, `equalTo`, `greaterThan`, `lessThan`, `instanceOf`,
  `notInstanceOf`) against the current build state. Discovery (Q1)
  enumerates every instance so the interpreter covers all of them.
- **Defensive/reactive abilities with no clean steady-state model**
  (Overwatch, once-per-game effects) — represented as text, excluded from
  the calc, and that exclusion is visible, not silent.

## Constraints

- Single-user, static front-end (Vite + React), no backend, no build-time
  fetch — `sync.mjs` stays a manual step that commits generated data.
- Restructure the combat math's inputs, don't rewrite the probability
  model or dice conventions.
- The 4 tracked factions reach parity before the old pipeline is removed;
  no flag-day where the app is broken.
- Preserve the multi-tool suite structure (`src/core` shared, `src/tools/*`).
- `main` currently contains the merged #22 hardpoint work (PRs #30/#31/#36/
  #37); that is the starting point and R10 removes it.

## Non-Goals

- Any kind of army/list builder — no roster object, no running points
  total, no Detachment-Point or enhancement-slot budgeting, no whole-list
  legality checks. Individual units are built legally; that is the extent
  of the "2k" framing.
- Character-attach modelling for newly-added factions in v1
  (`abilities`/leader handling stays minimal); the 4 existing factions keep
  their current character data until the follow-up.
- Damage-bracket ("while this model has N wounds remaining") modelling.
- The Fight Simulator's positional logic (ranges, cover, LoS, phase
  sequencing) — its own follow-up (R13).
- A visual redesign of the Evaluator beyond replacing slot widgets with a
  tree walker.
- Modelling every printed ability — only the calc-relevant subset is typed
  (the rest stay as visible text).

## Existing Behavior

`node scripts/bsdata-import/sync.mjs` fetches 4 named catalogue files, runs
`convertFaction.mjs` per faction (walks the BSData tree with
`extractSlots.mjs`'s shape heuristics, pulls stats/points from the
hand-authored `src/factions/*.js`, applies `hardpointMap.mjs` /
`wargearPoints.mjs` overrides), and writes
`src/core/composableData/<faction>.json`. The Evaluator
(`src/tools/FactionUnitEvaluator.jsx`) and `UnitBuilder.jsx` read that
JSON; `resolveBuild()` collapses a `{modelCount, slotChoices}` selection
into `{sWs, mWs, pts}` for the engine. Targets are hand-abstracted in
`src/core/targets.js` + per-faction `DEFENSE` maps. `KNOWN_GAPS.md` logs
where this misrepresents reality.

## Examples / Scenarios

### Scenario 1 — Add a faction

**Given:** Orks are not in the app.
**When:** a maintainer adds `orks: "Orks.json"` to `sync.mjs` and runs it.
**Then:** every Ork unit appears in the Evaluator with its BSData weapons,
stats, points, and size range; `sync` output lists any Ork-only keywords
or ability effects not yet mapped; no `src/factions/orks.js` is created.

### Scenario 2 — Configure a multi-weapon vehicle

**Given:** a Deff Dread — BSData: a `min=max=4` group over {Dread klaw
(min 2), Big shoota (min 2), Kustom mega-blasta, Rokkit launcha, Skorcha}.
**When:** the user sets 2× Dread klaw and 2× Rokkit launcha.
**Then:** the comparison row shows the summed output of exactly those 4
weapons per target; the UI would not have let a 5th weapon be added.

### Scenario 3 — Squad size scaling

**Given:** a 10-model Ork Boyz squad, "1 per 5 models may take a special
weapon."
**When:** the user sets the size to 10.
**Then:** the Evaluator offers 2 special-weapon slots; at size 5 it offers 1.

### Scenario 4 — Defensive rule on a benchmark

**Given:** a benchmark column set to a unit with a 4+ invulnerable save
and "reduce incoming Damage by 1".
**When:** any attacker is evaluated against it.
**Then:** the durability/EW figure reflects the 4++ and the -1 Damage.

### Scenario 5 — New keyword

**Given:** a weapon has `Keywords: Wall of Death` (unmapped).
**When:** `sync.mjs` runs.
**Then:** the unit imports; `sync` output contains `unrecognised keyword:
"Wall of Death" (Orks / Flash Gitz)`; the weapon evaluates as if the
keyword were absent until an entry is added.

## Open Questions

### Resolved during discussion (kept here for the planner)

- **Default selection** — BSData groups carry an explicit
  `defaultSelectionEntryId` (verified on GK Venerable Dreadnought). Treat it
  as optional metadata: pre-select when present, otherwise pre-select
  nothing.
- **One-use / situational toggles (Q3)** — they render as a **list on the
  unit itself, in the build UI**, alongside its wargear — not a separate
  per-side panel. Joshua's read: few of these actually affect this sim, so
  contextual placement is fine and won't clutter.
- **Generated data (Q4)** — `sync.mjs` is a **manual step, run
  semi-frequently** (MFM points updates, errata, new editions) and the
  output is **committed**. Not build-time.

### Genuinely open

- **Structural discovery must come first (Q1).** Before implementation, a
  discovery pass reads all ~28 BSData catalogues and enumerates every
  distinct way wargear, weapons, stats, and constraints are encoded — so
  the tree-walker and the ingester are built to cover the real data by
  construction, not patched shape-by-shape the way `extractSlots.mjs` was.
  Deliverable: a short structural report + a fixture set of the awkward
  cases. The Plan's first task; its findings may reshape later tasks.

- **Conditional constraints (Q2) — resolved.** Discovery (Q1) enumerates
  the complete set of constraint/modifier patterns present across all 28
  catalogues; we build the evaluator to cover **all of them**. There is no
  "handle common, defer rest" — once Crusade/Legends subtrees are filtered
  (they carry `hidden` markers) and roster-scope constraints are ignored by
  design (R12: not a list builder), what remains is the small closed
  BattleScribe condition vocabulary (`atLeast`, `atMost`, `equalTo`,
  `greaterThan`, `lessThan`, `instanceOf`, `notInstanceOf`) over
  `selections` at a scope — "1 per 5 models" = `atLeast` on model count;
  "not if it has X" = `atMost 0` on a sibling. Fully modellable.

  After Task 1 there is **no residual modelling backlog**. The `sync`
  "needs a human look" output (which should be near-empty in steady state)
  exists only as a **regression guard for future data changes**: when the
  game data updates (MFM, errata, new edition/faction), `sync` re-run
  surfaces (a) BSData data errors → R9 override table, and (b) any keyword /
  ability / constraint pattern that did not exist at discovery time → added
  to the dictionary/evaluator in that iteration if calc-relevant. Same idea
  as today's `sync` gaps output, but honest/visible instead of silent, and
  expected to be empty.

- **Leaders / character attachment (Q5) — needs more discussion.** BSData
  leader entries carry the list of units they can attach to (Leader ability
  text and/or a structured link). Eligibility = "is this unit in that
  list." Open UX question: pick a unit then show eligible characters, or
  pick a character then show units it can join (Joshua leans the latter —
  "easier to know"). For the 4 existing factions, the current `chars`
  system is bolted on during the transition and folded into the R5 ability
  layer as a follow-up. Revisit before the follow-up.

## Notes

- Origin: a long conversation (2026-09-02) that began as "keep working on
  #22," surfaced that the app has 4 of ~28 factions when the intent was
  all, and concluded that scaling the heuristic reshape is the wrong move —
  the reshape *is* the bug source. Joshua's framing: "you have a box and
  you are trying to fit this data into that box, meanwhile this data is
  100% descriptive… just define the rules for the weapons and how many can
  be used, what the keywords do, what rules the unit has, how combat
  works."
- Rejected alternative: extend `convertFaction.mjs` to all factions on the
  existing schema (a "measurement spike" was floated). Rejected — it scales
  the fragile layer instead of removing it, with no hand data to catch the
  errors.
- Evidence the raw data suffices: direct inspection of BSData for Ork Deff
  Dread and Boyz showed complete weapon stat lines + keywords, unit stats,
  points, and wargear as clean min/max constraints. The only awkward part
  is that Crusade/Legends cruft is ~40% of each unit's tree and must be
  filtered.

### BSData structure findings (from raw inspection, 2026-09-02)

Verified against `Imperium - Grey Knights.json` and `Orks.json` from
`BSData/wh40k-11e`:

- **Unit stats**: a `profiles` entry with `typeName: "Unit"`; characteristics
  `M, T, Sv, W, LD, OC, InSv` as strings (`"Sv": "3+"`, `"InSv": "4+"` or
  `""` for none). Squads sometimes carry this on a model sub-entry, not the
  unit entry.
- **Points**: `costs` array; the real one is `name: "pts"`. Everything else
  (`Crusade Points`, `Detachment Points`, `Enhancements`, …) is a currency
  at value 0 — filter to `pts`.
- **Weapon profiles**: `typeName` `"Ranged Weapons"` / `"Melee Weapons"`;
  characteristics `Range, A, BS`/`WS, S, AP, D`; `Keywords` is a
  comma-separated string of GW's controlled vocabulary. May be embedded
  (`profiles`) or shared via `infoLinks` → `sharedProfiles`.
- **Wargear = nested `selectionEntryGroups` / `selectionEntries` /
  `entryLinks`**, each with `constraints` (`{type: "min"|"max", value,
  field: "selections", scope: "parent"}`).
- **Default choice is explicit**: a group has
  `defaultSelectionEntryId` pointing at the child that is equipped by
  default. GK Venerable Dreadnought "Assault Cannon" group:
  `{min:1, max:1}`, `defaultSelectionEntryId` → "Assault cannon".
  ("You have X, may replace with Y/Z" = a `min=max=1` group whose default
  is X.)
- **Size-scaled limits are explicit**: base `constraint {max:1}` + a
  `modifier {type:"set", value:2, conditions:[{type:"atLeast", value:10,
  field:"selections", scope:<squad group>}]}` = "1, or 2 at 10+ models".
  (GK Strike Squad "Grey Knight with Heavy Weapon".)
- **Cruft filter signal**: non-matched-play subtrees (`Crusade`, `Battle
  Honours`, `Weapon Modifications`, `Gifts of the Prescient`, …) carry
  `hidden: true` or a `modifier {set hidden true}`. Filtering on `hidden` +
  a name blocklist removes ~40% of the tree.
- **Cross-references**: `entryLinks` / `infoLinks` into
  `sharedSelectionEntries`, `sharedSelectionEntryGroups`, `sharedProfiles`,
  and sometimes a separate library catalogue (Chaos Knights). Resolution
  helpers already exist in `weaponHelpers.mjs`.
- Reusable seeds: `src/core/engine.js` (combat math), `scripts/bsdata-
  import/keywordMap.mjs` (partial keyword table), the `sync.mjs` fetch, and
  the `resolveProfiles` / link-resolution helpers in `weaponHelpers.mjs`.
- The merged #22 hardpoint work and `KNOWN_GAPS.md` are throwaway once R10
  lands; still-relevant content (real BSData data errors like #3) migrates
  to the R9 override table's comments.
