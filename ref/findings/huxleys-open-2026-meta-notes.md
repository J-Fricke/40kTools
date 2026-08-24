# HUXLEYS OPEN 2026 — meta deep dive (99 of 126 players submitted lists, n=99)

Working notes for the GK Recon list competitiveness question, same goal and
method as `wtc-warmaster-2026-meta-notes.md`. Event: HUXLEYS OPEN 2026 -
WARHAMMER 40K, event ID `f7dc4545f047ec5de9`
(https://listhammer.info/events/f7dc4545f047ec5de9), 2026-08-21–23, 126
players, played entirely under MFM v1.2 (legal 2026-08-05, confirmed zero
points changes for GK/Votann/Custodes/Chaos Knights via `mfmdiff.com`).
Source data: fetched via `scripts/scrapers/listhammer.py event
f7dc4545f047ec5de9`, saved to
`ref/ingest/lists/HUXLEYS-OPEN-2026---WARHAMMER-40K-f7dc4545f047ec5de9/`.
Appears to be a German-hosted event (most player names) - this data pull is
also what surfaced this repo's German-locale ("Punkte" instead of "points")
export-format support in both `listhammer.py` and `list_stats.py`.

**Methodology: this is a genuinely representative full-field sample, unlike
Newport/Upkeep.** 99 of 126 players submitted lists (79%), and the record
distribution spans the entire range from 0-6 up to 5-0 - not skewed toward
winners the way Newport/Upkeep turned out to be. This is the second
Warmaster-quality dataset (587-list full field there vs. 99-list full field
here) and the first real chance to check whether Warmaster's own full-field
patterns replicate at a second event.

## Tier sizes and disposition share by tier

Tiers: top(5+) n=11, upper-mid(4) n=22, mid(3) n=28, lower-mid(2) n=25,
bottom(0-1) n=13.

| Disposition | top(5+) | upper-mid(4) | mid(3) | lower-mid(2) | bottom(0-1) |
|---|---|---|---|---|---|
| Take and Hold | 36% (4) | 45% (10) | 32% (9) | 44% (11) | 8% (1) |
| Priority Assets | 45% (5) | 32% (7) | 29% (8) | 24% (6) | 31% (4) |
| Purge the Foe | 9% (1) | 14% (3) | 18% (5) | 16% (4) | 31% (4) |
| Reconnaissance | 9% (1) | 0% (0) | 14% (4) | 12% (3) | 23% (3) |
| Disruption | 0% (0) | 5% (1) | 7% (2) | 0% (0) | 8% (1) |

**This does not replicate Warmaster's Reconnaissance pattern, and that's
worth reporting plainly rather than explaining away.** At Warmaster,
Reconnaissance's share climbed steadily from 17% (bottom) to 27% (top). At
this event, Reconnaissance's share is *higher at the bottom (23%) than at
the top (9%)* - close to the opposite direction. The total Reconnaissance
sample here is small (11 lists total across all tiers: 1+0+4+3+3), so this
could be noise rather than a real reversal, but it's a genuine data point
that tempers confidence in "Reconnaissance disproportionately wins" as a
general rule rather than a Warmaster-specific pattern. Priority Assets also
doesn't cleanly replicate Warmaster's "rises toward the bottom" shape here
(45% top, 31% bottom, non-monotonic in between).

## Faction share by tier (top 10 factions by total count)

| Faction | top | upper-mid | mid | lower-mid | bottom | total |
|---|---|---|---|---|---|---|
| Adeptus Custodes | 1 | 3 | 1 | 4 | 0 | 9 |
| Chaos Space Marines | 1 | 1 | 3 | 1 | 2 | 8 |
| Orks | 1 | 3 | 1 | 2 | 0 | 7 |
| Imperial Knights | 2 | 1 | 1 | 0 | 3 | 7 |
| Chaos Daemons | 0 | 2 | 2 | 2 | 0 | 6 |
| Black Templars | 0 | 2 | 1 | 2 | 1 | 6 |
| Necrons | 1 | 1 | 3 | 0 | 0 | 5 |
| Tyranids | 1 | 2 | 1 | 1 | 0 | 5 |
| Thousand Sons | 1 | 1 | 2 | 1 | 0 | 5 |
| Dark Angels | 0 | 0 | 1 | 3 | 1 | 5 |

**Dark Angels does not replicate its Warmaster dominance here either** - 0
of 5 Dark Angels entries reached the top tier (3 sit in lower-mid, 1 in
mid, 1 in bottom), a striking contrast to Warmaster's 6/15 (40%) top-tier
share. Both of this event's two "Darkflight Pursuit | Company of Hunters"
Reconnaissance lists (the exact archetype identified as dominant at
Warmaster) finished 3-3 and 2-2 - mediocre, not dominant. Imperial Knights
shows a bimodal spread (2 top, 3 bottom, almost nothing in between) on a
small n=7 - notable but not enough to call a pattern. No faction here shows
the kind of lopsided top-tier concentration Dark Angels/Chaos Daemons/Orks
showed at Warmaster's full field.

## Top tier (11 lists, 5+ wins) - genuinely mixed, no dominant archetype

Nine different factions across 11 top-tier lists - no single archetype
repeats more than twice:

| Record | Faction | Detachment | Disposition |
|---|---|---|---|
| 5-0 | Chaos Space Marines | Devotees of Destruction \| Veterans of the Long War | Priority Assets |
| 5-0 | Necrons | Cursed Legion | Purge the Foe |
| 5-1 | Orks | Freebooter Krew | Take and Hold |
| 5-1 | Adeptus Custodes | Talons of the Emperor | Take and Hold |
| 5-1 | Tyranids | Warrior Bioform Onslaught \| Assimilation Swarm | Take and Hold |
| 5-1 | Imperial Knights | Questoris Companions | Take and Hold |
| 5-1 | Emperor's Children | Coterie of the Conceited | Priority Assets |
| 5-1 | Thousand Sons | Grand Coven | Priority Assets |
| 5-1 | Imperial Agents | Veiled Blade Elimination Force | Reconnaissance |
| 5-1 | Emperor's Children | Coterie of the Conceited | Priority Assets |
| 5-1 | Imperial Knights | Freeblade Company | Priority Assets |

Orks/Freebooter Krew appears once here (Take and Hold) - consistent with,
but not adding much new confirmation to, the repeated Ork pattern from
Warmaster/Newport/Upkeep. Emperor's Children/Coterie of the Conceited
repeats twice (Priority Assets) - worth noting given Emperor's Children
skewed toward the mid/bottom tiers in Warmaster's full-field breakdown; this
shows the faction can place well too, consistent with the earlier
characterization of it as present across the whole spread rather than
uniformly weak. **The only winning Reconnaissance list at this event is
Imperial Agents "Veiled Blade Elimination Force" (5-1)** - not a faction
seen as a Reconnaissance archetype anywhere else in this survey so far.

## Grey Knights (1 entry)

Only one GK entrant: 1-4, Banishers | Argent Assault, Priority Assets. Not
our archetype (Priority Assets, not Reconnaissance) and a poor result -
consistent with the Warmaster finding that Banishers|Argent Assault results
were "wildly inconsistent," though n=1 here adds little on its own.

## See also

- `wtc-warmaster-2026-meta-notes.md` — the original full-field deep dive,
  cross-event GK win-rate aggregate, and Grey Knights-specific synthesis.
- `warhammer-open-newport-2026-meta-notes.md`,
  `upkeep-games-gt-i-2026-meta-notes.md` — smaller, winner-skewed samples
  from the same post-v1.2 window.
- `40k-v1.2-meta-competitive-thoughts.md` — the rolling cross-event
  synthesis (pending a refresh to fold this event in).
- `greyknights-recon-matchplay-reference.md` — actionable output for use
  during actual games.
