#!/usr/bin/env python3
"""
listhammer.info-specific scraper. Generic HTTP/HTML helpers live in common.py.

listhammer.info is a Nuxt SPA - the pages themselves are mostly client-rendered,
but two things work reliably with a plain HTTP client (see common.py for the
required browser-like User-Agent):

  - Event standings:  GET https://listhammer.info/api/events/<eventId>
                       -> JSON {eventResult, eventPlayersResult}. eventPlayersResult
                       is a flat list of every player in the event, each with
                       faction / detachment / disposition / wins / draws / losses /
                       placing / a `listUid` field.

  - Individual list:  GET https://listhammer.info/list/<listUid>
                       -> full HTML page, server-rendered with the list's actual
                       units/points as visible text, plus a trailing per-round
                       "Matchups" section (opponent faction + score each round -
                       real signal, kept rather than stripped). The page also
                       carries ~70 lines of site-nav faction-menu chrome before
                       the actual list content; that part is trimmed by finding
                       the list's title line, which always matches
                       "<name> (<N> points)" and is the first such line on the page.

Usage:
    # Print the standings table for an event (optionally filtered)
    python3 scripts/scrapers/listhammer.py event <eventId> [--min-wins N] [--faction "Chaos Daemons"] [--disposition "Purge the Foe"]

    # Fetch one list's clean text by its listUid
    python3 scripts/scrapers/listhammer.py list <listUid>

    # Fetch every list matching a filter and write each to a directory
    python3 scripts/scrapers/listhammer.py event <eventId> --min-wins 5 --save-dir ref/ingest/lists
"""
import argparse
import json
import re
import sys
import time
from pathlib import Path

from common import http_get, html_to_text, safe_filename

BASE = "https://listhammer.info"


def fetch_event(event_id: str) -> dict:
    return json.loads(http_get(f"{BASE}/api/events/{event_id}"))


def fetch_list_text(list_uid: str) -> str:
    raw_html = http_get(f"{BASE}/list/{list_uid}")
    text = html_to_text(raw_html)
    lines = text.split("\n")
    title_idx = next(
        (i for i, l in enumerate(lines) if re.search(r"\(\d+\s*points?\)\s*$", l)),
        0,
    )
    return "\n".join(lines[title_idx:])


def filter_players(players: list, min_wins=None, faction=None, disposition=None) -> list:
    out = []
    for p in players:
        if not p.get("hasList"):
            continue
        if min_wins is not None and p.get("wins", 0) < min_wins:
            continue
        if faction and p.get("faction", "").lower() != faction.lower():
            continue
        if disposition and p.get("disposition", "").lower() != disposition.lower():
            continue
        out.append(p)
    out.sort(key=lambda p: p.get("placing") or 9999)
    return out


def cmd_event(args):
    data = fetch_event(args.event_id)
    players = data["eventPlayersResult"]
    matched = filter_players(players, args.min_wins, args.faction, args.disposition)

    print(f"{data['eventResult'].get('name', args.event_id)} - {len(matched)}/{len(players)} players matched\n")
    for p in matched:
        rec = f"{p['wins']}-{p['losses']}" + (f"-{p['draws']}" if p.get("draws") else "")
        print(f"#{p.get('placing','?'):<4} {rec:<8} {p['faction']:<20} {p['detachment']:<40} {p['disposition']:<15} {p['playerName']}  [{p['listUid']}]")

    if args.save_dir:
        event_name = data["eventResult"].get("name", args.event_id)
        out_dir = Path(args.save_dir) / f"{safe_filename(event_name)}-{args.event_id}"
        out_dir.mkdir(parents=True, exist_ok=True)
        for p in matched:
            fname = f"{p.get('placing','x')}-{safe_filename(p['playerName'])}-{safe_filename(p['faction'])}.txt"
            path = out_dir / fname
            print(f"fetching {p['playerName']} -> {path}", file=sys.stderr)
            try:
                text = fetch_list_text(p["listUid"])
                header = (
                    f"# {p['playerName']} - {p['faction']}\n"
                    f"# {p['detachment']} | {p['disposition']}\n"
                    f"# record: {p['wins']}-{p['losses']}"
                    f"{'-' + str(p['draws']) if p.get('draws') else ''}, placing {p.get('placing','?')}\n"
                    f"# {BASE}/list/{p['listUid']}\n\n"
                )
                path.write_text(header + text, encoding="utf-8")
            except Exception as e:
                print(f"  FAILED: {e}", file=sys.stderr)
            time.sleep(0.5)  # be polite


def cmd_list(args):
    print(fetch_list_text(args.list_uid))


def main():
    ap = argparse.ArgumentParser(description=__doc__, formatter_class=argparse.RawDescriptionHelpFormatter)
    sub = ap.add_subparsers(dest="cmd", required=True)

    ev = sub.add_parser("event", help="fetch/filter an event's player standings")
    ev.add_argument("event_id")
    ev.add_argument("--min-wins", type=int, default=None)
    ev.add_argument("--faction", default=None)
    ev.add_argument("--disposition", default=None)
    ev.add_argument("--save-dir", default=None, help="if set, fetch each matched player's list and save as text")
    ev.set_defaults(func=cmd_event)

    ls = sub.add_parser("list", help="fetch one list's clean text by listUid")
    ls.add_argument("list_uid")
    ls.set_defaults(func=cmd_list)

    args = ap.parse_args()
    args.func(args)


if __name__ == "__main__":
    main()
