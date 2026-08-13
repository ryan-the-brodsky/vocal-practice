// Pings IndexNow after a successful PRODUCTION build so Bing (and therefore
// ChatGPT search) picks up new articles fast. CommonJS on purpose — the repo
// has no "type": "module", so Netlify loads local plugins as CJS.
const { execFileSync } = require("node:child_process");

module.exports = {
  onSuccess: () => {
    if (process.env.CONTEXT !== "production") {
      console.log(`[indexnow] skipped — context is "${process.env.CONTEXT}", not production`);
      return;
    }
    try {
      execFileSync("node", ["scripts/indexnow-submit.mjs"], { stdio: "inherit" });
    } catch {
      // Never fail a deploy over a search-engine hint; the sitemap still covers us.
      console.warn("[indexnow] ping failed — Bing will still discover via sitemap");
    }
  },
};
