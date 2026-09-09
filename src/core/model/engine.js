// ─── COMBAT ENGINE (Story B) ───────────────────────────────────────────────
// Written fresh against the UnitRecord model; the probability FORMULAS are
// transcribed from src/core/engine.js (the trusted maths) and locked by
// parity.test.mjs. Expected values only, no RNG.
//
// ════ CONTRACT (frozen at umbrella S2 — Stories C and D depend on this) ════
//
// resolveMode(mode, defender, context) -> expected unsaved damage (number)
// resolveAttack({ weapons: [mode&{count?,perModel?,name?}], models? }, defender, context)
//     -> { expected, perWeapon: [{ name, expected }] }
// effectiveWounds(defender, context) -> number   (durability metric)
//
// mode      : a UnitRecord WeaponMode — raw strings A / BS|WS / S / AP / D /
//             range, keywords: ["SUSTAINED HITS 1", ...] (UPPERCASE).
// defender  : a UnitRecord — reads .stats {T,Sv,InvSv,FNP,W} (strings),
//             .keywords (UPPERCASE — VEHICLE/MONSTER/FLY/... for Anti-X),
//             .size.
// context   : ALL optional, ALL default to no-op. The seam Story C's ability
//             layer and the one-use toggles write into:
//   phase           "ranged" | "melee"
//   bh, bw          bonus to hit / wound (integer)
//   halfRange       apply MELTA
//   targetModels    for BLAST (+floor(n/5) attacks)
//   rapidFireRange  apply RAPID FIRE
//   charged         apply LANCE (+1 wound)            [hook only in B]
//   stationary      apply HEAVY (+1 hit)              [hook only in B]
//   attackerS       resolve a "User" melee Strength
//   damageReduction integer, "-N Damage" (floored at 1)
//   apIgnore        integer, "ignore AP -N"
//   invGranted      e.g. "4+"  — used if better than the defender's own
//   fnpGranted      e.g. "5+"
//   eAp / models    effectiveWounds only
//
// Keyword semantics come from ./keywords.js (the Effect vocabulary). Army /
// stratagem / ability effects are NOT keywords — they arrive via `context`
// (Story C). See ENGINE-NOTES.md for parity deltas and no-op keywords.
//
// attack   = { weapons: [ WeaponMode & { count?: number } ], models?: number }
//            each WeaponMode carries raw strings A / BS|WS / S / AP / D /
//            range and keywords: ["SUSTAINED HITS 1", ...] (UPPERCASE).
//            `count` = how many of that weapon fire (default 1); `models`
//            scales it further for a squad firing N copies.
// defender = a UnitRecord (uses .stats {T,Sv,InvSv,FNP,W}, .keywords, .size)
// context  = all optional, all default to no-op — the seam Story C's
//            ability layer and the one-use toggles write into:
//            { phase, bh, bw, halfRange, targetModels, rapidFireRange,
//              charged, stationary, damageReduction, apIgnore,
//              invGranted, fnpGranted, attackerS }
import { attacksAverage, diceAverage, parseSkill, stat, saveValue, parseKeyword } from "./dice.js";
import { resolveKeywords } from "./keywords.js";

const CAP = 5 / 6;               // GW's unmodified-1-always-fails / 6-always-hits ceiling
const clamp01 = p => Math.max(0, Math.min(1, p));

// wound threshold: S vs T
function woundThreshold(s, t) {
  if (s >= t * 2) return 2;
  if (s > t) return 3;
  if (s === t) return 4;
  if (s * 2 <= t) return 6;
  return 5;
}

// does the defender have this keyword (or, "!x", NOT have it)?
function defenderHas(defender, vs) {
  const kws = defender.keywords || [];
  if (vs.startsWith("!")) return !kws.includes(vs.slice(1).toUpperCase());
  return kws.includes(vs.toUpperCase());
}

// expected unsaved damage from ONE weapon mode vs the defender
export function resolveMode(mode, defender, context = {}) {
  const ds = defender.stats || {};
  const T = stat(ds.T) ?? 4;
  const sv = saveValue(ds.Sv);
  const invRaw = ds.InvSv ? saveValue(ds.InvSv) : null;
  const inv = context.invGranted ? Math.min(invRaw ?? 7, saveValue(context.invGranted)) : invRaw;
  const fnpRaw = ds.FNP ? saveValue(ds.FNP) : null;
  const fnp = context.fnpGranted ? Math.min(fnpRaw ?? 7, saveValue(context.fnpGranted)) : fnpRaw;

  const eff = resolveKeywords(mode.keywords);

  // ── shots ──
  let shots = attacksAverage(mode.A) * (mode.count || 1);
  if (eff.blast && context.targetModels) shots += Math.floor(context.targetModels / 5) * (mode.count || 1);
  if (eff.rapidFire && context.rapidFireRange) shots += eff.rapidFire * (mode.count || 1);
  if (!shots) return 0;

  // ── hit ──
  const sk = parseSkill(mode.BS ?? mode.WS);
  const bh = context.bh || 0;
  const hp = eff.autoHit || sk.auto ? 1 : clamp01(Math.min((7 - Math.max(2, sk.skill - bh)) / 6, CAP));
  const chp = eff.autoHit || sk.auto ? 0 : eff.critOn ? (7 - eff.critOn) / 6 : 1 / 6;   // Critical Hit probability
  let hits = shots * hp;
  if (eff.sustainedHits) hits += shots * chp * eff.sustainedHits;

  // ── wound ──
  const s = stat(mode.S) ?? context.attackerS ?? 4;
  const bw = context.bw || 0;
  let wt = woundThreshold(s, T) - bw;
  let wp = clamp01(Math.min((7 - Math.max(2, wt)) / 6, CAP));
  let cwp = 1 / 6;                                            // Critical Wound probability
  for (const a of eff.anti || []) {
    if (!defenderHas(defender, a.vs)) continue;
    wp = Math.max(wp, (7 - a.on) / 6);
    cwp = Math.max(cwp, (7 - a.on) / 6);
  }
  if (eff.rerollWound === "all") wp = Math.min(1 - (1 - wp) ** 2, CAP);
  else if (eff.rerollWound === "1") wp = Math.min(wp * 7 / 6, CAP);

  // lethal hits: the critical-hit portion auto-wounds
  const autoWoundHits = eff.lethal ? shots * chp : 0;
  let wounds = autoWoundHits + (hits - autoWoundHits) * wp;

  // devastating wounds: critical wounds -> mortal, bypass saves
  const devActive = eff.devastating === true
    || (typeof eff.devastating === "string" && defenderHas(defender, eff.devastating));
  let mortal = 0;
  if (devActive) {
    mortal = hits * cwp;
    wounds = autoWoundHits * Math.max(0, 1 - cwp) + (hits - autoWoundHits) * Math.max(0, wp - cwp);
  }

  // ── save ──
  let ap = stat(mode.AP) ?? 0;
  if (context.apIgnore && ap < 0) ap = Math.min(0, ap + context.apIgnore);
  const modSv = sv - ap;
  const effSv = inv ? Math.min(modSv, inv) : modSv;
  const saveProb = effSv <= 6 ? clamp01((7 - Math.max(effSv, 2)) / 6) : 0;   // P(save succeeds)
  const through = mortal + wounds * (1 - saveProb);

  // ── damage ──
  let d = diceAverage(mode.D) ?? 1;
  if (eff.melta && context.halfRange) d += eff.melta;
  if (context.damageReduction) d = Math.max(1, d - context.damageReduction);

  let out = through * d;
  if (fnp) out *= (1 - clamp01((7 - fnp) / 6));   // FNP reduces damage that got through
  return out;
}

// resolveAttack: sum over the selected weapons, scaled by squad size.
export function resolveAttack(attack, defender, context = {}) {
  const models = attack.models || 1;
  const perWeapon = (attack.weapons || []).map(w => ({
    name: w.name,
    expected: resolveMode(w, defender, context) * (w.perModel ? models : 1),
  }));
  return { expected: perWeapon.reduce((a, w) => a + w.expected, 0), perWeapon };
}

// effectiveWounds: total wounds adjusted for save / invuln / FNP at a
// baseline AP (context.eAp), the durability metric the Evaluator ranks by.
export function effectiveWounds(defender, context = {}) {
  const ds = defender.stats || {};
  const W = stat(ds.W) ?? 1;
  const models = context.models ?? defender.size?.min ?? 1;
  const sv = saveValue(ds.Sv) - (context.eAp || 0);
  const invRaw = ds.InvSv ? saveValue(ds.InvSv) : null;
  const inv = context.invGranted ? Math.min(invRaw ?? 7, saveValue(context.invGranted)) : invRaw;
  const fnpRaw = ds.FNP ? saveValue(ds.FNP) : null;
  const fnp = context.fnpGranted ? Math.min(fnpRaw ?? 7, saveValue(context.fnpGranted)) : fnpRaw;

  const effSv = inv ? Math.min(sv, inv) : sv;
  const saveProb = effSv <= 6 ? clamp01((7 - Math.max(effSv, 2)) / 6) : 0;
  let ew = (models * W) / ((1 - saveProb) * 0.5);
  if (fnp) ew /= (1 - clamp01((7 - fnp) / 6));
  if (context.damageReduction) ew *= (W / Math.max(1, W - context.damageReduction));  // rough: -1D on multi-wound models
  return ew;
}
