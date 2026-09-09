// ─── WEAPON KEYWORD CANONICALISER (Story A / task A3) ───────────────────────
// Canonicalises the STRING ONLY — lowercase, collapse separators, trim. It
// does NOT parse "N+" / ": qualifier" or know what a keyword does — that is
// Story B's dictionary (`parseKeyword` below is provided for it, not used by
// the ingester). P1 found 157 raw strings that collapse to ~40 real
// keywords; the difference is casing / hyphen-vs-space / Ork ALL-CAPS.
//
// canonicalKeyword("Twin-linked")  -> "twin linked"
// canonicalKeyword("TWIN-LINKED")   -> "twin linked"
// canonicalKeyword("Anti-Fly 4+")   -> "anti fly 4+"
// canonicalKeyword("Lethal Hits: non-MONSTER/VEHICLE") -> "lethal hits: non monster/vehicle"

export function canonicalKeyword(raw) {
  const s = String(raw ?? "").trim();
  if (!s || s === "-") return null;
  return s.toLowerCase()
    .normalize("NFKD")
    .replace(/[‐-―‑\-]+/g, " ")   // hyphen variants -> space
    .replace(/\s*:\s*/g, ": ")           // normalise the qualifier separator
    .replace(/\s+/g, " ")
    .trim();
}

export function canonicalKeywordList(str) {
  return String(str ?? "")
    .split(",")
    .map(canonicalKeyword)
    .filter(Boolean);
}

// ── For Story B's dictionary (NOT used by the ingester) ─────────────────────
// parse a canonical keyword string into { kw, on?, val?, vs? }.
export function parseKeyword(canonical) {
  let s = canonical;
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
