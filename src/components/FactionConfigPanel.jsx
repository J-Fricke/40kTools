import { useState } from "react";
import { C, CollapsibleRow } from "./ui.jsx";
import DetachmentPanel from "./DetachmentPanel.jsx";

// ─── FACTION CONFIG PANEL ──────────────────────────────────────────────────────
// One faction's unit/character/detachment configuration, as a single reusable
// piece. Used by the Faction Unit Evaluator once per faction currently in view
// (usually 0-2 at a time, since FUE defaults to nothing visible), and by the
// Fight Simulator exactly twice (Side A / Side B, each independent).
//
// `singleSelect` switches the unit picker between checkboxes (FUE: many units
// visible at once) and radio-style single selection (Fight Simulator: exactly
// one unit per side). Everything else - character attachment, detachment
// toggles, stratagem/option display - works the same either way.
//
// This component owns no state itself beyond the DP-cap check on detachment
// toggling; all selections are controlled via props so callers can persist
// them however they like (see usePersistedState).
export default function FactionConfigPanel({
    faction, fd, singleSelect = false, bare = false,
    visibleIds, onToggleVisible, onToggleUidGroup,
    charSel, onToggleChar,
    activeDets, onToggleDet, onClearDets, dpCap = 3,
    detOpts, onSetDetOpt,
}) {
    const { units: UNITS, chars: CHARS, dets: DETACHMENTS, uc: UC, label } = fd;
    const uids = [...new Set(UNITS.map(u => u.uid))];

    // Groups start expanded only if they already have a selection - otherwise
    // collapsed, so the list reads as a compact, scannable index of every unit
    // in the faction rather than a wall of always-open loadout detail.
    const [expanded, setExpanded] = useState(() =>
        new Set(uids.filter(uid => UNITS.some(u => u.uid === uid && visibleIds.has(u.id))))
    );
    const toggleExpanded = uid => setExpanded(p => { const n = new Set(p); n.has(uid) ? n.delete(uid) : n.add(uid); return n; });

    const content = (
        <>
            <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 6 }}>
                {!bare && <span style={{ fontSize: 11, fontWeight: 700, color: C.tx }}>{label}</span>}
                <span style={{ fontSize: 9, color: C.vdim }}>{uids.length} units</span>
                <div style={{ marginLeft: "auto", display: "flex", gap: 4 }}>
                    <button onClick={() => setExpanded(new Set(uids))}
                        style={{ fontSize: 9, background: "none", border: `1px solid ${C.bdr2}`, color: C.dim, cursor: "pointer", padding: "1px 6px", borderRadius: 3 }}>Expand all</button>
                    <button onClick={() => setExpanded(new Set())}
                        style={{ fontSize: 9, background: "none", border: `1px solid ${C.bdr2}`, color: C.dim, cursor: "pointer", padding: "1px 6px", borderRadius: 3 }}>Collapse all</button>
                </div>
            </div>

            {/* ── Units + Characters: vertical, collapsible per unit group ── */}
            <div className="scroll-visible" style={{ display: "flex", flexDirection: "column", gap: 2, marginBottom: 8, maxHeight: 260, overflowY: "auto", paddingRight: 4 }}>
                {uids.map(uid => {
                    const ul = UNITS.filter(u => u.uid === uid), col = UC[uid] || C.dim;
                    const allV = ul.every(u => visibleIds.has(u.id)), someV = ul.some(u => visibleIds.has(u.id));
                    const isOpen = expanded.has(uid);
                    return (
                        <CollapsibleRow key={uid} isOpen={isOpen} onToggle={() => toggleExpanded(uid)} indent={20}
                            header={<>
                                {!singleSelect && (
                                    <input type="checkbox" checked={allV} ref={el => { if (el) el.indeterminate = !allV && someV; }}
                                        onClick={e => e.stopPropagation()} onChange={() => onToggleUidGroup(uid)} style={{ accentColor: col }} />
                                )}
                                <span style={{ fontSize: 11, fontWeight: 700, color: someV ? col : C.sub }}>{ul[0].unit}</span>
                                <span style={{ fontSize: 9, color: C.vdim, marginLeft: "auto" }}>{ul.length} loadout{ul.length > 1 ? "s" : ""}{someV ? " · selected" : ""}</span>
                            </>}>
                            {ul.map(u => {
                                const sel = charSel[u.id] || new Set(["none"]);
                                const hasChars = u.chars && u.chars.length > 1;
                                const isVisible = visibleIds.has(u.id);
                                return (
                                    <div key={u.id} style={{ marginBottom: 4 }}>
                                        <label style={{ display: "flex", alignItems: "center", gap: 5, cursor: "pointer" }}>
                                            <input type={singleSelect ? "radio" : "checkbox"} name={singleSelect ? `${faction}-unit` : undefined}
                                                checked={isVisible} onChange={() => onToggleVisible(u.id)}
                                                style={{ accentColor: col, width: 11, height: 11 }} />
                                            <span style={{ fontSize: 10, color: isVisible ? C.sub : C.dim }}>
                                                {u.label}
                                                <span style={{ color: C.vdim }}> {u.pts}pt</span>
                                            </span>
                                        </label>
                                        {hasChars && isVisible && (
                                            <div style={{ paddingLeft: 16, marginTop: 2, display: "flex", flexWrap: "wrap", gap: 3 }}>
                                                {u.chars.map(ck => {
                                                    const ch = CHARS[ck]; if (!ch) return null;
                                                    const on = sel.has(ck);
                                                    return (
                                                        <button key={ck} onClick={() => onToggleChar(u.id, ck, singleSelect)}
                                                            style={{
                                                                fontSize: 9, padding: "2px 6px", borderRadius: 3, cursor: "pointer",
                                                                border: `1px solid ${on ? C.pur : C.bdr2}`,
                                                                background: on ? `${C.pur}22` : "transparent",
                                                                color: on ? C.pur : C.vdim
                                                            }}>
                                                            {ck === "none" ? "Base" : `+${ch.name}${ch.pts > 0 ? ` (${ch.pts}pt)` : ""}`}
                                                        </button>
                                                    );
                                                })}
                                            </div>
                                        )}
                                    </div>
                                );
                            })}
                        </CollapsibleRow>
                    );
                })}
            </div>

            {/* ── Detachments ── */}
            <DetachmentPanel dets={DETACHMENTS} activeDets={activeDets} onToggleDet={onToggleDet}
                onClearDets={onClearDets} dpCap={dpCap} detOpts={detOpts} onSetDetOpt={onSetDetOpt} />
        </>
    );

    if (bare) return content;
    return (
        <div style={{ border: `1px solid ${C.bdr2}`, borderRadius: 5, background: C.bg2, padding: "8px 10px", minWidth: 280, flex: "1 1 320px" }}>
            {content}
        </div>
    );
}
