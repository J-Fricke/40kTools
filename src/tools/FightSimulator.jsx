import { useMemo, useEffect } from "react";
import { calcWs } from "../core/engine.js";
import { FACTIONS, FACTION_KEYS } from "../core/registry.js";
import { COMPOSABLE } from "../core/composableRegistry.js";
import { resolveBuild } from "../core/composableUnit.js";
import { buildCombo } from "../core/combo.js";
import { getDetBuff, applyBuff } from "../core/buffs.js";
import { usePersistedState, serializeWithSets, deserializeWithSets } from "../hooks/usePersistedState.js";
import { C, Btn } from "../components/ui.jsx";
import UnitBuilder from "../components/UnitBuilder.jsx";
import DetachmentPanel from "../components/DetachmentPanel.jsx";

// Each faction module now exports DEFENSE (per-uid Toughness/Vehicle/Monster,
// sourced from the real datasheets in ref/) - see the DEFENSE export at the
// top of each src/factions/*.js file. This lets a unit act as a TARGET, which
// nothing before Fight Simulator ever needed.
const emptySide = faction => ({
    faction, uid: null, modelCount: null, slotChoices: {}, charKey: "none",
    activeDets: new Set(), detOpts: {}, yp: true,
});

const DEFAULT_STATE = {
    sideA: emptySide("greyknights"),
    sideB: emptySide("custodes"),
    inclShoot: true,
    inclMelee: true,
};

const toggleInSet = (set, item) => { const n = new Set(set); n.has(item) ? n.delete(item) : n.add(item); return n; };

function resolveSide(side, { inclShoot, inclMelee }) {
    const fd = FACTIONS[side.faction];
    const family = side.uid ? COMPOSABLE[side.faction][side.uid] : null;
    if (!family || !side.modelCount) return null;

    const built = resolveBuildSafe(family, side.modelCount, side.slotChoices);
    const basePts = family.models[side.modelCount] ?? 0;
    // buildCombo() expects a plain unit-shaped object (pts/W/sv/inv/fnp/sWs/mWs/m) -
    // the composable build result already matches that shape once pts is resolved
    // from a delta to an absolute value, so character attachment reuses the exact
    // same logic the Faction Unit Evaluator uses, unchanged.
    const asUnit = { pts: basePts + built.ptsDelta, W: built.W, sv: built.sv, inv: built.inv, fnp: built.fnp, sWs: built.sWs, mWs: built.mWs, m: side.modelCount, uid: side.uid };
    const char = fd.chars[side.charKey] || fd.chars.none;
    const combo = buildCombo(asUnit, char);
    const buff = getDetBuff(asUnit, side.charKey, { activeDets: side.activeDets, detOpts: side.detOpts, DETACHMENTS: fd.dets });
    // Yield Points (Votann's army rule) is per-side, not assumed - see the
    // YP toggle below and GitHub issue #12.
    const bh = (side.faction === "votann" && side.yp !== false) ? 1 : 0;
    const unitBh = bh + buff.bhBonus;
    const sWs = inclShoot ? applyBuff(combo.sWs, buff, true) : null;
    const mWs = inclMelee ? applyBuff(combo.mWs, buff, false) : null;
    const pts = combo.pts + buff.enhancementPts;
    const totalWounds = side.modelCount * combo.W;
    const def = fd.defense[side.uid] || { T: 6, veh: false, mon: false };
    const target = { T: def.T, sv: combo.sv, inv: combo.inv, fnp: combo.fnp, veh: def.veh, mon: def.mon };
    const keyword = def.veh ? "Vehicle" : def.mon ? "Monster" : "Infantry";
    return { combo, buff, unitBh, sWs, mWs, pts, totalWounds, target, def, keyword, label: `${family.unit}${char.name !== "None" ? ` +${char.name}` : ""}` };
}

// resolveBuild expects slotChoices with only valid slot ids for THIS family -
// guards against a stale slotChoices object left over from a different unit
// (e.g. right after switching which unit is selected).
function resolveBuildSafe(family, modelCount, slotChoices) {
    const validIds = new Set(family.slots.map(s => s.id));
    const cleaned = {};
    for (const [k, v] of Object.entries(slotChoices || {})) if (validIds.has(k)) cleaned[k] = v;
    return resolveBuild(family, { modelCount, slotChoices: cleaned });
}

function dmgPerRound(attacker, defenderTarget, bh) {
    const s = attacker.sWs ? calcWs(attacker.sWs, defenderTarget, bh) : 0;
    const m = attacker.mWs ? calcWs(attacker.mWs, defenderTarget, bh) : 0;
    return s + m;
}

function SidePanel({ label, side, onChange, dpCap = 3 }) {
    const fd = FACTIONS[side.faction];
    const family = side.uid ? COMPOSABLE[side.faction][side.uid] : null;
    const setSide = patch => onChange({ ...side, ...patch });
    const uidOptions = Object.keys(COMPOSABLE[side.faction]).sort((a, b) =>
        COMPOSABLE[side.faction][a].unit.localeCompare(COMPOSABLE[side.faction][b].unit));

    return (
        <div style={{ flex: "1 1 380px", minWidth: 320 }}>
            <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 6, flexWrap: "wrap" }}>
                <span style={{ fontSize: 12, fontWeight: 900, color: C.tx }}>{label}</span>
                <select value={side.faction} onChange={e => onChange(emptySide(e.target.value))}
                    style={{ fontSize: 11, padding: "2px 6px", background: C.bg3, color: C.tx, border: `1px solid ${C.bdr2}`, borderRadius: 3, cursor: "pointer" }}>
                    {FACTION_KEYS.map(f => <option key={f} value={f}>{FACTIONS[f].label}</option>)}
                </select>
                <select value={side.uid || ""} onChange={e => setSide({ uid: e.target.value || null, modelCount: null, slotChoices: {}, charKey: "none" })}
                    style={{ fontSize: 11, padding: "2px 6px", background: C.bg3, color: C.tx, border: `1px solid ${C.bdr2}`, borderRadius: 3, cursor: "pointer" }}>
                    <option value="">Pick a unit...</option>
                    {uidOptions.map(uid => <option key={uid} value={uid}>{COMPOSABLE[side.faction][uid].unit}</option>)}
                </select>
            </div>

            {family && (
                <>
                    <UnitBuilder family={family}
                        value={{ modelCount: side.modelCount ?? Math.min(...Object.keys(family.models).map(Number)), slotChoices: side.slotChoices }}
                        onChange={v => setSide(v)} />

                    {family.chars && family.chars.length > 1 && (
                        <div style={{ marginTop: 8, display: "flex", flexWrap: "wrap", gap: 3 }}>
                            {family.chars.map(ck => {
                                const ch = fd.chars[ck]; if (!ch) return null;
                                const on = side.charKey === ck;
                                return (
                                    <button key={ck} onClick={() => setSide({ charKey: ck })}
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

                    {side.faction === "votann" && (
                        <div style={{ marginTop: 8 }}>
                            <div style={{ fontSize: 9, color: C.vdim, marginBottom: 3, textTransform: "uppercase" }}>Yield Points</div>
                            <div style={{ display: "flex", gap: 3 }}>
                                <button onClick={() => setSide({ yp: true })}
                                    style={{ fontSize: 10, padding: "3px 8px", borderRadius: 3, cursor: "pointer", border: `1px solid ${side.yp !== false ? C.grn : C.bdr2}`, background: side.yp !== false ? `${C.grn}22` : "transparent", color: side.yp !== false ? C.grn : C.dim }}>+1 Hit</button>
                                <button onClick={() => setSide({ yp: false })}
                                    style={{ fontSize: 10, padding: "3px 8px", borderRadius: 3, cursor: "pointer", border: `1px solid ${side.yp === false ? C.amb : C.bdr2}`, background: side.yp === false ? `${C.amb}22` : "transparent", color: side.yp === false ? C.amb : C.dim }}>No YP</button>
                            </div>
                        </div>
                    )}

                    <div style={{ marginTop: 8 }}>
                        <DetachmentPanel dets={fd.dets} activeDets={side.activeDets}
                            onToggleDet={detId => setSide({ activeDets: toggleInSet(side.activeDets, detId) })}
                            onClearDets={() => setSide({ activeDets: new Set() })}
                            dpCap={dpCap} detOpts={side.detOpts}
                            onSetDetOpt={(detId, optKey) => setSide({ detOpts: { ...side.detOpts, [detId]: optKey } })} />
                    </div>
                </>
            )}
        </div>
    );
}

export default function FightSimulator() {
    const [state, setState, reset] = usePersistedState(
        "40ktools.fightsim.v2", DEFAULT_STATE,
        { serialize: serializeWithSets, deserialize: deserializeWithSets }
    );
    const { sideA, sideB, inclShoot, inclMelee } = state;
    const update = patch => setState(prev => ({ ...prev, ...patch }));
    const toggleShoot = () => { if (inclShoot && !inclMelee) return; update({ inclShoot: !inclShoot }); };
    const toggleMelee = () => { if (inclMelee && !inclShoot) return; update({ inclMelee: !inclMelee }); };

    useEffect(() => { document.title = "Fight Simulator · 40kTools"; }, []);

    const resolvedA = useMemo(() => resolveSide(sideA, { inclShoot, inclMelee }), [sideA, inclShoot, inclMelee]);
    const resolvedB = useMemo(() => resolveSide(sideB, { inclShoot, inclMelee }), [sideB, inclShoot, inclMelee]);

    let result = null;
    if (resolvedA && resolvedB) {
        const dmgAtoB = dmgPerRound(resolvedA, resolvedB.target, resolvedA.unitBh);
        const dmgBtoA = dmgPerRound(resolvedB, resolvedA.target, resolvedB.unitBh);
        const roundsAKillsB = dmgAtoB > 0 ? resolvedB.totalWounds / dmgAtoB : Infinity;
        const roundsBKillsA = dmgBtoA > 0 ? resolvedA.totalWounds / dmgBtoA : Infinity;
        const winner = roundsAKillsB === roundsBKillsA ? "tie" : (roundsAKillsB < roundsBKillsA ? "A" : "B");
        result = { dmgAtoB, dmgBtoA, roundsAKillsB, roundsBKillsA, winner };
    }

    const fmtR = v => v === Infinity ? "—" : v.toFixed(2);

    return (
        <div style={{ fontFamily: "'Courier New',monospace", background: C.bg, minHeight: "100%", color: C.tx, fontSize: 12 }}>
            <div style={{ padding: "10px 14px 4px" }}>
                <h1 style={{ fontSize: 15, fontWeight: 900, margin: "2px 0", letterSpacing: "-.02em" }}>Fight Simulator</h1>
            </div>

            <div style={{ padding: "6px 14px 8px", display: "flex", gap: 8, flexWrap: "wrap", alignItems: "flex-end", borderBottom: `1px solid ${C.bdr}` }}>
                <div><div style={{ fontSize: 9, color: C.vdim, marginBottom: 3, textTransform: "uppercase" }}>Phase</div>
                    <div style={{ display: "flex", gap: 3 }}>
                        <Btn on={inclShoot} click={toggleShoot} col={C.bl} disabled={inclShoot && !inclMelee}>Shooting</Btn>
                        <Btn on={inclMelee} click={toggleMelee} col={C.grn} disabled={inclMelee && !inclShoot}>Melee</Btn>
                    </div></div>
                <button onClick={reset} style={{ fontSize: 10, background: "none", border: `1px solid ${C.bdr2}`, color: C.dim, cursor: "pointer", padding: "3px 8px", borderRadius: 3 }}>Reset</button>
            </div>

            <div style={{ padding: "10px 14px", display: "flex", gap: 16, flexWrap: "wrap" }}>
                <SidePanel label="Side A" side={sideA} onChange={s => update({ sideA: s })} />
                <SidePanel label="Side B" side={sideB} onChange={s => update({ sideB: s })} />
            </div>

            <div style={{ padding: "10px 14px" }}>
                {!result && <div style={{ color: C.vdim, fontSize: 11 }}>Pick a unit for both sides to see the matchup.</div>}
                {result && (
                    <div style={{ border: `1px solid ${C.bdr2}`, borderRadius: 5, background: C.bg2, padding: "12px 14px" }}>
                        <div style={{ display: "flex", gap: 24, flexWrap: "wrap", marginBottom: 10 }}>
                            <div>
                                <div style={{ fontSize: 10, color: C.dim }}>Side A — {resolvedA.label} ({resolvedA.pts}pts, {resolvedA.totalWounds}W, T{resolvedA.def.T} {resolvedA.keyword})</div>
                                <div style={{ fontSize: 13, fontWeight: 700, color: result.winner === "A" ? C.grn : C.tx }}>
                                    {result.dmgAtoB.toFixed(2)} dmg/round to Side B → kills it in {fmtR(result.roundsAKillsB)} rounds
                                </div>
                            </div>
                            <div>
                                <div style={{ fontSize: 10, color: C.dim }}>Side B — {resolvedB.label} ({resolvedB.pts}pts, {resolvedB.totalWounds}W, T{resolvedB.def.T} {resolvedB.keyword})</div>
                                <div style={{ fontSize: 13, fontWeight: 700, color: result.winner === "B" ? C.grn : C.tx }}>
                                    {result.dmgBtoA.toFixed(2)} dmg/round to Side A → kills it in {fmtR(result.roundsBKillsA)} rounds
                                </div>
                            </div>
                        </div>
                        <div style={{ fontSize: 13, fontWeight: 900, color: C.amb }}>
                            {result.winner === "tie" ? "Even trade — both sides kill each other at the same rate." :
                                `${result.winner === "A" ? "Side A" : "Side B"} wins — kills the opponent first.`}
                        </div>
                    </div>
                )}
                <div style={{ marginTop: 10, fontSize: 9, color: C.vdim, lineHeight: 1.6 }}>
                    "Rounds to kill" = total wounds ÷ expected damage per round - a time-to-kill approximation,
                    not a full dice simulation. It ignores who charges/strikes first, assumes output stays
                    constant as models die, and (for units with an attached character) only tracks the base
                    unit's own wound pool, not the character's separately.
                </div>
            </div>
        </div>
    );
}
