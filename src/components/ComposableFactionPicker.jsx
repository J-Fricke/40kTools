import { useState } from "react";
import { COMPOSABLE } from "../core/composableRegistry.js";
import { C, CollapsibleRow } from "./ui.jsx";
import UnitBuilder from "./UnitBuilder.jsx";
import DetachmentPanel from "./DetachmentPanel.jsx";

// ─── COMPOSABLE FACTION PICKER ──────────────────────────────────────────────
// One faction's "browse units, configure, add to compare list" panel for the
// Faction Unit Evaluator - the Unit Builder equivalent of the old
// FactionConfigPanel, once FUE moved off the pre-baked-SKU visibility-toggle
// picker (see project memory / GitHub issue #5). Fight Simulator already
// uses UnitBuilder directly (controlled, one unit per side); FUE needs to
// browse MANY units and add configured instances to a growing list, so this
// keeps the old picker's "collapsible row per unit, expand to configure"
// browsing shape but drives each row's config through UnitBuilder + a
// per-uid draft, with its own "Add to compare list" action (not
// UnitBuilder's own onAdd, since FUE needs the RAW config - modelCount,
// slotChoices, charKey, activeDets, detOpts - not a pre-resolved snapshot,
// so the table can re-resolve a row if its underlying data ever changes).
//
// Detachment/stratagem selection is per-UNIT (part of each uid's own draft,
// captured into the compare-list entry on Add) rather than shared per
// faction - this is a theorycrafting/comparison tool, not a strict
// one-army-one-list builder, so comparing the SAME unit under different
// detachments (or different units each under their own) is a real, explicit
// use case, not an edge case to collapse away.
export default function ComposableFactionPicker({
    faction, fd,
    draftByUid, onSetDraft,
    onAdd,
    dpCap = 3,
}) {
    const uids = Object.keys(COMPOSABLE[faction] || {}).sort((a, b) =>
        COMPOSABLE[faction][a].unit.localeCompare(COMPOSABLE[faction][b].unit));
    const [expanded, setExpanded] = useState(() => new Set());
    const toggleExpanded = uid => setExpanded(p => { const n = new Set(p); n.has(uid) ? n.delete(uid) : n.add(uid); return n; });

    const toggleInSet = (set, item) => { const n = new Set(set); n.has(item) ? n.delete(item) : n.add(item); return n; };

    return (
        <>
            <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 6 }}>
                <span style={{ fontSize: 9, color: C.vdim }}>{uids.length} units</span>
                <div style={{ marginLeft: "auto", display: "flex", gap: 4 }}>
                    <button onClick={() => setExpanded(new Set(uids))}
                        style={{ fontSize: 9, background: "none", border: `1px solid ${C.bdr2}`, color: C.dim, cursor: "pointer", padding: "1px 6px", borderRadius: 3 }}>Expand all</button>
                    <button onClick={() => setExpanded(new Set())}
                        style={{ fontSize: 9, background: "none", border: `1px solid ${C.bdr2}`, color: C.dim, cursor: "pointer", padding: "1px 6px", borderRadius: 3 }}>Collapse all</button>
                </div>
            </div>

            <div className="scroll-visible" style={{ display: "flex", flexDirection: "column", gap: 2, marginBottom: 8, maxHeight: 340, overflowY: "auto", paddingRight: 4 }}>
                {uids.map(uid => {
                    const family = COMPOSABLE[faction][uid];
                    const col = fd.uc[uid] || C.dim;
                    const isOpen = expanded.has(uid);
                    const sizes = Object.keys(family.models).map(Number).sort((a, b) => a - b);
                    const draft = draftByUid[uid] || { modelCount: sizes[0], slotChoices: {}, charKey: "none", activeDets: new Set(), detOpts: {} };
                    const activeDets = draft.activeDets || new Set();
                    const dpSpent = [...activeDets].reduce((a, id) => { const d = fd.dets.find(d => d.id === id); return a + (d ? d.dp : 0); }, 0);

                    return (
                        <CollapsibleRow key={uid} isOpen={isOpen} onToggle={() => toggleExpanded(uid)} indent={20}
                            header={<>
                                <span style={{ fontSize: 11, fontWeight: 700, color: col }}>{family.unit}</span>
                                <span style={{ fontSize: 9, color: C.vdim, marginLeft: "auto" }}>{family.slots.length === 0 ? "fixed loadout" : `${family.slots.length} slot${family.slots.length > 1 ? "s" : ""}`}</span>
                                {dpSpent > 0 && <span style={{ fontSize: 9, background: C.amb, color: C.bg, borderRadius: 3, padding: "0 4px" }}>{dpSpent}DP</span>}
                            </>}>
                            <UnitBuilder family={family}
                                value={{ modelCount: draft.modelCount ?? sizes[0], slotChoices: draft.slotChoices || {} }}
                                onChange={v => onSetDraft(uid, { ...draft, ...v })} />

                            {family.chars && family.chars.length > 1 && (
                                <div style={{ marginTop: 8, display: "flex", flexWrap: "wrap", gap: 3 }}>
                                    {family.chars.map(ck => {
                                        const ch = fd.chars[ck]; if (!ch) return null;
                                        const on = (draft.charKey || "none") === ck;
                                        return (
                                            <button key={ck} onClick={() => onSetDraft(uid, { ...draft, charKey: ck })}
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

                            <div style={{ marginTop: 8 }}>
                                <DetachmentPanel dets={fd.dets} activeDets={activeDets}
                                    onToggleDet={detId => onSetDraft(uid, { ...draft, activeDets: toggleInSet(activeDets, detId) })}
                                    onClearDets={() => onSetDraft(uid, { ...draft, activeDets: new Set() })}
                                    dpCap={dpCap} detOpts={draft.detOpts || {}}
                                    onSetDetOpt={(detId, optKey) => onSetDraft(uid, { ...draft, detOpts: { ...(draft.detOpts || {}), [detId]: optKey } })} />
                            </div>

                            <button onClick={() => onAdd(uid, { modelCount: draft.modelCount ?? sizes[0], slotChoices: draft.slotChoices || {}, charKey: draft.charKey || "none", activeDets, detOpts: draft.detOpts || {} })}
                                style={{ fontSize: 11, fontWeight: 700, padding: "5px 12px", borderRadius: 4, cursor: "pointer", border: `1px solid ${C.grn}`, background: `${C.grn}22`, color: C.grn, marginTop: 8 }}>
                                + Add to compare list
                            </button>
                        </CollapsibleRow>
                    );
                })}
            </div>
        </>
    );
}
