import { parseKeywords } from "./keywordMap.mjs";

// Converts one BSData weapon profile (the raw characteristics array) into
// this app's engine.js weapon-array format: [shots, skill, S, AP, D, tags].
// `shots` and `skill` are left as their BSData string form here (e.g. "D6",
// "N/A") for the caller to resolve against known D-average conventions
// (D6=3.5 etc, matching the comments already used throughout src/factions/*.js)
// since that resolution is shared, non-keyword logic, not specific to this
// converter.
export function profileToWeapon(profile) {
    const char = name => (profile.characteristics.find(c => c.name === name) || {})["$text"];
    const isMelee = profile.typeName === "Melee Weapons";
    const rawShots = char("A");
    const skillRaw = isMelee ? char("WS") : char("BS");
    const s = Number(char("S"));
    const ap = Number(char("AP"));
    const dRaw = char("D");
    const { tags, shotMultiplier, extraShots, unrecognized } = parseKeywords(char("Keywords"));
    return {
        name: profile.name, isMelee,
        rawShots, skillRaw, s, ap, dRaw,
        shotMultiplier, extraShots, tags, unrecognized,
    };
}
