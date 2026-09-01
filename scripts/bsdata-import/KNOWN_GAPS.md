# Known gaps in the BSData import pipeline

Flagged during conversion, not blocking - the pipeline keeps our existing
`src/factions/*.js` data as-is for anything listed here rather than letting
an automated import silently drop or corrupt it. Revisit once the main
architecture (schema, extraction, Unit Builder UI, wiring into both tools)
is functional across all four factions.

**Tracked as GitHub issues as of 2026-09-01** - this file stays as the
detailed writeup, but the actionable to-do list now lives at
https://github.com/J-Fricke/40kTools/issues (#1 named-variant slots, #2
base-weapon fallback, #3 LRR flamestorm cannons, #4 wargear points, #6
coverage audit, #7 unrecognized keywords). Check there for current status
before assuming something below is still open.

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

**User's explicit call (2026-09-01)**: ship the Unit Builder wired into
Fight Simulator with these 21 units at fixed-loadout-only for now, revisit
in a dedicated pass rather than blocking on it. If picked up later: the fix
is a second recognized shape in `extractSlots.mjs` - detect a squad-size
group whose children are multiple named model variants (not a `selectionEntryGroups`
with weapon-only children, `extractSlots`'s current only trigger), resolve
each variant's own fixed weapons (reusing/extending `extractBase`'s
`directWeaponEntries` per-variant), treat whichever variant `extractBase`
already selected as the family's `base`, and expose the OTHER variants as
choices in a synthesized slot (their own `selections`/`scope:"parent"` cap,
via the same `getVariantCap()` used for Paladin's Heavy Weapon slot, becomes
that choice's max pick count).

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
