// ─── DICE / SKILL / KEYWORD PARSING (Story B / task B1) ─────────────────────
// App-side helpers for the combat engine. Deliberately a copy of the
// equivalents in scripts/bsdata-import/v2/ — the ingester (build tooling)
// and the app must not import across that boundary.

// GW dice notation → average. D6=3.5, D3=2, 2D6=7, D6+1=4.5, D3+3=6.5.
// "" / "-" / "N/A" → null (caller decides the fallback).
export function diceAverage(text) {
  if (text == null) return null;
  const s = String(text).trim();
  if (s === "" || s === "-" || /^n\/?a$/i.test(s)) return null;
  const plain = Number(s);
  if (!Number.isNaN(plain)) return plain;
  const m = s.match(/^(\d*)\s*[dD](\d+)\s*(?:([+-])\s*(\d+))?$/);
  if (!m) return null;
  const count = m[1] ? Number(m[1]) : 1;
  const die = Number(m[2]);
  const bonus = m[3] ? (m[3] === "-" ? -1 : 1) * Number(m[4]) : 0;
  return count * (die + 1) / 2 + bonus;
}

// Attacks characteristic → a number. Same as diceAverage but "N/A"/"-" → 0
// (a weapon with no attacks contributes nothing).
export function attacksAverage(text) {
  const v = diceAverage(text);
  return v == null ? 0 : v;
}

// Skill string → { skill, auto }. "3+" → {skill:3}. "N/A"/"-"/"" → {auto:true}
// (torrent / auto-hitting weapons). The engine uses `auto` for a true no-roll
// hit; keeping a `skill` fallback of 6 for any odd unparseable value.
export function parseSkill(text) {
  const s = String(text ?? "").trim();
  if (s === "" || s === "-" || /^n\/?a$/i.test(s)) return { auto: true };
  const n = Number(s.replace("+", ""));
  return Number.isNaN(n) ? { skill: 6 } : { skill: n };
}

// Strength / AP / T etc. → integer (null if "User"/unparseable — caller
// resolves relative melee S from the attacker).
export function stat(text) {
  const s = String(text ?? "").trim();
  if (!s || /^user$/i.test(s)) return null;
  const n = Number(s.replace(/[^\d.-]/g, ""));
  return Number.isNaN(n) ? diceAverage(s) : n;
}

// Save string "3+" → 3 ; "-"/"" → 7 (no save).
export function saveValue(text) {
  const s = String(text ?? "").trim();
  if (!s || s === "-") return 7;
  const n = Number(s.replace("+", ""));
  return Number.isNaN(n) ? 7 : n;
}

// Keyword string → { kw, on?, val?, vs? }. Lowercases + normalises
// separators first ("ANTI-FLY 4+" → {kw:"anti fly", on:4}). Copy of
// scripts/bsdata-import/v2/keywordNormalize.mjs `parseKeyword`.
export function parseKeyword(raw) {
  let s = String(raw).toLowerCase()
    .replace(/[‐-―‑\-]+/g, " ").replace(/\s*:\s*/g, ": ").replace(/\s+/g, " ").trim();
  let vs;
  const colon = s.split(/:\s*/);
  if (colon.length > 1) { s = colon[0]; vs = colon.slice(1).join(": ").trim(); }
  let on;
  let m = s.match(/^(.*?)\s+(\d+)\+$/);
  if (m) { s = m[1]; on = Number(m[2]); }
  let val;
  m = s.match(/^(.*?)\s+(\d+|d\d+(?:\+\d+)?)$/);
  if (m) { s = m[1]; val = m[2]; }
  const out = { kw: s.trim() };
  if (on != null) out.on = on;
  if (val != null) out.val = val;
  if (vs != null) out.vs = vs;
  return out;
}
