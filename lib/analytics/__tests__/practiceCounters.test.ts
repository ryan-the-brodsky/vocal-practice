import {
  readPracticeContext,
  recordFinish,
  recordPracticeStart,
} from '../practiceCounters';

const PRACTICE_KEY = 'vocal-training:practice-count:v1';
const FINISH_KEY = 'vocal-training:finish-count:v1';

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

function installWindow(local: Storage) {
  (globalThis as { window?: unknown }).window = { localStorage: local };
}

describe('practiceCounters', () => {
  afterEach(() => {
    delete (globalThis as { window?: unknown }).window;
  });

  describe('recordPracticeStart', () => {
    it('reports a first practice and persists it', () => {
      const local = makeStorage();
      installWindow(local);

      expect(recordPracticeStart()).toEqual({
        practiceNumber: 1,
        hasPracticedBefore: false,
      });
      expect(local.getItem(PRACTICE_KEY)).toBe('1');
    });

    it('increments and flags a returning practicer on the next session', () => {
      const local = makeStorage();
      installWindow(local);

      recordPracticeStart();
      const second = recordPracticeStart();

      expect(second).toEqual({ practiceNumber: 2, hasPracticedBefore: true });
      expect(local.getItem(PRACTICE_KEY)).toBe('2');
    });

    it('does NOT count a site visit — starts at 1 even after visits accrue', () => {
      // A Learn-article reader would have bumped the visits counter, never this
      // one; the first practice is always practiceNumber 1.
      const local = makeStorage();
      local.setItem('vocal-training:visits:v1', '{"count":9,"firstSeen":0}');
      installWindow(local);

      expect(recordPracticeStart().practiceNumber).toBe(1);
    });
  });

  describe('readPracticeContext', () => {
    it('reads without incrementing and matches the last stamped number', () => {
      const local = makeStorage();
      installWindow(local);

      recordPracticeStart();
      recordPracticeStart();
      expect(readPracticeContext()).toEqual({
        practiceNumber: 2,
        hasPracticedBefore: true,
      });
      // Read is side-effect free.
      expect(local.getItem(PRACTICE_KEY)).toBe('2');
      expect(readPracticeContext().practiceNumber).toBe(2);
    });

    it('reports a first-practice shape before any practice was recorded', () => {
      installWindow(makeStorage());
      expect(readPracticeContext()).toEqual({
        practiceNumber: 1,
        hasPracticedBefore: false,
      });
    });
  });

  describe('recordFinish', () => {
    it('reports a first finish and persists it', () => {
      const local = makeStorage();
      installWindow(local);

      expect(recordFinish()).toEqual({
        finishNumber: 1,
        hasFinishedBefore: false,
      });
      expect(local.getItem(FINISH_KEY)).toBe('1');
    });

    it('increments and flags a returning finisher on the next finish', () => {
      const local = makeStorage();
      installWindow(local);

      recordFinish();
      const second = recordFinish();

      expect(second).toEqual({ finishNumber: 2, hasFinishedBefore: true });
      expect(local.getItem(FINISH_KEY)).toBe('2');
    });

    it('is independent from the practice counter', () => {
      const local = makeStorage();
      installWindow(local);

      recordPracticeStart();
      recordPracticeStart();
      recordPracticeStart();
      // Three starts, one finish: someone who bails before completing.
      expect(recordFinish()).toEqual({
        finishNumber: 1,
        hasFinishedBefore: false,
      });
    });
  });

  describe('fail-safe behavior', () => {
    it('falls back to first shapes when there is no window (SSG)', () => {
      expect(recordPracticeStart()).toEqual({
        practiceNumber: 1,
        hasPracticedBefore: false,
      });
      expect(readPracticeContext()).toEqual({
        practiceNumber: 1,
        hasPracticedBefore: false,
      });
      expect(recordFinish()).toEqual({
        finishNumber: 1,
        hasFinishedBefore: false,
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
      installWindow(hostile);

      expect(() => recordPracticeStart()).not.toThrow();
      expect(recordPracticeStart()).toEqual({
        practiceNumber: 1,
        hasPracticedBefore: false,
      });
      expect(() => recordFinish()).not.toThrow();
      expect(readPracticeContext().practiceNumber).toBe(1);
    });

    it('ignores a corrupted stored count instead of propagating NaN', () => {
      const local = makeStorage();
      local.setItem(PRACTICE_KEY, '"lots"');
      installWindow(local);

      const ctx = recordPracticeStart();
      expect(ctx.practiceNumber).toBe(1);
      expect(ctx.hasPracticedBefore).toBe(false);
      expect(Number.isFinite(ctx.practiceNumber)).toBe(true);
    });
  });
});
