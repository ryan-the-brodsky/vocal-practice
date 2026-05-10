import React from "react";
import { act, fireEvent, render, screen } from "@testing-library/react";

import { MicStatus } from "@/components/practice/MicStatus";

describe("<MicStatus />", () => {
  it("renders the unknown state and fires onCheck when tapped", () => {
    const onCheck = jest.fn();
    render(<MicStatus state="unknown" onCheck={onCheck} />);

    expect(screen.getByText("Tap to check microphone")).toBeTruthy();

    const button = screen.getByLabelText("Tap to check microphone");
    act(() => {
      fireEvent.click(button);
    });
    expect(onCheck).toHaveBeenCalledTimes(1);
  });

  it("renders the checking state with no Pressable affordance", () => {
    render(<MicStatus state="checking" onCheck={() => {}} />);
    expect(screen.getByText("Checking microphone…")).toBeTruthy();
    expect(screen.queryByLabelText("Tap to check microphone")).toBeNull();
  });

  it("renders the denied state with the helpful copy and a retry affordance", () => {
    const onCheck = jest.fn();
    render(<MicStatus state="denied" onCheck={onCheck} />);

    expect(screen.getByText("Mic blocked — check OS settings")).toBeTruthy();
    const retry = screen.getByLabelText("Microphone blocked, tap to retry");
    act(() => {
      fireEvent.click(retry);
    });
    expect(onCheck).toHaveBeenCalledTimes(1);
  });

  it("renders 'Mic ready' when ready without a live RMS reading", () => {
    render(<MicStatus state="ready" onCheck={() => {}} />);
    expect(screen.getByText("Mic ready")).toBeTruthy();
    // Read-only — no Pressable in this state.
    expect(screen.queryByLabelText(/tap to/i)).toBeNull();
  });

  it("renders the live RMS readout (rounded) in place of 'Mic ready'", () => {
    render(<MicStatus state="ready" liveRmsDb={-22.7} onCheck={() => {}} />);
    expect(screen.getByText("-23 dB")).toBeTruthy();
    expect(screen.queryByText("Mic ready")).toBeNull();
  });
});
