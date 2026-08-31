// ─── SHARED UI PRIMITIVES ──────────────────────────────────────────────────────
// Color palette and small building blocks used across every tool in the suite,
// so the Faction Unit Evaluator, Fight Simulator, and future tools all look
// like one product instead of each inventing their own theme.
export const C = {
    bg: "#060e1c", bg2: "#0a1525", bg3: "#0d1f35", bdr: "#1e293b", bdr2: "#2d4266",
    tx: "#f1f5f9", sub: "#cbd5e1", dim: "#94a3b8", vdim: "#475569",
    amb: "#fbbf24", ambBg: "#78350f", bl: "#60a5fa", blBg: "#1e3a5f",
    grn: "#34d399", pur: "#c084fc"
};

export function heat(v, lo, hi) {
    if (hi === lo) return "transparent";
    const t = Math.max(0, Math.min(1, (v - lo) / (hi - lo)));
    if (t < .33) return `rgba(96,165,250,${.08 + t * .3})`;
    if (t < .66) return `rgba(251,191,36,${.1 + (t - .33) * .4})`;
    return `rgba(248,113,113,${.15 + (t - .66) * .6})`;
}

// A single collapsible row: click the header to expand/collapse, no separate
// button needed. Used at every nesting level that needs this (factions, unit
// groups within a faction, ...) so collapsing behaves identically everywhere
// in the suite rather than each level inventing its own variant.
export const CollapsibleRow = ({ isOpen, onToggle, header, children, indent = 16 }) => (
    <div style={{ borderBottom: `1px solid ${C.bdr}` }}>
        <div onClick={onToggle} style={{ display: "flex", alignItems: "center", gap: 6, padding: "5px 2px", cursor: "pointer" }}>
            <span style={{ fontSize: 9, color: C.vdim, width: 10, display: "inline-block", flexShrink: 0 }}>{isOpen ? "▼" : "▶"}</span>
            {header}
        </div>
        {isOpen && <div style={{ paddingLeft: indent }}>{children}</div>}
    </div>
);

export const Btn = ({ on, click, children, col, disabled }) => (
    <button onClick={click} disabled={disabled} style={{
        padding: "3px 8px", fontSize: 10, borderRadius: 3, border: "1px solid",
        cursor: disabled ? "not-allowed" : "pointer", opacity: disabled ? .5 : 1,
        borderColor: on ? (col || C.amb) : C.bdr, background: on ? `${col || C.amb}22` : "transparent",
        color: on ? (col || C.amb) : C.dim
    }}>{children}</button>
);
