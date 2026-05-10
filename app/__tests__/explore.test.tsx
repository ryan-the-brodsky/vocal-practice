// ProgressScreen integration: pre-seed AsyncStorage with sessions across 3
// exercises, render explore.tsx, assert that the weekly summary, exercise list,
// and recent-sessions list render — then expand a session row and assert that
// "Coach this" calls router.push with the session id.

import React from "react";
import { render, screen, fireEvent, waitFor, act } from "@testing-library/react";
import AsyncStorage from "@react-native-async-storage/async-storage";

import ProgressScreen from "@/app/(tabs)/explore";
import { getMockRouter } from "@/test/setup-component";
import { seedSessionRecord } from "@/test/fixtures/sessions";

const SESSIONS_KEY = "vocal-training:sessions:v1";
const FIXED_NOW = Date.UTC(2026, 4, 9, 12, 0, 0); // 2026-05-09T12Z (within the same week as runtime now())

function buildSession(opts: {
  id: string;
  exerciseId: string;
  startedAt: number;
  tonic: string;
  midis: number[];
  accuracyPct?: number;
}) {
  return seedSessionRecord({
    id: opts.id,
    exerciseId: opts.exerciseId,
    voicePart: "tenor",
    startedAt: opts.startedAt,
    attempts: [
      {
        tonic: opts.tonic,
        notes: opts.midis.map((m) => ({
          targetMidi: m,
          meanCentsDeviation: 5,
          accuracyPct: opts.accuracyPct ?? 90,
          framesAboveClarity: 25,
        })),
      },
    ],
  });
}

async function seedThreeExercises(): Promise<void> {
  // Use Date.now() so weekly summary catches every session.
  const now = Date.now();
  const day = 24 * 60 * 60 * 1000;
  const sessions = [
    // five-note-scale × 3
    buildSession({ id: "s-fns-1", exerciseId: "five-note-scale-mee-may-mah", startedAt: now - 1 * day, tonic: "G3", midis: [55, 57, 59, 60, 62, 60, 59, 57, 55] }),
    buildSession({ id: "s-fns-2", exerciseId: "five-note-scale-mee-may-mah", startedAt: now - 2 * day, tonic: "G3", midis: [55, 57, 59, 60, 62, 60, 59, 57, 55] }),
    buildSession({ id: "s-fns-3", exerciseId: "five-note-scale-mee-may-mah", startedAt: now - 3 * day, tonic: "G3", midis: [55, 57, 59, 60, 62, 60, 59, 57, 55] }),
    // octave-leap × 2
    buildSession({ id: "s-ol-1", exerciseId: "octave-leap-wow", startedAt: now - 4 * day, tonic: "D3", midis: [50, 62, 50] }),
    buildSession({ id: "s-ol-2", exerciseId: "octave-leap-wow", startedAt: now - 5 * day, tonic: "D3", midis: [50, 62, 50] }),
    // descending-five-to-one × 2
    buildSession({ id: "s-d51-1", exerciseId: "descending-five-to-one-nay", startedAt: now - 6 * day, tonic: "G3", midis: [62, 60, 59, 57, 55] }),
    buildSession({ id: "s-d51-2", exerciseId: "descending-five-to-one-nay", startedAt: now - 7 * day, tonic: "G3", midis: [62, 60, 59, 57, 55] }),
  ];
  await AsyncStorage.setItem(SESSIONS_KEY, JSON.stringify(sessions));
}

beforeEach(async () => {
  await AsyncStorage.clear();
});

describe("<ProgressScreen />", () => {
  it("renders the weekly summary, all 3 exercises, and the recent-sessions list from seeded AsyncStorage", async () => {
    await seedThreeExercises();
    render(<ProgressScreen />);

    // Loading → loaded.
    await waitFor(() => {
      expect(screen.getByText("Progress")).toBeTruthy();
    });

    // Weekly summary card (header is lowercase "This week").
    expect(screen.getByText("This week")).toBeTruthy();
    // Three exercises appear in both the per-exercise list and recent sessions —
    // assert each renders at least once.
    expect(screen.getAllByText("Five-Note Scale: Mee May Mah").length).toBeGreaterThan(0);
    expect(screen.getAllByText("Octave Leap on Wow").length).toBeGreaterThan(0);
    expect(screen.getAllByText("Descending 5-to-1 on Nay").length).toBeGreaterThan(0);

    // Recent sessions section header.
    expect(screen.getByText("Recent sessions")).toBeTruthy();
  });

  it("renders the empty state when no sessions / routine / imports exist", async () => {
    // loadRoutine() returns DEFAULT_ROUTINE (4 exercises) when nothing is saved.
    // To hit the empty branch we need an explicit empty routine config.
    await AsyncStorage.setItem(
      "vocal-training:routine:v1",
      JSON.stringify({ exerciseIds: [] }),
    );
    render(<ProgressScreen />);
    await waitFor(() => {
      expect(screen.getByText("No sessions yet")).toBeTruthy();
    });
    expect(screen.getByText("Head to Practice and sing something first.")).toBeTruthy();
  });

  it("'Coach this' on a recent session row navigates to /coaching with the session id", async () => {
    await seedThreeExercises();
    render(<ProgressScreen />);

    await waitFor(() => {
      expect(screen.getByText("Recent sessions")).toBeTruthy();
    });

    // RNW renders Pressable as a <div tabindex="0">. Recent rows include the
    // voice-part text "tenor"; the per-exercise summary row does not. Iterate
    // in DOM order so we click the most-recent session (s-fns-1) first.
    const matches = screen.getAllByText(/Five-Note Scale: Mee May Mah/i);
    let pressable: HTMLElement | null = null;
    for (const m of matches) {
      const candidate = m.closest('[tabindex="0"]') as HTMLElement | null;
      if (candidate && candidate.textContent?.includes("tenor")) {
        pressable = candidate;
        break;
      }
    }
    expect(pressable).not.toBeNull();
    await act(async () => {
      fireEvent.click(pressable!);
    });

    // After expansion the "Coach this" CTA appears.
    await waitFor(() => {
      expect(screen.getByText("Coach this")).toBeTruthy();
    });
    const router = getMockRouter();
    await act(async () => {
      fireEvent.click(screen.getByText("Coach this"));
    });
    expect(router.push).toHaveBeenCalledWith({
      pathname: "/coaching",
      params: { sessionId: "s-fns-1" },
    });
  });
});
