// ─── ENGINE: new mechanics (Story B / task B5) ─────────────────────────────
import { test } from "node:test";
import assert from "node:assert/strict";
import { resolveMode, resolveAttack, effectiveWounds } from "./engine.js";

const meq = { keywords: [], stats: { T: "4", Sv: "3+", W: "2" } };
const vehicle = { keywords: ["VEHICLE"], stats: { T: "9", Sv: "3+", W: "10" } };
const monster = { keywords: ["MONSTER"], stats: { T: "10", Sv: "2+", InvSv: "4+", W: "12" } };
const m = (kw, over = {}) => ({ A: "3", BS: "3+", S: "6", AP: "-1", D: "2", keywords: kw, ...over });

test("Anti-X applies only when the defender has the keyword", () => {
  const w = m(["ANTI-VEHICLE 2+"]);
  const vsVeh = resolveMode(w, vehicle, {});
  const vsMeq = resolveMode(w, meq, {});
  const plainVsVeh = resolveMode(m([]), vehicle, {});
  assert.ok(vsVeh > plainVsVeh, "wounds better vs VEHICLE with Anti-Vehicle");
  assert.equal(vsMeq, resolveMode(m([]), meq, {}), "no effect vs a non-VEHICLE");
});

test("Devastating Wounds with a target qualifier is conditional", () => {
  const w = m(["DEVASTATING WOUNDS: VEHICLE"]);
  assert.ok(resolveMode(w, vehicle, {}) > resolveMode(m([]), vehicle, {}), "fires vs VEHICLE");
  assert.equal(resolveMode(w, meq, {}), resolveMode(m([]), meq, {}), "inert vs INFANTRY");
});

test("Melta only adds damage at half range", () => {
  const w = m(["MELTA 4"]);
  assert.equal(resolveMode(w, vehicle, {}), resolveMode(m([]), vehicle, {}), "no bonus without context.halfRange");
  assert.ok(resolveMode(w, vehicle, { halfRange: true }) > resolveMode(m([]), vehicle, { halfRange: true }), "bonus at half range");
});

test("Blast adds attacks from context.targetModels", () => {
  const w = m(["BLAST"]);
  const base = resolveMode(w, meq, {});
  const vs10 = resolveMode(w, meq, { targetModels: 10 });   // +2 attacks
  assert.ok(vs10 > base);
  assert.equal(resolveMode(w, meq, { targetModels: 4 }), base, "<5 models → no bonus");
});

test("Rapid Fire adds attacks in rapid-fire range", () => {
  const w = m(["RAPID FIRE 2"], { A: "2" });
  assert.ok(resolveMode(w, meq, { rapidFireRange: true }) > resolveMode(w, meq, {}));
});

test("context hooks move the number the right way; default = no change", () => {
  const w = m([]);
  const base = resolveMode(w, meq, {});
  assert.ok(resolveMode(w, meq, { bh: 1 }) > base, "+1 to hit");
  assert.ok(resolveMode(w, meq, { bw: 1 }) > base, "+1 to wound");
  assert.ok(resolveMode(w, meq, { damageReduction: 1 }) < base, "-1 Damage");
  // meq's effective save vs this AP-1 weapon is 4+; a granted 3++ beats it
  assert.ok(resolveMode(w, meq, { invGranted: "3+" }) < base, "granted better invuln");
  assert.ok(resolveMode(w, meq, { fnpGranted: "5+" }) < base, "granted FNP");
  assert.equal(resolveMode(w, meq, {}), base, "empty context is a no-op");
});

test("resolveAttack sums weapons and scales per-model", () => {
  const out = resolveAttack({
    weapons: [m([], { name: "gun A" }), m(["LETHAL HITS"], { name: "gun B" })],
    models: 5,
  }, meq, {});
  assert.equal(out.perWeapon.length, 2);
  assert.ok(out.expected > 0);
});

test("effectiveWounds reflects invuln and FNP", () => {
  // ewCalc is an AP0 baseline — a 4++ only helps a unit with a worse armour save
  const plain = effectiveWounds({ stats: { W: "3", Sv: "5+" }, size: { min: 5 } }, {});
  const inv = effectiveWounds({ stats: { W: "3", Sv: "5+", InvSv: "4+" }, size: { min: 5 } }, {});
  const fnp = effectiveWounds({ stats: { W: "3", Sv: "5+", FNP: "5+" }, size: { min: 5 } }, {});
  assert.ok(inv > plain, "a better invuln than armour raises effective wounds");
  assert.ok(fnp > plain, "FNP raises effective wounds");
  // and matches the old ewCalc
});
