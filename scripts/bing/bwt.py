#!/usr/bin/env python3
"""Bing Webmaster Tools CLI for vocalhabit.com - replaces the browser dashboard.

Uses the JSON API: https://ssl.bing.com/webmaster/api.svc/json/<Op>?apikey=KEY
(The legacy SOAP/POX APIs retire 2026-08-31; this JSON surface is separate and current.)

SETUP (one time): in Bing Webmaster Tools -> Settings (gear, top-right) -> API access
-> API Key -> "Generate API Key", copy it, then store it (NEVER commit it to the repo):

    printf 'BING_WEBMASTER_API_KEY=%s\\n' 'PASTE_KEY_HERE' >> ~/.claude/.env
    chmod 600 ~/.claude/.env

The script reads the key from $BING_WEBMASTER_API_KEY or from ~/.claude/.env, and never prints it.
If the API rejects the siteUrl, run `sites` to see the exact verified URL and set
BING_SITE_URL=<that value> when calling.

Usage:
    scripts/bing/bwt.py sites                 # verified sites (confirms the key works)
    scripts/bing/bwt.py quota                 # daily/monthly URL-submission quota
    scripts/bing/bwt.py urlinfo <url>         # raw index details for one URL
    scripts/bing/bwt.py check                 # index status for every URL in the sitemap
    scripts/bing/bwt.py search [days]         # Bing Search Performance (clicks/impressions), default 30d
    scripts/bing/bwt.py queries [n]           # top n Bing SEARCH queries by impressions (default 20)
    scripts/bing/bwt.py submit <url> [url...]  # submit specific URLs for crawling
    scripts/bing/bwt.py submit-sitemap        # submit every URL in public/sitemap.xml

Note: this covers Search Performance + index status + URL submission. It does NOT cover Bing's
"AI Performance" (Total AI Citations / Grounding Queries / Cited Pages) — that is a Bing-UI BETA
with no API endpoint, so the AI-citation view still requires the browser dashboard.
"""
import json
import os
import pathlib
import re
import sys
import time
import urllib.error
import urllib.parse
import urllib.request

SITE = os.environ.get("BING_SITE_URL", "https://vocalhabit.com/")
BASE = "https://ssl.bing.com/webmaster/api.svc/json"
REPO = pathlib.Path(__file__).resolve().parents[2]  # vocal-practice/ repo root
SITEMAP = REPO / "public" / "sitemap.xml"
KEY = None  # populated in main()


def api_key():
    k = os.environ.get("BING_WEBMASTER_API_KEY")
    if not k:
        env = pathlib.Path.home() / ".claude" / ".env"
        if env.exists():
            for line in env.read_text().splitlines():
                if line.strip().startswith("BING_WEBMASTER_API_KEY="):
                    k = line.split("=", 1)[1].strip().strip('"').strip("'")
                    break
    if not k:
        sys.exit(
            "BING_WEBMASTER_API_KEY not set. Generate it in Bing Webmaster Tools "
            "(Settings -> API access -> Generate API Key) and add it to ~/.claude/.env "
            "as BING_WEBMASTER_API_KEY=...  (see the header of this file)."
        )
    return k


def _get(op, **params):
    params["apikey"] = KEY
    url = f"{BASE}/{op}?" + urllib.parse.urlencode(params)
    with urllib.request.urlopen(url, timeout=30) as r:
        return json.load(r)


def _post(op, body):
    url = f"{BASE}/{op}?apikey={KEY}"
    req = urllib.request.Request(
        url, data=json.dumps(body).encode(), headers={"Content-Type": "application/json"}
    )
    with urllib.request.urlopen(req, timeout=30) as r:
        txt = r.read().decode()
        return json.loads(txt) if txt.strip() else {"d": None}


def sitemap_urls():
    return re.findall(r"<loc>([^<]+)</loc>", SITEMAP.read_text())


def cmd_sites():
    print(json.dumps(_get("GetUserSites"), indent=2))


def cmd_quota():
    print(json.dumps(_get("GetUrlSubmissionQuota", siteUrl=SITE), indent=2))


def cmd_urlinfo(url):
    print(json.dumps(_get("GetUrlInfo", siteUrl=SITE, url=url), indent=2))


def cmd_check():
    urls = sitemap_urls()
    print(f"Index status for {len(urls)} URLs (site {SITE}):\n")
    indexed_n = 0
    # GetUrlInfo is rate-limited (~10 calls/minute), so pace the loop to stay under it.
    for i, u in enumerate(urls):
        if i:
            time.sleep(6.0)
        d = None
        for attempt in range(3):  # back off and retry when the rate window is hit (HTTP 400/429)
            try:
                d = (_get("GetUrlInfo", siteUrl=SITE, url=u) or {}).get("d") or {}
                break
            except urllib.error.HTTPError as e:
                if e.code in (400, 429) and attempt < 2:
                    time.sleep(15.0)
                    continue
                print(f"  error        {u}  (HTTP {e.code})")
                d = None
                break
            except Exception as e:  # noqa: BLE001 - report per-URL, keep going
                print(f"  error        {u}  ({e})")
                d = None
                break
        if d is None:
            continue
        size = d.get("DocumentSize")
        crawled = d.get("LastCrawledDate")
        http = d.get("HttpStatus")
        is_indexed = bool(size and int(size) > 0)
        indexed_n += 1 if is_indexed else 0
        label = "INDEXED" if is_indexed else "not indexed"
        print(f"  {label:12} http={http} size={size} crawled={crawled}  {u}")
    print(f"\n{indexed_n}/{len(urls)} indexed.")


def _wcf_date(s):
    # "/Date(1787554800000-0700)/" -> "YYYY-MM-DD"
    import datetime
    m = re.search(r"/Date\((-?\d+)", s or "")
    if not m:
        return "?"
    ms = int(m.group(1))
    if ms < 0:
        return "never"
    return datetime.datetime.fromtimestamp(ms / 1000, datetime.timezone.utc).strftime("%Y-%m-%d")


def cmd_search(days):
    rows = (_get("GetRankAndTrafficStats", siteUrl=SITE) or {}).get("d") or []
    rows = sorted(rows, key=lambda r: r.get("Date", ""))[-days:]
    tc = sum(r.get("Clicks", 0) for r in rows)
    ti = sum(r.get("Impressions", 0) for r in rows)
    print(f"Bing Search Performance, last {len(rows)} data points (site {SITE}):")
    print(f"  totals: {tc} clicks / {ti} impressions\n")
    for r in rows[-14:]:
        print(f"  {_wcf_date(r.get('Date'))}  clicks={r.get('Clicks')}  impressions={r.get('Impressions')}")


def cmd_queries(n):
    rows = (_get("GetQueryStats", siteUrl=SITE) or {}).get("d") or []
    agg = {}
    for r in rows:
        q = r.get("Query", "")
        a = agg.setdefault(q, {"Clicks": 0, "Impressions": 0})
        a["Clicks"] += r.get("Clicks", 0)
        a["Impressions"] += r.get("Impressions", 0)
    top = sorted(agg.items(), key=lambda kv: kv[1]["Impressions"], reverse=True)[:n]
    print(f"Top {len(top)} Bing SEARCH queries by impressions (site {SITE}):")
    print("(NOTE: these are organic search queries, NOT AI 'grounding queries' — that view is browser-only.)\n")
    for q, a in top:
        print(f"  impr={a['Impressions']:>5}  clicks={a['Clicks']:>4}  {q}")


def cmd_submit(urls):
    if not urls:
        sys.exit("submit needs at least one URL")
    print(json.dumps(_post("SubmitUrlBatch", {"siteUrl": SITE, "urlList": urls}), indent=2))


def cmd_submit_sitemap():
    urls = sitemap_urls()
    print(f"Submitting {len(urls)} URLs from {SITEMAP.name} ...")
    print(json.dumps(_post("SubmitUrlBatch", {"siteUrl": SITE, "urlList": urls}), indent=2))


def main():
    global KEY
    args = sys.argv[1:]
    cmd = args[0] if args else "help"
    if cmd in ("help", "-h", "--help"):
        print(__doc__)
        return
    KEY = api_key()
    try:
        if cmd == "sites":
            cmd_sites()
        elif cmd == "quota":
            cmd_quota()
        elif cmd == "urlinfo":
            cmd_urlinfo(args[1])
        elif cmd == "check":
            cmd_check()
        elif cmd == "search":
            cmd_search(int(args[1]) if len(args) > 1 else 30)
        elif cmd == "queries":
            cmd_queries(int(args[1]) if len(args) > 1 else 20)
        elif cmd == "submit":
            cmd_submit(args[1:])
        elif cmd == "submit-sitemap":
            cmd_submit_sitemap()
        else:
            print(__doc__)
            sys.exit(f"unknown command: {cmd}")
    except urllib.error.HTTPError as e:
        sys.exit(f"HTTP {e.code}: {e.read().decode()[:500]}")


if __name__ == "__main__":
    main()
