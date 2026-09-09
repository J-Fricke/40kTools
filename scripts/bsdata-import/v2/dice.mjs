// ─── DICE NOTATION → AVERAGE (Story A) ──────────────────────────────────────
// GW notation: D6=3.5, D3=2, 2D6=7, D6+1=4.5, D3+1=3, D6+3=6.5, etc.
// Matches the convention used throughout src/factions/*.js and the old
// keywordMap.mjs.
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

// Skill string ("3+", "N/A", "-") -> number. Torrent / auto-hit weapons use
// N/A and are treated as skill 2 (the engine's hit-probability ceiling), the
// same convention as every hand-authored torrent row.
export function skillNumber(text) {
  const s = String(text ?? "").trim();
  if (s === "" || s === "-" || /^n\/?a$/i.test(s)) return 2;
  const n = Number(s.replace("+", ""));
  return Number.isNaN(n) ? 2 : n;
}
