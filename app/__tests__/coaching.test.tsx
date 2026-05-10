// CoachingScreen integration: pre-seed a globally-flat SessionRecord into
// AsyncStorage, mount the screen with ?sessionId=, then assert that the
// global-flat detector wins, the headline copy matches the symptom card, and
// the bookmark click persists to vocal-training:coaching:saved:v1.

import React from "react";
import { render, screen, fireEvent, waitFor, act } from "@testing-library/react";
import AsyncStorage from "@react-native-async-storage/async-storage";

import CoachingScreen from "@/app/(tabs)/coaching";
import { getMockRouter, setMockRouterParams } from "@/test/setup-component";
import { seedSessionRecord } from "@/test/fixtures/sessions";

const SESSIONS_KEY = "vocal-training:sessions:v1";
const SAVED_KEY = "vocal-training:coaching:saved:v1";

async function seedSessions(): Promise<string> {
  // Two keys × 9 notes, every note 60¢ flat — clears global-flat thresholds
  // (mean < -20¢, ≥6 notes, ≥60% coverage of notes flat by ≥10¢).
  const session = seedSessionRecord({
    id: "test-flat-session",
    exerciseId: "five-note-scale-mee-may-mah",
    voicePart: "tenor",
    startedAt: Date.UTC(2026, 4, 8, 12, 0, 0),
    attempts: [
      {
        tonic: "G3",
        notes: [55, 57, 59, 60, 62, 60, 59, 57, 55].map((m) => ({
          targetMidi: m,
          meanCentsDeviation: -60,
          accuracyPct: 5,
          framesAboveClarity: 25,
        })),
      },
      {
        tonic: "G#3",
        notes: [56, 58, 60, 61, 63, 61, 60, 58, 56].map((m) => ({
          targetMidi: m,
          meanCentsDeviation: -60,
          accuracyPct: 5,
          framesAboveClarity: 25,
        })),
      },
    ],
  });
  await AsyncStorage.setItem(SESSIONS_KEY, JSON.stringify([session]));
  return session.id;
}

beforeEach(async () => {
  await AsyncStorage.clear();
});

describe("<CoachingScreen />", () => {
  it("loads a globally-flat session, renders the global-flat headline + cents evidence, and persists bookmarks", async () => {
    const sessionId = await seedSessions();
    setMockRouterParams({ sessionId });

    render(<CoachingScreen />);

    // Wait for the load + diagnose effects to settle.
    await waitFor(() => {
      // global-flat's symptomCard is "Singing flat".
      expect(screen.getByText("Singing flat")).toBeTruthy();
    });

    // Evidence line shows the cents number (-60¢).
    expect(screen.getByText(/-60¢/)).toBeTruthy();
    // Likely-causes section renders for global-flat.
    expect(screen.getByText("Likely causes")).toBeTruthy();

    // Bookmark — initial state, then save.
    const bookmark = screen.getByLabelText("Bookmark this tip");
    expect(bookmark).toBeTruthy();
    await act(async () => {
      fireEvent.click(bookmark);
    });

    await waitFor(async () => {
      const raw = await AsyncStorage.getItem(SAVED_KEY);
      expect(raw).not.toBeNull();
      const items = JSON.parse(raw!);
      expect(items.length).toBe(1);
      expect(items[0].diagnosis.detectorId).toBe("global-flat");
      expect(items[0].sessionId).toBe(sessionId);
    });

    // Button label flips to "Saved" / "Remove bookmark".
    expect(screen.getByLabelText("Remove bookmark")).toBeTruthy();
  });

  it("renders an error state when the sessionId doesn't exist", async () => {
    setMockRouterParams({ sessionId: "no-such-id" });
    render(<CoachingScreen />);
    await waitFor(() => {
      expect(screen.getByText("Couldn't find that session.")).toBeTruthy();
    });
  });

  it("renders an error state when no sessionId is provided", async () => {
    setMockRouterParams({});
    render(<CoachingScreen />);
    await waitFor(() => {
      expect(screen.getByText("No session id provided.")).toBeTruthy();
    });
  });

  it("'Practice this again' navigates to / with the source exerciseId and voicePart", async () => {
    const sessionId = await seedSessions();
    setMockRouterParams({ sessionId });
    render(<CoachingScreen />);

    // Wait for the diagnostic surface (which carries the Practice-again button).
    await waitFor(() => {
      expect(screen.getByText("Singing flat")).toBeTruthy();
    });

    const button = screen.getByLabelText("Practice this exercise again");
    const router = getMockRouter();
    await act(async () => {
      fireEvent.click(button);
    });

    expect(router.push).toHaveBeenCalledWith({
      pathname: "/",
      params: { exerciseId: "five-note-scale-mee-may-mah", voicePart: "tenor" },
    });
  });
});
