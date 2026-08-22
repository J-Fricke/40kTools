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

## Two more events, evaluated separately: Warhammer Open Newport + The Upkeep Games GT I

Pulled actual list composition (not just win/loss records) for two more of
the events already counted in the cross-event aggregate above. Both post-v1.2,
directly comparable to our own data. This doesn't change the win-rate table
above (those events were already counted there) — it's a composition/
archetype layer on top. Unlike Warmaster, these are **all submitted lists,
not filtered to 5+ wins** (both events had far fewer full-list submissions,
so no min-wins filter was applied) — treat as "what's being played" more than
"what's definitely winning."

### Warhammer Open Newport (2026-08-14–16, 188 players, 21 lists submitted)

Disposition frequency: Take and Hold 38% (8), Reconnaissance 29% (6),
Priority Assets 19% (4), Purge the Foe 14% (3), Disruption 0%.

Faction spread: 4x Orks, 4x Space Marines, 2x Adeptus Custodes, 2x Chaos
Daemons, 1 each Adeptus Mechanicus/Drukhari/Dark Angels/Space Wolves/
T'au/Thousand Sons/Emperor's Children/Grey Knights/Black Templars.

One Grey Knights entry (Ryan Johnson, 5-3, Warpbane Task Force/Take and
Hold) — already counted in the aggregate table above. Not our archetype
(Take and Hold, not Reconnaissance), so it doesn't validate or invalidate our
specific build, just confirms GK players are spread across multiple
disposition/detachment choices at this level.

### The Upkeep Games GT I (2026-08-15–16, 126 players, 21 lists submitted)

Disposition frequency: Take and Hold 38% (8), Purge the Foe 24% (5),
Priority Assets 19% (4), Reconnaissance 14% (3), Disruption 5% (1).

Faction spread: 3 each T'au/Space Marines/Orks, 2 each Emperor's Children/
Tyranids/Blood Angels, 1 each Chaos Space Marines/Thousand Sons/Adeptus
Custodes/Black Templars/Imperial Knights/Necrons. No Grey Knights entries.

**Reconnaissance archetypes found (9 lists total across both events, read in full):**

- **"Skimmer spam" shell found - but concentrated at one event, not confirmed
  cross-event.** 4 of Newport's 6 Reconnaissance lists (Dark Angels/Lion
  El'Jonson, Raven Guard/Kayvaan Shrike, and two separate plain Space Marines
  lists incl. Vulkan He'stan) ran 2-3x Land Speeder plus 2-3x Storm Speeder
  variants (Hailstrike/Hammerstrike/Thunderstrike). **Zero of Upkeep's 3
  Reconnaissance lists ran this shell.** Read as "this specific 188-player
  field had a skimmer-spam cluster" (a local-scene/netlist-copy effect is
  plausible) rather than "the format is trending toward skimmer spam" — the
  second data point that would confirm a real cross-event trend isn't there
  yet. Worth re-checking at the next event before treating it as a threat
  you'll definitely see, rather than one you might see.
- **Emperor's Children Recon (Upkeep) runs the exact boogeyman trio already
  profiled** in this doc: Keeper of Secrets + 4x Daemonettes (90pts each) +
  2x Defiler. Confirms that matchup is a live Recon-vs-Recon threat, not just
  a Priority Assets/Slaanesh theorycraft case.
- **New, harder case, now modeled**: Thousand Sons' (Newport) "Reconnaissance
  (thicc)" list stacks Magnus the Red (455pts) + 2x Lord of Change (650pts
  combined) + Kairos Fateweaver (305pts) + an Exalted Sorcerer — four separate large
  MONSTERs in one 2000pt list. Lord of Change's stat line (T10/6+/4++/18W) is
  defensively identical to the already-modeled Keeper of Secrets profile in
  this engine's math (its Sv6+ never beats its own 4++, same as Keeper's
  Sv5+) - no new profile needed there. Magnus is the real outlier: T11/**2+**/
  4++/16W - his actual armor save matters (unlike Keeper/LoC), added as a new
  `magnus` target profile. Kill% vs Magnus, base / with Abominus-Class
  Targets:

  | Unit | Base | +1CP (Abominus-Class Targets) |
  |---|---|---|
  | Crowe+Purifiers | 78% | **125%** |
  | BTS10 | 75% | **116%** |
  | 3x Interceptor | 87% | **135%** |
  | GMND | 73% | 81% (barely moves, same Surge of Wrath overlap as Keeper) |

  Same pattern as Keeper: don't spend the CP on GMND, spend it on BTS/
  Crowe+Purifiers/Interceptors. Caveat: Magnus's Unearthly Power lets him pick
  one Crimson King ability per battle round; if he calls Impossible Form that
  round, non-psychic attacks vs him take -1 Damage (opponent's choice, not
  modeled here) - so real in-game kill% could be softer on any given round.
  Also: a list with four huge Monsters needs the stratagem applied repeatedly
  across the game, not once - worth a follow-up once we can simulate
  multi-turn CP usage rather than single-activation snapshots.
- **T'au (Kauyon Crisis-suit spam, Upkeep) and Drukhari (Lelith/Archon/
  Drazhar/Lady Malys multi-Incubi+Wych blade list, Newport) Recon builds are
  opposite-profile threats** — pure ranged alpha-strike vs. fast melee
  blade-spam — no single tactic in our current matchplay reference covers
  both.
- Adeptus Custodes Recon (Upkeep) (Trajann + 2x Shield-Captain/Dawneagle +
  5x Vertus Praetors + 3x undersized Allarus squads + Witchseekers) is a
  mixed elite-melee/anti-horde build, distinct from either extreme above.

## Cross-event archetype confirmations from the other 33 lists (Take and Hold/Priority Assets/Purge the Foe/Disruption)

Didn't open every one of these 33 (much smaller, more scattered faction
spread than Warmaster's 55 - most factions show up only once or twice), but
the detachment-name column of the standings itself surfaces two repeated
archetypes worth confirming with a full read:

- **Orks "Freebooter Krew | Equatorial Hordes" repeats 3 of 3 Ork Take and
  Hold entries**: Jake Dinner and Jude Burges at **Newport**, Rick Kincaid at
  **Upkeep**. Read Rick Kincaid's list in full: opens with Ghazghkull Thraka
  + 19 Boyz (Warlord) + Painboy, second Boyz blob with Warboss + Painboy —
  the exact same "Ghazghkull+19 Boyz" core shell identified at Warmaster.
  Third independent confirmation of this being the near-solved Ork Take and
  Hold shell, not a Warmaster-specific artifact.
- **Space Marines "Librarius Conclave | Reclamation Force" repeats 3 times**
  in Take and Hold: Adam Crellin at **Newport**, Kramer Doyle and Jerry
  Reynolds at **Upkeep** - a pattern Warmaster's own Take and Hold section
  didn't show at all (that section was Orks/Custodes/Necrons/Space
  Wolves/Tyranids, no Space Marines). Read Adam Crellin's and Kramer Doyle's
  lists in full: both are big multi-character melee/elite deathballs
  (Captain Titus + Wardens of Ultramar + Bladeguard Veterans in one; Marneus
  Calgar + Cato Sicarius + Victrix Honour Guard + Sternguard in the other) -
  same detachment combo (psychic buff auras + army-wide reinforcement) built
  around different specific elite blocks each time. Worth watching as an
  emerging Take and Hold archetype, not yet in the matchplay reference.

Everything else in this batch (AdMech 8-0 Priority Assets at Newport, T'au
Mont'ka 7-1 at Newport, Thousand Sons/Emperor's Children/Tyranids/Imperial
Knights Priority Assets at Upkeep, Custodes/Chaos Daemons Purge the Foe at
Newport, Chaos Space Marines/Necrons/Blood Angels Purge the Foe at Upkeep,
one Ork Disruption entry at Upkeep) are one-off data points - no repeated
pattern to confirm, not worth a deep read for a single result each.

## Open threads / not yet resolved

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
