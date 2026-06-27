// RangeTesterIsland guided walk: Start lazy-loads the fake audio + pitch engines,
// then the tool plays a note from middle C and waits for the singer to match it.
// Matching a note records it and steps a semitone; "too low" switches to the
// ascending phase; "too high" finishes and classifies the voice type, and the CTA
// deep-links into Practice with ?voicePart=. Pure walk + classify logic is
// unit-tested in lib/tools/__tests__/rangeTest.test.ts.

import React from "react";
import { render, screen, fireEvent, act } from "@testing-library/react";

import RangeTesterIsland from "@/components/tools/RangeTesterIsland";
import {
  installFakeAudio,
  installFakePitch,
  getMockRouter,
  type InstalledFakePitch,
} from "@/test/setup-component";
import type { PitchSample } from "@/lib/pitch";

// A steady, clarity-passing hold on one MIDI note spanning > MATCH_HOLD_MS (350ms).
function hold(midi: number, startT = 0): PitchSample[] {
  return Array.from({ length: 12 }, (_, i) => ({
    hz: 0,
    midi,
    cents: 0,
    clarity: 0.95,
    rmsDb: -30,
    timestamp: startT + i * 50,
  }));
}

let fake: InstalledFakePitch;
beforeEach(() => {
  installFakeAudio();
  fake = installFakePitch();
});

describe("<RangeTesterIsland />", () => {
  it("walks the range, classifies the voice type, and deep-links with voicePart", async () => {
    render(<RangeTesterIsland />);

    // Idle
    expect(screen.getByText("Start the test")).toBeTruthy();

    // Start → lazy-import + mic acquisition resolve → walking, target middle C (C4)
    fireEvent.click(screen.getByText("Start the test"));
    await screen.findByText("GOING DOWN ↓");
    await screen.findByText("C4");

    // Wait out the pre-listen delay until the tool is listening, then match C4.
    await screen.findByText(/sing it back/i, undefined, { timeout: 2000 });
    await act(async () => {
      fake.emitMany(hold(60));
    });

    // Matched C4 → tap out "too low" to switch into the ascending phase.
    await screen.findByText(/range so far: c4 . c4/i, undefined, { timeout: 2000 });
    fireEvent.click(screen.getByText(/too low/i));

    // Ascending now from C#4 (MIDI 61).
    await screen.findByText("GOING UP ↑", undefined, { timeout: 2000 });
    await screen.findByText("C#4");
    await screen.findByText(/sing it back/i, undefined, { timeout: 2000 });
    await act(async () => {
      fake.emitMany(hold(61));
    });

    // Matched C#4 → tap "too high" to finish.
    await screen.findByText(/range so far: c4 . c#4/i, undefined, { timeout: 2000 });
    fireEvent.click(screen.getByText(/too high/i));

    // Result: classifyVoice(60, 61) classifies and shows the range.
    await screen.findByText("YOUR RANGE", undefined, { timeout: 2000 });
    expect(screen.getByText(/closest voice type/i)).toBeTruthy();

    // CTA carries the classified voice part into Practice.
    fireEvent.click(screen.getByText(/practice warm-ups in your range/i));
    expect(getMockRouter().push).toHaveBeenCalledWith(
      expect.stringMatching(/^\/\?voicePart=(soprano|alto|tenor|baritone)$/),
    );
  }, 20000);
});
