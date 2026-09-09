// ─── GOLDEN-VALUE PARITY vs src/core/engine.js (Story B / task B4) ──────────
import { test } from "node:test";
import assert from "node:assert/strict";
import { calcW, ewCalc } from "../engine.js";
import { resolveMode, effectiveWounds } from "./engine.js";

// old engine tags -> new keyword strings
function keywordsFor(tags) {
  const k = [];
  if (tags.sustained) k.push(`SUSTAINED HITS ${tags.sustained}`);
  if (tags.let) k.push("LETHAL HITS");
  if (tags.tl) k.push("TWIN-LINKED");
  if (tags.dev) k.push("DEVASTATING WOUNDS");
  if (tags.av3) k.push("ANTI-VEHICLE 3+");
  if (tags.am3) k.push("ANTI-MONSTER 3+");
  return k;
}
function defenderFor(tgt) {
  const kw = [];
  if (tgt.veh) kw.push("VEHICLE");
  if (tgt.mon) kw.push("MONSTER");
  return {
    keywords: kw,
    stats: {
      T: String(tgt.T), Sv: `${tgt.sv}+`,
      InvSv: tgt.inv ? `${tgt.inv}+` : null,
      FNP: tgt.fnp ? `${tgt.fnp}+` : null,
    },
  };
}
function modeFor(shots, skill, s, ap, d, tags) {
  return {
    A: String(shots), BS: `${skill}+`, S: String(s),
    AP: String(ap), D: String(d), keywords: keywordsFor(tags),
  };
}

const T4 = { T: 4, sv: 3, inv: null, fnp: null, veh: false, mon: false };
const TEQ = { T: 5, sv: 2, inv: 4, fnp: null, veh: false, mon: false };
const VEH = { T: 9, sv: 3, inv: null, fnp: null, veh: true, mon: false };
const MON = { T: 10, sv: 2, inv: 4, fnp: null, veh: false, mon: true };
const FNP = { T: 4, sv: 3, inv: null, fnp: 5, veh: false, mon: false };

const CASES = [
  // [label, shots, skill, S, AP, D, tags, target]
  ["bolter vs MEQ",           10, 3, 4, 0, 1, {}, T4],
  ["AP-2 vs MEQ",             10, 3, 4, -2, 1, {}, T4],
  ["high-D vs MEQ",            3, 3, 8, -3, 3, {}, T4],
  ["low S vs T",               6, 4, 3, 0, 1, {}, T4],
  ["vs TEQ (invuln)",          6, 3, 8, -3, 2, {}, TEQ],
  ["vs FNP",                  10, 3, 4, 0, 2, {}, FNP],
  ["sustained 1",             10, 3, 4, 0, 1, { sustained: 1 }, T4],
  ["sustained 2",             10, 3, 4, 0, 1, { sustained: 2 }, T4],
  ["lethal hits",             10, 3, 4, -1, 1, { let: 1 }, T4],
  ["devastating wounds",       6, 3, 6, -1, 2, { dev: 1 }, T4],
  ["twin-linked",              4, 3, 7, -1, 2, { tl: 1 }, T4],
  ["twin-linked + reroll ceil",6, 2, 10, -2, 3, { tl: 1 }, T4],
  ["anti-vehicle 3+ vs VEH",   3, 3, 6, -2, 3, { av3: 1 }, VEH],
  ["anti-vehicle 3+ vs MEQ (no effect)", 3, 3, 6, -2, 3, { av3: 1 }, T4],
  ["anti-monster 3+ vs MON",   4, 3, 8, -2, 2, { am3: 1 }, MON],
  ["dev + sustained vs MON",   6, 3, 9, -3, 3, { dev: 1, sustained: 1 }, MON],
  ["lethal + twin-linked",     8, 3, 5, -1, 1, { let: 1, tl: 1 }, T4],
  ["heavy hitter vs VEH",      2, 3, 14, -4, 6, {}, VEH],
  ["chaff clearer",           20, 4, 4, 0, 1, {}, T4],
  ["one big shot vs invuln",   1, 2, 16, -4, 8, {}, MON],
];

test("parity: new resolveMode matches src/core/engine.js calcW", () => {
  const rows = [];
  for (const [label, shots, skill, s, ap, d, tags, tgt] of CASES) {
    const old = calcW(shots, skill, s, ap, d, tags, tgt, 0);
    const neu = resolveMode(modeFor(shots, skill, s, ap, d, tags), defenderFor(tgt), {});
    const delta = Math.abs(old - neu);
    rows.push(`${label.padEnd(38)} old ${old.toFixed(4)}  new ${neu.toFixed(4)}  Δ ${delta.toExponential(1)}`);
    assert.ok(delta < 1e-9, `${label}: old ${old} != new ${neu}`);
  }
  // (uncomment to eyeball) console.log("\n" + rows.join("\n"));
});

test("parity: Torrent — base damage matches the old ×6/5 convention", () => {
  // old torrent = skill 2 + shots×(6/5) at ingest. new = true auto-hit (hp=1).
  // for base hits these are equal: 10×6/5×5/6 = 10 = 10×1.
  const oldTorrent = calcW(10 * 6 / 5, 2, 4, 0, 1, {}, T4, 0);
  const newTorrent = resolveMode({ A: "10", BS: "N/A", S: "4", AP: "0", D: "1", keywords: ["TORRENT"] }, defenderFor(T4), {});
  assert.ok(Math.abs(oldTorrent - newTorrent) < 1e-9, `${oldTorrent} vs ${newTorrent}`);
});

test("parity: effectiveWounds matches ewCalc", () => {
  for (const [tw, sv, inv, fnp] of [[15, 3, null, null], [15, 5, 4, null], [30, 2, 4, 6], [10, 6, null, 5]]) {
    const old = ewCalc(tw, sv, inv, fnp, 0);
    const models = tw / 3;
    const neu = effectiveWounds({
      stats: { W: "3", Sv: `${sv}+`, InvSv: inv ? `${inv}+` : null, FNP: fnp ? `${fnp}+` : null },
      size: { min: models },
    }, {});
    assert.ok(Math.abs(old - neu) < 1e-9, `tw${tw} sv${sv}: ${old} vs ${neu}`);
  }
});

test("Torrent nullifies Sustained / Lethal (rules-accurate, intentional)", () => {
  const plain = resolveMode({ A: "10", BS: "N/A", S: "4", AP: "0", D: "1", keywords: ["TORRENT"] }, defenderFor(T4), {});
  const withSus = resolveMode({ A: "10", BS: "N/A", S: "4", AP: "0", D: "1", keywords: ["TORRENT", "SUSTAINED HITS 2"] }, defenderFor(T4), {});
  const withLethal = resolveMode({ A: "10", BS: "N/A", S: "4", AP: "0", D: "1", keywords: ["TORRENT", "LETHAL HITS"] }, defenderFor(T4), {});
  assert.equal(plain, withSus, "Sustained does nothing on an auto-hit weapon");
  assert.equal(plain, withLethal, "Lethal does nothing on an auto-hit weapon");
});
