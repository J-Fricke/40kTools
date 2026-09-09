// ─── PER-UNIT / PER-WEAPON OVERRIDES (Story A / task A6, A8) ─────────────────
// Applied AFTER the ingester builds a UnitRecord, keyed by record `id`
// (`<faction>/<slug>`). Each entry is a deep-merge patch and MUST carry a
// comment citing the datasheet / the reason. This is the exception, not a
// parallel dataset — for cases where BSData is wrong, stale, or missing data
// (parent-plan R9), or the P1 "no stats" units.
//
// Shape: { "<id>": { patch: { ...partial UnitRecord... }, why: "..." } }

export const OVERRIDES = {
  // Populated during A8 as the sync report is worked to clean.
  // e.g.
  // "greyknights/land-raider-redeemer": {
  //   why: "BSData has no twin flamestorm cannon profile (issue #3); values from ref/greyknights-10th-datasheets.txt",
  //   patch: { weapons: [ ... ] },
  // },
};

function deepMerge(base, patch) {
  if (Array.isArray(patch)) return patch;
  if (patch && typeof patch === "object") {
    const out = { ...base };
    for (const k of Object.keys(patch)) out[k] = deepMerge(base?.[k], patch[k]);
    return out;
  }
  return patch;
}

export function applyOverride(record) {
  const o = OVERRIDES[record.id];
  if (!o) return record;
  const merged = deepMerge(record, o.patch);
  merged.overridden = Object.keys(o.patch);
  return merged;
}
