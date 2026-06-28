#!/usr/bin/env python3
"""
yt-extract — key-free YouTube discovery + transcript extraction for the
artist-profile / song-profile content pipeline.

Stack (no API keys, no signed-URL / nsig dance):
  - discovery : yt-dlp "ytsearchN:..." --flat-playlist   (search results, no player)
  - metadata  : YouTube oembed endpoint                   (title + channel)
  - transcript: youtube-transcript-api                    (caption track)

Run via the wrapper so deps + venv are handled for you:
  bash scripts/yt-extract.sh search "vocal coach ariana grande vocal range" --n 8
  bash scripts/yt-extract.sh transcript https://www.youtube.com/watch?v=JELW5CSmDpM
  bash scripts/yt-extract.sh batch JELW5CSmDpM dQw4w9WgXcQ --json

Default output is human-readable; pass --json for machine-readable output
(what the skill consumes).
"""
import argparse
import json
import re
import subprocess
import sys
import urllib.parse
import urllib.request

OEMBED = "https://www.youtube.com/oembed"
WATCH = "https://www.youtube.com/watch?v="
_ID_RE = re.compile(r"^[A-Za-z0-9_-]{11}$")


def video_id(url_or_id: str) -> str | None:
    """Accept a bare 11-char id or any YouTube URL form and return the id."""
    s = url_or_id.strip()
    if _ID_RE.match(s):
        return s
    try:
        u = urllib.parse.urlparse(s)
    except ValueError:
        return None
    if u.hostname in ("youtu.be",):
        cand = u.path.lstrip("/").split("/")[0]
        return cand if _ID_RE.match(cand) else None
    if u.hostname and "youtube" in u.hostname:
        qs = urllib.parse.parse_qs(u.query)
        if "v" in qs and _ID_RE.match(qs["v"][0]):
            return qs["v"][0]
        # /shorts/<id>, /embed/<id>, /live/<id>
        m = re.search(r"/(?:shorts|embed|live)/([A-Za-z0-9_-]{11})", u.path)
        if m:
            return m.group(1)
    return None


def oembed(vid: str) -> dict:
    """Title + channel, no key, no signature. Bulletproof; works even when
    transcripts are disabled."""
    qs = urllib.parse.urlencode({"url": WATCH + vid, "format": "json"})
    try:
        with urllib.request.urlopen(f"{OEMBED}?{qs}", timeout=15) as r:
            d = json.load(r)
        return {"title": d.get("title"), "channel": d.get("author_name"),
                "channel_url": d.get("author_url")}
    except Exception as e:
        return {"title": None, "channel": None, "channel_url": None,
                "meta_error": f"{type(e).__name__}: {e}"}


def fetch_transcript(vid: str, langs: list[str]) -> dict:
    """Return {available, reason, language, segments[], text} for a video.

    Prefers the requested languages; falls back to any available track
    (manual before generated). Never raises — caption availability is data,
    not an error."""
    try:
        from youtube_transcript_api import YouTubeTranscriptApi
    except ImportError:
        return {"available": False, "reason": "youtube-transcript-api not installed "
                "(run scripts/yt-extract.sh, which bootstraps it)"}
    api = YouTubeTranscriptApi()
    try:
        listing = api.list(vid)
    except Exception as e:
        return {"available": False, "reason": f"{type(e).__name__}: {str(e).splitlines()[0]}"}

    # pick a track: requested lang (manual > auto), else first manual, else first auto
    chosen = None
    try:
        chosen = listing.find_manually_created_transcript(langs)
    except Exception:
        try:
            chosen = listing.find_generated_transcript(langs)
        except Exception:
            tracks = list(listing)
            if tracks:
                tracks.sort(key=lambda t: t.is_generated)  # manual (False) first
                chosen = tracks[0]
    if chosen is None:
        return {"available": False, "reason": "no transcript tracks"}

    try:
        fetched = chosen.fetch()
    except Exception as e:
        return {"available": False, "reason": f"fetch failed: {type(e).__name__}"}

    segs = [{"t": round(s.start, 2), "d": round(s.duration, 2), "text": s.text}
            for s in fetched.snippets]
    text = collapse(" ".join(s["text"] for s in segs))
    return {
        "available": True,
        "language": chosen.language_code,
        "kind": "auto" if chosen.is_generated else "manual",
        "duration_s": round(segs[-1]["t"] + segs[-1]["d"], 1) if segs else 0,
        "segment_count": len(segs),
        "char_count": len(text),
        "word_count": len(text.split()),
        "segments": segs,
        "text": text,
    }


def collapse(s: str) -> str:
    s = s.replace("\n", " ").replace(" ", " ")
    s = re.sub(r"\[(?:Music|Applause|Laughter|.*?)\]", " ", s)  # caption sfx tags
    return re.sub(r"\s+", " ", s).strip()


def search(query: str, n: int) -> list[dict]:
    """yt-dlp flat search — uses the search results page, so it sidesteps the
    per-video player signature challenge entirely."""
    sep = "␟"  # unit separator, unlikely in titles
    fmt = sep.join(["%(id)s", "%(title)s", "%(channel)s", "%(duration)s",
                    "%(view_count)s"])
    cmd = ["yt-dlp", f"ytsearch{n}:{query}", "--flat-playlist", "--no-warnings",
           "--ignore-errors", "--print", fmt]
    try:
        out = subprocess.run(cmd, capture_output=True, text=True, timeout=120).stdout
    except FileNotFoundError:
        return [{"error": "yt-dlp not found on PATH"}]
    except subprocess.TimeoutExpired:
        return [{"error": "yt-dlp search timed out"}]
    rows = []
    for line in out.splitlines():
        if sep not in line:
            continue
        vid, title, channel, dur, views = (line.split(sep) + ["", "", "", "", ""])[:5]
        rows.append({"id": vid, "url": WATCH + vid, "title": title,
                     "channel": channel,
                     "duration_s": _int(dur), "views": _int(views)})
    return rows


def _int(s):
    try:
        return int(float(s))
    except (TypeError, ValueError):
        return None


def one(url_or_id: str, langs: list[str], with_segments: bool) -> dict:
    vid = video_id(url_or_id)
    if not vid:
        return {"input": url_or_id, "error": "could not parse a video id"}
    meta = oembed(vid)
    tr = fetch_transcript(vid, langs)
    if not with_segments:
        tr.pop("segments", None)
    return {"id": vid, "url": WATCH + vid, "embed_url": f"https://www.youtube.com/embed/{vid}",
            "title": meta.get("title"), "channel": meta.get("channel"),
            "channel_url": meta.get("channel_url"), "transcript": tr}


def _print_human(obj):
    if isinstance(obj, list):
        for i, r in enumerate(obj, 1):
            if "error" in r:
                print(f"  ! {r['error']}")
                continue
            if "transcript" in r:  # batch transcript result
                t = r["transcript"]
                status = (f"{t['kind']}/{t['language']} · {t['word_count']}w"
                          if t.get("available") else f"NO TRANSCRIPT ({t.get('reason','')})")
                print(f"{i}. {r['title']}  —  {r['channel']}")
                print(f"   {r['url']}  [{status}]")
            else:  # search result
                dur = f"{r['duration_s']//60}:{r['duration_s']%60:02d}" if r.get("duration_s") else "?"
                print(f"{i}. {r['title']}  —  {r['channel']}  ({dur})")
                print(f"   {r['url']}")
        return
    # single transcript
    t = obj.get("transcript", {})
    print(f"TITLE   : {obj.get('title')}")
    print(f"CHANNEL : {obj.get('channel')}")
    print(f"URL     : {obj.get('url')}")
    print(f"EMBED   : {obj.get('embed_url')}")
    if t.get("available"):
        print(f"CAPTIONS: {t['kind']}/{t['language']} · {t['word_count']} words · "
              f"{t['duration_s']}s")
        print("\n--- TRANSCRIPT ---")
        print(t["text"])
    else:
        print(f"CAPTIONS: UNAVAILABLE — {t.get('reason')}")


def main():
    ap = argparse.ArgumentParser(prog="yt-extract")
    sub = ap.add_subparsers(dest="cmd", required=True)

    s = sub.add_parser("search", help="find candidate videos")
    s.add_argument("query")
    s.add_argument("--n", type=int, default=8)

    t = sub.add_parser("transcript", help="metadata + transcript for one video")
    t.add_argument("url_or_id")
    t.add_argument("--lang", default="en,en-US,en-GB")
    t.add_argument("--segments", action="store_true", help="include timestamped segments")

    b = sub.add_parser("batch", help="metadata + transcript for several videos")
    b.add_argument("ids", nargs="+")
    b.add_argument("--lang", default="en,en-US,en-GB")
    b.add_argument("--segments", action="store_true")

    for p in (s, t, b):
        p.add_argument("--json", action="store_true")

    # Normalize bare video ids that start with "-" (e.g. -MXM3qkF-Zc) into URLs
    # so argparse doesn't mistake them for flags.
    argv = [WATCH + a if re.fullmatch(r"-[A-Za-z0-9_-]{10}", a) else a
            for a in sys.argv[1:]]
    a = ap.parse_args(argv)
    if a.cmd == "search":
        res = search(a.query, a.n)
    elif a.cmd == "transcript":
        res = one(a.url_or_id, a.lang.split(","), a.segments)
    else:
        res = [one(x, a.lang.split(","), a.segments) for x in a.ids]

    if a.json:
        print(json.dumps(res, ensure_ascii=False, indent=2))
    else:
        _print_human(res)


if __name__ == "__main__":
    main()
