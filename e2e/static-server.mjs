// Serves dist/ the way Netlify does: exact file → clean URL (+ .html) →
// directory index.html → SPA fallback to /index.html (public/_redirects).
// Used only by the Playwright e2e run. Usage: node e2e/static-server.mjs [port]
import { createServer } from "node:http";
import { existsSync, readFileSync, statSync } from "node:fs";
import { extname, join, normalize } from "node:path";

const ROOT = join(process.cwd(), "dist");
const PORT = Number(process.argv[2] ?? 4173);
const TYPES = { ".html": "text/html; charset=utf-8", ".js": "text/javascript", ".css": "text/css", ".json": "application/json",
  ".png": "image/png", ".jpg": "image/jpeg", ".webp": "image/webp", ".svg": "image/svg+xml", ".mp3": "audio/mpeg",
  ".woff2": "font/woff2", ".otf": "font/otf", ".ttf": "font/ttf", ".txt": "text/plain", ".xml": "application/xml" };

function resolve(pathname) {
  const p = normalize(decodeURIComponent(pathname)).replace(/^(\.\.[/\\])+/, "");
  const candidates = [join(ROOT, p), join(ROOT, `${p}.html`), join(ROOT, p, "index.html")];
  for (const f of candidates) if (existsSync(f) && statSync(f).isFile()) return f;
  return join(ROOT, "index.html");
}

createServer((req, res) => {
  const file = resolve(new URL(req.url, "http://x").pathname);
  res.writeHead(200, { "content-type": TYPES[extname(file)] ?? "application/octet-stream" });
  res.end(readFileSync(file));
}).listen(PORT, () => console.log(`static server on http://localhost:${PORT}`));
