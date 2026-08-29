import React from "react";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { fireEvent, render, screen, waitFor } from "@testing-library/react";

import MarkCompleteButton from "@/components/courses/MarkCompleteButton";
import { COURSES_STORAGE_KEY, loadCourseProgress } from "@/lib/courses/store";

beforeEach(async () => {
  await AsyncStorage.clear();
});

describe("<MarkCompleteButton />", () => {
  it("marks and undoes completion in storage", async () => {
    render(<MarkCompleteButton courseId="foundations-of-singing" lessonId="01-can-anyone-learn-to-sing" index={0} />);
    fireEvent.click(await screen.findByText("Mark lesson complete"));
    await screen.findByText("✓ Lesson completed");
    expect((await loadCourseProgress("foundations-of-singing"))?.completedLessonIds).toEqual(["01-can-anyone-learn-to-sing"]);

    fireEvent.click(screen.getByText("Undo"));
    await screen.findByText("Mark lesson complete");
    await waitFor(async () =>
      expect((await loadCourseProgress("foundations-of-singing"))?.completedLessonIds).toEqual([]),
    );
  });

  it("hydrates the completed state from storage", async () => {
    await AsyncStorage.setItem(
      COURSES_STORAGE_KEY,
      JSON.stringify({ c: { startedAt: "2026-01-01T00:00:00Z", completedLessonIds: ["l1"] } }),
    );
    render(<MarkCompleteButton courseId="c" lessonId="l1" index={0} />);
    await screen.findByText("✓ Lesson completed");
  });
});
