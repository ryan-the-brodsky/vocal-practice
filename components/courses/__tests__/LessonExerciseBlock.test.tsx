// LessonExerciseBlock renders the descriptor's pedagogy as static text, the
// embed, and a routine toggle that writes vocal-training:routine:v1.
import React from "react";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { fireEvent, render, screen, waitFor } from "@testing-library/react";

import LessonExerciseBlock from "@/components/courses/LessonExerciseBlock";
import { loadRoutine, saveRoutine } from "@/lib/progress/routine";

beforeEach(async () => {
  await AsyncStorage.clear();
});

describe("<LessonExerciseBlock />", () => {
  it("renders the pedagogy paragraph without the follow-along sentence and shows a pill instead", () => {
    render(<LessonExerciseBlock courseId="c" lessonId="03-x" exerciseId="hum-warmup" />);
    expect(screen.getByText(/gentle closed-mouth hum/i)).toBeTruthy();
    expect(screen.queryByText(/Plays as a follow-along/i)).toBeNull();
    expect(screen.getByText("Follow-along, not scored")).toBeTruthy();
    expect(screen.getByText("▶ Play")).toBeTruthy();
  });

  it("toggles the exercise in and out of the routine", async () => {
    await saveRoutine({ exerciseIds: ["five-note-scale-mee-may-mah"] });
    render(<LessonExerciseBlock courseId="c" lessonId="05-x" exerciseId="nay-1-3-5-3-1" />);
    const btn = await screen.findByText("+ Add to routine");
    fireEvent.click(btn);
    await screen.findByText("✓ In routine");
    expect((await loadRoutine()).exerciseIds).toEqual(["five-note-scale-mee-may-mah", "nay-1-3-5-3-1"]);
    fireEvent.click(screen.getByText("✓ In routine"));
    await screen.findByText("+ Add to routine");
    await waitFor(async () => expect((await loadRoutine()).exerciseIds).toEqual(["five-note-scale-mee-may-mah"]));
  });

  it("hydrates as in-routine when already present", async () => {
    await saveRoutine({ exerciseIds: ["nay-1-3-5-3-1"] });
    render(<LessonExerciseBlock courseId="c" lessonId="05-x" exerciseId="nay-1-3-5-3-1" />);
    await screen.findByText("✓ In routine");
  });
});
