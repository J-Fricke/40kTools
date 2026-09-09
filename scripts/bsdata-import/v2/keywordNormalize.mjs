// ─── WEAPON KEYWORD NORMALIZER (Story A / task A3) ──────────────────────────
// Canonicalises the string only — it does NOT know what a keyword does
// (that's Story B's dictionary). P1 found 157 raw strings that collapse to
// ~40 real keywords; the mess is casing / separators / Ork ALL-CAPS /
// `: qualifier` conditionals.
//
// normalizeKeyword("Anti-Fly 4+")            -> { kw: "anti fly", on: 4 }
// normalizeKeyword("SUSTAINED HITS 2")        -> { kw: "sustained hits", val: "2" }
// normalizeKeyword("Sustained Hits D3")       -> { kw: "sustained hits", val: "d3" }
// normalizeKeyword("Lethal Hits: non-MONSTER/VEHICLE")
//                                             -> { kw: "lethal hits", vs: "non monster/vehicle" }
// normalizeKeyword("Twin-linked")             -> { kw: "twin linked" }
// normalizeKeyword("Rapid Fire 1")            -> { kw: "rapid fire", val: "1" }

const canonSep = s => s.toLowerCase().replace(/[‐-―\-\s]+/g, " ").trim();

export function normalizeKeyword(raw) {
  let s = String(raw ?? "").trim();
  if (!s || s === "-") return null;

  // split the ": target qualifier" tail first
  let vs;
  const colon = s.split(/\s*:\s*/);
  if (colon.length > 1) { s = colon[0]; vs = canonSep(colon.slice(1).join(":")).replace(/\bnon /g, "non "); }

  s = canonSep(s);

  // trailing rated threshold "N+"  (Anti-X, some others)
  let on;
  let m = s.match(/^(.*?)\s+(\d+)\s*\+$/);
  if (m) { s = m[1]; on = Number(m[2]); }

  // trailing magnitude: a bare integer or a dice expr (Rapid Fire N, Sustained
  // Hits N/DN, Melta N, Blast N, Cleave N). Kept as a raw string — Story B
  // resolves DN to an average.
  let val;
  m = s.match(/^(.*?)\s+(\d+|d\d+(?:\s*\+\s*\d+)?)$/);
  if (m) { s = m[1]; val = m[2].replace(/\s+/g, ""); }

  const out = { kw: s.trim() };
  if (on != null) out.on = on;
  if (val != null) out.val = val;
  if (vs != null) out.vs = vs;
  return out;
}

// Split a BSData `Keywords` characteristic string into normalized keywords.
export function normalizeKeywordString(str) {
  return String(str ?? "")
    .split(",")
    .map(s => s.trim())
    .filter(Boolean)
    .map(normalizeKeyword)
    .filter(Boolean);
}

// A canonical display string for a normalized keyword (for the sync report /
// coverage checks in Story B).
export function keywordKey(k) {
  return k.kw + (k.val != null ? ` ${k.val}` : "") + (k.on != null ? ` ${k.on}+` : "") + (k.vs != null ? `: ${k.vs}` : "");
}
