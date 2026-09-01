// ─── GW WEAPON KEYWORD → ENGINE TAG MAPPING ────────────────────────────────
// BSData's "Keywords" characteristic on a weapon profile is GW's own fixed,
// controlled vocabulary (the same handful of named abilities appear across
// every datasheet in the game) - so this is a lookup table, not a judgment
// call. What's NOT here: custom per-weapon named abilities with their own
// bespoke rule text (Grey Knights' "Conversion:", Force Edge, Guidance of
// the Ancients, Galatus Shield, etc.) - those aren't part of the standard
// keyword vocabulary and still need a human/LLM read of the actual ability
// text, same as we've been doing by hand all along.
//
// Two kinds of entries:
//  - `tag`: sets an engine.js weapon tag (see src/core/engine.js header comment)
//  - `shotMultiplier`: TORRENT needs shots × 6/5 to compensate for the engine's
//     hit-probability floor of 5/6 (see existing "torrent correction" comments
//     throughout src/factions/*.js) - applied to the shots value, not a tag.
//  - `noop: true` entries are real keywords with no calc effect in this engine
//     (positional/targeting rules) - listed explicitly so the importer can
//     silently drop them instead of flagging them as "unrecognized."
//
// Anything matched here is a plain string key; DEVASTATING WOUNDS variants
// with a qualifier (e.g. "Devastating Wounds: Monster/Vehicle only") are
// handled separately by matchKeyword's regex pass below.
// Resolves GW dice notation to its average value, same convention already
// used throughout src/factions/*.js comments (D6=3.5, D3=2, 2D6=7, D6+1=4.5,
// D6+3=6.5, D3+1=3, etc.) - shared here so Sustained Hits X isn't limited to
// whatever specific magnitudes happen to appear in the four factions' data
// today. X in "Sustained Hits X" is any value, not a fixed set of tiers.
export function diceAverage(text) {
    const plain = Number(text);
    if (!Number.isNaN(plain)) return plain;
    const m = text.match(/^(\d*)D(\d+)(?:\+(\d+))?$/i);
    if (!m) return null;
    const count = m[1] ? Number(m[1]) : 1;
    const die = Number(m[2]);
    const bonus = m[3] ? Number(m[3]) : 0;
    return count * (die + 1) / 2 + bonus;
}

export const KEYWORD_TAGS = {
    "Lethal Hits": { tag: "let" },
    "Devastating Wounds": { tag: "dev" },
    "Twin-linked": { tag: "tl" },
    "Twin-Linked": { tag: "tl" }, // GW's own text isn't consistently cased between datasheets
    "Torrent": { shotMultiplier: 6 / 5 },
    "Conversion": { tag: "conv", note: "Grey Knights conversion beamer ability - turns out to be a real Keywords entry, not just bespoke ability text" },
    "Lance": { tag: "w1", note: "charge-bonus approximation, matches existing Cerastus shock lance convention" },
    // Positional/targeting rules with no calc effect in this engine - explicit
    // noops so the importer doesn't flag them as unrecognized.
    "Ignores Cover": { noop: true },
    "Blast": { noop: true },
    "Heavy": { noop: true },
    "Assault": { noop: true },
    "Precision": { noop: true },
    "Indirect Fire": { noop: true },
    "Hazardous": { noop: true },
    "Psychic": { noop: true, note: "already treated as standard damage for calc purposes per existing convention" },
    "Pistol": { noop: true },
    "Extra Attacks": { noop: true, note: "handled per-unit via char.buffs, not a generic weapon tag" },
    "One Shot": { noop: true, note: "resource-limited (fires once/battle) - engine assumes every-round firing, not modeled, same class of simplification as Melta" },
};

// Regex-matched variants: ANTI-X N+ (any threshold), RAPID FIRE N, MELTA N,
// SUSTAINED HITS X (any magnitude - see diceAverage), DEVASTATING WOUNDS
// with a MONSTER/VEHICLE qualifier.
const REGEX_RULES = [
    { re: /^Anti-Infantry \d\+?$/i, tag: "ai" },
    { re: /^Anti-Vehicle \d\+?$/i, tag: "av3", note: "existing convention floors wound prob at 4/6 regardless of the real X+ threshold" },
    { re: /^Anti-Monster \d\+?$/i, tag: "am3", note: "existing convention floors wound prob at 4/6 regardless of the real X+ threshold" },
    { re: /^Sustained Hits (.+)$/i, tag: "sustained", value: m => diceAverage(m[1]) },
    { re: /^Rapid Fire (\d+)$/i, extraShots: m => Number(m[1]), note: "add N extra shots at half range - existing convention bakes this into the base shot count rather than a tag (see storm bolter comments)" },
    { re: /^Devastating Wounds:?\s*Monster\/Vehicle(?:\s*only)?$/i, tag: "devmv" },
    { re: /^Melta \d+$/i, noop: true, note: "bonus damage at half range - documented existing simplification, base D value used" },
    // GENUINE ENGINE GAP, not a parsing failure: the engine only special-cases
    // Infantry/Vehicle/Monster (via tgt.veh/tgt.mon/isInf), so ANTI-CHARACTER,
    // ANTI-DAEMON, ANTI-FLY etc. have nowhere to attach - the target profile
    // would need matching char/daemon/fly flags for these to mean anything.
    // Left unrecognized deliberately so the importer surfaces every occurrence
    // rather than silently dropping a real rule.
];

// parseKeywords: takes the raw "Keywords" characteristic text (comma-separated,
// as BSData stores it) and returns { tags, shotMultiplier, extraShots,
// unrecognized, source }.
// `unrecognized` is never silently dropped - the importer should surface these
// for a human to look at, per the "let's look at the actual data and maybe I
// can spot it" instruction rather than guessing.
// `source` maps each resolved tag back to the exact keyword string it came
// from, so the generated data stays auditable against the real rules text
// instead of the mapping being a black box once it's baked into a tag.
export function parseKeywords(keywordText) {
    const tags = {};
    const source = {};
    let shotMultiplier = 1, extraShots = 0;
    const unrecognized = [];
    if (!keywordText) return { tags, shotMultiplier, extraShots, unrecognized, source };

    for (let raw of keywordText.split(",")) {
        const kw = raw.trim();
        if (!kw) continue;
        if (KEYWORD_TAGS[kw]) {
            const entry = KEYWORD_TAGS[kw];
            if (entry.tag) { tags[entry.tag] = entry.value ?? 1; source[entry.tag] = kw; }
            if (entry.shotMultiplier) shotMultiplier *= entry.shotMultiplier;
            continue;
        }
        let matched = false;
        for (const rule of REGEX_RULES) {
            const m = kw.match(rule.re);
            if (!m) continue;
            matched = true;
            if (rule.tag) {
                const value = rule.value ? rule.value(m) : 1;
                if (value == null) { unrecognized.push(kw); break; } // e.g. dice notation diceAverage() couldn't parse
                tags[rule.tag] = value;
                source[rule.tag] = kw;
            }
            if (rule.extraShots) extraShots += rule.extraShots(m);
            break;
        }
        if (!matched) unrecognized.push(kw);
    }
    return { tags, shotMultiplier, extraShots, unrecognized, source };
}
