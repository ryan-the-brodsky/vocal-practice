// Generates public/sitemap.xml from the indexable routes + Learn article slugs.
// The app shells (/plan, /progress, /library) are intentionally excluded — they
// render empty static HTML (client-only). Run: npm run seo:sitemap

import { readdirSync, writeFileSync } from "node:fs";
import { join, dirname } from "node:path";
import { fileURLToPath } from "node:url";

const HERE = dirname(fileURLToPath(import.meta.url));
const SITE = "https://vocalhabit.com";
const lastmod = new Date().toISOString().slice(0, 10);

const slugs = readdirSync(join(HERE, "..", "content", "learn"))
  .filter((f) => f.endsWith(".md"))
  .map((f) => f.replace(/\.md$/, ""))
  .sort();

const urls = [
  { loc: `${SITE}/`, priority: "1.0" },
  { loc: `${SITE}/vocal-range-test`, priority: "0.9" },
  { loc: `${SITE}/learn/`, priority: "0.7" },
  ...slugs.map((s) => ({ loc: `${SITE}/learn/${s}`, priority: "0.6" })),
];

const body = urls
  .map(
    (u) =>
      `  <url>\n    <loc>${u.loc}</loc>\n    <lastmod>${lastmod}</lastmod>\n    <priority>${u.priority}</priority>\n  </url>`,
  )
  .join("\n");

const xml = `<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n${body}\n</urlset>\n`;

writeFileSync(join(HERE, "..", "public", "sitemap.xml"), xml);
console.log(`wrote public/sitemap.xml (${urls.length} urls)`);
