# P1 findings — interpretation & Plan deltas (for S1 review)

Companion to `DISCOVERY.md` (the raw census) and `fixtures/` (15
self-contained unit bundles). Run: `node scripts/bsdata-import/v2/discover.mjs`.

**Scope covered:** 34 in-scope faction catalogues, **1344 unit entries**
analysed (Space Marine chapter files are thin — their datasheets resolve
through `Imperium - Space Marines.json`; the ingester loads the chapter
file for chapter detachments/enhancements and the library for the shared
datasheets).

---

## Headline: the Plan holds. No exotic structures.

Every wargear tree is a **recursive `{min, max}` group** over weapon leaves,
upgrade leaves, nested groups, and named model-variants. The top ~40
structural signatures (of "390", inflated because my signature keyed on
constraint *values*) cover essentially everything:

- `upgrade[leaf]{max 1}` ×20121 — a single optional toggle
- `group[upgrade]{max 1}` ×5030 — pick ≤1 of a list
- `upgrade[leaf]{min 1, max 1}*W` ×1473 — a mandatory fixed weapon
- `upgrade[linkGroup]{min 2, max 2}*W` ×101 — "pick exactly 2" (Deff Dread)
- `group[model]{min 4, max 9}` / `{min 5, max 10}` — squad size
- `group[model]` with named variants — Custodian-Guard shape

**A per-node constraint *evaluator* is sufficient — no BattleScribe-style
constraint *solver* is needed.** (Retires the top Plan risk.)

## 1. Weapon keywords — 157 raw strings, ~40 real

The vocabulary is small; the mess is **formatting inconsistency**, mostly
from Orks (ALL-CAPS) and hand-authoring drift:

- casing / separators: `Twin-linked` (541) vs `Twin-Linked` (103) vs
  `Twin Linked` (18); `Torrent` vs `TORRENT`; `Devastating Wounds` vs
  `DEVASTATING WOUNDS` vs `Devastating wounds`; `Sustained Hits 1` vs
  `Sustained hits 1` vs `SUSTAINED HITS 1`.
- `Anti-<X> N+`: `Anti-Infantry 3+`, `Anti-INFANTRY 2+`, `Anti-infantry 2+`,
  `Anti-non-Monster/Vehicle 3+`, `Anti-Epic Hero 2+`, `Anti-TITANIC 4+`.
- conditional variants: `LETHAL HITS: non-MONSTER/VEHICLE` (107),
  `DEVASTATING WOUNDS: INFANTRY`, `SUSTAINED HITS 2: MONSTER/VEHICLE`,
  `Devastating Wounds: Monster/Vehicle only`.
- Ork numeric suffixes: `BLAST 1/2/3`, `CLEAVE 1/2/3/4` — `Cleave` is an
  Ork-detachment keyword (mortal-ish), `Blast N` looks like an authoring
  artifact of the "Dakka/Point-Blank" mode split, **not** a rules value.
- weapon **modes**: names prefixed `➤` (`Kustom Shoota - Aimed` /
  `- Point Blank`; `Da Rippa - Standard` / `- Supercharge`) — one weapon,
  several profiles. **Answered (Joshua's S1 question): a weapon never uses
  more than one mode at once.**

### Multi-profile weapons — three distinct cases (checked all 34 catalogues)

| case | count | meaning |
|---|---|---|
| **`➤` modes** (strike/sweep, Aimed/Point-Blank, supercharge, kombi-weapon profiles, witchfire variants, artillery shell/frag) | 229 + 10 strike/sweep | **pick exactly one per activation** — no BSData constraint says otherwise, and the rules never allow both. Includes #26. |
| **ranged + melee on one weapon** (Laser Lance: 6" Assault *and* a Lance melee profile; ~dozens of Aeldari/Chaos spear/lance/force weapons) | ~40 | **both are used — in different phases.** One weapon that shoots *and* fights. Must NOT be treated as pick-one. |
| **`(ref. only)` profiles** (Pink/Blue Horrors) | few | reference profiles for a mixed unit — different models use different ones; all apply. |

**No weapon anywhere fires multiple *ranged* profiles together in one
shooting attack.**

**Plan delta:** R4's dictionary gets an explicit **normalizer** —
lowercase, collapse `-`/space, strip trailing punctuation — then parse
`<keyword> [N+] [: <target qualifier>]`. And R1/R2's weapon shape is:

```
weapon = {
  name,
  ranged?: [ mode, ... ],   // when shooting, pick ONE of these
  melee?:  [ mode, ... ],   // when fighting, pick ONE of these
}
mode = { chars: {A, BS|WS, S, AP, D, range}, keywords: [...] }
```

A weapon can populate `ranged`, `melee`, or both. Both phases' contributions
count. Where a phase's list has 2+ modes, the UI shows a **plain mode
selector** on that weapon (the "assumed" mode for this comparison), default
to the first / "Standard"-named entry — no special machinery, it's just
another pick. The overwhelming majority of weapons have one mode per phase
and need no selector. This folds in #26 and handles Laser Lance correctly.

## 2. Constraints

| scope | meaning | action |
|---|---|---|
| `selections · parent` (min/max) | pick counts within a group | **evaluate** (the 95% case) |
| `selections · model` / `unit` | "N per model" / "N per unit" | **evaluate** |
| `selections · <entry-guid>` (~150) | "max N of that specific entry" | **evaluate** (generic: count of entry id) |
| `selections · roster` / `force` | army-list legality (rule of 3, DP, enhancements) | **ignore** (R12: not a list builder) |

Condition vocabulary confirmed and closed: `none, atLeast, atMost,
greaterThan, lessThan, equalTo, instanceOf, notInstanceOf`.

## 3. Modifiers — high volume, clean clusters

| cluster | ~count | action |
|---|---|---|
| `set: hidden when <cond>` | ~25 000 | **see §4** |
| `add: category / add-info / error / warning`, `append: annotation`, `set: name` | ~2 000 | **ignore** (cosmetic / validation) |
| `set / increment: <pts type-id> when <count>` | 279 units | **evaluate** — per-size points |
| `set: <entry-guid> when atLeast/model` | ~200 | **evaluate** — size-scaled wargear limits (GK Strike Squad, Ork Big Mek) |
| `increment / set: <characteristic-guid> when none` | ~600 | **evaluate** the unconditional ones (real stat/weapon values); conditional ones case-by-case |
| `divide: <enhancement> when …/roster` | ~250 | **ignore** — enhancement point math |

## 4. Conditional visibility (`hidden`) — decision needed

~25 000 `set: hidden when <cond>` modifiers. They fall into:

- **cruft gating** — Crusade / Legends / detachment-upgrade subtrees turned
  on/off. Covered by the static-`hidden` + name blocklist filter already.
- **sub-faction / detachment gating of real wargear** — "this option only
  in Detachment X", "this weapon only for Chapter Y". These are genuine
  matched-play options, just conditionally available.

**Recommendation:** the ingester filters static `hidden: true` + the cruft
blocklist, and **keeps conditionally-hidden real wargear visible** (does
not evaluate sub-faction / detachment gating). Rationale: we do not enforce
list legality (R12), and the user wants to *see* options. A later refinement
can grey-out options whose detachment isn't the selected one. **Confirm.**

## 5. Default selection

- `defaultSelectionEntryId` present on **1324** multi-child groups.
- **494 mandatory (`min>=1`) multi-child groups have no `defaultSelectionEntryId`**
  — e.g. `Corsair Voidscarred › Weapon`, `Dire Avengers › Dire Avenger`.

**Plan delta (P3):** default resolution is: (1) `defaultSelectionEntryId`
if present; (2) else, for a squad model group, the variant whose name has
no " with " / " w/ " (the plain model — the old `extractBase` heuristic,
which did work for squads); (3) else match the unit's "This model is
equipped with:" ability text; (4) else first child + add to the `sync`
review list. A small override table absorbs the residue.

## 6. Stats & points

- Unit profile: **unit entry 1033**, **model sub-entry 303**, **none 8**
  (all `[Legends]` kill teams / Death Korps / Wulfen — override table).
- **Invulnerable save is split**: a Unit-profile `InvSv`/`InSv` char for
  most, an **"Invulnerable Save" ability** (37 units) for the conditional
  ones ("4+ vs ranged"). Ingester reads both.
- **Feel No Pain is always an ability** (71 units) — parse "Feel No Pain
  X+" from ability text; never a Unit char.
- **Per-size points: 279 units** — `set pts` modifier keyed on model count
  (SM Terminator Squad: base 160, `set 320 when models ≥ 6`).
- **Damage brackets: only 5 units** have real multiple `Unit` profiles;
  everywhere else it's a "Damaged: 1-X" **ability text** → skip per Story
  (take the top/undamaged profile).

## 7. Abilities

`typeName: "Abilities"` dominates (3030); plus `Transport`, `Orders` (AM),
and a dozen faction-specific types. 1826 distinct names but most are
unit-unique. The **recurring, calc-relevant** ones (frequency-ranked list
in DISCOVERY.md §9) cluster into a modest curated table for P6:

- skip: `Damaged: 1-X …` (brackets)
- defensive: `Invulnerable Save`, `*Invulnerable Save` (conditional), Feel
  No Pain variants, `Necrodermis` / "-1 to the Damage", Lone Operative,
  Stealth
- offensive: rerolls (`Death to the Alien`, `Black Rage`), +1 to hit vs
  Fly/non-Fly (`Interceptor`, `Strafing Run`, `Airborne Predator`),
  `Devoted to Destruction` (+2A to caestus)
- leader: **`Leader` / `Support` / `Attached Unit` — 435 units**; attach
  list is a markdown bullet list inside the ability text (parseable).

## 8. Fixtures

15 self-contained bundles under `fixtures/` (unit entry + every shared
entry/group/profile it references, cruft filtered): GK Venerable
Dreadnought + Strike Squad, Ork Deff Dread + Boyz + Meganobz, Knight
Despoiler, Custodian Guard + Caladius, SM Terminator Squad + Ballistus
Dreadnought, Leman Russ, Tau Crisis, Wraithknight, Necron Warriors,
Termagants. Spans: replace-group + default, squad + size-scaled limit,
pick-N, deep nesting (#22), named model variants, per-size points, weapon
modes, per-model-count wargear.

---

## Proposed Plan adjustments (for S1)

1. **R1/R2** — a weapon is `{ name, ranged?: [mode…], melee?: [mode…] }`;
   within a phase's list you pick one mode (covers strike/sweep, Ork
   Aimed/Point-Blank, supercharge — folds in #26), and a weapon may
   populate both lists (Laser Lance shoots *and* fights, both counted).
   Verified across all 34 catalogues: no weapon ever uses >1 mode at once,
   and none fires multiple ranged profiles together.
2. **R4** — add the keyword **normalizer** spec (§1).
3. **P2** — ingester also parses ability text for invuln (conditional) and
   FNP (always); handles the SM chapter↔library split; per-size points via
   the pts-type-id modifier.
4. **P3** — default resolution fallback chain (§5) + small override table.
5. **New decision (this doc §4)** — conditionally-hidden real wargear: show
   it, don't evaluate sub-faction/detachment gating. **Needs Joshua's OK.**
6. **Retire** the "might need a constraint solver" risk — confirmed a
   per-node evaluator suffices.
7. Everything else in the Plan stands.
