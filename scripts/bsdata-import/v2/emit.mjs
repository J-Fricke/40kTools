// ─── DETERMINISTIC EMIT + ID HELPERS (Story A / task A1) ────────────────────
import { writeFileSync, mkdirSync } from "fs";
import { dirname } from "path";

// slug: lowercase, non-alphanumeric runs -> "-", trim "-".
export function slug(str) {
  return String(str).toLowerCase().normalize("NFKD").replace(/[^a-z0-9]+/g, "-").replace(/^-+|-+$/g, "");
}

// uniqueId(base, taken:Set) -> base, base-2, base-3, ... ; mutates `taken`.
export function uniqueId(base, taken) {
  let id = base || "x", n = 1;
  while (taken.has(id)) id = `${base}-${++n}`;
  taken.add(id);
  return id;
}

// Recursively sort object keys so serialisation is stable regardless of
// insertion order (arrays keep their order — callers sort the arrays that
// need it, e.g. `units`, `keywords`).
function sortKeys(v) {
  if (Array.isArray(v)) return v.map(sortKeys);
  if (v && typeof v === "object") {
    const out = {};
    for (const k of Object.keys(v).sort()) out[k] = sortKeys(v[k]);
    return out;
  }
  return v;
}

// writeJson: 2-space indent, sorted keys, trailing newline. Byte-identical
// for equal input.
export function writeJson(path, obj) {
  mkdirSync(dirname(path), { recursive: true });
  writeFileSync(path, JSON.stringify(sortKeys(obj), null, 2) + "\n");
}

export function stableStringify(obj) {
  return JSON.stringify(sortKeys(obj), null, 2) + "\n";
}
