#!/usr/bin/env node
// ─── COLOR CONTRAST CHECKER ─────────────────────────────────────────────────
// Reusable WCAG relative-luminance contrast checker for this app's dark
// theme. Grew out of a real bug hunt (2026-09-02): several colors "looked
// fine" during development but were unreadable in practice, and it took an
// actual contrast calculation (not eyeballing) to find and fix them
// correctly - see scripts/design/COLOR_GUIDELINES.md for what was learned.
//
// Usage:
//   node scripts/design/checkContrast.mjs                    - audit every
//     faction's UC (unit color) export against src/components/ui.jsx's C.bg/
//     C.bg2, reporting any color under the 4.5:1 threshold.
//   node scripts/design/checkContrast.mjs '#hex1' '#hex2'     - print the
//     contrast ratio between two specific colors (e.g. checking a new color
//     against a specific background before adding it).
import { readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";

export function hexToRgb(hex) {
    hex = hex.replace("#", "");
    return [0, 2, 4].map(i => parseInt(hex.slice(i, i + 2), 16));
}
export function relLuminance([r, g, b]) {
    const f = c => { c /= 255; return c <= 0.03928 ? c / 12.92 : Math.pow((c + 0.055) / 1.055, 2.4); };
    return 0.2126 * f(r) + 0.7152 * f(g) + 0.0722 * f(b);
}
export function contrastRatio(hex1, hex2) {
    const l1 = relLuminance(hexToRgb(hex1)), l2 = relLuminance(hexToRgb(hex2));
    const [lighter, darker] = l1 > l2 ? [l1, l2] : [l2, l1];
    return (lighter + 0.05) / (darker + 0.05);
}

const TARGET = 4.5; // WCAG AA, normal text - use 3.0 only for large/bold-only text

const args = process.argv.slice(2);
if (args.length === 2) {
    const [a, b] = args;
    console.log(`${a} vs ${b}: ${contrastRatio(a, b).toFixed(2)}:1 ${contrastRatio(a, b) >= TARGET ? "PASS" : "FAIL"} (target ${TARGET}:1)`);
    process.exit(0);
}

// Default mode: audit every faction's UC export.
const ROOT = fileURLToPath(new URL("../../src/", import.meta.url));
const uiText = readFileSync(ROOT + "components/ui.jsx", "utf8");
const bg = uiText.match(/bg:\s*"(#[0-9a-fA-F]{6})"/)[1];
const bg2 = uiText.match(/bg2:\s*"(#[0-9a-fA-F]{6})"/)[1];

const factions = ["chaosknights", "custodes", "greyknights", "votann"];
let fails = 0, total = 0;
for (const f of factions) {
    const text = readFileSync(ROOT + `factions/${f}.js`, "utf8");
    const ucMatch = text.match(/export const UC = \{([\s\S]*?)\};/);
    if (!ucMatch) continue;
    for (const [, uid, hex] of ucMatch[1].matchAll(/(\w+):\s*"(#[0-9a-fA-F]{6})"/g)) {
        total++;
        const worst = Math.min(contrastRatio(hex, bg), contrastRatio(hex, bg2));
        if (worst < TARGET) { console.log(`FAIL  ${f}/${uid} ${hex} - ${worst.toFixed(2)}:1`); fails++; }
    }
}
console.log(`\n${total - fails}/${total} pass (${TARGET}:1 target) against C.bg/C.bg2.`);
if (fails) process.exitCode = 1;
