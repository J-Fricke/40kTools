import { C } from "./ui.jsx";

// ─── DETACHMENT PANEL ───────────────────────────────────────────────────────
// One faction's detachment/stratagem picker, extracted out of
// FactionConfigPanel so it can pair with something other than the old
// pre-baked-SKU unit picker - e.g. UnitBuilder, which handles unit/wargear
// selection on its own and still needs a detachment picker alongside it.
export default function DetachmentPanel({ dets, activeDets, onToggleDet, onClearDets, dpCap = 3, detOpts, onSetDetOpt }) {
    const dpSpent = [...activeDets].reduce((a, id) => {
        const d = dets.find(d => d.id === id); return a + (d ? d.dp : 0);
    }, 0);
    const toggleDet = id => {
        const det = dets.find(d => d.id === id); if (!det) return;
        if (activeDets.has(id) || dpSpent + det.dp <= dpCap) onToggleDet(id);
    };

    return (
        <div>
            <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 5 }}>
                <span style={{ fontSize: 9, color: C.dim, textTransform: "uppercase" }}>Detachment Points</span>
                <span style={{ fontSize: 9, color: dpSpent === dpCap ? C.amb : C.dim }}>{dpSpent}/{dpCap} DP</span>
                {dpSpent > 0 && <button onClick={onClearDets}
                    style={{ fontSize: 9, background: "none", border: `1px solid ${C.bdr2}`, color: C.dim, cursor: "pointer", padding: "1px 6px", borderRadius: 3 }}>Clear</button>}
            </div>
            <div style={{ display: "flex", flexWrap: "wrap", gap: 6 }}>
                {dets.map(det => {
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
        </div>
    );
}
