# Known gaps in the BSData import pipeline

Flagged during conversion, not blocking - the pipeline keeps our existing
`src/factions/*.js` data as-is for anything listed here rather than letting
an automated import silently drop or corrupt it. Revisit once the main
architecture (schema, extraction, Unit Builder UI, wiring into both tools)
is functional across all four factions.

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
