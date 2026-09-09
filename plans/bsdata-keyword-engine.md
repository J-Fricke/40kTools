# Plan: Weapon-keyword dictionary + combat engine (Story B)

## Status

Draft — Ready for Execution.

## Source Story

`stories/bsdata-keyword-engine.md` (child of
`stories/bsdata-verbatim-rearchitecture.md`; coordination spine in
`plans/bsdata-verbatim-rearchitecture.md`, lane B).

## Objective

Add `src/core/model/keywords.js` (44 weapon keywords → declarative
effects) and `src/core/model/engine.js` (`resolveAttack` +
`effectiveWounds` over raw `UnitRecord` weapon strings + the defender's
full profile), preserving `src/core/engine.js`'s probability maths. Pure
functions, tests are the deliverable, nothing in the app wired.

## Story Requirements Covered

| Req | Tasks |
|---|---|
| R1 dictionary complete | B2, B6 (coverage sweep) |
| R2 declarative effect vocab | B2 (+ contract doc B6) |
| R3 no-op keywords explicit | B2 |
| R4 engine consumes raw strings | B1 (helpers), B3 |
| R5 full defender profile / Anti-X | B3, B5 |
| R6 preserve current maths | B3, B4 (parity harness) |
| R7 `context` extension seam | B3 |
| R8 standalone, not wired | all — no `src/` edits outside `src/core/model/` |

## Current-System Notes

- `src/core/engine.js` — ~40 lines. `calcW(shots, skill, s, ap, d, tags,
  tgt, bh)`; `calcWs(ws, tgt, bh)` sums; `ewCalc(tw, sv, inv, fnp, eAp)`.
  Mechanics: `wt(s,t)` wound threshold; `hp` with a 5/6 ceiling and `bh`
  bonus-to-hit; `cp` crit prob (1/6, or 3/6 `conv`, 2/6 `ch5`, or `ai`
  auto-wound); sustained adds `shots*cp*N` hits; `wp` with 5/6 ceiling,
  `+1` (`w1`), `av3`/`am3` (anti 3+ vs veh/mon), twin-linked
  `wp+(1-wp)wp`, reroll-1 `wp*7/6`, reroll-full `1-(1-wp)²`; lethal/conv
  carve the crit portion as auto-wounds; `dev` turns `h/6` crits into
  mortals bypassing saves; save `sv-effAp` then `min(inv)`; then FNP.
- `tags` vocabulary (16): `sustained, let, conv, con, tl, rrw1, rrwf, dev,
  devmv, av3, am3, ai, sowf, fe, w1, w1mv, ch5` — several are conditional
  (`sowf`/`devmv`/`w1mv` = "…only vs MON/VEH"), several are army/strat
  effects (`sowf`, `w1mv`, `fe`) that belong to Story C, not B.
- `scripts/bsdata-import/v2/dice.mjs` — `diceAverage`, `skillNumber`
  (already the right conventions). `keywordNormalize.mjs` — `parseKeyword`
  (splits `"<name> <N>+"` / `"<name> <val>"` / `"<name>: <vs>"`).
- `src/core/data/*.json` — the input: weapon modes with raw
  `A/BS/WS/S/AP/D/range` strings + `keywords: ["SUSTAINED HITS 1", …]`
  (UPPERCASE, otherwise verbatim). 44 distinct base keywords (Story
  Notes). Defender: `stats.{T,Sv,InvSv,FNP}` (strings), `keywords`
  (UPPERCASE — `VEHICLE`, `MONSTER`, `FLY`, `INFANTRY`, …).
- `src/core/targets.js` — today's hand-abstracted meta profiles; Story D
  replaces them with real records, but B's parity harness can use them.
- `src/core/model/unitRecord.js` — the frozen shapes.

## Proposed Approach

`src/core/model/` gains:

```
dice.js       # diceAverage, skillNumber, num — ported from v2/dice.mjs (app-side copy)
keywords.js   # KEYWORD_EFFECTS table + resolveKeywords(strings[]) -> Effect
engine.js     # resolveAttack(attack, defender, context), effectiveWounds(defender, context)
engine.test.mjs
keywords.test.mjs
parity.test.mjs   # golden values vs src/core/engine.js
```

**`keywords.js`** — a flat `KEYWORD_EFFECTS` map keyed by the parsed base
keyword (`parseKeyword(str).kw`), each entry a function `(parsed) => partial
Effect` or a static partial. `resolveKeywords` folds a mode's keyword list
into one `Effect`. Unknown base → `effect.unknown.push(raw)`. No maths.

**Effect shape** (the B↔engine contract — flat, chosen for the parity
diff):

```
Effect = {
  autoHit?: true,                 // torrent
  sustainedHits?: number,         // N (D3 -> 2)
  lethal?: true,
  devastating?: true | "vehicle"|"monster"|"infantry"|...,   // DevWounds, optional target qualifier
  rerollHit?: "1" | "all",        // (from twin-linked? no — TL is wound) / abilities later
  rerollWound?: "1" | "all",      // twin-linked -> "all"
  woundFloor?: number,            // anti-X: wound (and crit-wound) on this roll vs a target type
  anti?: [ { vs: string, on: number } ],   // vs may be "!monster" for ANTI-NON-...
  apMod?: number,
  extraAttacks?: number,          // EXTRA ATTACKS (flat; some carry a value)
  melta?: number,                 // +N damage at half range
  blast?: true,                   // +floor(targetModels/5) attacks
  rapidFire?: number,             // +N attacks in rapid-fire range (context.rapidFireRange)
  hazardous?: true,               // note-only unless we model the mortal-to-self (skip)
  ignoresCover?: true,            // note-only (cover not modelled)
  noop?: string[],                // keywords with no calc effect, for display
  unknown?: string[],
}
```

**`engine.js`** — port `calcW` field-by-field, but:
- inputs are `{ A, BS|WS, S, AP, D, keywords }` raw strings → convert with
  `dice.js`;
- `tags` object replaced by the resolved `Effect`;
- `tgt` = `{ T, Sv, InvSv, FNP, keywords }` from a `UnitRecord`; Anti-X
  reads `tgt.keywords`;
- `context = { phase, bh (bonus hit), bw (bonus wound), rerollHit,
  halfRange, targetModels, rapidFireRange, damageReduction, apIgnore,
  invGranted, fnpGranted }` — all optional, all default to no-op. Story C
  writes these; the R5 one-use toggles feed them via Story D.
- Army/strat-conditional tags (`sowf`, `w1mv`, `fe`) are **not** keyword
  effects — they come from `context` (Story C). B just leaves the hooks.

`resolveAttack(attack, defender, context)`:
- `attack = { weapons: [mode, ...], models: number }` (models scales
  per-model weapons; the mode's A is per-weapon);
- returns `{ expected, perWeapon: [{name, expected}] }`.

`effectiveWounds(defender, context)` — port `ewCalc`; `tw = models * W`;
apply `context.damageReduction` / granted inv/fnp when present.

## Affected Areas

- `src/core/model/{dice,keywords,engine}.js` — **new**.
- `src/core/model/{keywords,engine,parity}.test.mjs` — **new**.
- Nothing else. `src/core/engine.js`, `targets.js`, the tools, the build —
  untouched.

## Data / API / State Changes

- New `Effect` type + `resolveAttack`/`effectiveWounds` signatures →
  documented in `src/core/model/engine.js` header and frozen at umbrella S2
  (the contract Story C writes `context` for and Story D calls).
- No persisted state, no app wiring.

## Compatibility / Migration

None — additive. `src/core/engine.js` stays until Story E.

# Execution Graph

```
B1 ──┬──> B2 ─────────┐
     └──> B3 ──┬──> B4 ┼──> B6
               └──> B5 ┘
```

Critical path: **B1 → B3 → B4 → B6**. B2 parallel with B3 after B1; B5
parallel with B4 after B3.

## Tasks

### B1 — Shared numeric + parsing helpers

**Type:** Independent · **Blocks:** B2, B3
**Files:** `src/core/model/dice.js`

- Port `diceAverage` (`"D6"`→3.5, `"2D6"`→7, `"D3+1"`→3, `"N/A"`/`"-"`→
  null), `skillNumber` (`"3+"`→3, `"N/A"`→special), and a `num()` from
  `scripts/bsdata-import/v2/dice.mjs` — an **app-side copy** (no
  cross-boundary import).
- `parseKeyword` (base kw + `on`/`val`/`vs`) — copy from
  `keywordNormalize.mjs`, keep it lowercase-normalising internally.

**Verify:** unit tests for each notation incl. `"N/A"`, `"User"` (→ null,
caller resolves), `"2D6"`, `"D6+1"`, `"-"`.

---

### B2 — Keyword dictionary

**Type:** Dependency (B1) · **Blocks:** B6
**Files:** `src/core/model/keywords.js`, `keywords.test.mjs`

- `KEYWORD_EFFECTS`: an entry for **all 44 base keywords** (Story Notes
  list). Effect-producing ones: `sustained hits`, `lethal hits`,
  `devastating wounds` (+ `: <vs>` qualifier), `twin linked` →
  `rerollWound:"all"`, `torrent` → `autoHit`, `anti <x>` → `anti:[{vs,on}]`
  (incl. `anti monster/vehicle` → two entries, `anti non monster/vehicle`
  → `vs:"!monster"` etc.), `melta` → `melta:N`, `blast` → `blast:true`,
  `rapid fire` → `rapidFire:N`, `extra attacks` → `extraAttacks:1` (or the
  weapon already bakes the count — check the data, note), `conversion` →
  (its GK-specific crit-on-3+ — port as `critOn: 3`), `hazardous` /
  `ignores cover` → recorded but effectively `noop` (cover, self-mortals
  not modelled).
- No-op ones → `{ noop: ["<KW>"] }` with a per-keyword note:
  `assault, heavy, pistol, precision, indirect fire, psychic, one shot,
  close quarters, overcharge, plasma warhead, linked fire, defensive array,
  psychic assassin, reverberating summons, hooked, harpooned, hive
  defences, cleave` (Cleave = mortal-on-crit for Orks — decide in this
  task whether to model as `devastating`-like or noop; lean model it).
- `resolveKeywords(strings[])` → folded `Effect`; collision handling
  (two `sustained hits` → take the max, note it).
- Unknown base kw → `effect.unknown`.

**Verify:** a test that loads every `src/core/data/*.json`, runs
`resolveKeywords` over every weapon mode, asserts **`unknown` is always
empty**. Plus explicit cases from Story acceptance (`"ANTI-FLY 4+"`,
`"SUSTAINED HITS D3"`, `"MELTA 4"`, `"RAPID FIRE 2"`).

---

### B3 — Engine port + restructure

**Type:** Dependency (B1, B2) · **Blocks:** B4, B5
**Files:** `src/core/model/engine.js`, `engine.test.mjs`

- **Write fresh in structure; transcribe the *formulas* faithfully.** Not
  a fork of `src/core/engine.js` — clean named code against the new model.
  What carries over unchanged is the trusted maths: `wt()` wound
  thresholds, the 5/6 hit/wound ceiling, reroll compounding
  (`1-(1-wp)²`, twin-linked `wp+(1-wp)·wp`, reroll-1 `wp·7/6`), lethal
  carving `shots·cp` as auto-wounds, the Devastating mortal handling, the
  `sv-ap` → `min(inv)` → FNP chain. What is written fresh: inputs, the
  `Effect` vocab replacing `tags`, `context`, general Anti-X (vs the
  hardcoded `av3`/`am3`), Torrent/Melta/Blast. Old tags `sowf`/`w1mv`/`fe`
  are **not** ported — army/strat conditionals belong to Story C's
  `context`.
- Input conversion:
  - `shots = diceAverage(mode.A) * (mode.qty || 1)`, scaled by
    `attack.models` for per-model weapons (flag TBD — see coordination);
  - `skill = skillNumber(mode.BS ?? mode.WS)`;
  - `s = num(mode.S)` (if `null`/`"User"` and `context.attackerS` given,
    use that; else fall back to a sane default + note);
  - `ap = num(mode.AP)`, `d = diceAverage(mode.D)`;
  - `eff = resolveKeywords(mode.keywords)`.
- Map `eff` → the maths:
  - `autoHit` → `hp = 1`, `cp = 0` (no crits → sustained/lethal contribute
    nothing — the rules-accurate Torrent behaviour);
  - `sustainedHits` → `h += shots*cp*N`;
  - `lethal` → carve `shots*cp` as auto-wounds (as `let` today);
  - `anti[{vs,on}]` where `defenderHasKeyword(vs)` → `wp = max(wp,
    (7-on)/6)` and `cwp = (7-on)/6` (crit-wound prob, for `devastating`);
  - `rerollWound:"all"` → `wp = 1-(1-wp)²`; `"1"` → `wp*7/6` (both 5/6
    capped);
  - `devastating` (+ optional `vs`) → `mort = h * cwp` (cwp = 1/6 or the
    anti value), `nw = h * max(0, wp - cwp)`, mortals bypass saves;
  - `apMod` → `ap += apMod`;
  - `melta` and `context.halfRange` → `d += melta`;
  - `blast` and `context.targetModels` → `shots += floor(models/5)` before
    hit;
  - `rapidFire` and `context.rapidFireRange` → `shots += rapidFire`;
  - `context.bh/bw` → bonus to hit / wound; `context.damageReduction` →
    `d = max(1, d - r)` post-save (or per rules, pre-save — match GW);
    `context.apIgnore` → clamp `ap`; `context.invGranted/fnpGranted` →
    use if better / present.
- `resolveAttack(attack, defender, context)` → `{ expected, perWeapon }`.
- `effectiveWounds(defender, context)` — port `ewCalc`; `tw = (defender
  .size?.min-ish or a models arg) * num(defender.stats.W)`.

**Verify:** direct unit tests for each mechanic in isolation (a T4 3+
target, one weapon, toggle one effect, check the delta).

---

### B4 — Golden-value parity harness

**Type:** Integration (B3) · **Blocks:** B6
**Files:** `src/core/model/parity.test.mjs`

- A table of ~25 `(mode chars, keyword list, defender)` cases spanning:
  plain, Sustained 1/2, Lethal, Devastating, Twin-linked, Anti-INF/VEH/MON,
  Torrent, +AP, multi-damage, low/high S vs T, invuln, FNP.
- For each: compute with **`src/core/engine.js`** (build the equivalent
  `tags` object + `tgt` by hand) and with the **new** `resolveAttack`;
  assert equal within 1e-6, **except** the documented intentional
  deltas: Torrent (+ Torrent×Sustained/Lethal), and anything Melta/Blast
  (old engine = 0 effect).
- Output a table (old / new / delta / verdict) into `ENGINE-NOTES.md`.

**Verify:** all non-excepted rows within tolerance; excepted rows have a
one-line reason.

---

### B5 — New mechanics + their tests

**Type:** Dependency (B3) · parallel with B4 · **Blocks:** B6
**Files:** `engine.test.mjs` (additions)

- Anti-X conditional on `defender.keywords` (wounds vs VEHICLE, no effect
  vs INFANTRY — Story Scenario 2).
- Torrent true auto-hit + the Sustained/Lethal nullification.
- Melta gated on `context.halfRange`; Blast from `context.targetModels`;
  Rapid Fire from `context.rapidFireRange`.
- `context` hooks (`bh`, `bw`, `damageReduction`, `invGranted`,
  `fnpGranted`) each move the number the right direction; default context
  = no change.
- `devastating: "vehicle"` only fires vs a VEHICLE defender.

**Verify:** one test per bullet.

---

### B6 — Freeze the contract + notes

**Type:** Final Verification (B4, B5) · **Blocks:** none
**Files:** `src/core/model/engine.js` header, `src/core/model/ENGINE-NOTES.md`

- Document the `Effect` vocabulary and the `resolveAttack` /
  `effectiveWounds` / `context` signatures in the `engine.js` header — the
  **S2 contract** for Stories C and D.
- `ENGINE-NOTES.md`: the parity table (B4), the list of no-op keywords and
  why, the intentional deltas vs. the old engine (Torrent, Melta ~280
  weapons, Blast ~700), and the `context` fields Story C is expected to
  populate.
- Update `work/…work.md`; mark lane B done at S-B (Story-B analogue of
  S-A3).

# Synchronization Points

## S-B1 — Effect vocab + engine signatures published
**Waits for:** B2, B3 · **Owner:** Master Agent
The `Effect` shape and `resolveAttack`/`context` signatures go in the Work
file before B4/B5 lean on them; this is also the umbrella **S2** input for
lane B.

## S-B — Story B done
**Waits for:** B6 · **Owner:** Master + Joshua
Parity table accepted (deltas understood), coverage sweep green, contract
frozen. Gate to start Story C.

# File-Overlap / Conflict Analysis

| Tasks | Overlap | Rule |
|---|---|---|
| B2 / B3 | none (separate files, both import B1) | concurrent OK |
| B3 / B4 / B5 | B4, B5 import B3; B4 & B5 edit different test files | B4 ∥ B5 after B3 |
| B6 | edits `engine.js` header + a new md | after B4, B5 |
| all | no `src/` edits outside `src/core/model/` | — |

# Testing / Verification Strategy

- **Unit:** `dice.js` notations; `keywords.resolveKeywords` per keyword +
  the data-sweep zero-unknown; `engine` per mechanic in isolation.
- **Parity:** B4 golden-value table vs `src/core/engine.js`.
- **Coverage:** every base keyword in `src/core/data` has a `KEYWORD_EFFECTS`
  entry (effect or explicit noop).
- **Repo health:** `npm run build` unchanged; `node --test
  src/core/model/` green; `src/core/engine.js` untouched (`git diff`).

# Acceptance-Criteria Verification

| Story B criterion | Method |
|---|---|
| dictionary covers all 44, zero unknowns | B2 data-sweep test |
| parametric parse (ANTI-FLY 4+, SUSTAINED HITS D3, MELTA 4, RAPID FIRE 2) | B2 explicit tests |
| golden-value parity ±rounding (or documented delta) | B4 |
| Anti-VEHICLE only vs VEHICLE keyword | B5 |
| effectiveWounds reflects InvSv + FNP, matches ewCalc | B3/B4 |
| every no-op keyword present with `{noop}` | B2 test |
| `src/core/engine.js` + build unchanged | repo-health check |

# Risks

- **Anti-X semantics** — 10e Anti-X is "wound roll of X+ is a Critical
  Wound" AND (effectively) "wounds on X+". The old engine's `av3`/`am3`
  only bumped `wp`. Getting the crit-wound interaction with Devastating
  right is the subtle bit. *Mitigation:* B5 tests a `DEVASTATING WOUNDS` +
  `ANTI-VEHICLE 2+` weapon vs a VEHICLE and checks against a hand
  calculation.
- **Per-model vs per-unit shot scaling** — the data's `A` is per weapon;
  a squad fields N of a weapon. Whether `attack.models` or the wargear
  resolution supplies the count is a Story-D concern, but B's
  `resolveAttack` needs a clear input contract. *Mitigation:* B3 takes an
  explicit `attack.weapons` list already expanded to the fielded weapons
  (Story D builds it); `resolveAttack` does not read wargear.
- **`S: "User"` / relative melee S** — some melee modes carry `"User"`.
  *Mitigation:* B3 falls back to `context.attackerS` or flags it; the
  ingester could also resolve it in a later Story-A patch.
- **Cleave / bespoke faction keywords** — if `CLEAVE` or another turns out
  calc-relevant and non-trivial, it lands as `{noop}` + a note this pass
  and a follow-up.

# Open Technical Questions

- Damage reduction ("-1 Damage"): applied before or after the save step,
  and floored at 1 — confirm against the core rules in B3.
- `effectiveWounds` model-count input — take `size.min`, `size.max`, or a
  parameter? (Story D likely passes the chosen size; default to `size.min`.)
- Do we keep a thin `calcWs`-style convenience wrapper for the parity
  harness, or build `tags` by hand in the test? (Lean: by hand — keeps the
  old engine truly untouched.)

# Execution Instructions

1. Read `stories/bsdata-keyword-engine.md` + this Plan.
2. Add lane-B rows to `work/bsdata-verbatim-rearchitecture.work.md`.
3. B1 → then B2 ∥ B3 → then B4 ∥ B5 → B6.
4. Publish the `Effect` shape + `resolveAttack`/`context` signatures to the
   Work file at S-B1 (umbrella S2 for lane B).
5. Stop at S-B for Joshua to accept the parity table before Story C.
6. Keep `src/core/engine.js` untouched; keep the Work file current.
