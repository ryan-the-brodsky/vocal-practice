// Generates public/sitemap.xml from the indexable routes + Learn article slugs.
// The app shells (/routine, /progress, /library) are intentionally excluded — they
// render empty static HTML (client-only). Run: npm run seo:sitemap

import { readdirSync, readFileSync, statSync, writeFileSync } from "node:fs";
import { execFileSync } from "node:child_process";
import { join, dirname } from "node:path";
import { fileURLToPath } from "node:url";

const HERE = dirname(fileURLToPath(import.meta.url));
const ROOT = join(HERE, "..");
const SITE = "https://vocalhabit.com";
const TODAY = new Date().toISOString().slice(0, 10);

// Per-URL lastmod from the source file's last commit date. Stamping one build date on
// every URL tells Bing all 42 pages changed today, which makes lastmod worthless for
// crawl scheduling — the suspected cause of new URLs never being crawled (2026-09-02).
function lastmodFor(...relPaths) {
  const dates = relPaths.map((rel) => {
    const abs = join(ROOT, rel);
    try {
      const out = execFileSync("git", ["log", "-1", "--format=%cs", "--", rel], {
        cwd: ROOT,
        encoding: "utf8",
        stdio: ["ignore", "pipe", "ignore"],
      }).trim();
      if (out) return out;
    } catch {
      // not a git checkout, or shallow clone without this file's history
    }
    try {
      return statSync(abs).mtime.toISOString().slice(0, 10);
    } catch {
      return TODAY;
    }
  });
  return dates.sort().pop() ?? TODAY; // newest wins for multi-source routes
}

const slugs = readdirSync(join(HERE, "..", "content", "learn"))
  .filter((f) => f.endsWith(".md"))
  .map((f) => f.replace(/\.md$/, ""))
  .sort();

// Published artist spotlights (drafts excluded — matches the production
// draft-gate, EXPO_PUBLIC_INCLUDE_DRAFTS=0). Parse the top-level frontmatter
// `status`/`slug` the same way gen-artist-profiles.mjs does, tolerating a
// leading HTML render-contract comment before the `---` block.
const artistDir = join(HERE, "..", "content", "artist-profiles");
const artistSlugs = readdirSync(artistDir)
  .filter((f) => f.endsWith(".md"))
  .map((f) => {
    const md = readFileSync(join(artistDir, f), "utf8").replace(/^﻿?\s*<!--[\s\S]*?-->\s*/, "");
    const fm = md.match(/^---\r?\n([\s\S]*?)\r?\n---/);
    const fields = {};
    if (fm) {
      for (const line of fm[1].split(/\r?\n/)) {
        const kv = line.match(/^([A-Za-z][A-Za-z0-9]*):\s*(.*)$/);
        if (kv) fields[kv[1]] = kv[2].replace(/^["']|["'].*$/g, "").trim();
      }
    }
    const slug = fields.slug || f.replace(/\.draft\.md$/, "").replace(/\.md$/, "");
    return { slug, status: fields.status || "draft" };
  })
  .filter((p) => p.status === "published")
  .map((p) => p.slug)
  .sort();

// Courses: hub + one syllabus per course dir + lessons (NN-*.md) from the filesystem.
const coursesDir = join(HERE, "..", "content", "courses");
const courseIds = readdirSync(coursesDir).filter((f) => statSync(join(coursesDir, f)).isDirectory()).sort();
const courseUrls = courseIds.flatMap((id) => [
  {
    loc: `${SITE}/courses/${id}/`,
    priority: "0.8",
    lastmod: lastmodFor(`content/courses/${id}/course.md`),
  },
  ...readdirSync(join(coursesDir, id))
    .filter((f) => /^\d{2}-.+\.md$/.test(f))
    .sort()
    .map((f) => ({
      loc: `${SITE}/courses/${id}/${f.replace(/\.md$/, "")}`,
      priority: "0.6",
      lastmod: lastmodFor(`content/courses/${id}/${f}`),
    })),
]);

const urls = [
  { loc: `${SITE}/`, priority: "1.0", lastmod: lastmodFor("components/home/HomeHeroSEO.tsx") },
  {
    loc: `${SITE}/vocal-range-test`,
    priority: "0.9",
    lastmod: lastmodFor("app/(marketing)/vocal-range-test.tsx"),
  },
  {
    loc: `${SITE}/learn/`,
    priority: "0.7",
    lastmod: lastmodFor("components/learn/LearnHub.tsx", "app/(marketing)/learn/index.tsx"),
  },
  {
    loc: `${SITE}/courses/`,
    priority: "0.7",
    lastmod: lastmodFor("app/(marketing)/courses/index.tsx"),
  },
  ...courseUrls,
  ...slugs.map((s) => ({
    loc: `${SITE}/learn/${s}`,
    priority: "0.6",
    lastmod: lastmodFor(`content/learn/${s}.md`),
  })),
  ...artistSlugs.map((s) => ({
    loc: `${SITE}/artists/${s}`,
    priority: "0.6",
    lastmod: lastmodFor(`content/artist-profiles/${s}.md`),
  })),
];

const body = urls
  .map(
    (u) =>
      `  <url>\n    <loc>${u.loc}</loc>\n    <lastmod>${u.lastmod}</lastmod>\n    <priority>${u.priority}</priority>\n  </url>`,
  )
  .join("\n");

const xml = `<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n${body}\n</urlset>\n`;

writeFileSync(join(HERE, "..", "public", "sitemap.xml"), xml);
console.log(`wrote public/sitemap.xml (${urls.length} urls)`);
