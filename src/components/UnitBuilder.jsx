import { useState } from "react";
import { resolveBuild } from "../core/composableUnit.js";
import { C } from "./ui.jsx";

// ─── UNIT BUILDER ───────────────────────────────────────────────────────────
// Configure one unit from a composable family definition (base profile +
// wargear slots + choices per slot, see src/core/composableUnit.js) and add
// the resolved result to a compare list - replaces picking from a pre-baked
// list of every loadout combination as a separate row.
//
// `family.models` is {modelCount: basePts} sourced from OUR OWN MFM-verified
// data, not BSData - see project memory for why. `family.slots[].choices[]`
// carry their own weapon arrays (sWs/mWs) and an optional ptsDelta.
export default function UnitBuilder({ family, onAdd }) {
    const sizes = Object.keys(family.models).map(Number).sort((a, b) => a - b);
    const [modelCount, setModelCount] = useState(sizes[0]);
    const [slotChoices, setSlotChoices] = useState({}); // slotId -> [choiceId,...]

    const setSlot = (slotId, choiceId, max) => {
        setSlotChoices(prev => {
            const cur = prev[slotId] || [];
            if (max === 1) return { ...prev, [slotId]: cur[0] === choiceId ? [] : [choiceId] };
            const has = cur.includes(choiceId);
            if (has) return { ...prev, [slotId]: cur.filter(id => id !== choiceId) };
            if (cur.length >= max) return prev; // slot full
            return { ...prev, [slotId]: [...cur, choiceId] };
        });
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
                        <select value={modelCount} onChange={e => setModelCount(Number(e.target.value))}
                            style={{ fontSize: 11, padding: "2px 4px", background: C.bg3, color: C.tx, border: `1px solid ${C.bdr2}`, borderRadius: 3 }}>
                            {sizes.map(m => <option key={m} value={m}>{m}</option>)}
                        </select>
                    </label>
                )}
                <span style={{ fontSize: 11, color: C.amb, fontWeight: 700, marginLeft: "auto" }}>{totalPts}pts</span>
            </div>

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

            <button onClick={() => onAdd({ ...resolved, pts: totalPts, unit: family.unit, uid: family.uid })}
                style={{ fontSize: 11, fontWeight: 700, padding: "5px 12px", borderRadius: 4, cursor: "pointer", border: `1px solid ${C.grn}`, background: `${C.grn}22`, color: C.grn, marginTop: 4 }}>
                + Add to compare list
            </button>
        </div>
    );
}
