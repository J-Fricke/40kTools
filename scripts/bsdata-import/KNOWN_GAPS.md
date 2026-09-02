# Known gaps in the BSData import pipeline

Flagged during conversion, not blocking - the pipeline keeps our existing
`src/factions/*.js` data as-is for anything listed here rather than letting
an automated import silently drop or corrupt it. Revisit once the main
architecture (schema, extraction, Unit Builder UI, wiring into both tools)
is functional across all four factions.

**Tracked as GitHub issues as of 2026-09-01** - this file stays as the
detailed writeup, but the actionable to-do list now lives at
https://github.com/J-Fricke/40kTools/issues (#1 named-variant slots - fully
resolved 2026-09-02, see below, #2 base-weapon fallback, #3 LRR flamestorm
cannons, #4 wargear points, #6 coverage audit - now built into the
pipeline itself rather than a separate script, see below, #7 unrecognized
keywords). Check there for current status before assuming something below
is still open.

**Issue #1 fully closed 2026-09-02**: the 3 remaining units turned out to
be two different things, not one bug. `bu` (Buri Aegnirssen) and `sv`
(Ironkin Steeljacks with Heavy Volkanite Disintegrators) were false
positives all along - both confirmed against their raw BSData tree to be
genuinely fixed-loadout (for `sv` specifically, the apparent "choice" is
already resolved by which of two separate unit names/uids you pick - `sv`
vs `sm` - not an in-unit option at all). `bs` (Cthonian Beserks) was a
real gap, now fixed - see the `infoLinks` finding below.

**Root cause found while investigating `bs` - a fourth data-linkage
mechanism**: a weapon's stat block can be attached to a BSData entry two
ways - embedded directly (`entry.profiles`), or shared once in the
catalogue's own `sharedProfiles` array and referenced via `entry.infoLinks`
(type:"profile"). `bs`'s "Concussion maul" had zero embedded profile and
only an infoLink - the real characteristics were sitting in
`sharedProfiles` the whole time, and nothing in the extraction pipeline
ever looked there. Fixed via `weaponHelpers.mjs`'s new `resolveProfiles()`,
threaded through `hasWeaponProfile`/`directWeaponEntries`/`buildFamily.mjs`/
`convertFaction.mjs`. This fix alone (nothing else) took the coverage-warning
count from 21 to 18, since it applies broadly, not just to `bs`.

**A third recognized BSData shape added**: `comboChoiceSlot()` in
`extractSlots.mjs` - a group whose children are named "combo" choices (e.g.
Venerable Dreadnought's "Storm bolter and Dreadnought combat weapon" vs
"Heavy flamer and Dreadnought combat weapon"), each bundling 2+
weapon-linked sub-items with no direct profile of its own - not a single
weapon (shape 1) and not a full model variant (shape 2). Also handles a
group mixing wrapper-combo children with plain direct-weapon children
(Knight Despoiler's "Replace reaper chainsword": two combo entries plus two
bare weapon entryLinks sitting alongside them) via the new
`resolveChoiceWeapons()` helper, and a group mixing a real weapon option
with an ability-only option it can't represent (Hekaton Land Fortress'
"Wargear": "Hekaton warhead" weapon + "Pan spectral scanner" ability) by
dropping the unrepresentable option rather than rejecting the whole group.
Took the coverage-warning count from 18 to 3 - all 3 remaining are
confirmed pure-ability groups (Votann's "Crest"/"Enhancements"), correctly
out of scope for a weapon-focused schema, not bugs.

## A deeper, pre-existing bug surfaced while fixing #1 (tracked separately)

`family.base.sWs`/`mWs` (`composableUnit.js`) are flat arrays with no
concept of which entry belongs to which hardpoint. `resolveBuild()` reduces
the WHOLE array by "how many models stepped out of this category" when any
slot in that category is swapped. For a single-model unit whose base
happens to have 2+ separate entries in the same category (e.g. Knight
Despoiler's `mWs` lumping together reaper chainsword + warpstrike claw +
titanic feet as 3 entries for its 1 model), swapping ANY ONE of those
hardpoints wipes the ENTIRE category array, not just the one entry that
should have been replaced - confirmed directly: swapping Despoiler's
reaper chainsword for a ranged combo empties `mWs` completely, losing the
warpstrike claw and titanic feet too, which should have been untouched.

This is not new - it predates today's work and already affects
already-shipped units (Venerable Dreadnought's live "Assault Cannon" slot
hits the same failure mode), just made more visible because today's fixes
added real slots to more multi-hardpoint units. Found 36 affected units
across all 4 factions (any single-model unit with 2+ entries in the same
base category AND at least one slot in that category) - see GitHub issue
#22 for the full list.

**Update 2026-09-02: the real fix (hardpoint tagging) is built and
partially applied.** `composableUnit.js`'s `resolveBuild()` now honors a
base entry shaped `{weapon, hardpoint: slotId}` instead of only a plain
weapon array - swapping that slot's hardpoint removes ONLY that entry, and
(critically) other slots that happen to share the same category no longer
wrongly claim it either (verified this cross-slot leakage was a real risk,
not hypothetical - Despoiler's "Replace reaper chainsword"/"Replace
warpstrike claw" both touch `sWs` since their own choice sets include
ranged options, and would have wrongly wiped the untagged shoulder-mount
meltagun without explicit tagging). `scripts/bsdata-import/hardpointMap.mjs`
is the explicit, hand-verified per-unit tag table (cross-referenced against
each unit's real datasheet in `ref/`, not inferred or guessed) -
`applyHardpointTags()` wires it into `convertFaction.mjs`.

**4 "easy" units re-investigated first** (base sourced directly from
BSData, correlatable to slots): `pur`, `al`, `pi` turned out to be
already-correct on inspection - their slot choices already re-supply
exactly the base portion that gets reduced, self-compensating with no
tagging needed. `hk` genuinely needed a tag (verified numerically) and got
one. This means the original "36 at risk" count was an upper bound from a
structural proxy check, not all confirmed bugs - always verify numerically
before tagging, don't assume multi-entry-base implies a real bug.

**Fully fixed and verified**: `hk`, `desp` (Knight Despoiler), `tyrant`
(Knight Tyrant), `ndk` (Nemesis Dreadknight - base correction, no tag),
`vd` (Venerable Dreadnought), `razorback` (Razorback). Despoiler and Tyrant
both needed real per-unit work beyond tagging - see below.

**Grey Knights pass, 2026-09-02 (batch 3)** - worked the 7 GK units on the
original 36-unit list against `ref/greyknights-10th-datasheets.txt`
(weapon profiles are edition-stable; wargear structure cross-checked):

- **`vd` (Venerable Dreadnought)** - the unit issue #22 was opened on. Real
  fixed 3-weapon loadout (assault cannon + storm bolter + Dreadnought combat
  weapon) on three hardpoints. Fixed: corrected the hand-authored base to
  the datasheet default (storm bolter, not the heavy-flamer swap), then
  hardpoint-tagged all three to their owning slots. Swapping the assault
  cannon no longer wipes the storm bolter, and the combo slot no longer
  wipes the assault cannon. Verified numerically across every slot choice.
- **`razorback` (Razorback)** - base had twin lascannon + storm bolter
  wrongly baked in. Datasheet default is just twin heavy bolter + armoured
  tracks; twin lascannon is the free swap, storm bolter / hunter-killer are
  add-ons. Fixed: base corrected to the twin heavy bolter, hardpoint-tagged
  to the "Twin Heavy Bolter" slot. This surfaced a **distinct facet of the
  same core problem**: an optional single-weapon *add-on* slot on a
  single-model unit (min:0, "can be equipped with 1 storm bolter") also
  wrongly reduces base, because resolveBuild's default per-choice inference
  treats any choice carrying `sWs` as "1 model steps out of base ranged."
  Hardpoint-tagging the base entry sidesteps it (tagged entries are immune
  to the blanket reduction) - but the general fix is for extractSlots to
  mark these slots `replaces:{sWs:false,mWs:false}` the way `comboChoiceSlot`
  already does for optional combo mounts. Logged as GitHub issue #29.
- **`pur` (Purifier Squad)** - confirmed false positive again (multi-model
  squad, the "Heavy weapons" choice re-supplies the shared weapon, and the
  second base entry is untouched). No action.
- **`sr` (Stormraven Gunship)** - NOT a #22 bug. Its "Wargear" slot is
  already `replaces:{sWs:false,mWs:false}` (pure add-on), so the 3-entry
  base is preserved in every case. Its real gap is that the twin assault
  cannon / typhoon launcher *swaps* aren't modeled at all - a coverage
  warning, tracked separately.
- **`gmndk` (Grand Master in Nemesis Dreadknight)** - same shape as `ndk`
  (no fixed ranged weapon - "up to two of the following"; dreadfists is the
  true default melee, "replaced with one of"). The clean fix is the same
  base correction (`base.sWs = []`, `base.mWs = [dreadfists]`). NOT done
  this pass: the current hand-authored base also carries `sowf` (Surge of
  Wrath - full hit/wound/damage reroll vs MONSTER/VEHICLE, a real GMNDK
  ability `ndk` doesn't have) as a weapon tag, and the BSData-extracted
  slot choices have no such tag. Doing the base correction in isolation
  silently drops Surge of Wrath from the model. Needs a joint pass with
  ability modeling (post-process `sowf` onto gmndk's melee choices + the
  psychic ranged ones), not a rushed base edit.
- **`lrr` (Land Raider Redeemer)** - entangled with issue #3: BSData has no
  twin flamestorm cannon data at all, so the hand-authored base has the
  flamestorm + twin assault cannon (correct) plus multi-melta + storm bolter
  (wrongly baked-in add-ons), and the "Wargear" slot offers a lone
  "Flamestorm cannon" choice that doesn't even match the "2 flamestorm
  cannons" base. Deferred until #3 is resolved - the base can't be made
  consistent while the real weapon data is missing.

**Two more systemic extraction bugs found and fixed investigating these**,
likely affecting units well beyond this list:

1. **Entry-link quantity multipliers weren't read at all.** A BSData choice
   can bundle "N copies of this weapon" via a `min===max>1` constraint on
   the entryLink itself (not the resolved weapon target) - e.g. Knight
   Tyrant's "2 Gheiststrike missile launchers and 1 twin desecrator cannon"
   choice links to each weapon once, with the quantity living on the LINK.
   Both of Tyrant's "Carapace weapons" choices extracted to identical stats
   before this fix (neither's "2 of X" was ever applied). Fixed via
   `weaponHelpers.mjs`'s `entryLinkQty()`, threaded through as `_qty` on the
   resolved profile, applied in `buildFamily.mjs`'s shot calculation.
2. **"Always-included sibling" groups were misread as exclusive choices.**
   A group with NO explicit min/max on itself, whose children each carry
   their OWN independent mandatory fixed-count constraint, isn't a "pick 1
   of these" choice at all - it's several separately-required items that
   are ALL always present (Knight Tyrant's "Wargear": "Titanic feet"
   min=max=1 and "Twin daemonbreath meltagun" min=max=2, sitting side by
   side, BOTH mandatory). Before this fix, these were wrongly extracted as
   a mutually-exclusive pick-1-of-2 - a real correctness bug (not just
   "missing," actively wrong), now caught by `isAlwaysIncludedSiblings()`
   and correctly produces no slot (with a coverage warning) instead.
   **Surfaced 21 more affected units** (previously silently
   mis-extracted, not flagged at all): `cal`, `pal` (Custodes Pallas
   Grav-attack), `cor`, `vcd`, `tel`, `hg`, `sg`, `ch`, `ak` (Votann),
   `desc`, `ruin`, `tyrant`, `ach` (Chaos Cerastus Knight Acheron), `atra`,
   `casti`, `mag`, `sty`, `aster`, `porf`, `exec`, `karnivore`. These units'
   always-included items aren't represented in `family.base` at all yet
   (correctly absent rather than wrongly presented as optional, but still
   incomplete) - needs the same per-unit datasheet cross-reference used for
   Despoiler/Tyrant to fold them into base properly.

Tyrant additionally needed its hand-authored base itself corrected
(`src/factions/chaosknights.js`) - the gheiststrike missile launcher's
shot count was wrong (1, should be 2, matching "2 gheiststrike missile
launchers" on the real datasheet) and the twin desecrator cannon was
missing from the row entirely. Found by cross-referencing
`ref/chaos-knights-datasheets.txt`'s exact unit-composition text, not
inferred from the numbers alone.

Remaining work (both categories, not yet done): Grey Knights is now worked
through (see the batch-3 pass above). Still open - the Custodes / Votann /
Chaos Knights units on the original 36-unit list (spot-checked this pass:
`cal`, `cor`, `ach`, `tel`, `vlr` all show the failure mode and need the
same per-unit datasheet cross-reference), plus folding the 21 newly-found
"always-included siblings" units' equipment into their base. Both need the
same rigor used above - real datasheet cross-reference, not
numeric pattern-matching alone.

## The systemic pattern: single-model "vehicle-shape" units

Confirmed across all four factions, not GK-specific: squads (Paladin Squad,
Custodian Guard, Hearthkyn Warriors, etc.) convert cleanly - their base
weapons resolve via `extractBase`'s squad-model heuristic. Single-model units
(dreadnoughts, tanks, War Dogs, Knights, characters) do not - their fixed
weapons and optional wargear both live inside one "Wargear"
`selectionEntryGroup`, sometimes genuinely indistinguishable from each other
by structure alone (see Rhino vs Land Raider Redeemer below). All of these
currently fall back to our own existing hand-authored base weapons (safe,
but means their SLOTS are BSData-sourced while their BASE is not yet -
inconsistent provenance worth fixing per-unit, not systemically, since each
needs an individual read against the real datasheet).

Full list (74 units converted total, 0 hard failures, this many used the fallback):

**Grey Knights** (7 of 13): Nemesis Dreadknight, Grand Master in Nemesis
Dreadknight, Venerable Dreadnought, Stormraven Gunship, Rhino, Razorback,
Land Raider Redeemer.

**Custodes** (13 of 26): Sagittarum Custodians, Caladius Grav-tank, Pallas
Grav-attack, Coronus Grav-carrier, Venerable Contemptor Dreadnought,
Contemptor-Achillus Dreadnought, Contemptor-Galatus Dreadnought, Telemon
Heavy Dreadnought, Venerable Land Raider, Blade Champion, Shield-Captain,
Shield-Captain in Allarus Terminator Armour, Shield-Captain on Dawneagle
Jetbike.

**Votann** (8 of 15): Cthonian Beserks, Brôkhyr Thunderkyn, Cthonian
Earthshakers, Hekaton Land Fortress, Sagitaur, Kapricus Defenders, Einhyr
Champion, Arkanyst Evaluator.

**Chaos Knights** (20 of 20 - every unit in this faction is single-model):
all of them.

## The second systemic pattern: named fixed-loadout model variants (zero slots)

Found 2026-09-01 while hands-on testing the wired-up Unit Builder in Fight
Simulator: 21 of 74 units come back with `slots: []` (fixed loadout, no
wargear options at all) even though the real unit has genuine options -
Custodian Guard being the flagship example the user hit immediately.

Root cause: `extractSlots.mjs` was written and proven against Paladin
Squad's BSData shape - one base model plus a separate "swap group" (pick 1
of Incinerator/Psycannon/Psilencer for a model). A second, at least equally
common shape exists that shape-detection never learned: the squad-size
container holds several **named, already-fully-built model variants** as
direct siblings, with no inner "pick 1 of N" group at all -
`"Custodian Guard (Guardian Spear)"`, `"Custodian Guard (Sentinel Blade &
Praesidium Shield)"`, `"Custodian Guard (Vexilla, Praesidium Shield &
Misericordia)"`. Building the squad *is* choosing how many of each named
variant to take - `extractSlots` correctly finds no swap group (there isn't
one) and returns nothing, so `extractBase`'s "no ' with ' in the name"
heuristic just happens to grab ONE variant (whichever survives the regex)
as if it were the unit's only loadout.

Affected (21 of 74) - **Grey Knights** (3): Interceptor Squad, Purgation
Squad, Purifier Squad. **Custodes** (13, hit hardest - this is its
dominant squad pattern): Custodian Guard, Allarus Custodians, Sagittarum
Custodians, Vertus Praetors, Venatari Custodians, Agamatus Custodians,
Aquilon Custodians, Custodian Guard with Adrasite and Pyrithite spears,
Prosecutors, Vigilators, Witchseekers, Trajann Valoris, Valerian.
**Votann** (5): Cthonian Beserks, Ironkin Steeljacks with Heavy Volkanite
Disintegrators, Hernkyn Yaegirs, Hernkyn Pioneers, Buri Aegnirssen.

**Fixed 2026-09-01**: `extractSlots.mjs` now recognizes this shape via
`namedVariantSlot()` - a group whose children are all `type:"model"`
entries, each resolving its own weapon-bearing entries directly. Of the
original 21 flagged, 12 were real gaps and are now fixed (GK Interceptor/
Purgation/Purifier Squad; Custodes Custodian Guard, Allarus, Vertus,
Venatari, Agamatus, Aquilon, Custodian Guard with Adrasite/Pyrithite
spears; Votann Hernkyn Yaegirs/Pioneers). The other 9 turned out, on
individual inspection of their raw BSData tree, to be legitimately
fixed-loadout units in the real game (Sagittarum Custodians, Prosecutors,
Vigilators, Witchseekers, Trajann Valoris, Valerian) - the original 21-unit
list was itself imprecise (pattern-matched, not individually verified per
unit). See buildFamily.mjs/composableUnit.js for how a synthesized
variant's weapons are threaded through (`choice.entries`, plural, since a
variant can bundle more than one weapon-bearing upgrade).

## Coverage-audit mechanism (added 2026-09-01)

`extractSlots.mjs` now also returns `warnings`: any group with 2+ children
that matched NEITHER recognized shape (weapon-swap-group or named-variant)
and produced no slot anywhere beneath it - the exact structural signature
Custodian Guard had before its shape was recognized. `convertFaction.mjs`
folds these into the same `gaps` array `sync.mjs` already reports, prefixed
`COVERAGE WARNING`. This runs automatically on every `sync.mjs` run - no
separate audit script needed, and no reliance on comparing against the old
(imprecise) hand-authored data as a proxy.

**Current warnings (21, as of the same sync that fixed the 12 above)** -
mostly single-model "vehicle-shape" units already in the base-weapon
fallback list above (a third, not-yet-recognized shape: a `Wargear`/
`Weapon` group whose children are named WEAPON-COMBO entries directly,
not nested model variants) plus a couple of squads with deeper nesting
than either recognized shape handles:

Grey Knights: Venerable Dreadnought, Stormraven Gunship.
Custodes: Telemon Heavy Dreadnought.
Votann: Einhyr Hearthguard (Crest sub-choice only - its main weapon slots
already work), Cthonian Beserks (genuine unresolved squad weapon choice,
not just a vehicle-shape case), Ironkin Steeljacks w/ Heavy Volkanite
Disintegrators, Hekaton Land Fortress, Sagitaur, Kapricus Defenders,
Einhyr Champion.
Chaos Knights: Knight Despoiler, Knight Tyrant, Chaos Questoris Knight
Magaera/Styrix, War Dog Moirax.

Not fixed in this pass - flagged and left for individual review, same
"flag and keep moving" instinct as the rest of this file. Re-running
`sync.mjs` after any future extraction fix will show whether the warning
list shrinks.

## Specific confirmed real BSData data gaps (not just structural ambiguity)

- **Land Raider Redeemer (`lrr`, Grey Knights)**: BSData's catalogue does not
  contain the twin flamestorm cannons at all (confirmed via full-file search
  for "flamestorm" - zero matches). This is a genuine completeness gap in
  the third-party data, not a parser bug.

## Unrecognized keywords found during the full 4-faction conversion

Beyond the ANTI-CHARACTER/ANTI-DAEMON/ANTI-FLY/ANTI-PSYKER genuine engine
gap already documented in `keywordMap.mjs` (engine only special-cases
Infantry/Vehicle/Monster targets), these bespoke per-weapon named abilities
need a human read (same as always - not a vocabulary problem):
- "Executioner greatblade" (Custodes) - Anti-Psyker 5+ (same engine gap as above)
- "➤ Transmatter inverter - overcharge" (Votann) - Overcharge keyword, bespoke ability text
- "Hellstorm autocannons" / "Helios defence missiles" (Chaos Knights) - Anti-Fly variants (same engine gap)

## Points

`ourSizeTiers.mjs` extracts base costs from our own existing MFM-verified
`src/factions/*.js` data (cheapest SKU per uid+model-count), NOT from
BSData's `costs` field - deliberate, see project memory.

**Per-choice wargear cost deltas: fixed 2026-09-02 (issue #4)**. Traced
every genuinely-costed wargear option directly to each faction's own
`ref/*-mfm-v1.3.txt` "WARGEAR OPTIONS" section (a "per <weapon>: N pts"
line), NOT the datasheet text (which never states a cost even for options
that do cost points in the MFM) and NOT BSData's `costs` field. Wired via
`scripts/bsdata-import/wargearPoints.mjs`'s `WARGEAR_POINTS` table, applied
in `convertFaction.mjs` after `buildFamily`. Confirmed exceptions (almost
everything else is genuinely free):

- **Grey Knights**: Brotherhood Terminator Squad, Paladin Squad, Purgation
  Squad - Psycannon +5pts. Nemesis Dreadknight - Heavy psycannon +15pts.
  Grand Master in Nemesis Dreadknight - Sublimator +15pts, Heavy psycannon
  +15pts.
- **Custodes**: Caladius Grav-tank - Twin arachnus heavy blaze cannon
  +15pts.
- **Votann**: none - no "WARGEAR OPTIONS" section anywhere in
  `votann-mfm-v1.3.txt`.
- **Chaos Knights**: Knight Despoiler has real costed options (gatling
  cannon +25pts, battle cannon +10pts) but NOT wired in - `desp`'s
  extracted wargear slots are still wrong (see the coverage-warning list
  above), wiring points onto the current incorrect choices would be
  actively misleading. Revisit once `desp`'s extraction itself is fixed.

**Genuine unresolved ambiguity, deliberately not applied**: Custodes
Venatari Custodians. The MFM says "per Venatari lance: 5pts", but
`ref/custodes-datasheets.txt`'s rules text says the lance is the FREE base
weapon and the (uncosted) optional swap is TO a kinetic destroyer +
tarsus buckler - the opposite direction from what the MFM line implies.
Either a newer errata/dataslate flipped which weapon is free (this
datasheet source may predate that), or the MFM means something this app's
schema can't represent (a cost to KEEP the base weapon rather than a
selectable choice). See `wargearPoints.mjs`'s comment. Needs a human check
against a current datasheet before wiring anything in either direction.

**A real trap avoided**: the old hand-authored data showed apparent point
variation for a couple of units (Nemesis Dreadknight 195 vs 210pts) that
turned out to be the MFM's unrelated "3rd+ copy of this unit in your army
costs more" battle-size tax, not a wargear cost - don't trust apparent
point variation in old data as evidence of a costed wargear option without
tracing it back to an actual "WARGEAR OPTIONS" section.
