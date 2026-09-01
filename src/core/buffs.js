// ─── DETACHMENT / STRATAGEM BUFF RESOLUTION (army-agnostic) ───────────────────
// Extracted from UnitEvaluator.jsx so it no longer closes over component state -
// callers pass in exactly which detachments are active and which options are
// selected, for whichever faction's DETACHMENTS array is relevant. This lets
// the Fight Simulator resolve two independent factions' buffs side by side
// using the same code the Faction Unit Evaluator uses.

// getDetBuff: resolve every active detachment/stratagem's effect on one unit.
// activeDets: Set<detachmentId> - which detachments are toggled on for this faction.
// detOpts: {detachmentId: optionKey} - selected option for detachments that have them.
// DETACHMENTS: that faction's DETACHMENTS export.
export function getDetBuff(unit, charKey, { activeDets, detOpts, DETACHMENTS }) {
    let bhBonus = 0, rrw1 = false, rrw1Shoot = false, ap1 = false, kahlW = 0, enhancementPts = 0,
        wBonus = 0, ap1m = false, ch5m = false, sh1m = false, letm = false, sh1g = false, letg = false, w1mv = false;
    const applyAffects = a => {
        if (!a) return;
        const matchUnit = a.all || (a.uids && a.uids.includes(unit.uid));
        if (!matchUnit) return;
        if (a.bhBonus) bhBonus += a.bhBonus;
        if (a.wBonus) wBonus += a.wBonus;
        if (a.rrw1) rrw1 = true;
        if (a.rrw1Shoot) rrw1Shoot = true;
        if (a.ap1uids && a.ap1uids.includes(unit.uid)) ap1 = true;
        if (a.ap1chars && a.ap1chars.includes(charKey)) ap1 = true;
        if (a.ap1m) ap1m = true;
        if (a.ch5m) ch5m = true;
        if (a.sh1m) sh1m = true;
        if (a.letm) letm = true;
        if (a.sh1g) sh1g = true;
        if (a.letg) letg = true;
        if (a.w1mv) w1mv = true;
    };
    for (const id of activeDets) {
        const det = DETACHMENTS.find(d => d.id === id);
        if (!det) continue;
        let a = det.affects;
        if (det.options) {
            const optKey = detOpts[id] || (det.options[0] && det.options[0].key);
            const opt = det.options.find(o => o.key === optKey);
            a = opt ? opt.affects : null;
        }
        applyAffects(a);
        // Stratagems: applied whenever their detachment is active - CP budget is
        // never tracked, the app always assumes CP is available when needed to secure a kill.
        if (det.stratagems) for (const strat of det.stratagems) applyAffects(strat.affects);
    }
    // Ironskein (10pts enhancement): +2W to Kâhl when HGC or Hearthband active
    if (charKey === "kahl" && (activeDets.has("hg_covenant") || activeDets.has("hearthband"))) {
        kahlW = 2;
        enhancementPts += 10;
    }
    return { bhBonus, rrw1, rrw1Shoot, ap1, kahlW, enhancementPts, wBonus, ap1m, ch5m, sh1m, letm, sh1g, letg, w1mv };
}

// applyBuff: apply a resolved buff (from getDetBuff) onto a weapon array.
export function applyBuff(ws, buff, isShooting) {
    const useRrw1 = buff.rrw1 || (isShooting && buff.rrw1Shoot);
    const useAp1 = buff.ap1 || (!isShooting && buff.ap1m);
    const useCh5 = !isShooting && buff.ch5m;
    const useSh1 = buff.sh1g || (!isShooting && buff.sh1m);
    const useLet = buff.letg || (!isShooting && buff.letm);
    if (!ws || (!useRrw1 && !useAp1 && !buff.wBonus && !useCh5 && !useSh1 && !useLet && !buff.w1mv)) return ws;
    return ws.map(w => {
        const [shots, skill, s, ap, d, tags] = w;
        return [shots, skill, s, useAp1 ? ap - 1 : ap, d, {
            ...tags,
            rrw1: useRrw1 ? 1 : (tags.rrw1 || 0),
            w1: buff.wBonus > 0 ? 1 : (tags.w1 || 0),
            w1mv: buff.w1mv ? 1 : (tags.w1mv || 0),
            ch5: useCh5 ? 1 : (tags.ch5 || 0),
            // A granted Sustained Hits 1 doesn't downgrade a weapon that already has a
            // higher magnitude natively - keep whichever is better, don't overwrite.
            sustained: useSh1 ? Math.max(1, tags.sustained || 0) : (tags.sustained || 0),
            let: useLet ? 1 : (tags.let || 0),
        }];
    });
}
