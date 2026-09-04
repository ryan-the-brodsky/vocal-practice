// COMPONENT TEST: guards the Guided/Standard analytics contract.
//
// Standard mode emits ONE `pattern_completed` per run with the key count in
// `keys`. Guided used to emit one per *key*, because `onPatternComplete` fires
// per pattern — so `pattern_completed / practice_started` read 0.67 for standard
// and 1.33 for guided, and any mode-blind ratio on that event was wrong. These
// tests pin the lifecycle that fixes it: `onRunEnd` fires once per run, and
// never per pattern.
import React from "react";
import { act, fireEvent, render, screen } from "@testing-library/react";

import GuidedSession from "@/components/practice/GuidedSession";
import { getExercise } from "@/lib/exercises/library";
import { installFakeAudio, installFakePitch } from "@/test/setup-component";

const exercise = getExercise("five-note-scale-mee-may-mah")!;

function renderGuided(onRunEnd: jest.Mock, onPatternComplete = jest.fn()) {
  return render(
    <GuidedSession
      exercise={exercise}
      voicePart="alto"
      onRunEnd={onRunEnd}
      onPatternComplete={onPatternComplete}
    />,
  );
}

async function startRun() {
  await act(async () => {
    fireEvent.click(screen.getByText("Start guided"));
  });
  // Let the player/detector init promises settle so the run reaches "cue".
  await act(async () => {
    await Promise.resolve();
  });
}

/** The Stop control is labelled "Loading…" until the first note is scheduled. */
function stopControl(): HTMLElement | null {
  return screen.queryByText("Stop") ?? screen.queryByText("Loading…");
}

describe("<GuidedSession /> run lifecycle", () => {
  beforeEach(() => {
    installFakeAudio();
    installFakePitch();
  });

  it("does not fire onRunEnd before a run has started", () => {
    const onRunEnd = jest.fn();
    renderGuided(onRunEnd);
    expect(onRunEnd).not.toHaveBeenCalled();
  });

  it("fires onRunEnd exactly once when a started run is stopped", async () => {
    const onRunEnd = jest.fn();
    renderGuided(onRunEnd);

    await startRun();
    const stop = stopControl();
    expect(stop).toBeTruthy();

    await act(async () => {
      fireEvent.click(stop!);
    });

    expect(onRunEnd).toHaveBeenCalledTimes(1);
    // Guided only ascends, so the plan is every tonic Next-Tonic could reach.
    // Alto on this exercise is C4→A4 step 1 = 10 tonics.
    expect(onRunEnd.mock.calls[0][0]).toEqual({ plannedKeys: 10 });
  });

  it("does not fire onRunEnd a second time when Stop is pressed twice", async () => {
    const onRunEnd = jest.fn();
    renderGuided(onRunEnd);

    await startRun();
    const stop = stopControl();
    await act(async () => {
      fireEvent.click(stop!);
    });
    // A second Stop (double tap, or Done after the pattern) must not re-report.
    const again = stopControl();
    if (again) {
      await act(async () => {
        fireEvent.click(again);
      });
    }

    expect(onRunEnd).toHaveBeenCalledTimes(1);
  });

  it("fires onRunEnd once when the singer navigates away mid-run", async () => {
    const onRunEnd = jest.fn();
    const { unmount } = renderGuided(onRunEnd);

    await startRun();
    await act(async () => {
      unmount();
    });

    // A walked-away run must still report, or guided runs silently vanish.
    expect(onRunEnd).toHaveBeenCalledTimes(1);
  });

  it("does not fire onRunEnd on unmount when no run was ever started", async () => {
    const onRunEnd = jest.fn();
    const { unmount } = renderGuided(onRunEnd);

    await act(async () => {
      unmount();
    });

    expect(onRunEnd).not.toHaveBeenCalled();
  });
});
