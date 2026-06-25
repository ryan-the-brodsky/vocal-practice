// EmbeddedExercise renders a static, clickable placeholder (Play + deep-link)
// at build time; actual audio playback lazy-loads on Play and is verified live
// (not in jsdom). Here we assert the static render + the full-version deep-link.

import React from "react";
import { render, screen, fireEvent } from "@testing-library/react";

import EmbeddedExercise from "@/components/learn/EmbeddedExercise";
import { getMockRouter } from "@/test/setup-component";

describe("<EmbeddedExercise />", () => {
  it("renders a Play affordance and deep-links to the full scored version", () => {
    render(<EmbeddedExercise exerciseId="head-voice-vwohm" />);

    expect(screen.getByText("▶ Play")).toBeTruthy();
    const full = screen.getByText(/open full version with scoring/i);
    fireEvent.click(full);
    expect(getMockRouter().push).toHaveBeenCalledWith({
      pathname: "/",
      params: { exerciseId: "head-voice-vwohm" },
    });
  });
});
