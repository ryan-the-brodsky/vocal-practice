// Cookieless mode identifies people with a daily-rotating server-side hash, so
// PostHog cannot tell Tuesday's visitor from Thursday's. This counter closes
// that gap without a consent banner: the count lives in the site's own
// first-party storage (next to the onboarding flag and practice history it
// already keeps) and rides along as a property on every event. PostHog still
// never identifies anyone across days — the event just says "visit 3".
//
// See PACED_ONBOARDING_PLAN.md §2 for why this route was chosen over a banner.

const VISITS_KEY = 'vocal-training:visits:v1';
// sessionStorage, so a reload or an in-app route change doesn't inflate the
// count. One browser session equals one visit.
const COUNTED_THIS_SESSION_KEY = 'vocal-training:visit-counted';

export type VisitContext = {
  visitNumber: number;
  daysSinceFirstVisit: number;
  returning: boolean;
};

type StoredVisits = { count: number; firstSeen: number };

function readStored(): StoredVisits | null {
  try {
    const raw = window.localStorage.getItem(VISITS_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw) as Partial<StoredVisits>;
    if (typeof parsed?.count !== 'number' || typeof parsed?.firstSeen !== 'number') return null;
    return { count: parsed.count, firstSeen: parsed.firstSeen };
  } catch {
    // Private mode, disabled storage, or a corrupted value. Not worth recovering.
    return null;
  }
}

/**
 * Increments the visit count once per browser session and returns the context to
 * attach to outgoing events. Safe to call during SSG and in storage-hostile
 * browsers: it falls back to a first-visit shape rather than throwing.
 */
export function recordVisit(now: number = Date.now()): VisitContext {
  if (typeof window === 'undefined') {
    return { visitNumber: 1, daysSinceFirstVisit: 0, returning: false };
  }

  const stored = readStored();
  let alreadyCounted = false;
  try {
    alreadyCounted = window.sessionStorage.getItem(COUNTED_THIS_SESSION_KEY) === '1';
  } catch {
    // No sessionStorage. Counting again is the lesser evil versus not counting
    // at all, so fall through.
  }

  const firstSeen = stored?.firstSeen ?? now;
  const count = alreadyCounted ? (stored?.count ?? 1) : (stored?.count ?? 0) + 1;

  if (!alreadyCounted) {
    try {
      window.localStorage.setItem(VISITS_KEY, JSON.stringify({ count, firstSeen }));
      window.sessionStorage.setItem(COUNTED_THIS_SESSION_KEY, '1');
    } catch {
      // Storage full or blocked — the in-memory value below is still correct
      // for this session, it just won't persist.
    }
  }

  return {
    visitNumber: count,
    daysSinceFirstVisit: Math.max(0, Math.floor((now - firstSeen) / 86_400_000)),
    returning: count > 1,
  };
}
