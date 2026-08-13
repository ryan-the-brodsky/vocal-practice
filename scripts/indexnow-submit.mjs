// Pings IndexNow (Bing / Yandex / Seznam) with every URL in the sitemap so new
// articles land in Bing's index in hours instead of weeks. ChatGPT search is
// Bing-backed, so this is also the fastest path to AI-answer eligibility.
// Google does NOT support IndexNow — it still discovers via sitemap + crawl.
// Run: npm run seo:indexnow

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

const urlList = [...readFileSync(sitemapPath, "utf8").matchAll(/<loc>([^<]+)<\/loc>/g)]
  .map((m) => m[1].trim())
  .filter((u) => u.startsWith(SITE));

if (urlList.length === 0) {
  console.error(`[indexnow] ${sitemapPath} contained no ${SITE} URLs`);
  process.exit(1);
}

if (process.argv.includes("--dry-run")) {
  console.log(`[indexnow] dry run — would submit ${urlList.length} urls from ${sitemapPath}:`);
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
  console.log(`[indexnow] submitted ${urlList.length} urls (HTTP ${res.status})`);
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
