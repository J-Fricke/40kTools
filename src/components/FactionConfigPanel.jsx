import { useState } from "react";
import { C, CollapsibleRow } from "./ui.jsx";

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
    const dpSpent = [...activeDets].reduce((a, id) => {
        const d = DETACHMENTS.find(d => d.id === id); return a + (d ? d.dp : 0);
    }, 0);

    const toggleDet = id => {
        const det = DETACHMENTS.find(d => d.id === id); if (!det) return;
        if (activeDets.has(id) || dpSpent + det.dp <= dpCap) onToggleDet(id);
    };

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
            <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 5 }}>
                <span style={{ fontSize: 9, color: C.dim, textTransform: "uppercase" }}>Detachment Points</span>
                <span style={{ fontSize: 9, color: dpSpent === dpCap ? C.amb : C.dim }}>{dpSpent}/{dpCap} DP</span>
                {dpSpent > 0 && <button onClick={onClearDets}
                    style={{ fontSize: 9, background: "none", border: `1px solid ${C.bdr2}`, color: C.dim, cursor: "pointer", padding: "1px 6px", borderRadius: 3 }}>Clear</button>}
            </div>
            <div style={{ display: "flex", flexWrap: "wrap", gap: 6 }}>
                {DETACHMENTS.map(det => {
                    const active = activeDets.has(det.id);
                    const canAdd = !active && (dpSpent + det.dp <= dpCap);
                    const disabled = !active && !canAdd;
                    return (
                        <div key={det.id} onClick={() => !disabled && toggleDet(det.id)}
                            style={{
                                cursor: disabled ? "not-allowed" : "pointer", border: `1px solid ${active ? C.amb : disabled ? C.bdr : C.bdr2}`,
                                borderRadius: 4, padding: "5px 8px", background: active ? C.ambBg : C.bg3, opacity: disabled ? 0.4 : 1, minWidth: 160, maxWidth: 240
                            }}>
                            <div style={{ display: "flex", alignItems: "center", gap: 5, marginBottom: 2 }}>
                                <span style={{ fontSize: 9, background: active ? C.amb : C.bdr2, color: active ? C.bg : C.sub, borderRadius: 2, padding: "1px 4px", fontWeight: 700 }}>{det.dp}DP</span>
                                <span style={{ fontSize: 10, fontWeight: 700, color: active ? C.amb : C.tx }}>{det.name}</span>
                                {(det.affects || det.options || det.stratagems) && <span style={{ fontSize: 8, color: C.grn, marginLeft: "auto" }}>+calc</span>}
                            </div>
                            <div style={{ fontSize: 8, color: C.vdim, marginBottom: 2, letterSpacing: ".05em", textTransform: "uppercase" }}>{det.disp}</div>
                            <div style={{ fontSize: 9, color: C.vdim, lineHeight: 1.3 }}>{det.desc}</div>
                            {det.options && active && (
                                <div onClick={e => e.stopPropagation()} style={{ marginTop: 5, display: "flex", gap: 3 }}>
                                    {det.options.map(opt => {
                                        const sel = (detOpts[det.id] || det.options[0].key) === opt.key;
                                        return (
                                            <button key={opt.key} onClick={() => onSetDetOpt(det.id, opt.key)}
                                                style={{
                                                    fontSize: 8, padding: "2px 6px", borderRadius: 2, cursor: "pointer",
                                                    border: `1px solid ${sel ? C.grn : C.bdr2}`,
                                                    background: sel ? `${C.grn}22` : "transparent",
                                                    color: sel ? C.grn : C.vdim
                                                }}>
                                                {opt.label}
                                            </button>
                                        );
                                    })}
                                </div>
                            )}
                            {det.stratagems && active && (
                                <div style={{ marginTop: 6, display: "flex", flexDirection: "column", gap: 3 }}>
                                    {det.stratagems.map(strat => (
                                        <div key={strat.key} title={strat.desc}
                                            style={{
                                                fontSize: 11, fontWeight: 700, padding: "3px 7px", borderRadius: 3,
                                                border: `1.5px solid ${C.pur}`, background: `${C.pur}33`, color: "#fff"
                                            }}>
                                            ✓ STRAT ACTIVE: {strat.name} ({strat.cp}CP, always used)
                                        </div>
                                    ))}
                                </div>
                            )}
                        </div>
                    );
                })}
            </div>
        </>
    );

    if (bare) return content;
    return (
        <div style={{ border: `1px solid ${C.bdr2}`, borderRadius: 5, background: C.bg2, padding: "8px 10px", minWidth: 280, flex: "1 1 320px" }}>
            {content}
        </div>
    );
}
