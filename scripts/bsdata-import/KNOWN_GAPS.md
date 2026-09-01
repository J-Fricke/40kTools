# Known gaps in the BSData import pipeline

Flagged during conversion, not blocking - the pipeline keeps our existing
`src/factions/*.js` data as-is for anything listed here rather than letting
an automated import silently drop or corrupt it. Revisit once the main
architecture (schema, extraction, Unit Builder UI, wiring into both tools)
is functional across all four factions.

**Tracked as GitHub issues as of 2026-09-01** - this file stays as the
detailed writeup, but the actionable to-do list now lives at
https://github.com/J-Fricke/40kTools/issues (#1 named-variant slots - 12/21
fixed same day, #2 base-weapon fallback, #3 LRR flamestorm cannons, #4
wargear points, #6 coverage audit - now built into the pipeline itself
rather than a separate script, see below, #7 unrecognized keywords). Check
there for current status before assuming something below is still open.

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
BSData's `costs` field - deliberate, see project memory. Per-choice wargear
cost deltas are not yet wired in at all (composableUnit.js's `ptsDelta` on
each choice defaults to 0) - most GK Heavy Weapon-style options are
genuinely free per the real rules, but this needs verification per-faction
before trusting it as a blanket assumption.
