#!/usr/bin/env python3
"""Extract structured stats (unit count, mobility indicators) from a directory
of list .txt files saved by listhammer.py's --save-dir option. Each file's
self-describing header comment (player/faction/detachment/disposition/record/
placing) is parsed directly - no need to re-fetch the event JSON.

Usage:
    python3 scripts/scrapers/list_stats.py <dir> [--disposition "Reconnaissance"] [--min-wins N]
    python3 scripts/scrapers/list_stats.py <dir> --disposition Reconnaissance --tier-summary
"""
import argparse
import re
import sys
from pathlib import Path

HEADER_RE = re.compile(
    r"^# (?P<player>.+) - (?P<faction>.+)\n"
    r"# (?P<detachment>.+) \| (?P<disposition>.+)\n"
    r"# record: (?P<wins>\d+)-(?P<losses>\d+)(?:-(?P<draws>\d+))?, placing (?P<placing>\S+)\n"
    r"# (?P<url>\S+)\n",
    re.MULTILINE,
)

# Units/keywords that grant real battlefield mobility (fast movement, deep
# strike, or a dedicated transport) - a rough proxy count, not exhaustive.
MOBILITY_KEYWORDS = [
    "Land Speeder", "Storm Speeder", "Jetbike", "Outrider", "Bike Squad",
    "Attack Bike", "Rhino", "Razorback", "Land Raider", "Venom", "Raider",
    "Wave Serpent", "Falcon", "Skorpius Dunerider", "Trukk", "Battlewagon",
    "Ravager", "Immolator", "Repressor", "Impulsor", "Gladiator",
]

# Two distinct export formats seen in the wild:
# - app-native: "Unit Name\n123 points" (or "Points")
# - WTC-style pasted export: "Char2: 1x Unit Name\n123 pts", and usually
#   states its own unit count on a "+ NUMBER OF UNITS: N" header line, which
#   is used directly instead of counting headers (the pasted format's
#   "Char2:"/"Vehi4:"-prefixed headers don't cleanly match the same regex).
UNIT_HEADER_RE = re.compile(r"^(?!\s*[•◦])(.+)\n(\d[\d,]*)\s*(?:[Pp]oints?|pts)\s*$", re.MULTILINE)
WTC_UNIT_COUNT_RE = re.compile(r"^\+\s*NUMBER OF UNITS:\s*(\d+)", re.MULTILINE)
# Rare third variant (seen in ~2/587 Warmaster files, likely an HTML->text
# stripping quirk): name and points glued onto one line with no separator,
# e.g. "Patriarch105 Points". Only used as a fallback when the primary regex
# finds nothing, to avoid false-positives on the far more common formats.
GLUED_UNIT_RE = re.compile(r"^(?!\s*[•◦])(\D+?)(\d[\d,]*)\s*(?:[Pp]oints?|pts)\s*$", re.MULTILINE)
SECTION_LABELS = {
    "attached units", "characters", "battleline", "other datasheets",
    "dedicated transports", "epic hero", "allied units",
}


def parse_file(path):
    text = path.read_text(encoding="utf-8")
    m = HEADER_RE.match(text)
    if not m:
        return None
    d = m.groupdict()
    body = text[m.end():]
    # Every list ends with a "Matchups" section (opponent faction + score
    # pairs, e.g. "Adeptus Custodes\n95 pts\nv\nBlood Angels\n54 pts") that
    # matches the same "name line followed by a points line" shape as a real
    # unit header - cut it off before parsing units, or match records get
    # miscounted as army units.
    body = re.split(r"^Matchups$", body, maxsplit=1, flags=re.MULTILINE)[0]

    units = [
        h.strip() for h, pts in UNIT_HEADER_RE.findall(body)
        if h.strip().lower() not in SECTION_LABELS and not h.strip().startswith("Attached Unit ")
    ]
    if not units:
        units = [
            h.strip() for h, pts in GLUED_UNIT_RE.findall(body)
            if h.strip().lower() not in SECTION_LABELS and not h.strip().startswith("Attached Unit ")
        ]
    wtc_count = WTC_UNIT_COUNT_RE.search(body)
    unit_count = int(wtc_count.group(1)) if wtc_count else len(units)
    mobility_hits = [kw for kw in MOBILITY_KEYWORDS if kw in body]

    return {
        "player": d["player"], "faction": d["faction"], "detachment": d["detachment"],
        "disposition": d["disposition"], "wins": int(d["wins"]), "losses": int(d["losses"]),
        "draws": int(d["draws"] or 0), "placing": d["placing"],
        "unit_count": unit_count, "units": units,
        "mobility_count": len(mobility_hits), "mobility_hits": mobility_hits,
        "path": str(path),
    }


def tier(wins):
    if wins >= 5: return "top(5+)"
    if wins >= 4: return "upper-mid(4)"
    if wins >= 3: return "mid(3)"
    if wins >= 2: return "lower-mid(2)"
    return "bottom(0-1)"


def main():
    ap = argparse.ArgumentParser()
    ap.add_argument("dir")
    ap.add_argument("--disposition")
    ap.add_argument("--min-wins", type=int, default=0)
    ap.add_argument("--tier-summary", action="store_true", help="print aggregate stats grouped by win tier instead of per-list rows")
    args = ap.parse_args()

    rows = []
    for path in sorted(Path(args.dir).glob("*.txt")):
        r = parse_file(path)
        if not r:
            print(f"skip (unparseable header): {path}", file=sys.stderr)
            continue
        if args.disposition and r["disposition"] != args.disposition:
            continue
        if r["wins"] < args.min_wins:
            continue
        rows.append(r)

    if not rows:
        print("no matching lists found")
        return

    if args.tier_summary:
        from collections import defaultdict
        by_tier = defaultdict(list)
        for r in rows:
            by_tier[tier(r["wins"])].append(r)
        print(f"{'Tier':<16}{'n':>4}{'avg units':>12}{'avg mobility':>14}")
        for t in ["top(5+)", "upper-mid(4)", "mid(3)", "lower-mid(2)", "bottom(0-1)"]:
            grp = by_tier.get(t, [])
            if not grp:
                continue
            avg_u = sum(r["unit_count"] for r in grp) / len(grp)
            avg_m = sum(r["mobility_count"] for r in grp) / len(grp)
            print(f"{t:<16}{len(grp):>4}{avg_u:>12.1f}{avg_m:>14.1f}")
        return

    print(f"{'Record':<8}{'Units':>6}{'Mobility':>9}  {'Faction':<20}{'Detachment'}")
    for r in rows:
        rec = f"{r['wins']}-{r['losses']}" + (f"-{r['draws']}" if r['draws'] else "")
        print(f"{rec:<8}{r['unit_count']:>6}{r['mobility_count']:>9}  {r['faction']:<20}{r['detachment']}")


if __name__ == "__main__":
    main()
