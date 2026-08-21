"""
Shared helpers for tournament-list scrapers (listhammer, BCP, etc).

Sites in this space are almost all client-rendered SPAs that 403 a default
python/urllib User-Agent, so a browser-like one is required. Beyond that,
each site has its own API/page shape - site-specific modules live alongside
this one and import from here.
"""
import html
import re
import urllib.request

USER_AGENT = (
    "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 "
    "(KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36"
)


def http_get(url: str, timeout: int = 30) -> str:
    req = urllib.request.Request(url, headers={"User-Agent": USER_AGENT})
    with urllib.request.urlopen(req, timeout=timeout) as resp:
        return resp.read().decode("utf-8")


def html_to_text(raw_html: str) -> str:
    """Strip scripts/styles/tags and decode entities into clean line-per-line text."""
    text = re.sub(r"<script[^>]*>.*?</script>", "", raw_html, flags=re.S)
    text = re.sub(r"<style[^>]*>.*?</style>", "", text, flags=re.S)
    text = re.sub(r"<[^>]+>", "\n", text)
    text = html.unescape(text)
    lines = [l.strip() for l in text.split("\n") if l.strip()]
    return "\n".join(lines)


def safe_filename(name: str) -> str:
    return re.sub(r"[^a-zA-Z0-9_-]+", "-", name).strip("-")
