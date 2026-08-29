import { defineConfig, devices } from "@playwright/test";

// E2E against the real static export (dist/), served Netlify-style. Run
// `npm run web:export` first (or let `npm run e2e` do it).
export default defineConfig({
  testDir: "./e2e",
  timeout: 60_000,
  retries: process.env.CI ? 1 : 0,
  reporter: process.env.CI ? "github" : "list",
  use: { baseURL: "http://localhost:4173", trace: "retain-on-failure" },
  webServer: { command: "node e2e/static-server.mjs 4173", url: "http://localhost:4173/courses/", reuseExistingServer: true, timeout: 30_000 },
  projects: [{ name: "chromium", use: { ...devices["Desktop Chrome"], channel: "chrome" } }],
});
