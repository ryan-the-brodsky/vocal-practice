// Pings IndexNow (Bing / Yandex / Seznam) with RECENTLY CHANGED sitemap URLs so new
// articles land in Bing's index in hours instead of weeks. ChatGPT search is
// Bing-backed, so this is also the fastest path to AI-answer eligibility.
// Google does NOT support IndexNow — it still discovers via sitemap + crawl.
//
// This runs on every production deploy. Submitting the whole sitemap each time (the
// behaviour until 2026-09-02) announces 42 unchanged URLs as changed, which is what
// IndexNow asks you not to do and leaves Bing no way to spot a genuinely new page.
// Gate on the sitemap's per-URL lastmod instead; nothing recent means nothing to say.
//
// Run: npm run seo:indexnow [--days=N] [--all] [--dry-run]

import { readFileSync, existsSync } from "node:fs";
import { join, dirname } from "node:path";
import { fileURLToPath } from "node:url";

const HERE = dirname(fileURLToPath(import.meta.url));
const ROOT = join(HERE, "..");
const SITE = "https://vocalhabit.com";
const HOST = "vocalhabit.com";
const KEY = "19a0f4599c207ac7ae2b368970decb47";
const ENDPOINT = "https://api.indexnow.org/indexnow";

// dist/ wins when it exists — that's what actually shipped.
const sitemapPath = [join(ROOT, "dist", "sitemap.xml"), join(ROOT, "public", "sitemap.xml")].find(
  existsSync,
);

if (!sitemapPath) {
  console.error("[indexnow] no sitemap.xml found — run `npm run seo:sitemap` first");
  process.exit(1);
}

const entries = [
  ...readFileSync(sitemapPath, "utf8").matchAll(
    /<loc>([^<]+)<\/loc>\s*(?:<lastmod>([^<]+)<\/lastmod>)?/g,
  ),
]
  .map((m) => ({ loc: m[1].trim(), lastmod: m[2]?.trim() ?? "" }))
  .filter((e) => e.loc.startsWith(SITE));

if (entries.length === 0) {
  console.error(`[indexnow] ${sitemapPath} contained no ${SITE} URLs`);
  process.exit(1);
}

const days = Number(process.argv.find((a) => a.startsWith("--days="))?.slice(7)) || 14;
const all = process.argv.includes("--all");
const cutoff = new Date(Date.now() - days * 864e5).toISOString().slice(0, 10);

// A URL with no lastmod can't be aged, so treat it as changed rather than silently skipping it.
const urlList = all
  ? entries.map((e) => e.loc)
  : entries.filter((e) => !e.lastmod || e.lastmod >= cutoff).map((e) => e.loc);

const scope = all ? "all urls" : `changed since ${cutoff}`;

if (urlList.length === 0) {
  console.log(`[indexnow] nothing changed in the last ${days}d — skipped (${entries.length} urls in sitemap)`);
  process.exit(0);
}

if (process.argv.includes("--dry-run")) {
  console.log(
    `[indexnow] dry run — would submit ${urlList.length}/${entries.length} urls (${scope}) from ${sitemapPath}:`,
  );
  for (const u of urlList) console.log(`  ${u}`);
  process.exit(0);
}

const res = await fetch(ENDPOINT, {
  method: "POST",
  headers: { "Content-Type": "application/json; charset=utf-8" },
  body: JSON.stringify({ host: HOST, key: KEY, keyLocation: `${SITE}/${KEY}.txt`, urlList }),
});

// 200 accepted, 202 accepted but key still being validated — both are successes.
if (res.status === 200 || res.status === 202) {
  console.log(
    `[indexnow] submitted ${urlList.length}/${entries.length} urls (${scope}, HTTP ${res.status})`,
  );
  process.exit(0);
}

const detail = {
  400: "malformed request",
  403: `key rejected — is ${SITE}/${KEY}.txt live and serving the key?`,
  422: "url/host mismatch",
  429: "rate limited",
}[res.status];

console.error(`[indexnow] FAILED HTTP ${res.status}${detail ? ` — ${detail}` : ""}`);
console.error(await res.text().catch(() => ""));
process.exit(1);
