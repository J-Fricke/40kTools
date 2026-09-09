import { test } from "node:test";
import assert from "node:assert/strict";
import { readdirSync } from "fs";
import { resolveKeywords } from "./keywords.js";
import { diceAverage, parseSkill, stat, saveValue } from "./dice.js";

test("dice.js: notations", () => {
  assert.equal(diceAverage("D6"), 3.5);
  assert.equal(diceAverage("2D6"), 7);
  assert.equal(diceAverage("D3+1"), 3);
  assert.equal(diceAverage("D6+3"), 6.5);
  assert.equal(diceAverage("3"), 3);
  assert.equal(diceAverage("N/A"), null);
  assert.equal(diceAverage("-"), null);
  assert.deepEqual(parseSkill("3+"), { skill: 3 });
  assert.deepEqual(parseSkill("N/A"), { auto: true });
  assert.equal(stat("6"), 6);
  assert.equal(stat("User"), null);
  assert.equal(saveValue("2+"), 2);
  assert.equal(saveValue("-"), 7);
});

test("keywords: parametric parse", () => {
  assert.deepEqual(resolveKeywords(["ANTI-FLY 4+"]), { anti: [{ vs: "fly", on: 4 }] });
  assert.equal(resolveKeywords(["SUSTAINED HITS D3"]).sustainedHits, 2);
  assert.equal(resolveKeywords(["SUSTAINED HITS 2"]).sustainedHits, 2);
  assert.equal(resolveKeywords(["MELTA 4"]).melta, 4);
  assert.equal(resolveKeywords(["RAPID FIRE 2"]).rapidFire, 2);
  assert.equal(resolveKeywords(["TWIN-LINKED"]).rerollWound, "all");
  assert.equal(resolveKeywords(["TORRENT"]).autoHit, true);
  assert.equal(resolveKeywords(["DEVASTATING WOUNDS"]).devastating, true);
  assert.equal(resolveKeywords(["DEVASTATING WOUNDS: INFANTRY"]).devastating, "infantry");
});

test("keywords: compound / negated anti", () => {
  assert.deepEqual(resolveKeywords(["ANTI-MONSTER/VEHICLE 3+"]).anti,
    [{ vs: "monster", on: 3 }, { vs: "vehicle", on: 3 }]);
  assert.deepEqual(resolveKeywords(["ANTI-NON-MONSTER/VEHICLE 3+"]).anti,
    [{ vs: "!monster", on: 3 }, { vs: "!vehicle", on: 3 }]);
});

test("keywords: no-op keywords are explicit, not dropped", () => {
  const e = resolveKeywords(["HEAVY", "PRECISION", "PISTOL"]);
  assert.deepEqual(e.noop.sort(), ["HEAVY", "PISTOL", "PRECISION"]);
});

test("keywords: coverage — every keyword in src/core/data resolves (0 unknown)", async () => {
  const unknown = new Set();
  for (const f of readdirSync(new URL("../data/", import.meta.url)).filter(x => x.endsWith(".json") && x[0] !== "_")) {
    const { default: units } = await import(new URL(`../data/${f}`, import.meta.url), { with: { type: "json" } });
    for (const u of units) for (const w of u.weapons || []) for (const m of [...(w.ranged || []), ...(w.melee || [])]) {
      for (const k of resolveKeywords(m.keywords).unknown || []) unknown.add(k);
    }
  }
  assert.deepEqual([...unknown], [], `unknown keywords: ${[...unknown].join(", ")}`);
});
