import { recordVisit } from '../visits';

const DAY = 86_400_000;

function makeStorage(): Storage {
  const map = new Map<string, string>();
  return {
    getItem: (k: string) => map.get(k) ?? null,
    setItem: (k: string, v: string) => void map.set(k, v),
    removeItem: (k: string) => void map.delete(k),
    clear: () => map.clear(),
    key: (i: number) => [...map.keys()][i] ?? null,
    get length() {
      return map.size;
    },
  } as Storage;
}

function installWindow(local: Storage, session: Storage) {
  (globalThis as { window?: unknown }).window = {
    localStorage: local,
    sessionStorage: session,
  };
}

describe('recordVisit', () => {
  afterEach(() => {
    delete (globalThis as { window?: unknown }).window;
  });

  it('reports a first visit and persists it', () => {
    const local = makeStorage();
    installWindow(local, makeStorage());

    expect(recordVisit(1000)).toEqual({
      visitNumber: 1,
      daysSinceFirstVisit: 0,
      returning: false,
    });
    expect(local.getItem('vocal-training:visits:v1')).toContain('"count":1');
  });

  it('does not double-count within one browser session', () => {
    const local = makeStorage();
    const session = makeStorage();
    installWindow(local, session);

    recordVisit(1000);
    // A reload or route change re-runs init against the same sessionStorage.
    expect(recordVisit(2000).visitNumber).toBe(1);
    expect(recordVisit(3000).visitNumber).toBe(1);
  });

  it('increments when the browser session is new but localStorage persists', () => {
    const local = makeStorage();
    installWindow(local, makeStorage());
    recordVisit(0);

    // New tab/session: fresh sessionStorage, same localStorage.
    installWindow(local, makeStorage());
    const second = recordVisit(3 * DAY);

    expect(second.visitNumber).toBe(2);
    expect(second.returning).toBe(true);
    expect(second.daysSinceFirstVisit).toBe(3);
  });

  it('falls back to a first-visit shape when there is no window (SSG)', () => {
    expect(recordVisit(1000)).toEqual({
      visitNumber: 1,
      daysSinceFirstVisit: 0,
      returning: false,
    });
  });

  it('survives storage that throws (private mode, blocked storage)', () => {
    const hostile = {
      getItem: () => {
        throw new Error('blocked');
      },
      setItem: () => {
        throw new Error('blocked');
      },
    } as unknown as Storage;
    installWindow(hostile, hostile);

    expect(() => recordVisit(1000)).not.toThrow();
    expect(recordVisit(1000).visitNumber).toBe(1);
  });

  it('ignores a corrupted stored value instead of propagating NaN', () => {
    const local = makeStorage();
    local.setItem('vocal-training:visits:v1', '{"count":"lots"}');
    installWindow(local, makeStorage());

    const v = recordVisit(1000);
    expect(v.visitNumber).toBe(1);
    expect(Number.isFinite(v.daysSinceFirstVisit)).toBe(true);
  });
});
