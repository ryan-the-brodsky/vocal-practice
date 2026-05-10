// Component-test setup: installs registry overrides for AudioPlayer / PitchDetector
// and configures the standard mocks for Reanimated, expo-router, AsyncStorage.
//
// Each test calls installFakeAudio() / installFakePitch() in beforeEach to get
// a recording spy back, then __reset…Factory() in afterEach.

// jsdom doesn't ship matchMedia; reanimated 4.x reads it at module load.
if (typeof window !== "undefined" && typeof window.matchMedia !== "function") {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  (window as any).matchMedia = (query: string) => ({
    matches: false,
    media: query,
    onchange: null,
    addListener: () => {},
    removeListener: () => {},
    addEventListener: () => {},
    removeEventListener: () => {},
    dispatchEvent: () => false,
  });
}

import {
  __setAudioPlayerFactory,
  __resetAudioPlayerFactory,
  type AudioPlayer,
  type SequenceHandle,
  type NoteHandle,
} from "@/lib/audio";
import {
  __setPitchDetectorFactory,
  __resetPitchDetectorFactory,
  type PitchDetector,
  type PitchSample,
  type PitchListener,
} from "@/lib/pitch";

// ---------------------------------------------------------------------------
// Fake AudioPlayer
// ---------------------------------------------------------------------------

export interface FakeAudioPlayerLog {
  initCalls: number;
  disposeCalls: number;
  playNoteCalls: { noteName: string; durationSec: number; velocity?: number }[];
  playSequenceCalls: { events: unknown[]; startAt?: number }[];
  holdNoteCalls: { noteName: string; velocity?: number; hzOverride?: number }[];
  setMasterVolumeCalls: number[];
}

export interface InstalledFakeAudio {
  player: AudioPlayer;
  log: FakeAudioPlayerLog;
}

export function installFakeAudio(): InstalledFakeAudio {
  const log: FakeAudioPlayerLog = {
    initCalls: 0,
    disposeCalls: 0,
    playNoteCalls: [],
    playSequenceCalls: [],
    holdNoteCalls: [],
    setMasterVolumeCalls: [],
  };

  const noopHandle: SequenceHandle = {
    stop: () => {},
    getCurrentTime: () => 0,
    getProgress: () => 0,
  };
  const noopNote: NoteHandle = {
    release: () => {},
    isReleased: () => true,
  };

  const player: AudioPlayer = {
    init: async () => { log.initCalls += 1; },
    isReady: () => true,
    playNote: (noteName, durationSec, velocity) => {
      log.playNoteCalls.push({ noteName, durationSec, velocity });
    },
    playSequence: (events, startAt) => {
      log.playSequenceCalls.push({ events, startAt });
      return noopHandle;
    },
    holdNote: (noteName, velocity, hzOverride) => {
      log.holdNoteCalls.push({ noteName, velocity, hzOverride });
      return noopNote;
    },
    setMasterVolume: (v) => { log.setMasterVolumeCalls.push(v); },
    getLatencyInfo: () => null,
    dispose: async () => { log.disposeCalls += 1; },
  };

  __setAudioPlayerFactory(() => player);
  return { player, log };
}

export function resetFakeAudio(): void {
  __resetAudioPlayerFactory();
}

// ---------------------------------------------------------------------------
// Fake PitchDetector
// ---------------------------------------------------------------------------

export interface InstalledFakePitch {
  detector: PitchDetector;
  emit: (sample: PitchSample) => void;
  emitMany: (samples: PitchSample[]) => void;
  isStarted: () => boolean;
  listenerCount: () => number;
}

export function installFakePitch(): InstalledFakePitch {
  const listeners = new Set<PitchListener>();
  let active = false;

  const detector: PitchDetector = {
    start: async () => { active = true; },
    stop: async () => { active = false; },
    isActive: () => active,
    on: (listener) => {
      listeners.add(listener);
      return () => listeners.delete(listener);
    },
    setClarityThreshold: () => {},
    setOctaveJumpFrames: () => {},
  };

  __setPitchDetectorFactory(() => detector);

  return {
    detector,
    emit: (sample) => listeners.forEach((l) => l(sample)),
    emitMany: (samples) => samples.forEach((s) => listeners.forEach((l) => l(s))),
    isStarted: () => active,
    listenerCount: () => listeners.size,
  };
}

export function resetFakePitch(): void {
  __resetPitchDetectorFactory();
}

// ---------------------------------------------------------------------------
// Standard component-test mocks (executed at module-load by jest setup hook)
// ---------------------------------------------------------------------------

// Reanimated — use the official mock so animated values resolve synchronously.
jest.mock("react-native-reanimated", () =>
  // eslint-disable-next-line @typescript-eslint/no-require-imports
  require("react-native-reanimated/mock"),
);

// AsyncStorage — official in-memory mock.
jest.mock("@react-native-async-storage/async-storage", () =>
  // eslint-disable-next-line @typescript-eslint/no-require-imports
  require("@react-native-async-storage/async-storage/jest/async-storage-mock"),
);

// expo-haptics — silent no-op.
jest.mock("expo-haptics", () => ({
  impactAsync: jest.fn(),
  notificationAsync: jest.fn(),
  selectionAsync: jest.fn(),
  ImpactFeedbackStyle: { Light: "Light", Medium: "Medium", Heavy: "Heavy" },
  NotificationFeedbackType: { Success: "Success", Warning: "Warning", Error: "Error" },
}));

// Tone.js — short-circuit transitive imports with a no-op stub.
jest.mock("tone", () => require("./mocks/tone"));

// expo-router — tests drive route params via setMockRouterParams() and
// inspect router calls via getMockRouter(). Reset to defaults in afterEach.
type MockRouter = {
  push: jest.Mock;
  back: jest.Mock;
  replace: jest.Mock;
  setParams: jest.Mock;
};

const mockRouterState: { params: Record<string, string | undefined>; router: MockRouter } = {
  params: {},
  router: {
    push: jest.fn(),
    back: jest.fn(),
    replace: jest.fn(),
    setParams: jest.fn(),
  },
};

export function setMockRouterParams(params: Record<string, string | undefined>): void {
  mockRouterState.params = { ...params };
}

export function getMockRouter(): MockRouter {
  return mockRouterState.router;
}

export function resetMockRouter(): void {
  mockRouterState.params = {};
  mockRouterState.router.push.mockReset();
  mockRouterState.router.back.mockReset();
  mockRouterState.router.replace.mockReset();
  mockRouterState.router.setParams.mockReset();
}

jest.mock("expo-router", () => ({
  useLocalSearchParams: () => mockRouterState.params,
  useRouter: () => mockRouterState.router,
  router: mockRouterState.router,
}));

// Reset registries between tests so a leak doesn't poison the next test.
afterEach(() => {
  resetFakeAudio();
  resetFakePitch();
  resetMockRouter();
});
