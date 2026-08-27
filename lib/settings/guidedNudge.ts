// One-time "did you know Guided mode exists?" nudge. Shown at most ONCE per
// device — a rough session (or a returning-user reminder) surfaces it, then it
// never reappears, so it can't become a repeated "you're doing badly" nag.
// Uses window.localStorage directly (web), matching lib/analytics/visits.ts.
const KEY = "vocal-training:guided-nudge:v1";

export function hasSeenGuidedNudge(): boolean {
  try {
    if (typeof window === "undefined") return true; // native / SSR — don't nag
    return !!window.localStorage.getItem(KEY);
  } catch {
    return true; // storage unreadable — fail safe to "already seen"
  }
}

export function markGuidedNudgeSeen(): void {
  try {
    if (typeof window === "undefined") return;
    window.localStorage.setItem(KEY, String(Date.now()));
  } catch {
    // ignore — worst case the nudge could show one more time
  }
}

// Test/dev seam.
export function __resetGuidedNudge(): void {
  try {
    window.localStorage.removeItem(KEY);
  } catch {
    // ignore
  }
}
