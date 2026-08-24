# Warhammer Open Newport — meta deep dive (all submitted lists, n=21)

Working notes for the GK Recon list competitiveness question, same goal and
method as `wtc-warmaster-2026-meta-notes.md`. Event: Warhammer 40,000 Grand
Tournament - Warhammer Open Newport, 2026-08-14–16, 188 players, played
entirely under MFM v1.2 (legal 2026-08-05, confirmed zero points changes for
GK/Votann/Custodes/Chaos Knights via `mfmdiff.com`). Source data: fetched via
`scripts/scrapers/listhammer.py event 746563a79b1a0ffbe8`, saved to
`ref/ingest/lists/Warhammer-40-000-Grand-Tournament---Warhammer-Open-Newport-746563a79b1a0ffbe8/`.

**Methodology difference from Warmaster, corrected after checking the
actual record distribution:** only 21 of 188 players submitted full lists
(`hasList=1`, 11%) - no min-wins filter was applied when pulling these, but
the resulting sample turns out to skew heavily toward winners anyway: 19 of
21 already have 5+ wins, only one 3-3 and one 0-0 round it out. This is very
different from Warmaster, where 587 of ~600 players (98%) submitted a list
regardless of record, making that sample close to the whole field. Here,
players who do well appear far more likely to share their list than players
who don't - so **this is not a representative sample of "what's being
played at this event" the way it first looked; it's much closer to "what
winning players are playing," just with a smaller n than Warmaster's own
55-list top-tier sample.** The disposition/faction numbers below should be
compared against Warmaster's *top-tier-only* numbers (27%/27%/27%/16%/2%
across Take and Hold/Priority Assets/Reconnaissance/Purge the Foe/
Disruption, n=55), not its full-field numbers - and a genuine "what's not
working" comparison isn't possible from this event's data, since there's
almost no bottom-tier data to compare against.

## Disposition frequency (21 submitted lists — see methodology caveat above: this skews toward winners, it is not the whole field)

| Disposition | Count | % |
|---|---|---|
| Take and Hold | 8 | 38% |
| Reconnaissance | 6 | 29% |
| Priority Assets | 4 | 19% |
| Purge the Foe | 3 | 14% |
| Disruption | 0 | 0% |

Compared against Warmaster's *top-tier-only* numbers (n=55: Take and Hold
27%, Priority Assets 27%, Reconnaissance 27%, Purge the Foe 16%, Disruption
2%) - the fair comparison, per the methodology caveat above - Reconnaissance
here (29%) lines up closely, Take and Hold is notably higher (38% vs 27%),
Priority Assets is lower (19% vs 27%), and Disruption is similarly rare
(0% vs 2%). Small sample (n=21 vs n=55), treat as a second data point, not
a confirmation on its own.

## Take and Hold (8 lists)

Faction spread: 2x Orks, 2x Space Marines, 1 each Space Wolves/Adeptus
Custodes/Chaos Daemons/Grey Knights.

**Space Marines "Librarius Conclave | Reclamation Force" (2/2 SM lists) —
new archetype, not seen at Warmaster.** Adam Crellin's list (6-2): Captain
Titus + Wardens of Ultramar (6-model named-character bodyguard unit) +
Bladeguard Veteran Squad + Librarian, a big multi-character melee/elite
deathball built around psychic buff auras (Librarius Conclave) and
army-wide reinforcement (Reclamation Force). Confirmed as a recurring shell
— see `warhammer-open-newport-2026-meta-notes.md` sibling file for Upkeep,
where the same detachment pairing repeats twice more with different named
characters (Calgar/Cato Sicarius, Uriel Ventris-style multi-character
lineup). Worth adding to the matchplay reference as an emerging Take and
Hold threat — durability category (see the tempo-vs-durability framework in
`40k-v1.2-meta-competitive-thoughts.md`), a big melee brick that needs
focused answers, not a chip-damage target.

**Orks "Freebooter Krew | Equatorial Hordes" (2 lists)** — Jake Dinner (6-2)
and Jude Burges (5-3), not individually deep-read here, but the detachment
pairing matches the "Ghazghkull + 19 Boyz" shell confirmed by full read at
Upkeep (Rick Kincaid) and originally identified at Warmaster (5/7 Ork Take
and Hold lists there). Third and fourth sightings of the same near-solved
Ork shell.

**One Grey Knights entry**: Ryan Johnson, 5-3, Warpbane Task Force. Not our
archetype (Take and Hold, not Reconnaissance) so doesn't validate or
invalidate our specific build — see the cross-event aggregate table in
`wtc-warmaster-2026-meta-notes.md` where this result is already counted.

Space Wolves (Matthew McCurdy, 7-1, Legends of Saga and Song), Adeptus
Custodes (Will Leach, 6-2, Lions of the Emperor), and Chaos Daemons (Blair
Wilson, 5-3, Plague Legion/Warptide - Nurgle-flavored, distinct from either
Slaanesh or Khorne builds seen elsewhere) are one-off entries, not deep-read.

## Reconnaissance (6 lists) — our disposition

Faction spread: 1 each Drukhari/Dark Angels/Thousand Sons/Space Marines
(x2)/Black Templars (roster faction tag; list itself is Raven Guard chapter).

**"Skimmer spam" shell — 4 of 6 lists, but this is single-event evidence.**
Dark Angels (Mikey Herbert, 7-1: Sammael + Lion El'Jonson + Ravenwing
Command Squad, backed by 3x Land Speeder + Land Speeder Vengeance + 2x Storm
Speeder Hailstrike + Storm Speeder Hammerstrike + 2x Storm Speeder
Thunderstrike — extremely vehicle-heavy, matches the Warmaster DA archetype
structurally), "Raven Guard" (Nicky Myland, 3-3: Kayvaan Shrike + Assault
Intercessors, backed by 3x Land Speeder + 3x Storm Speeder Hammerstrike +
Storm Speeder Thunderstrike + Centurion Devastator Squad), and two separate
plain Space Marines lists (Gerard Purcell 6-2: Uriel Ventris/Tigurius
multi-character list + Land Raider Redeemer + 2x Land Speeder + 2x Storm
Speeder Hammerstrike; Archie Balfour 5-2: Vulkan He'stan + Terminators +
2x Land Raider Redeemer + 2x Land Speeder). **Checked Upkeep's 3
Reconnaissance lists (T'au, Custodes, Emperor's Children) — none run this
shell.** Read as a cluster specific to this 188-player field (a local-scene
or netlist-copy effect is plausible), not a confirmed cross-event trend.
Needs a third event's data before treating as "expect this."

**Thousand Sons "Reconnaissance (thicc)" deathstar** (Dom Ridley, 6-2):
Magnus the Red (455pts) + 2x Lord of Change (650pts combined) + Kairos
Fateweaver (305pts) + Exalted Sorcerer — four separate large MONSTERs in one
2000pt list. See `wtc-warmaster-2026-meta-notes.md` for the full kill%
analysis against Magnus (new `magnus` target profile added to the
evaluator) — Lord of Change's stat line is defensively identical to the
already-modeled Keeper of Secrets profile, Magnus is the real outlier
(Sv2+ actually matters, unlike Keeper/LoC).

**Drukhari** (Patrick Harrison, 7-1): Lelith Hesperax + Archon + Drazhar +
Lady Malys + Succubus, each leading a Wych/Incubi unit, backed by
Raiders/Venoms — a fast multi-character melee blade-spam list, opposite
profile from the skimmer-spam/gunline threats above.

## Priority Assets (4 lists)

Faction spread: 1 each Adeptus Mechanicus/T'au/Space Marines/Orks.

**Adeptus Mechanicus went 8-0, the best single result found across all
three events studied so far** (Richard Siegler, Lords of the Forge/Skitarii
Hunter Cohort). Read in full: Belisarius Cawl (220pts) + Thulia Ghuld
(180pts) + Inquisitor Draxus leading 2x 10-model Skitarii Vanguard squads
(transuranic arquebus/arc rifle/plasma caliver mix, high ranged-damage
volume), Skorpius Dunerider transports. A shooting-heavy AdMech build, not
a melee brick or horde. One result, not a pattern yet — no second AdMech
list at this or the Upkeep event to compare against — but worth watching.

T'au (tony barrett, 7-1, Mont'ka), Space Marines (chloe chippindale, 7-1,
Librarius Conclave/Forgefather's Seekers - notably the *same* detachment
pairing as the Take and Hold deathball above, different disposition), and
Orks (Billy Guest, 0-0, Dread Mob/Equatorial Hordes) are one-off entries,
not deep-read.

## Purge the Foe (3 lists)

Faction spread: 1 each Adeptus Custodes/Emperor's Children/Chaos Daemons.

Not deep-read — small sample, no repeated archetype to confirm. Adeptus
Custodes (Stephen Box, 6-2, Shield Host/Tharanatoi Hammerblow), Emperor's
Children (Jarrad Evans, 6-2, Spectacle of Slaughter/Court of the
Phoenician), Chaos Daemons (Dean Murphy, 5-1, Shadow Legion/Cavalcade of
Chaos - detachment name suggests Slaanesh-flavored rather than the Khorne
Bloodcrushers seen at Warmaster's Purge the Foe).

## Disruption (0 lists)

No submissions in this disposition at this event.

## Reconnaissance unit-count/mobility data point (n=6, too small for a tier table)

Using `scripts/scrapers/list_stats.py` (built for the Warmaster full-field
breakdown - see that file for what it can/can't measure):

| Record | Units | Mobility (partial proxy) | Faction | Detachment |
|---|---|---|---|---|
| 7-1 | 22 | 3 | Drukhari | Skysplinter Assault \| Exhibition of Slaughter |
| 7-1 | 16 | 3 | Dark Angels | Darkflight Pursuit \| Company of Hunters |
| 6-2 | 12 | 1 | Thousand Sons | Changehost of Deceit \| Servants of Change |
| 6-2 | 14 | 3 | Space Marines | Librarius Conclave \| Forgefather's Seekers |
| 5-2 | 17 | 4 | Space Marines | Librarius Conclave \| Firestorm Assault Force |
| 3-3 | 15 | 2 | Black Templars | Fulguris Task Force |

n=6 is too small to compute a tier table or say anything about a trend -
listed here as raw data only. Both best records (7-1) sit at opposite ends
of the unit-count range (22 and 16), which on its own doesn't confirm or
contradict the Warmaster full-field pattern (winning Reconnaissance lists
there clustered tighter around 14-20 units) - just noting it, not drawing a
conclusion from 6 data points.

## See also

- `wtc-warmaster-2026-meta-notes.md` — the original deep dive (Warmaster GT
  2026), cross-event GK win-rate aggregate, and Grey Knights-specific
  synthesis/final verdict.
- `upkeep-games-gt-i-2026-meta-notes.md` — the same treatment for the other
  event evaluated alongside this one.
- `40k-v1.2-meta-competitive-thoughts.md` — the rolling cross-event
  synthesis that merges all three files above into one meta-landscape view.
- `greyknights-recon-matchplay-reference.md` — actionable output (kill-
  commitment map, threat list) for use during actual games.
