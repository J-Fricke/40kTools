# Engine notes (Story B)

`src/core/model/{dice,keywords,engine}.js` + tests. `node --test
src/core/model/*.test.mjs` — 16 tests. The old `src/core/engine.js` is
untouched and still in use (Story D swaps consumers over; Story E deletes).

## Parity with `src/core/engine.js`

`parity.test.mjs` runs 20 `(weapon, defender)` cases and 4 durability
cases through **both** engines. All match within `1e-9` — the formula
transcription is faithful:

- hit / wound / save / FNP probabilities, the 5/6 ceiling
- reroll compounding: reroll-1 `wp·7/6`, reroll-all `1-(1-wp)²`,
  twin-linked `wp+(1-wp)·wp` (twin-linked is now "reroll all wounds")
- Sustained Hits (`+shots·critHit·N`), Lethal Hits (crit portion
  auto-wounds), Devastating Wounds (crit wounds → mortals, bypass saves)
- `effectiveWounds` == `ewCalc`

## Intentional differences from the old engine

| Change | Effect |
|---|---|
| **Torrent = true auto-hit** (`hp=1`, no hit roll) | base damage is identical to the old `skill 2 + shots·6/5` convention; but **Sustained Hits and Lethal Hits now do nothing on a torrent weapon** — correct per the rules (no hit roll ⇒ no Critical Hits) |
| **Melta modelled** (~280 weapons) | `+N` Damage when `context.halfRange`; the old engine ignored Melta entirely. Off by default. |
| **Blast modelled** (~700 weapons) | `+floor(context.targetModels / 5)` attacks; old engine ignored Blast |
| **Rapid Fire modelled** | `+N` attacks when `context.rapidFireRange`; old engine baked it into the shot count per-weapon |
| **Anti-X generalised** | old engine hardcoded `av3`/`am3` (anti-vehicle/monster 3+). Now any `ANTI-<keyword> N+` checks the **defender's own keywords** and sets both the wound floor and the Critical Wound threshold (so Anti-X + Devastating Wounds interact correctly) |

Story E's parity pass quantifies the per-unit delta for the 4 currently
hand-authored factions.

## No-op keywords (present in the dictionary, no calc effect)

`ASSAULT`, `HEAVY` (positional — hooked via `context.stationary`),
`PISTOL`, `PRECISION`, `INDIRECT FIRE`, `IGNORES COVER` (cover not
modelled), `PSYCHIC`, `ONE SHOT`, `HAZARDOUS` (self-harm not modelled),
`CLOSE QUARTERS`, `OVERCHARGE`, `PLASMA WARHEAD`, `LINKED FIRE`,
`DEFENSIVE ARRAY`, `PSYCHIC ASSASSIN`, `REVERBERATING SUMMONS`, `HOOKED`,
`HARPOONED`, `HIVE DEFENCES`. Each carries a `note`. `LANCE` and `CLEAVE`
are modelled (Lance via `context.charged`; Cleave as Devastating-like).

## `context` fields Story C must populate

`bh`, `bw`, `rerollHit`/`rerollWound` (army-wide), `damageReduction`,
`apIgnore`, `invGranted`, `fnpGranted`, `charged`, `stationary`,
`halfRange`, `rapidFireRange`, `targetModels`. Story B ships them all as
no-op-by-default; Story C's ability layer and Story D's toggles fill them.

## Known simplifications (acceptable for a comparison tool)

- `S: "User"` melee weapons default to the datasheet number when present,
  else `context.attackerS`, else 4 — the ingester or Story C could
  resolve these properly later.
- `context.damageReduction` in `effectiveWounds` uses a rough
  `W / max(1, W-r)` scaling — fine for the durability ranking, not a
  per-attack model.
- Cover, range bands, LoS, phase sequencing — Fight Simulator follow-up.
