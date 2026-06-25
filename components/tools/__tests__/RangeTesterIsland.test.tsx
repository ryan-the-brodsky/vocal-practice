// RangeTesterIsland flow: idle → Start (lazy-loads the fake detector) → capture
// a sustained low note → capture a high note → result classifies the voice type
// and the CTA deep-links into Practice with ?voicePart=. Pure capture/classify
// logic is unit-tested in lib/tools/__tests__/rangeTest.test.ts.

import React from "react";
import { render, screen, fireEvent, act } from "@testing-library/react";

import RangeTesterIsland from "@/components/tools/RangeTesterIsland";
import { installFakePitch, getMockRouter, type InstalledFakePitch } from "@/test/setup-component";
import type { PitchSample } from "@/lib/pitch";

// A steady, clarity-passing hold on one MIDI note spanning > 300ms.
function hold(midi: number, startT = 0): PitchSample[] {
  return Array.from({ length: 10 }, (_, i) => ({
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
  fake = installFakePitch();
});

describe("<RangeTesterIsland />", () => {
  it("captures a range, classifies the voice type, and deep-links with voicePart", async () => {
    render(<RangeTesterIsland />);

    // Idle
    expect(screen.getByText("Start the test")).toBeTruthy();

    // Start → lazy-import + mic acquisition resolve → step 1
    fireEvent.click(screen.getByText("Start the test"));
    await screen.findByText(/sing your lowest/i);

    // Sing C3 (MIDI 48) and hold it
    await act(async () => {
      fake.emitMany(hold(48));
    });
    await screen.findByText(/lowest so far: c3/i);

    // Advance to the high step and sing C5 (MIDI 72)
    fireEvent.click(screen.getByText(/next: highest note/i));
    await screen.findByText(/now your highest/i);
    await act(async () => {
      fake.emitMany(hold(72));
    });
    await screen.findByText(/highest so far: c5/i);

    // Result
    fireEvent.click(screen.getByText(/see my result/i));
    await screen.findByText(/tenor/i); // classifyVoice(48, 72) → tenor

    // CTA carries the classified voice part into Practice
    fireEvent.click(screen.getByText(/practice warm-ups in your range/i));
    expect(getMockRouter().push).toHaveBeenCalledWith("/?voicePart=tenor");
  });
});
