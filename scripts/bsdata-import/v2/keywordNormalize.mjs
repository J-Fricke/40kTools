// ─── WEAPON KEYWORD HANDLING (Story A / task A3) ────────────────────────────
// The ingester keeps keyword strings VERBATIM apart from `.toUpperCase()`
// (lossless — casing carries no meaning, and CAPS is GW's own style and
// stands out if it leaks to UI). It does NOT collapse separators, parse
// "N+" / ": qualifier", or know what a keyword does.
//
// BSData's remaining inconsistency (e.g. both "TWIN-LINKED" and "TWIN
// LINKED" appear) is Story B's dictionary's job to map — that is where
// "these strings mean the same effect" lives.
//
// keywordList("Twin-linked, Devastating Wounds")
//   -> ["TWIN-LINKED", "DEVASTATING WOUNDS"]

export function keywordList(str) {
  return String(str ?? "")
    .split(",")
    .map(s => s.trim().toUpperCase())
    .filter(s => s && s !== "-");
}

// ── For Story B's dictionary (NOT used by the ingester) ─────────────────────
// parse a keyword string into { kw, on?, val?, vs? } after normalising
// separators. Provided here so Story B has a starting point.
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
