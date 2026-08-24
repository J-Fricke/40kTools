# WTC Warmaster GT 2026 — meta deep dive (5+ win lists, n=55)

Working notes for the GK Recon list competitiveness question. Source data:
`ref/ingest/lists/WTC-Warmaster-GT-2026-d0f86a313ef8c966e4/` (55 lists, fetched via
`scripts/scrapers/listhammer.py`). Goal: figure out whether our locked GK Recon list
(Sanctic Spearhead, 2x GMND, Purifier+Crowe, 3x Interceptor, Callidus ally — see
project memory `project_greyknights_recon_list`) can be competitive against what's
actually winning, and what to change if not.

## Disposition frequency (5+ win lists)

| Disposition | Count | % |
|---|---|---|
| Take and Hold | 15 | 27% |
| Priority Assets | 15 | 27% |
| Reconnaissance | 15 | 27% |
| Purge the Foe | 9 | 16% |
| Disruption | 1 | 2% |

Take and Hold — our community-agreed hardest matchup as a low-model-count army — is
tied for *most common*, not rare. Disruption (a lot of Discord discussion energy)
is nearly unplayed at this level. Re-prioritize prep time accordingly.

## Take and Hold (15 lists) — we'd play Reconnaissance Sweep vs. this

Faction spread: 7x Orks, 3x Custodes, 2x Necrons, 2x Space Wolves, 1x Tyranids.
**Orks dominate (nearly half).**

### Orks/Take and Hold (7/7 lists read) — DONE

Two sub-archetypes found, but one dominates:
- **More Dakka | Freebooter Krew** (5 of 7 lists) — a remarkably consistent, near-
  solved shell across 5 different players: Ghazghkull+19 Boyz (Warlord, hard to
  snipe out of the blob), Zodgrod+20 Gretchin, 1-3x Big Mek Dakkarig (walker,
  Blitzkannon), 2-3x 8-man Lootas (Deffgun shooting), a Squighog Boyz unit,
  Wazdakka, plus filler (Flash Gitz/Tankbustas/Kommandos/Stormboyz) tuned to
  points. Shooting+horde hybrid.
- **War Horde** (2 of 7): melee-cavalry-leaning — heavy Squighog Boyz investment
  (up to 15 models across multiple units), less dedicated shooting, otherwise
  same Ghazghkull/Zodgrod/Wazdakka core.

Common thread regardless of sub-archetype: **60-90+ cheap bodies per list**
(Boyz/Gretchin/Squighog), Ghazghkull as centerpiece Warlord.

**Real evidence, not just theory:** 3 of these 7 lists' own matchup logs show
actual games against Grey Knights at this event — all Ork wins: **91-57, 85-72,
90-70**. Consistent ~15-30pt margins, not blowouts but a clear, repeated pattern
of GK losing this specific matchup at this event. This is the single strongest
piece of concrete evidence so far that our archetype has a real problem here,
not just a theoretical one.

**Implication for us:** we cannot out-body Orks on raw objective/quarter contests.
Our edges are (1) FLY/deep-strike mobility (Interceptors, Gate of Infinity) to get
into quarters they can't defend everywhere, and (2) Purifying Flame's guaranteed-
wound-regardless-of-toughness mechanic (esp. doubled by Crowe) as the efficient
answer to cheap T4/Sv5+ chaff — GMND's low-shot-count high-damage guns are
inefficient against 10-20-body units, and Reconnaissance Sweep needs full unit
kills (not chip damage) for the kill-bonus VP. Whether that's *enough* given the
real losses observed is still open — worth stress-testing our list's actual
output against a Boyz/Gretchin/Lootas profile in the evaluator once we're done
surveying.

## Reconnaissance (15 lists) — mirror matchup, we'd play Gather Intel

Faction spread: 6x Dark Angels (dominant), 3x Chaos Daemons, 2x Space Marines,
2x Emperor's Children, 1x Aeldari, 1x Leagues of Votann.

### Dark Angels/Reconnaissance (5/6 lists checked) — DONE, effectively a solved list

All 6 run the identical detachment pairing (Darkflight Pursuit | Company of
Hunters), and 5 of 6 share nearly the same roster: **Azrael + Lion El'Jonson**
(W8-ish, 2+/4++, a genuinely dangerous independent melee centerpiece) +
**Sammael/Ravenwing Command Squad**, backed by 5-6 fast vehicles (2x Land
Speeder, 3x Land Speeder Vengeance, sometimes Storm Speeder Thunderstrike),
Deathwing Knights or Ravenwing Black Knights as the elite melee/durability
piece, an Outrider Squad, and 1-2 cheap 5-man Scout squads for actions.

This is our **mirror matchup** (they're Reconnaissance too -> we'd both play
Gather Intel). The comparison scodge drew ("Company of Hunters doing what we're
doing") holds up structurally: same speed+action-body gameplan we're going for
with Interceptors, but DA backs it with a much scarier independent melee
centerpiece (Lion El'Jonson) and more numerous fast vehicle platforms (5-6 vs
our 2 GMND) than we currently field. Worth noting for the synthesis step: if
this mirror matchup comes down to "whoever's speed force does more work," their
speed force has a stronger single hard-to-kill threat in it than ours does.

## Priority Assets (15 lists) — we'd play Search and Scour

Faction spread: 5x Chaos Daemons (dominant), 2x Thousand Sons, 2x Orks,
2x Adeptus Mechanicus, 1 each Death Guard/Space Marines/Votann/Dark Angels.

### Chaos Daemons/Priority Assets (5/5 lists checked) — DONE, solved list, distinct from the Purge the Foe Daemons archetype

All 5 run Legion of Excess | Warptide and share the same core: **Contorted
Epitome (x1-2 leaders), 5-7x Daemonette squads (9-model, fast melee),
3x Fiends (5-model fast melee monsters), 1-2x Keeper of Secrets (huge melee
monster), Tormentbringer**, sometimes Beasts of Nurgle/Flesh Hounds. This is a
**Slaanesh speed+melee-monster build**, completely different from the Khorne
Bloodcrusher/durability build seen under Purge the Foe (David Gaylard's #2
seed) — Chaos Daemons is fielding two distinct, both-dominant sub-archetypes at
this event, one per disposition. Chaos Daemons is the single most important
faction to prepare for overall, appearing at the top of both Purge the Foe and
Priority Assets with different threat shapes.

**Real evidence, severe:** Hugo Richiardi's list (6-0, undefeated at the whole
event) shows a matchup log entry of **Chaos Daemons 100 pts v Grey Knights 23
pts** — a blowout, worse than any of the Ork results. This is the single worst
recorded GK result found in this survey. Fast melee-monster-heavy Daemons lists
look like a serious, specific weak point — worth checking in the evaluator
whether our GMND/BTS/Purifier survive being charged by multiple 9-Daemonette
squads or a Keeper of Secrets before they can shoot back.

## Purge the Foe (9 lists) — we'd play Triangulation

### Purge the Foe (9/9 lists checked) — DONE, genuinely mixed, no single dominant archetype

Mixed: 2x Chaos Daemons, 2x Necrons, 1 each Space Marines/T'au/Adepta Sororitas/
Imperial Knights/Votann. Unlike the other 3 dispositions surveyed, no single
faction/build repeats enough to call it "solved" here.

- **Chaos Daemons (2 lists)**: both Khorne-flavored, both feature Bloodcrushers
  again (David Gaylard's #2-seed Blood Legion list, and Joel Larsson's Shadow
  Legion list — 2x Bloodcrushers + Bloodletters + Skullmaster + Rendmaster +
  Skull Cannons + a Lord of Change). Confirms Bloodcrushers (T7/Sv3+/Inv5+, now
  in the evaluator's meta tab as `bcrush`) are the recurring Purge the Foe
  Daemons threat, distinct from the Slaanesh speed/melee build seen under
  Priority Assets.
- **Space Marines (Konrad Schmuck, 5-0-1)**: two full 10-man Terminator Assault
  Squads (345/350pts each, Storm Shield+Thunder Hammer) — a genuine durable
  melee-brick mirror of what our own BTS is trying to do, just bigger investment.
- **T'au (Durante Bozzini)**: pure battlesuit gunline — Crisis suits x4,
  Commanders x4, 2x Hammerhead, 2x Pathfinder, 2x Stealth suits. No melee
  presence to speak of; a shooting attrition matchup.
- Sororitas/Necrons x2/Imperial Knights/Votann not deep-read given time budget —
  no GK matchup data surfaced for any of these specifically.

Community consensus flagged this disposition as our *favorable* matchup. Nothing
found here contradicts that directly, but nothing strongly confirms it either —
the aggregate GK loss data above (see below) doesn't include any Purge the Foe
results specifically, so this claim remains untested by real match data so far.

## Disruption (1 list) — we'd play Surveil the Foe — DONE

Adeptus Custodes, Lions of the Emperor | Silent Hunters. Notably MSU rather than
concentrated: 5 small attached units (Trajann+4 Custodian Guard, Allarus
Shield-Captain+5 Allarus, Inquisitor Draxus+4 Custodian Guard, Blade Champion+4
Custodian Guard, Dawneagle Shield-Captain+2 Vertus Praetors) plus a standalone
5-man Allarus and 2x cheap Witchseekers — spread bodies for actions rather than
one or two big bricks, unlike the Take-and-Hold Custodes lists earlier. Makes
sense given Disruption's action/terrain-control demands. No GK matchup data
found in this one. Given the disposition is nearly unplayed at this level (1/55),
not worth deeper investment beyond this single data point.

## Grey Knights at this event (all 16 entries, not just 5+ win filter)

| Placing | Record | Detachment(s) | Disposition | Player |
|---|---|---|---|---|
| 134 | 4-2 | Immaterial Interdiction \| Sanctic Spearhead | Reconnaissance | Sebastien Jeoffroy ("scodge") |
| 149 | 4-2 | Fires of Purgation \| Brotherhood Strike | Purge the Foe | Jort Kassies |
| 153 | 4-2 | Banishers \| Argent Assault | Priority Assets | Riccardo Ghio |
| 214 | 3-2 | Argent Assault \| Sanctic Spearhead | Priority Assets | Richard Calnon |
| 255 | 3-3 | Banishers \| Argent Assault | Priority Assets | Raphaël blere |
| 279 | 3-3 | Warpbane Task Force | Take and Hold | Aaron Hermans |
| 303 | 3-3 | Hallowed Conclave \| Argent Assault | Priority Assets | Ari Hartikainen |
| 316 | 3-3 | Fires of Purgation \| Brotherhood Strike | Purge the Foe | Gabor Csordas |
| 355 | 2-3-1 | Brotherhood Strike \| Argent Assault | Purge the Foe | Luke Handley |
| 381 | 2-4 | Banishers \| Argent Assault | Disruption | George Babagiannis |
| 406 | 2-4 | Warpbane Task Force | Take and Hold | Flament Paul |
| 447 | 2-4 | Warpbane Task Force | Take and Hold | Mickael Pouliquen |
| 450 | 2-4 | Brotherhood Strike \| Argent Assault | Purge the Foe | Vlad Olich |
| 472 | 2-5 | Brotherhood Strike | Purge the Foe | cedric chassaigne |
| 528 | 1-2 | Warpbane Task Force | Take and Hold | Dorian Jacquot |
| 554 | 1-5 | Banishers \| Argent Assault | Priority Assets | Kevin O'Connor |

**Baseline, with proper weighting:** no GK entry reached 5+ wins at this
578-player event, but the field itself is elite (WTC Warmaster — top players
worldwide), and the best GK result (scodge, 4-2, placing 134/578) is an
above-average record against that competition — he lost exactly one match that
kept him off our 5+ cut. That's a genuinely competent showing, not a failure;
don't read GK's absence from the 5+ list as "GK can't compete here."

**Real signal from the 16 entries:**
- **scodge's list (4-2) is the one GK Recon entry at the whole event, running
  Immaterial Interdiction + Sanctic Spearhead** — which is also our own settled
  detachment choice (confirmed, not up for further debate). Direct structural
  comparison against our locked list:

  | | scodge (4-2, real event) | Our locked list |
  |---|---|---|
  | Detachment | II + Sanctic Spearhead (3DP) | Same |
  | Warlord | Techmarine (cheap, disposable) | not yet explicitly set |
  | Dreadknight chassis | 2× GMND + 2× plain NDK (4 total) | 2× GMND + VenDread (3 total, no plain NDK) |
  | Infantry anchor | none — no Terminators, no Purifiers | BTS+Voldus, Purifier+Crowe |
  | Transport | 2× Razorback (75pts each, twin lascannon) + Land Raider Redeemer | 1× Rhino |
  | Interceptors | 3×5-man (125/125/135) | same, matches exactly |
  | Ally | Inquisitorial Agents (60pts, cheap bodies) | Callidus Assassin (100pts, specialist) |

  The Razorbacks stood out as notably efficient — 75pts each for a twin
  lascannon is cheap, real anti-armor output, not just a taxi. Land Raider
  Redeemer adds both mobility (Assault Ramp) and infantry-clearing (2x
  flamestorm cannon) in one package. Our build's biggest divergence is going
  infantry-anchor-heavy (BTS/Purifier) where the one real result goes
  Dreadknight-and-transport-heavy with zero infantry blobs — worth a real look
  at trial in the synthesis step, not just banked as trivia.
- **Warpbane Task Force is a clear loser for GK here**: 4 of the 6 worst GK
  results (3-3, 2-4, 2-4, 1-2) all ran it, all for Take and Hold.
- **Banishers|Argent Assault** is the most common pairing (4 entries) but wildly
  inconsistent (4-2 down to 1-5) — looks matchup/execution-dependent, not
  reliably strong or weak on its own.

## IMPORTANT METHODOLOGY CORRECTION — see aggregate stats below first

The section immediately below (7 anecdotal GK losses, 0 wins) was found by
reading the matchup logs of top-*opponent* lists — a method that can only ever
surface games the opponent won, by construction. It is NOT a real win-rate
signal and should not be read as "GK loses to X." The real signal is the
cross-event aggregate further down: **Reconnaissance is GK's best disposition
(67% win rate)**, which directly contradicts the pessimistic impression these
anecdotes create in isolation. Kept below for the specific tactical detail
(archetypes, scores, gameplan lessons) but do not treat the 0-for-7 framing as
a verdict on GK's viability.

## Anecdotal GK losses found via opponent matchup logs (selection-biased sample)

Found opportunistically in opponents' matchup logs while reading top lists —
NOT a full survey of every GK game at the event. 7 games found, all losses,
**because the method can't find wins** (see correction above). Still useful for
the specific tactical detail:

| Opponent | Score (GK-Opp) | Archetype |
|---|---|---|
| Orks | 57-91 | More Dakka\|Freebooter Krew |
| Orks | 72-85 | War Horde |
| Orks | 70-90 | More Dakka\|Freebooter Krew |
| Chaos Daemons | 23-100 | Slaanesh (Warptide\|Legion of Excess) |
| Chaos Daemons | 35-99 | Slaanesh (Warptide\|Legion of Excess) |
| Chaos Daemons | 42-75 | Slaanesh (Warptide\|Legion of Excess) |
| Adeptus Mechanicus | 96-98 | — (narrow, near-draw) |

Slaanesh Daemons (Contorted Epitome/Daemonettes/Fiends/Keeper of Secrets) is a
fast melee-monster army — per user's note, the blowout margins likely reflect
getting caught out of position against a fast-closing threat, a gameplan/
deployment lesson (don't clump, use own mobility to dictate engagement range),
not evidence the matchup is unwinnable. Orks' cheap-horde volume is a genuine
structural challenge (see Take and Hold section above) but the 67% Recon win
rate below suggests our gameplan already handles it well enough on average.

## Cross-event aggregate: GK win rate by disposition (the trustworthy number)

Checked 8 events for GK entries (WTC Warmaster GT 2026, Warhammer Open Newport,
Edmonton Wargaming Open, Surrey Primarchs GW Golden Ticket, Upkeep Games GT I,
Utah Cup 2026, Salt City GT, Lone Star Open 2026 — 39 GK players total, sizes
ranging 64-327 players). Most of these players didn't submit full lists to
listhammer (`hasList=0`), so this is a records-only aggregate, not a
composition study — but it's the first *unbiased* signal in this whole survey.

**Aggregate: 98-121-2 (44.3% win rate)** — below average but not catastrophic.

| Disposition | Record | Win rate | n |
|---|---|---|---|
| **Reconnaissance** | **8-4** | **67%** | 12 |
| Take and Hold | 13-16 | 45% | 29 |
| Priority Assets | 51-61 | 46% | 112 |
| Disruption | 7-10-1 | 39% | 18 |
| Purge the Foe | 19-30-1 | 38% | 50 |

**Reconnaissance is GK's clearly best disposition by win rate, and it's the one
we're building for.** Caveat: n=12 is a small sample with a wide confidence
interval — 8-4 could easily have been 6-6 or 10-2 on slightly different draws,
so treat this as "directionally encouraging," not "proven." It's still the best
signal in the whole survey precisely because it's unbiased (a real cross-event
record tally, not cherry-picked anecdotes), and it points the same direction as
scodge's own real result and community consensus. The anecdotal losses above
are real games that happened, but they're not representative of the
disposition's overall win rate — treat them as specific tactical lessons
(positioning vs fast melee armies, body-count problem vs Orks) rather than a
verdict against the archetype.

**Counter-example worth weighing, same caution applies:** David Harris (Lone
Star Open 2026, 327 players) went 4-2 running Banishers|Argent Assault /
Priority Assets with two full 10-man Paladin Squads (950pts combined) + GMND +
2 small Terminator squads + 2 Strike squads + Rhino — and his match log shows a
**95-73 win over Orks**, plus wins over Adeptus Mechanicus, Emperor's Children,
and Necrons, losses to Imperial Knights and Space Wolves. This is one list
beating one Ork opponent once — it doesn't prove "Paladin bricks solve Orks,"
but it's a real, concrete counterexample to the anecdotal Ork losses above, and
shows composition/gameplan clearly can flip a matchup that looked bad in
isolation.

## Synthesis — is our GK Recon list competitive, and what would we actually change?

Calibration first: everything below is drawn from one 578-player event studied
deeply plus a records-only skim of 7 more (39 GK players, 64-327 players each).
That's real, unbiased-where-it-counts data, but still a small slice of a whole
season. Treat conclusions as "reasonable working hypotheses," not settled.

**On competitiveness:** the honest answer is "probably yes, cautiously."
Reconnaissance is GK's best disposition in the cross-event aggregate (67%,
n=12) — a small but real sample pointing the same direction as scodge's actual
4-2 result and community consensus. GK's overall win rate (44.3%) is
below-average but not a lost cause, and the worst anecdotal results
(blowout losses to Slaanesh Daemons, moderate losses to Orks) came from a
selection-biased method that can't show wins — real counter-evidence exists
(David Harris beating Orks 95-73 with a completely different build). This
isn't "GK is secretly great," it's "GK-as-Recon is a defensible, not-crazy
choice," which is a meaningfully different and more useful claim.

**Concrete list-building takeaways, roughly in order of confidence:**

1. **Detachment: II + Sanctic Spearhead is confirmed correct, not up for
   further debate** — it's our own settled choice AND the only real
   Reconnaissance list found (scodge, 4-2) uses exactly this pairing.
2. **The infantry-anchor-heavy structure (BTS+Voldus, Purifier+Crowe) is the
   biggest open question, not a settled strength.** Every real high-performing
   GK list found across this whole survey — scodge's Recon list, David Harris's
   Priority Assets list — skews toward Dreadknight-chassis-and-vehicles or
   Paladin-bricks-plus-vehicles, not our specific BTS+Purifier combination.
   That's not proof our structure is wrong (small sample, different
   dispositions), but it's a real pattern worth a genuine trial: a
   Dreadknight/transport-heavy variant (closer to scodge's list: more plain
   NDK, Razorbacks, Land Raider Redeemer, cheap Techmarine Warlord) alongside
   our current build, not a forced replacement.
3. **Techmarine as a cheap, disposable Warlord** (confirmed in scodge's real
   list) is a free, low-risk adjustment worth adopting regardless of the
   bigger structural question — denies easy Assassinate/Warlord-kill value at
   effectively no cost.
4. **Crowe's Purifying Flame doubling (now correctly modeled in the tool) is
   validated as a strong anti-horde/anti-elite-infantry tool** — directly
   relevant to the Ork body-count problem identified in the Take and Hold
   section, independent of whether we keep the BTS/Purifier structure or shift
   toward Dreadknights.
5. **Avoid Warpbane Task Force and Brotherhood Strike for Take and Hold /
   Purge the Foe respectively** — both show up disproportionately among the
   worst GK results in the WTC dataset (small sample, but a consistent one).
6. **Gameplan lesson, not a list change:** against fast melee-monster armies
   (Slaanesh Daemons), the anecdotal blowout losses likely reflect getting
   caught out of position rather than a stat-line problem — deployment
   discipline and using our own mobility to dictate engagement range matters
   at least as much as list composition here.

**What we did NOT establish:** whether our exact current build (as opposed to
the Dreadknight/transport-heavy alternative) wins or loses more than average —
no real GK list matching our specific composition was found anywhere in this
survey to check directly. That's the natural next step if we want a firmer
answer: simulate our actual list against the specific threat profiles found
here (Ork Boyz/Gretchin/Lootas, Slaanesh Daemonettes/Fiends/Keeper of Secrets,
Dark Angels' Lion El'Jonson speed force) in the evaluator, which was explicitly
deferred earlier in favor of this survey.

## Can our current list (1985pt, Techmarine Warlord + 2xRazorback + VenDread version)
## actually kill the specific "boogeyman" units found in this survey?

Added real datasheet-backed target profiles to the evaluator's meta tab
(`src/factions/votann.js` TARGETS, shared across all factions) for the key
dangerous units identified above: Daemonette squad (10W), Keeper of Secrets
(18W monster), Fiends (24W), Ork Boyz blob (20W), plus the already-existing
Bloodcrusher (24W). Then checked our list's kill% (damage as % of the unit's
total wounds — 100%+ means a reliable one-activation wipe) both per-unit and
as a whole-list total.

**Framing, per user correction:** raw kill% matters less than whether we can
kill *enough in one go* to deny scoring/an action, or avoid being denied
ourselves — partial chip damage across multiple turns doesn't secure anything
most missions care about (see `primary-missions.txt` — kill-bonus VP require
a destroyed unit, not damage dealt).

**Trivially one-shot by any single unit in our list** (no focus-fire needed):
Daemonettes (any unit ≥113% alone; Crowe+Purifiers alone hits 644%), Fiends
(any unit ≥80%), Ork Boyz (any unit ≥71%, GMND alone at 144%). **Our killing
capacity against the actual chaff/mid-tier units in these lists is not the
problem.** This strongly implies the earlier blowout losses to Slaanesh
Daemons (100-23, 99-35) were NOT about failing to kill Daemonettes/Fiends —
those die easily to anything we own — but about their speed/alpha-strike
getting to us first, or committing too little to a Keeper of Secrets and
having it survive to swing back. A positioning/sequencing lesson, not a list
problem. Same logic for Orks: Boyz die easily, the real issue is their *unit
count* (Lootas, multiple Dakkarigs, Gretchin, Squighogs all needing separate
attention) outpacing how many targets we can wipe per turn — a coverage
problem, not a lethality one.

**Genuinely hard, needs real commitment:**
- **Keeper of Secrets (18W monster)** — even our best single answer
  (Crowe+Purifiers) only reaches 95%; GMND/BTS/Interceptors sit at 77-91%.
  Needs two units focusing it in the same activation to guarantee the wipe,
  or a stratagem boost (see below).
- **Bloodcrusher (24W)** — Crowe+Purifiers clears it alone (136%), but
  GMND/BTS alone (75-77%) are borderline, not reliable solo answers.

**Stratagem check — what can we rely on with minimal decision-making?**
Sanctic Spearhead's *Abominus-Class Targets* (1CP, +1 to wound vs
MONSTER/VEHICLE) tested against Keeper of Secrets:

| Unit | Base | +1CP (Abominus-Class Targets) |
|---|---|---|
| Crowe+Purifiers | 95% | **156%** |
| BTS10 | 77% | **123%** |
| 3× Interceptor | 91% | **148%** |
| GMND | 77% | 80% (barely moves) |

**Counterintuitive but clear: don't spend the CP on GMND** — its own Surge of
Wrath ability already rerolls wounds vs MONSTER/VEHICLE, so the stratagem's
+1-to-wound overlaps and adds almost nothing. **Spend it on BTS or
Crowe+Purifiers instead** — turns a shaky ~77-95% into a comfortable
120-156% overkill. That's the repeatable, low-thought play: Keeper of Secrets
(or any real Monster/Vehicle) in range → 1CP Abominus-Class Targets on
whichever of BTS/Crowe-Purifiers/Interceptors is already in range, not GMND.

**Resolved — full Immaterial Interdiction text now in `ref/greyknights-11th-detach.txt`.**
Every II stratagem/enhancement is Interceptor-Squad-specific: Echojump (D6+1"
surge move after shooting, but replaces that unit's Personal Teleporters use
that turn — an either/or, not a stack), Predestined Coordinates/Astral Overlap
(enhancements, turn-1 ingress / Stealth), Blades from the Beyond (1CP, charged
Interceptor Squad's melee gains [LANCE] — not Lethal+Sustained as scodge's
Discord paraphrase suggested, just LANCE, and Interceptors' S4 melee means
this doesn't make them a real answer to Keeper of Secrets/Bloodcrushers even
with the wound bonus), By Thought Alone (1CP, action+shoot same phase),
Responsive Displacement (1CP, reactive move). **None of this touches
GMND/BTS/Purifiers/VenDread — it's a separate mobility/action-economy layer,
not a kill-boosting one.** So the earlier finding stands as the complete
answer, not a partial one: Sanctic's Abominus-Class Targets on BTS or
Crowe+Purifiers is the actual reliable kill-boosting tool available to us.

## Points-version sanity check: is any of this data stale?

WTC Warmaster ran 2026-08-11–13, three days after MFM v1.2 went legal
(2026-08-05) — so Warmaster was played entirely under v1.2. Checked
`mfmdiff.com` for all four factions we track: **Grey Knights, Leagues of
Votann, Adeptus Custodes, and Chaos Knights all had zero points changes
between v1.1 and v1.2.** So none of the analysis in this file (or our own
list data, still labeled "v1.1" in the faction files) is stale on points
grounds — the numbers didn't move. This wouldn't catch a non-points rules
change from a Balance Dataslate/FAQ, but MFM updates are points-only by GW
convention, so the risk that matters here is closed.

## Two more events, evaluated separately

Reconnaissance archetype composition for Warhammer Open Newport and The
Upkeep Games GT I - the skimmer-spam cluster, the Magnus/Lord of Change/
Kairos deathstar, the Slaanesh boogeyman-trio confirmation, and the
Librarius Conclave Take and Hold shell - has moved to its own dedicated
files, matching this file's structure and depth rather than being tacked on
here as extra sections:

- `warhammer-open-newport-2026-meta-notes.md`
- `upkeep-games-gt-i-2026-meta-notes.md`

See `40k-v1.2-meta-competitive-thoughts.md` for the merged cross-event view.

## Full-field breakdown: all 587 lists by performance tier

Everything above uses the 55 five-plus-win lists (top ~9% of the 578-600
player field, depending which player-count field you read from the API).
That's a strong signal for "what's winning outright," but it's a small
slice - Warmaster actually has list data for 587 of ~600 entrants, so the
same source lets us look at the *whole* field, not just the top. Pulled all
587 via `scripts/scrapers/listhammer.py event d0f86a313ef8c966e4 --min-wins
0 --save-dir ref/ingest/lists`, split into five win-count tiers (round count
appears to be 6, so 5+ wins/top(5+), 4 wins/upper-mid, 3 wins/mid, 2 wins/
lower-mid, 0-1 wins/bottom). Reporting what the data shows across a few
different angles below - deliberately not drawing conclusions past what the
numbers directly support, per the caution to avoid leaps.

**Tier sizes:** top(5+) n=55, upper-mid(4) n=118, mid(3) n=171, lower-mid(2)
n=140, bottom(0-1) n=103.

### Angle 1: does disposition share shift between winning and losing tiers?

| Disposition | top(5+) | upper-mid(4) | mid(3) | lower-mid(2) | bottom(0-1) |
|---|---|---|---|---|---|
| Reconnaissance | 27% (15) | 20% (24) | 19% (32) | 19% (27) | 17% (18) |
| Priority Assets | 27% (15) | 30% (35) | 34% (58) | 31% (43) | 37% (38) |
| Take and Hold | 27% (15) | 24% (28) | 27% (46) | 26% (37) | 26% (27) |
| Purge the Foe | 16% (9) | 17% (20) | 14% (24) | 16% (23) | 17% (17) |
| Disruption | 2% (1) | 9% (11) | 6% (11) | 7% (10) | 3% (3) |

What the numbers show: Reconnaissance's share falls in a straight line from
top to bottom (27%→20%→19%→19%→17%). Priority Assets shows the opposite
direction (27%→30%→34%→31%→37%), though not as cleanly monotonic in the
middle tiers. Take and Hold, Purge the Foe, and Disruption stay roughly flat
across every tier. This is the largest sample we've looked at for this
question (587 lists vs. the cross-event aggregate's n=12 GK-specific
games), and at this event specifically, Reconnaissance lists placed better
than their overall frequency would predict, Priority Assets lists placed
worse. Caveat: this is one event, disposition choice is one of many
variables (faction, list quality, matchup luck, player skill all vary too),
and correlation here doesn't establish that choosing Reconnaissance *causes*
better results - it's a real pattern worth registering, not a proven
mechanism.

### Angle 2: does faction share shift between winning and losing tiers?

| Faction | top(5+) | upper-mid(4) | mid(3) | lower-mid(2) | bottom(0-1) | total |
|---|---|---|---|---|---|---|
| Chaos Daemons | 10 | 8 | 15 | 8 | 4 | 45 |
| Orks | 9 | 14 | 9 | 4 | 5 | 41 |
| Dark Angels | 7 | 3 | 7 | 3 | 3 | 23 |
| Emperor's Children | 2 | 11 | 15 | 10 | 9 | 47 |
| Necrons | 4 | 10 | 12 | 9 | 8 | 43 |
| Adeptus Custodes | 4 | 6 | 11 | 6 | 8 | 35 |
| Tyranids | 1 | 6 | 11 | 11 | 5 | 34 |
| T'au Empire | 1 | 9 | 9 | 9 | 6 | 34 |
| Chaos Space Marines | 0 | 5 | 11 | 3 | 7 | 26 |
| Grey Knights | 0 | 3 | 5 | 6 | 2 | 16 |

What the numbers show: some factions have a similar total volume but very
different distribution shapes. Chaos Daemons (45 total) and Orks (41 total)
both put a large share of their entries in the top tier (10/45=22% and
9/41=22% respectively) relative to their share of the bottom tier
(4/45=9% and 5/41=12%). Dark Angels (23 total) is the most lopsided of all -
7 of 23 (30%) in the top tier, 3 of 23 (13%) in the bottom, and literally
zero Dark Angels entries anywhere in this table's other tiers' top-6 lists
(meaning very few Dark Angels players placed in the middle either - most DA
entries are concentrated at the very top or scattered thin elsewhere).
Emperor's Children (47 total, the single largest faction count in this
table) shows close to the opposite shape - only 2 of 47 (4%) reached the
top tier, while 15 of 47 (32%) landed in the mid tier and 9 of 47 (19%) in
the bottom - the most entries of any tracked faction in the bottom tier.
Necrons (43 total) and Adeptus Custodes (35 total) are the most evenly
spread across all five tiers of any faction checked - present everywhere,
concentrated nowhere.

**What this doesn't tell us, and needs actual list reads to answer** (per
your question about whether bottom results are a list-building problem or a
matchup/skill problem): Emperor's Children shows up at every tier including
the top, so the faction itself isn't unplayable - the question is whether
the top-tier and bottom-tier Emperor's Children entries are running
recognizably different sub-archetypes (a list-composition signal) or
whether they're similar lists with different matchup luck/pilot skill (not
a list signal at all). That requires reading actual list text on both ends,
which the full download now sitting in `ref/ingest/lists/` makes possible -
flagged as a follow-up, not yet done.

Grey Knights (16 total) is covered in detail in the dedicated section above
- no entries in the top tier, one entry each in bottom(0-1) explained by
Warpbane Task Force's uniformly poor showing there.

### Angle 3: what this means for our own list, stated carefully

Reconnaissance placing better than its base rate at this specific event is
a second, much larger-sample data point in the same direction as the
cross-event aggregate's 67% GK Reconnaissance win rate (n=12) - both point
toward "Reconnaissance is not a weak disposition to be building around,"
which is reassuring but not new information, just better-supported. What
*is* new: no claim above says anything about *why* Reconnaissance performs
this way at this event (faster missions rewarding action-taking, a
disposition-specific scoring quirk, or simply that stronger players
gravitated to it) - that mechanism question is open, and worth being honest
that we don't have the data to answer it yet.

## What do winning Reconnaissance lists specifically look like? (116 lists, all tiers)

The angles above look at Reconnaissance vs. the other four dispositions.
This section stays inside Reconnaissance only and asks what separates its
better-placing lists from its worse-placing ones - unit count, detachment
choice, and (with real caveats) mobility investment. Built with a new
reusable tool, `scripts/scrapers/list_stats.py`, which parses saved list
text for a rough unit count and a mobility-keyword count; see the tool's own
comments for exactly what it can and can't detect (it undercounts mobility
for any faction whose speed comes from something other than a named fast
vehicle/transport, since jump packs, jetbikes-by-other-names, and Deep
Strike/Scout abilities aren't visible in the exported list text at all).

**Unit count by tier:**

| Tier | n | mean | median | min | max |
|---|---|---|---|---|---|
| top(5+) | 15 | 15.9 | 16.0 | 14 | 20 |
| upper-mid(4) | 24 | 16.5 | 16.0 | 12 | 22 |
| mid(3) | 32 | 16.9 | 16.0 | 11 | 26 |
| lower-mid(2) | 27 | 17.8 | 18.0 | 13 | 22 |
| bottom(0-1) | 18 | 17.6 | 18.0 | 10 | 23 |

What the numbers show: the top tier is both the lowest-average (15.9) and
the most tightly clustered (range 14-20, a spread of 6) of all five tiers.
The bottom tier has a noticeably wider spread (range 10-23, a spread of 13)
- both the single lowest unit count in the whole Reconnaissance sample (10,
a 1-4 Chaos Daemons Warptide list) and one of the highest (23, appearing
twice) show up at the bottom, not just low counts. Read carefully: this
isn't "fewer units wins" or "more units wins" in a straight line - it's
that unit counts *outside* roughly 14-20 appear more often paired with
losing records than counts inside that band. That's a correlation in the
data, not a mechanism - list size is entangled with faction (elite armies
like Custodes/Grey Knights naturally run fewer, bigger units than horde
factions like Genestealer Cult/Astra Militarum) so this isn't isolating
"unit count" as an independent variable on its own.

Our own reference point: scodge's Grey Knights Reconnaissance list (4-2,
upper-mid tier) runs 14 units - the same number as the lowest list in the
top tier, sitting inside the 14-20 band associated with better placements
here.

**Detachment concentration within the single largest archetype (Dark
Angels, 15 of 116 Reconnaissance lists):** 13 of 15 run the identical
Darkflight Pursuit | Company of Hunters pairing (the other 2 run a
Librarius Conclave variant). Their records, in full: 5-1, 5-1, 5-1, 5-1,
5-1, 5-1, 4-2, 4-1, 3-3, 3-2, 3-2, 3-1, 2-3, 2-1, 1-5. Even holding
detachment (and roughly unit count - all but two of these sit in the
15-18 range) constant, records span the entire possible range from 5-1
down to 1-5. Stated plainly: a near-identical, repeatedly-chosen shell
does not produce a narrow band of outcomes - matchup and/or execution
variance is doing real work even for what looks like a "solved" list from
the outside.

**Faction share within Reconnaissance specifically, top vs. bottom tier**
(full table already in the Angle 2 breakdown above, repeated here filtered
to just this disposition): Dark Angels holds 6 of 15 top-tier Reconnaissance
slots (40%) against 1 of 18 bottom-tier slots - the most lopsided
distribution of any faction in this disposition. Emperor's Children, which
skewed heavily toward the bottom in the whole-field breakdown (Angle 2:
only 2/47 in the top tier overall), looks close to proportional *within*
Reconnaissance specifically (2 of 15 top-tier, 14 total Reconnaissance
entries) - meaning Emperor's Children's overall weak showing isn't
concentrated in this one disposition; whatever is happening to that faction
elsewhere isn't visibly repeating itself here.

**Mobility keyword count:** flat across every tier (1.1-1.3 average, no
separation). Given the tool's stated blind spots (misses jump packs,
non-vehicle fast movement, and all deep-strike/scout-move abilities
entirely), this result should be read as "inconclusive with this
measurement," not "mobility doesn't matter" - the tool likely isn't
sensitive enough to detect a real effect here even if one exists.



- Matchup reconstruction idea (cross-reference all 600 players' round-by-round
  score logs by reciprocal score + faction to identify actual opponents without
  BCP) — viable, not yet attempted. Score collisions are a real risk.
- Reference faction datasheets now in `ref/`: chaos-daemons, orks, tau,
  thousand-sons, emperors-children, space-marines, dark-angels (DA chapter
  filtered). Custodes/Votann/GK/Chaos Knights already fully tracked.

## Final verdict on GK competitiveness

**Competitive: probably yes, cautiously — this hasn't changed since the
Synthesis section above, but it's now resting on more than one event.** The
cross-event aggregate (39 GK players, 8 events) still shows Reconnaissance as
GK's best disposition (67%, n=12) against a below-average overall rate
(44.3%). The two extra events pulled since Synthesis was written (Newport,
Upkeep) didn't add GK Reconnaissance data points directly (only one GK entry
found, and it was Take and Hold), but they did stress-test the *matchup*
side of the picture, and nothing found there overturns the verdict:

- **Our kill-tools hold up against every new threat found.** The Abominus-
  Class Targets stratagem answer (BTS/Crowe+Purifiers, not GMND) that worked
  against Keeper of Secrets and Bloodcrusher works the same way against
  Magnus the Red (78%→125%, 75%→116%) — this is now a validated, repeatable
  pattern across three independent hard targets, not a one-off tuned to a
  single boogeyman.
- **New threats to actually prep for, not yet in the matchplay reference:**
  the Space Marine "Land Speeder/Storm Speeder skimmer spam" Reconnaissance
  shell (4 players, but concentrated at one event with zero sightings at a
  second - possible, not confirmed), the Space Marine "Librarius Conclave +
  Reclamation Force" melee-deathball Take and Hold shell (3 independent
  players across two events, would face us if we're forced into playing
  their mirror mission),
  and the Thousand Sons "four Monsters in one list" deathstar (Magnus + 2x
  Lord of Change + Kairos) as a harder version of the Keeper problem — needs
  the stratagem more than once per game, which we can't fully model yet.
- **Nothing here changes the structural open question from Synthesis**: we
  still haven't found a real GK list matching our specific BTS+Purifier
  composition to check directly — that remains the honest gap, not something
  this round of data closed.

**Bottom line:** the list is a defensible, evidence-backed choice for
Reconnaissance, our kill math is now validated against a wider and harder
set of targets than when this doc started, and the concrete prep items are
(1) trial a Dreadknight/transport-heavy variant per Synthesis point 2, (2)
add the SM skimmer-spam and Librarius Conclave shells to the matchplay
reference's threat list, (3) treat Magnus-style multi-Monster lists as a
"need the stratagem more than once" edge case rather than assuming one CP
solves it.
