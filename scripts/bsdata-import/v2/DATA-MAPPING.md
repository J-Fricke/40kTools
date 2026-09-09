# BSData → UnitRecord: exactly what the ingester does, and what it drops

This answers "what's the diff between BSData and our data, and do we lose
anything?" Field by field. The guiding rule: **keep BSData's content
verbatim; only impose structure (grouping, tree, link resolution,
cruft-filter).** Anything that needs interpreting (dice, skill, keyword
meaning) is left for the engine (Story B).

## Per-field mapping

| UnitRecord field | Source in BSData | Transformation | Information lost |
|---|---|---|---|
| `id` | — | **derived**: `<faction>/<slug(name)>` | none (new) |
| `faction` | which catalogue file | **derived** | none (new) |
| `name` | selectionEntry `.name` | verbatim | none |
| `keywords` | `categoryLinks[].name` | `.toUpperCase()`, dedup, sort | none — same list of names, cased |
| `stats.{M,T,Sv,W,OC,Ld}` | Unit profile `characteristics` | verbatim strings (`"8\""`, `"9"`, `"2+"`) | none |
| `stats.InvSv` | Unit-profile `InvSv`/`InSv` char, **else** parsed from the first "Invulnerable Save" ability | the numeric part (`"4+"`) | the conditional wording of an ability-based save ("4+ vs ranged") — kept as `stats.InvSvNote` when present, but only the bare value is in `InvSv` |
| `stats.FNP` | parsed from a "Feel No Pain X+" ability's name/text | the value (`"5+"`) | any conditional wording ("vs mortal wounds") — not captured |
| `size.{min,max}` | the model-count group's `selections` min/max constraint (+ a mandatory leader model) | **interpreted** — the ingester finds the right group | wrong if the heuristic misidentifies the group (a bug, not a design choice) |
| `points[]` | `costs[name=="pts"]` + pts-field `set/inc/dec` modifiers with a model-count condition | evaluate the count modifiers; emit **min-size and max-size rows only** | intermediate sizes (5-10 squad → rows for 5 and 10, not 6-9); **non-count pts modifiers dropped** (the "3rd+ copy of this unit costs more" battle-size tax, character-dependent buffs) — these are logged in `_sync-report.json`, and they never change a unit's own list cost |
| `abilities[]` | every non-weapon, non-"Unit" profile on the unit + immediate ability children (embedded + `infoLinks`) | `{name, text}`; `bracket:true` on "Damaged: 1-X" | the profile `typeName` ("Abilities" / "Transport" / faction types) — lumped; any structured sub-fields on the profile |
| `weapons[].{ranged,melee}[].{A,BS,WS,S,AP,D,range}` | weapon profile `characteristics` | verbatim strings (`"D6"`, `"3+"`, `"-1"`, `"24\""`) | none |
| `weapons[].{ranged,melee}[].keywords` | weapon profile `Keywords` char | split on `,`, trim, `.toUpperCase()` | none — BSData's own inconsistency (`TWIN-LINKED` vs `TWIN LINKED`) is preserved for Story B to map |
| `weapons[].{ranged,melee}` grouping | profiles under one weapon-bearing entry, grouped by `typeName` and by base name | **structure**: profiles named `➤ X - Mode` / `X - Mode` collapse into one weapon with a `modes` list; a ranged + melee profile of the same name = one weapon populating both | the weapon-profile `id`; the `typeName` string (used to pick phase, then discarded) |
| `weapons[].count` / `mode.qty` | a `min===max>1` `selections`/`parent` constraint on the entryLink | the multiplier (`2`) | none |
| `wargear` tree | the unit's `selectionEntryGroups` / `selectionEntries` / `entryLinks` recursion | **structure**: each node → `{name, kind, min, max, children, weaponRefs, defaultSelected, conditions}` | see "Dropped subtrees" below |
| `wargear.node.min/max` | `selections`-field `min`/`max` constraints | verbatim (`Infinity` → `null`) | non-`selections` constraints (e.g. `points`-field caps) |
| `wargear.node.defaultSelected` | group `defaultSelectionEntryId`, **else** heuristic (plain-model / "equipped with:" text / first child) | flag on one child | — |
| `wargear.node.conditions` | the node's `modifiers` that adjust a limit or `hidden`, + their `conditions` | **reshaped** into `{target, op, value, when:[{type,childId,scope,value}]}` | modifier types that aren't limit/hidden (name changes, category adds, cost tweaks, annotations) |
| `wargear.node.weaponRefs` | the weapon profiles an option grants | `weapon.id[]` (by name+profile match) | — |
| `provenance` | catalogue name + entry id | **derived** (debug aid) | none (new) |

## Dropped subtrees (deliberate)

The wargear/weapon walk prunes these entirely:

1. **Crusade** — Battle Tallies, Battle Honours, Battle Traits, Crusade
   Relics, Weapon Modifications, Experience, Blackstone, Personal
   Commendations, "Gifts of…", etc.
2. **Other game modes** — Boarding Actions, Combat Patrol upgrade branches.
3. **Legends / sub-faction unit-gating** `hidden` toggles, the Chaos
   Daemons "Show Khorne/Nurgle/… Daemons" UI toggles.
4. **`Warlord` / `Enhancements` / `Detachment` / `Show/Hide Options` /
   `Order of Battle`** nodes — roster chrome, not unit wargear.
5. **Weaponless wargear branches** — Crests, psychic disciplines, wargear
   that grants only an ability. These are real, but they're **Story C's**
   job (the ability layer), not Story A's. They still appear in
   `abilities[]` when they hang off the unit directly.
6. **`roster` / `force`-scoped constraints** (rule of 3, detachment
   composition, "1 per army" enhancement caps) — list legality, which this
   tool does not model.

## Also not modelled (by design, per the Stories)

- **Damage brackets** — units with multiple `Unit` profiles (5 of them:
  Grimaldus, Calgar, Wolf Guard Headtakers, Wardens of Ultramar, Kroot
  Farstalkers) → the ingester takes the top/undamaged profile.
- **Ability effects** — abilities are text only. Story C types the
  calc-relevant ones.
- **Detachment / army rules / enhancements** — Story C/R12.
- **Leader attachment** — the `Leader`/`Support` ability text is kept, but
  the attach relationship isn't structured. Story C/Q5.

## What is NOT lost

Every weapon's full stat line and keyword list; every unit's core stats,
invuln, FNP, points (at fielded sizes), and complete matched-play wargear
option structure with its real min/max limits (including size-scaled
limits); every ability as text. If BSData has it and it bears on a
matched-play damage/durability comparison, it's in the record.
