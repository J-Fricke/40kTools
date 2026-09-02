import { useState } from "react";
import { resolveBuild } from "../core/composableUnit.js";
import { C } from "./ui.jsx";

// ─── UNIT BUILDER ───────────────────────────────────────────────────────────
// Configure one unit from a composable family definition (base profile +
// wargear slots + choices per slot, see src/core/composableUnit.js).
//
// Two usage modes:
//  - Uncontrolled + `onAdd`: the component owns its own config state and
//    exposes an "Add" button that hands the caller a resolved, immutable
//    snapshot - for a compare-list style UI (Faction Unit Evaluator).
//  - Controlled via `value`/`onChange`: the caller owns {modelCount,
//    slotChoices} and re-renders live as it changes, no Add button - for a
//    single-live-instance UI (Fight Simulator's one-unit-per-side).
// Pass either `onAdd` or `value`+`onChange`, not both.
//
// `family.models` is {modelCount: basePts} sourced from OUR OWN MFM-verified
// data, not BSData - see project memory for why. `family.slots[].choices[]`
// carry their own weapon arrays (sWs/mWs) and an optional ptsDelta.
export default function UnitBuilder({ family, onAdd, value, onChange }) {
    const sizes = Object.keys(family.models).map(Number).sort((a, b) => a - b);
    const controlled = value != null && onChange != null;
    const [localState, setLocalState] = useState(() => ({ modelCount: sizes[0], slotChoices: {} }));
    const { modelCount, slotChoices } = controlled ? value : localState;
    const setState = patch => controlled ? onChange({ ...value, ...patch }) : setLocalState(prev => ({ ...prev, ...patch }));

    const setSlot = (slotId, choiceId, max) => {
        const cur = slotChoices[slotId] || [];
        let next;
        if (max === 1) next = cur[0] === choiceId ? [] : [choiceId];
        else if (cur.includes(choiceId)) next = cur.filter(id => id !== choiceId);
        else if (cur.length >= max) next = cur; // slot full
        else next = [...cur, choiceId];
        setState({ slotChoices: { ...slotChoices, [slotId]: next } });
    };

    const resolved = resolveBuild(family, { modelCount, slotChoices });
    const basePts = family.models[modelCount];
    const totalPts = basePts + resolved.ptsDelta;

    return (
        <div style={{ border: `1px solid ${C.bdr2}`, borderRadius: 5, background: C.bg2, padding: "10px 12px" }}>
            <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 8 }}>
                <span style={{ fontSize: 13, fontWeight: 700, color: C.tx }}>{family.unit}</span>
                {sizes.length > 1 && (
                    <label style={{ fontSize: 10, color: C.sub, display: "flex", alignItems: "center", gap: 5 }}>
                        Models
                        <select value={modelCount} onChange={e => setState({ modelCount: Number(e.target.value) })}
                            style={{ fontSize: 11, padding: "2px 4px", background: C.bg3, color: C.tx, border: `1px solid ${C.bdr2}`, borderRadius: 3 }}>
                            {sizes.map(m => <option key={m} value={m}>{m}</option>)}
                        </select>
                    </label>
                )}
                <span style={{ fontSize: 11, color: C.amb, fontWeight: 700, marginLeft: "auto" }}>{totalPts}pts</span>
            </div>

            {family.slots.length === 0 && <div style={{ fontSize: 10, color: C.vdim, marginBottom: 4 }}>Fixed loadout - no wargear options.</div>}
            {family.slots.map(slot => (
                <div key={slot.id} style={{ marginBottom: 8 }}>
                    <div style={{ fontSize: 9, color: C.dim, textTransform: "uppercase", marginBottom: 3 }}>
                        {slot.label} (pick {slot.pick.min === slot.pick.max ? slot.pick.max : `${slot.pick.min}-${slot.pick.max}`})
                    </div>
                    <div style={{ display: "flex", flexWrap: "wrap", gap: 4 }}>
                        {slot.choices.map(choice => {
                            const on = (slotChoices[slot.id] || []).includes(choice.id);
                            return (
                                <button key={choice.id} onClick={() => setSlot(slot.id, choice.id, slot.pick.max)}
                                    style={{
                                        fontSize: 10, padding: "3px 8px", borderRadius: 3, cursor: "pointer",
                                        border: `1px solid ${on ? C.pur : C.bdr2}`,
                                        background: on ? `${C.pur}22` : "transparent",
                                        color: on ? C.pur : C.sub,
                                    }}>
                                    {choice.label}{choice.ptsDelta ? ` (+${choice.ptsDelta}pt)` : ""}
                                </button>
                            );
                        })}
                    </div>
                </div>
            ))}

            {onAdd && (
                <button onClick={() => onAdd({ ...resolved, pts: totalPts, unit: family.unit, uid: family.uid })}
                    style={{ fontSize: 11, fontWeight: 700, padding: "5px 12px", borderRadius: 4, cursor: "pointer", border: `1px solid ${C.grn}`, background: `${C.grn}22`, color: C.grn, marginTop: 4 }}>
                    + Add to compare list
                </button>
            )}
        </div>
    );
}
