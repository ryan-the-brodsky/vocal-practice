// EmbeddedExercise renders a static, indexable card: the exercise staff +
// syllables, a Play affordance (audio lazy-loads on click, verified live not in
// jsdom), and a "full version" link (new-tab anchor to Practice with the
// exercise preselected).

import React from "react";
import { render, screen } from "@testing-library/react";

import EmbeddedExercise from "@/components/learn/EmbeddedExercise";

describe("<EmbeddedExercise />", () => {
  it("renders the exercise staff syllables, a Play affordance, and the full-version link", () => {
    render(<EmbeddedExercise exerciseId="head-voice-vwohm" />);

    expect(screen.getByText("▶ Play")).toBeTruthy();
    expect(screen.getByText(/open full version with scoring/i)).toBeTruthy();
    // head-voice-vwohm is sung on "vwo"/"ohm" — at least one syllable renders on the staff.
    expect(screen.getAllByText(/vwo|ohm/i).length).toBeGreaterThan(0);
  });
});
