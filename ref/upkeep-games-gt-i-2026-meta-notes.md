# The Upkeep Games GT I — meta deep dive (all submitted lists, n=21)

Working notes for the GK Recon list competitiveness question, same goal and
method as `wtc-warmaster-2026-meta-notes.md`. Event: The Upkeep Games GT I
2026, 2026-08-15–16, 126 players, played entirely under MFM v1.2 (legal
2026-08-05, confirmed zero points changes for GK/Votann/Custodes/Chaos
Knights via `mfmdiff.com`). Source data: fetched via
`scripts/scrapers/listhammer.py event 6e0f8d5195bf52121a`, saved to
`ref/ingest/lists/The-Upkeep-Games-GT-I-2026-6e0f8d5195bf52121a/`.

**Methodology difference from Warmaster, corrected after checking the
actual record distribution:** only 21 of 126 players submitted full lists
(`hasList=1`, 17%) - no min-wins filter was applied, but the resulting
sample skews toward winners even more heavily than Newport's: **literally
zero of the 21 submitters have fewer than 4 wins** (12 at 5+, 9 at exactly
4). This is not a representative sample of "what's being played at this
event" - it's a top-tier-only sample by accident of who chose to share
their list, with an even smaller n than Warmaster's own 55-list top-tier
sample. Compare the numbers below against Warmaster's *top-tier-only*
numbers (27%/27%/27%/16%/2%, n=55), not its full-field numbers - and, as
with Newport, a genuine "what's not working" comparison isn't possible
here since there's no bottom-tier data at all.

## Disposition frequency (21 submitted lists — see methodology caveat above: this is a top-tier-only sample, not the whole field)

| Disposition | Count | % |
|---|---|---|
| Take and Hold | 8 | 38% |
| Purge the Foe | 5 | 24% |
| Priority Assets | 4 | 19% |
| Reconnaissance | 3 | 14% |
| Disruption | 1 | 5% |

Compared against Warmaster's top-tier numbers (Take and Hold 27%, Priority
Assets 27%, Reconnaissance 27%, Purge the Foe 16%, Disruption 2%): Take and
Hold and Purge the Foe both run notably higher here, Reconnaissance notably
lower, Priority Assets close. Take and Hold matches Newport's share exactly
(38%) - worth being cautious about this agreement rather than reading it as
confirmation, since both samples share the same winner-skew bias; if
something about strong players/winning lists specifically drives that
number, both samples would agree for that reason alone, not because it
reflects the true population split. Purge the Foe is notably higher here than at
either Newport (14%) or Warmaster's top tier (16%) - Reconnaissance notably
lower than at Newport (29%). Small samples each, but the spread across all
three events (Recon ranging 14-29%, Purge the Foe
14-24%) shows real event-to-event variance even within the same short
post-v1.2 window — worth remembering before treating any single event's
frequency table as "the meta."

## Take and Hold (8 lists)

Faction spread: 2x Space Marines, 1 each T'au/Orks/Black Templars/
Tyranids/Space Marines (Vengeful Hosts)/Blood Angels. (Astartes chapters
counted separately below since two different SM entries ran genuinely
different archetypes.)

**Space Marines "Librarius Conclave | Reclamation Force" (2 of 3 Astartes
entries) — confirms the Newport pattern is real across events, not a
one-event artifact.** Kramer Doyle (5-1): Marneus Calgar in Armour of
Antilochus + Cato Sicarius + Victrix Honour Guard + Librarian + Sternguard
Veteran Squad. Jerry Reynolds (5-1, not individually read but same
detachment pairing). Same shell structurally as Newport's Adam Crellin list
(Titus/Wardens/Bladeguard) — big multi-character melee/elite deathball
built around the same detachment combo, different specific elite blocks
each time. Three independent players across two events now — a real,
emerging Take and Hold archetype, not yet in the matchplay reference.

**Orks "Freebooter Krew | Equatorial Hordes"** — Rick Kincaid (5-1), read
in full: Ghazghkull Thraka + 19 Boyz (Warlord) + Painboy, second Boyz blob
with Warboss + Painboy — the exact "Ghazghkull+19 Boyz" core shell
identified at Warmaster (5/7 lists there) and matched again by Newport's
two Freebooter Krew entries. Fourth-plus independent confirmation of this
being the near-solved Ork Take and Hold shell.

T'au (Randy Brigham, 5-1, Kroot Hunting Pack/Advanced Acquisition Cadre),
Black Templars (Adam Pastor, 5-1, Bastion Task Force), Tyranids (Stephen
Less, 5-1, Crusher Stampede/Talons of the Norn Queen), Space Marines
(Joel Weever, 4-2, Vengeful Hosts/Hammer of Avernii - different detachment
pairing from the Librarius Conclave shell above), and Blood Angels (Jason
Norris, 4-2, Liberator Assault Group) are one-off entries, not deep-read.

No Grey Knights entries at this event.

## Purge the Foe (5 lists)

Faction spread: 1 each T'au/Chaos Space Marines/Orks/Necrons/Blood Angels.

Genuinely mixed, same as every Purge the Foe sample seen so far across all
three events — no single dominant archetype. T'au (Kenneth Fiala, 6-0,
Retaliation Cadre — best record at this disposition, not individually
read), Chaos Space Marines (Ben Isenhoff, 5-1, Creations of Bile), Orks
(Joe Rammuni, 4-2, Da Big Hunt/More Dakka), Necrons (Eric Owczarzak, 4-2,
Cursed Legion/Skyshroud Spearhead), Blood Angels (Clinton Williams, 4-2,
Rage-cursed Onslaught). Notably no Chaos Daemons/Bloodcrusher entries here,
unlike Warmaster's Purge the Foe sample — that archetype's dominance may be
more Warmaster-specific than previously assumed; worth re-checking at a
future event before treating Bloodcrushers as a guaranteed Purge the Foe
threat.

## Priority Assets (4 lists)

Faction spread: 1 each Thousand Sons/Emperor's Children/Tyranids/Imperial
Knights.

Not deep-read — small sample, no repeated archetype, and none matches the
Warmaster-dominant Slaanesh Chaos Daemons "Contorted Epitome" shell (no
Chaos Daemons entries in this disposition at this event at all). Thousand
Sons (Kyle Trayah, 5-1, Sekhetar Cohort/Warpforged Cabal), Emperor's
Children (Kyle Sams, 5-1, Coterie of the Conceited), Tyranids (Ian
McCurdy, 4-2, Talons of the Norn Queen/Assimilation Swarm), Imperial
Knights (Matt Kruppa, 4-2, Freeblade Company).

## Reconnaissance (3 lists) — our disposition

Faction spread: 1 each T'au/Adeptus Custodes/Emperor's Children.

**None of these three run the "skimmer spam" shell found at Newport** —
this is the data point that downgrades that pattern from "confirmed
cross-event trend" to "single-event cluster." See
`warhammer-open-newport-2026-meta-notes.md` for the full skimmer-spam
writeup.

T'au (Lyle Dixon, 6-0, Experimental Prototype Cadre/Kauyon): pure Crisis
Battlesuit alpha-strike — 3x Commander (Coldstar/Coldstar/Enforcer battle-
suits), Crisis Starscythe x3 units, Crisis Sunforge, Crisis Fireknife x2,
Stealth Battlesuits x2, Pathfinder Teams x2, a Tiger Shark (375pts), no
melee presence at all.

Adeptus Custodes (Will Horan, 5-1, Lions of the Emperor/Silent Hunters):
Trajann Valoris + 2x Shield-Captain on Dawneagle Jetbike (5 total Vertus
Praetors split across the two attached units) + 3x undersized Allarus
Custodian squads (6/6/3 models) + Prosecutors + Vertus Praetors + 2x
Witchseekers — mixed elite-melee/anti-horde, MSU-leaning.

Emperor's Children (Jules Rusin, 4-2, Carnival of Excess/Frenzied Host):
runs the same Keeper of Secrets + 4x Daemonettes + 2x Defiler trio already
profiled in `wtc-warmaster-2026-meta-notes.md`'s boogeyman kill-analysis —
confirms that matchup is a live Recon-vs-Recon threat, not just a Priority
Assets/Slaanesh theorycraft case.

## Disruption (1 list)

Orks (John Barsotti, 4-2, Kult of Speed/More Dakka/Equatorial Hordes) — the
only Disruption entry found across all three events combined besides
Warmaster's single Custodes MSU list. Not deep-read, single data point.

## Reconnaissance unit-count/mobility data point (n=3, too small for a tier table)

Using `scripts/scrapers/list_stats.py` (built for the Warmaster full-field
breakdown - see that file for what it can/can't measure):

| Record | Units | Mobility (partial proxy) | Faction | Detachment |
|---|---|---|---|---|
| 6-0 | 18 | 0 | T'au Empire | Experimental Prototype Cadre \| Kauyon |
| 5-1 | 13 | 2 | Adeptus Custodes | Lions of the Emperor \| Silent Hunters |
| 4-2 | 15 | 1 | Emperor's Children | Frenzied Host \| Carnival of Excess |

n=3, raw data only, no trend claimed. The best result here (T'au, 6-0, 18
units) has a mobility score of 0 - a clean illustration of the tool's known
blind spot (Crisis Battlesuits move via jump-pack-like rules the exported
list text doesn't describe, so a genuinely fast, deep-striking army reads
as "zero mobility" to this measurement).

## See also

- `wtc-warmaster-2026-meta-notes.md` — the original deep dive (Warmaster GT
  2026), cross-event GK win-rate aggregate, and Grey Knights-specific
  synthesis/final verdict.
- `warhammer-open-newport-2026-meta-notes.md` — the same treatment for the
  other event evaluated alongside this one.
- `40k-v1.2-meta-competitive-thoughts.md` — the rolling cross-event
  synthesis that merges all three files above into one meta-landscape view.
- `greyknights-recon-matchplay-reference.md` — actionable output (kill-
  commitment map, threat list) for use during actual games.
