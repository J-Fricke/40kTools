import { CHARS as V_CHARS, UNITS as V_UNITS, DETACHMENTS as V_DETS, UC as V_UC, DEFENSE as V_DEF } from "../factions/votann.js";
import { CHARS as C_CHARS, UNITS as C_UNITS, DETACHMENTS as C_DETS, UC as C_UC, DEFENSE as C_DEF } from "../factions/custodes.js";
import { CHARS as GK_CHARS, UNITS as GK_UNITS, DETACHMENTS as GK_DETS, UC as GK_UC, DEFENSE as GK_DEF } from "../factions/greyknights.js";
import { CHARS as CK_CHARS, UNITS as CK_UNITS, DETACHMENTS as CK_DETS, UC as CK_UC, DEFENSE as CK_DEF } from "../factions/chaosknights.js";

// ─── FACTION REGISTRY ───────────────────────────────────────────────────────
// Shared by every tool in the suite - the Faction Unit Evaluator and Fight
// Simulator both need "all four factions' data at once" rather than one
// faction loaded at a time, so this lives here instead of inside either tool.
export const FACTIONS = {
    votann:       { label: "Leagues of Votann", units: V_UNITS,  chars: V_CHARS,  dets: V_DETS,  uc: V_UC,  defense: V_DEF },
    custodes:     { label: "Adeptus Custodes",  units: C_UNITS,  chars: C_CHARS,  dets: C_DETS,  uc: C_UC,  defense: C_DEF },
    greyknights:  { label: "Grey Knights",      units: GK_UNITS, chars: GK_CHARS, dets: GK_DETS, uc: GK_UC, defense: GK_DEF },
    chaosknights: { label: "Chaos Knights",     units: CK_UNITS, chars: CK_CHARS, dets: CK_DETS, uc: CK_UC, defense: CK_DEF },
};
export const FACTION_KEYS = Object.keys(FACTIONS);
