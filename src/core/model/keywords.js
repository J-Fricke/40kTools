// ─── WEAPON KEYWORD DICTIONARY (Story B / task B2) ──────────────────────────
// Maps GW weapon keyword strings to declarative Effect objects. Contains NO
// combat maths — src/core/model/engine.js interprets. Every base keyword
// present in src/core/data/*.json (44 of them, P1 census) has an entry:
// either an effect or an explicit { noop: [...] }.
import { diceAverage, parseKeyword } from "./dice.js";

// magnitude string ("2", "d3", "d6+3") -> number
const mag = v => {
  if (v == null) return null;
  const n = Number(v);
  return Number.isNaN(n) ? diceAverage(v) : n;
};

// Each handler: (parsed) => partial Effect. `parsed` = parseKeyword(raw).
const EFFECTS = {
  "sustained hits": p => ({ sustainedHits: mag(p.val) ?? 1 }),
  "lethal hits": () => ({ lethal: true }),
  "devastating wounds": p => ({ devastating: p.vs || true }),
  "twin linked": () => ({ rerollWound: "all" }),
  "torrent": () => ({ autoHit: true }),
  "melta": p => ({ melta: mag(p.val) ?? 0 }),
  "rapid fire": p => ({ rapidFire: mag(p.val) ?? 0 }),
  "blast": () => ({ blast: true }),
  "extra attacks": () => ({ extraAttacks: true }),   // count already in the weapon's own A on the datasheet
  "conversion": () => ({ critOn: 4, note: "Conversion: Critical Hit on 4+ at >12\" — modelled as crit-on-4+" }),
  "cleave": () => ({ devastating: true, note: "Cleave (Orks): unmodified wound 6 inflicts mortals — modelled like Devastating Wounds" }),
  "lance": () => ({ woundBonusOnCharge: 1, note: "Lance: +1 to Wound on the turn it charged — not applied unless context.charged" }),

  // ANTI-<target> [N+]  — handled specially in resolveKeywords (kw is "anti <x>")

  // ── no calc effect (positional / resource / cover / self-harm / bespoke) ──
  ...Object.fromEntries([
    ["assault", "declare-charge-after-advance"],
    ["heavy", "+1 hit if Remained Stationary — context.stationary, not default"],
    ["pistol", "can shoot in engagement range"],
    ["precision", "allocate hits to a CHARACTER"],
    ["indirect fire", "shoot without LoS"],
    ["ignores cover", "cover is not modelled"],
    ["psychic", "Psychic — treated as standard damage"],
    ["one shot", "fires once per battle — every-round firing assumed"],
    ["hazardous", "self mortal wounds — not modelled"],
    ["close quarters", "+1 AP in engagement range — positional"],
    ["overcharge", "Votann Transmatter inverter mode — bespoke, no standalone effect"],
    ["plasma warhead", "Deathstrike bespoke ability text"],
    ["linked fire", "Aeldari Prism Cannon combine-fire — bespoke"],
    ["defensive array", "Hammerfall auto-fire on death — positional"],
    ["psychic assassin", "Culexus bespoke"],
    ["reverberating summons", "Death Guard bespoke"],
    ["hooked", "Kroot — bespoke"],
    ["harpooned", "Tyranid — bespoke"],
    ["hive defences", "Sporocyst — bespoke"],
  ].map(([k, note]) => [k, () => ({ noop: [k.toUpperCase()], note })])),
};

// resolveKeywords: fold a mode's UPPERCASE keyword list into one Effect.
export function resolveKeywords(list = []) {
  const eff = { noop: [], unknown: [], anti: [] };
  for (const raw of list) {
    const p = parseKeyword(raw);
    if (p.kw.startsWith("anti ")) {
      const targets = p.kw.slice(5).trim();               // "vehicle" | "monster/vehicle" | "non monster/vehicle" | "epic hero" ...
      const negate = targets.startsWith("non ");
      const parts = (negate ? targets.slice(4) : targets).split("/").map(s => s.trim()).filter(Boolean);
      for (const t of parts) eff.anti.push({ vs: (negate ? "!" : "") + t, on: p.on ?? 4 });
      continue;
    }
    const h = EFFECTS[p.kw];
    if (!h) { eff.unknown.push(raw); continue; }
    const part = h(p);
    for (const [k, v] of Object.entries(part)) {
      if (k === "noop") eff.noop.push(...v);
      else if (k === "sustainedHits" || k === "rapidFire" || k === "melta") eff[k] = Math.max(eff[k] ?? 0, v);
      else if (k === "note") eff.notes = [...(eff.notes || []), v];
      else eff[k] = v;
    }
  }
  if (!eff.noop.length) delete eff.noop;
  if (!eff.unknown.length) delete eff.unknown;
  if (!eff.anti.length) delete eff.anti;
  return eff;
}

// For the coverage test — every base keyword the dictionary knows about.
export const KNOWN_BASE_KEYWORDS = new Set([
  ...Object.keys(EFFECTS),
  "anti",   // ANTI-<anything> handled by prefix
]);
