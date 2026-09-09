# Story B: Weapon-keyword dictionary + combat engine

## Status

Ready for Planning — pending Joshua's OK.

## Parent

`stories/bsdata-verbatim-rearchitecture.md` (umbrella). Lane B of the
coordination spine (`plans/bsdata-verbatim-rearchitecture.md`), the old
P4 + P5. Follows Story A (`stories/bsdata-ingester.md`), which landed the
`UnitRecord` data with **raw** BSData characteristics — this Story is what
finally interprets them.

## Summary

Build two `src/core/model/` modules:

1. **`keywords.js`** — the weapon-keyword dictionary. Every GW weapon
   keyword string that appears in `src/core/data/*.json` maps to a typed
   effect (or an explicit "no calc effect"), with the parametric part
   (`ANTI-INFANTRY 3+`, `SUSTAINED HITS 2`, `RAPID FIRE 1`, `MELTA 4`, …)
   parsed out. **44 distinct base keywords** exist across all 34 factions
   (96 raw strings after case/format variants) — a small, closed table.

2. **`engine.js`** (new, from `src/core/engine.js`) — `resolveAttack()` and
   `effectiveWounds()`. Consumes a `UnitRecord` weapon selection (raw
   strings), the resolved keyword effects, a phase/context, and the
   **defender's full profile** (T, Sv, InvSv, FNP, keywords). Does the
   dice-averaging (`"D6"` → 3.5), skill mapping (`"3+"` → hit probability),
   and keyword application. **Preserves the current engine's probability
   model and conventions** — this is a restructuring of inputs, not a
   rewrite of the maths.

No UI, no unit abilities, no detachments (Stories C/D).

## Problem

`src/core/engine.js` today takes a pre-digested weapon array
`[shots, skill, S, AP, D, tags]` and a `{T, sv, inv, fnp, veh, mon}`
target, where `tags` is a hand-rolled ~18-entry vocabulary
(`sustained, let, dev, tl, ai, sowf, …`) produced by the old pipeline for
the 4 hand-authored factions. Story A deliberately stopped producing that
shape — the data now carries raw BSData strings. Something has to:

- turn `A: "D6"`, `D: "D3+1"` into numbers (the engine's dice convention);
- turn `BS: "3+"`, `WS: "2+"`, `"N/A"` into hit probabilities;
- know that `TWIN-LINKED` means reroll-wound, `SUSTAINED HITS 2` means +2
  hits per crit, `ANTI-VEHICLE 3+` means auto-wound-on-3+ vs VEHICLE,
  `TORRENT` means auto-hit, `DEVASTATING WOUNDS` means crits bypass saves,
  `MELTA 4` means +4 damage at half range, etc.;
- apply the defender's own defences (invuln, FNP, and — new — `-1 Damage`
  once Story C feeds those in).

Until this exists, the ingested data can't be evaluated.

## User / Product Context

Solo hobbyist, 2000-pt matched-play frame. The Evaluator compares
damage-per-point and effective-wounds-per-point across units and against
the "meta" columns (real units). The current `engine.js` math (hit/wound/
save probabilities, the 5/6 hit ceiling, the Torrent `×6/5` correction,
dice averages `D6=3.5`) is trusted and must not silently change — a
regression there invalidates every number in the app.

GW weapon keywords are a fixed controlled vocabulary. The dictionary is a
lookup table, not a per-weapon judgement call. The 44-entry census
(`scripts/bsdata-import/v2/DISCOVERY.md` §3, re-derivable from the data)
is the definitive list to work through.

## Desired Outcome

### `keywords.js`

```
resolveKeywords(["SUSTAINED HITS 2", "TWIN-LINKED", "ANTI-VEHICLE 3+"])
  -> {
       sustainedHits: 2,
       rerollWound: "all",
       anti: [ { vs: "vehicle", on: 3 } ],
       // ...only the keys that apply
     }
```

- one entry per base keyword; parametric value parsed from the string;
- effects are **declarative** (`{sustainedHits: n}`, `{rerollWound: "1"|"all"}`,
  `{devastating: true}`, `{lethal: true}`, `{apMod: n}`, `{extraShots: n}`,
  `{autoHit: true}`, `{melta: n}`, `{ignoresCover: true}`, `{blast: true}`,
  `{anti: [...]}`, …) — the engine interprets them;
- a keyword with **no calc effect** (`ASSAULT`, `HEAVY`, `PISTOL`,
  `PRECISION`, `INDIRECT FIRE`, `PSYCHIC`, `ONE SHOT`, positional stuff)
  is present with `{noop: true}` and a note — never silently missing;
- a keyword string the dictionary doesn't recognise is returned as
  `{unknown: "<raw>"}` and surfaced (regression guard, expected empty).

### `engine.js`

```
resolveAttack(attack, defender, context) -> {
  expected,                 // expected unsaved damage, summed over the selection
  perWeapon: [ { name, expected } ],
}
effectiveWounds(defender, context) -> number   // durability metric (today's ewCalc)
```

- `attack` = the selected weapon modes from a `UnitRecord` build
  (`[{ name, A, BS|WS, S, AP, D, range?, keywords: [...] }]`), plus model
  count for per-model weapons;
- `defender` = a `UnitRecord`'s `{ stats: {T, Sv, InvSv, FNP}, keywords }`
  and (from Story C, later) typed defensive effects;
- `context` = `{ phase: "ranged"|"melee", halfRange?: bool, hitMod, woundMod,
  rerollHit, ... }` — the hooks reactive rules / one-use toggles plug into;
- the maths (hp/wp/save probability, dice averages, Torrent correction,
  the crit mechanics for Sustained/Lethal/Devastating, Anti-X auto-wound,
  Melta bonus, invuln vs. AP, FNP) reproduces `src/core/engine.js`'s
  results for equivalent inputs, extended to the full keyword set.

## Requirements

### R1 — Keyword dictionary complete for the data

`keywords.js` has an entry for **every one of the 44 base keywords** in
`src/core/data/*.json` (and any that a future `sync` adds). Parametric
keywords parse their value. Verified by a test that sweeps the data and
asserts zero `unknown`.

### R2 — Declarative effect vocabulary

The dictionary emits declarative effect objects; it contains no engine
maths. The effect-key vocabulary is documented (it's the contract between
`keywords.js` and `engine.js`).

### R3 — No-op keywords are explicit

Every keyword with no bearing on the steady-state damage/durability
exchange (`ASSAULT`, `HEAVY`, `PISTOL`, `PRECISION`, `INDIRECT FIRE`,
`PSYCHIC`, `ONE SHOT`, `IGNORES COVER` — cover isn't modelled —, `BLAST`
partially, positional keywords, and the bespoke faction ones like
`HOOKED`, `HARPOONED`, `HIVE DEFENCES`, `REVERBERATING SUMMONS`) is present
with `{noop: true, note}`. The Evaluator can then show "modelled / not
modelled" honestly.

### R4 — Engine consumes raw strings

`engine.js` takes weapon modes with raw `A/BS/WS/S/AP/D/range` strings and
does the conversion itself (dice average, skill→probability). Torrent /
`"N/A"` skill → the existing skill-2 + ×6/5 convention. `S: "User"` /
melee `S` relative to the model → resolved from the attacker's profile
where needed (or left, if the datasheet already gives a number).

### R5 — Full defender profile

The wound roll uses the defender's real `T`; the save uses `Sv` vs
(AP + apMod), then `InvSv` if better; then `FNP`. Anti-X auto-wound checks
the defender's `keywords` for the target type (`VEHICLE`, `MONSTER`,
`FLY`, `INFANTRY`, `CHARACTER`, `PSYKER`, `TITANIC`, `WALKER`, etc.).
Hooks exist for `-1 to hit`, `-1 Damage`, `ignore AP -1`, invuln-granting,
FNP-granting — applied when Story C supplies them; default no-ops here.

### R6 — Preserve the current maths

For the weapon/target pairs the current `engine.js` can express, the new
`resolveAttack` / `effectiveWounds` produce the same numbers within
rounding. A golden-value test locks this: a table of
`(weapon chars, keywords, defender) → expected` computed from
`src/core/engine.js` today, re-run through the new engine.

### R7 — `context` is the extension seam

`resolveAttack` accepts a `context` carrying hit/wound modifiers, rerolls,
half-range, and phase. Story C's ability layer and the R5 one-use toggles
write into `context`; Story B ships it as a no-op-by-default parameter with
the plumbing in place.

### R8 — Standalone, not wired

`src/core/engine.js` (old) stays untouched and in use. The new modules are
imported by nothing in the app yet (Story D wires them). Tests are the
deliverable alongside the code.

## Acceptance Criteria

- [ ] `resolveKeywords()` covers all 44 base keywords in the data; a
      data-sweep test asserts zero unknowns.
- [ ] Parametric parse: `"ANTI-FLY 4+"` → `{anti:[{vs:"fly",on:4}]}`,
      `"SUSTAINED HITS D3"` → `{sustainedHits: 2}` (D3 avg), `"MELTA 4"` →
      `{melta: 4}`, `"RAPID FIRE 2"` → `{rapidFire: 2}`.
- [ ] Golden-value parity: for ~20 `(weapon, defender)` pairs spanning
      Sustained / Lethal / Devastating / Twin-linked / Anti-X / Torrent /
      Melta / plain, the new engine matches `src/core/engine.js` within
      rounding, or the difference is a documented correction.
- [ ] A weapon with `ANTI-VEHICLE 3+` auto-wounds on 3+ only when the
      defender's keywords include `VEHICLE`.
- [ ] `effectiveWounds` reflects `InvSv` and `FNP` and matches today's
      `ewCalc` for equivalent inputs.
- [ ] Every no-op keyword is present with `{noop:true}` — none missing.
- [ ] `src/core/engine.js` and `npm run build` unchanged / clean.

## Edge Cases / Failure Modes

- **`A: "D6"` / `D: "D3+1"` / `S: "2D6"`** — dice average via the shared
  helper (`scripts/bsdata-import/v2/dice.mjs` is a seed). `"N/A"` A → 0.
- **Skill `"N/A"` (Torrent)** — hit prob = 1, no hit roll (`{autoHit}`);
  Sustained/Lethal on the same weapon therefore contribute nothing (see
  Resolved).
- **`S: "User"`** on a melee weapon — needs the attacker's Strength; if
  the datasheet mode already carries a number, use it, else resolve from
  the attacker `UnitRecord` profile.
- **`ANTI-MONSTER/VEHICLE 3+`, `ANTI-NON-MONSTER/VEHICLE 3+`** — compound /
  negated target sets; parse into `{anti:[{vs:"monster",on:3},{vs:"vehicle",on:3}]}`
  and `{anti:[{vs:"!monster",...}]}` respectively.
- **`DEVASTATING WOUNDS: INFANTRY`** — a conditional variant; effect only
  applies vs that target type.
- **`BLAST`** — `+floor(targetModels/5)` attacks; `context.targetModels`
  from the defending unit's size or a target-size input (see Resolved).
- **`MELTA N`** — `+N` Damage when `context.halfRange`; a toggle, default
  off (see Resolved).
- **Unknown/bespoke keyword** (`HOOKED`, `PLASMA WARHEAD`, …) — `{noop}` +
  the census note; if any turns out calc-relevant, add an effect.

## Constraints

- Pure functions, no React, no app state. `src/core/model/`.
- Keep `src/core/engine.js`'s probability formulas (`wt()`, the 5/6 hit
  ceiling, reroll compounding, mortal-wound handling for Devastating) —
  port them, don't reinvent.
- Deterministic, no RNG (expected values only, as today).
- The `keywords.js` ↔ `engine.js` effect vocabulary, once set, is a
  contract Story C and D read — freeze it at the umbrella S2.

## Non-Goals

- Unit / army / detachment ability effects — Story C (this Story only
  leaves `context` hooks).
- Any UI, any `registry.js` / Evaluator / Fight Sim change — Story D.
- Cover, range bands, line of sight, the shooting/melee/charge sequence —
  Fight Simulator follow-up.
- Monte-Carlo / variance — expected values only.
- Re-pricing or changing `src/core/data` — that's Story A's output, frozen.

## Existing Behavior

`src/core/engine.js`: `calcW(shots, skill, s, ap, d, tags, tgt, bh)` →
expected unsaved damage; `calcWs(ws, tgt, bh)` sums a weapon list;
`ewCalc(totalWounds, sv, inv, fnp, eAp)` → effective wounds. `tags` keys:
`sustained, let, conv, con, tl, rrw1, rrwf, dev, devmv, av3, am3, ai, sowf,
fe, w1, w1mv, ch5`. The Evaluator (`src/tools/FactionUnitEvaluator.jsx`)
and Fight Sim call these against `src/core/targets.js` profiles.

## Examples / Scenarios

### Scenario 1 — a keyword resolves to an effect

**Given:** a weapon mode `{ A:"3", BS:"3+", S:"6", AP:"-1", D:"1",
keywords:["SUSTAINED HITS 1","LETHAL HITS"] }`.
**When:** `resolveAttack` runs it vs a T4 Sv3+ defender.
**Then:** the expected damage includes the extra hit on a crit (Sustained)
and the auto-wound on a crit (Lethal), matching `calcW(...,{sustained:1,
let:1},...)` today.

### Scenario 2 — Anti-X is conditional on the target

**Given:** a weapon with `ANTI-VEHICLE 3+`.
**When:** evaluated vs a VEHICLE meta unit, then vs an INFANTRY one.
**Then:** vs VEHICLE it wounds on 3+ (or its normal roll, whichever is
better); vs INFANTRY the keyword has no effect.

### Scenario 3 — no-op keyword is visible

**Given:** a weapon with `HEAVY, PRECISION`.
**When:** `resolveKeywords` runs.
**Then:** both return `{noop:true, note:"..."}` — the Evaluator can show
"Heavy, Precision (not modelled)" rather than dropping them.

## Resolved (2026-09-09)

### Torrent — true auto-hit

`TORRENT` → `{autoHit: true}`; the engine sets hit probability to 1 and
**rolls no hit dice**. This is the rules-accurate model, and a
consequence that falls out correctly: **Sustained Hits and Lethal Hits do
nothing on a torrent weapon** (no hit roll ⇒ no Critical Hits), which is
how the game actually works. Replaces the old engine's
`skill 2 + shots×6/5` approximation.
*Parity note:* torrent weapons' numbers shift slightly vs. the old app,
and torrent + Sustained/Lethal combos drop to just the base hits.

### Melta — a range toggle in `context`

`MELTA N` → `{melta: N}`. The engine adds `N` to Damage **only when
`context.halfRange` is set**. Story D exposes this as a per-comparison
"assume melta range" toggle (default off — the conservative baseline —
with the toggle prominent). Story B ships the effect + the `context` flag;
default behaviour is no bonus.

### Blast — a target-size input in `context`

`BLAST` → `{blast: true}`. The engine adds `floor(context.targetModels / 5)`
attacks. `context.targetModels` comes from the defending unit's real size
(the "meta" columns are real units) or, for a custom target, a "target
unit size" input (Story D). Absent → no bonus.

### Ramifications (call-outs, not blockers)

The new engine will **not** reproduce the old app's numbers for any unit
fielding **Melta** (~280 weapons) or **Blast** (~700 weapons) — the old
engine ignored both. Melta-heavy anti-tank units look markedly better at
half range; Blast weapons look better into big units. This is a
correctness gain, and Story E's parity pass quantifies the per-unit delta.
Torrent weapons shift a little too.

## Open Questions

- **Effect object shape** — flat (`{sustainedHits, lethal, ...}`) or a
  list of `{type, ...}` — settle in the Plan against the parity test.
- **Where dice/skill helpers live** — `src/core/model/dice.js` shared by
  the engine, or inline. (`scripts/bsdata-import/v2/dice.mjs` exists as a
  seed but shouldn't be imported across the script/app boundary.)

## Notes

- The 44-keyword list (from `src/core/data`): anti chaos / character /
  daemon / epic hero / fly / infantry / monster / monster-vehicle /
  non-monster-vehicle / psyker / titanic / vehicle / walker; assault;
  blast; cleave; close quarters; conversion; defensive array; devastating
  wounds; extra attacks; harpooned; hazardous; heavy; hive defences;
  hooked; ignores cover; indirect fire; lance; lethal hits; linked fire;
  melta; one shot; overcharge; pistol; plasma warhead; precision; psychic;
  psychic assassin; rapid fire; reverberating summons; sustained hits;
  torrent; twin linked.
- `parseKeyword()` in `scripts/bsdata-import/v2/keywordNormalize.mjs`
  already splits `"<name> <N>+"` / `"<name> <val>"` / `"<name>: <vs>"` —
  reuse or port it.
- `src/core/engine.js`'s `calcW` is the reference implementation for the
  crit/reroll/save maths — the Plan should port it function by function
  and diff the outputs.
