import React from "react";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { render, screen } from "@testing-library/react";

import CourseSyllabus from "@/components/courses/CourseSyllabus";
import { COURSES } from "@/content/courses/courses.generated";
import { COURSES_STORAGE_KEY } from "@/lib/courses/store";

const course = COURSES.find((c) => c.id === "foundations-of-singing")!;

beforeEach(async () => {
  await AsyncStorage.clear();
});

describe("<CourseSyllabus />", () => {
  it("renders every lesson title and the free/beginner H1 with no progress", async () => {
    render(<CourseSyllabus course={course} />);
    expect(screen.getByText(/free online singing course for beginners/i)).toBeTruthy();
    for (const l of course.lessons) expect(screen.getByText(l.title)).toBeTruthy();
    expect(await screen.findByText("Start lesson 1")).toBeTruthy();
    expect(screen.queryByRole("progressbar")).toBeNull();
  });

  it("upgrades the CTA to Continue and shows progress after hydration", async () => {
    await AsyncStorage.setItem(
      COURSES_STORAGE_KEY,
      JSON.stringify({ [course.id]: { startedAt: "2026-01-01T00:00:00Z", completedLessonIds: [course.lessons[0].id, course.lessons[1].id] } }),
    );
    render(<CourseSyllabus course={course} />);
    expect(await screen.findByText("Continue: Lesson 3")).toBeTruthy();
    expect(screen.getByRole("progressbar")).toBeTruthy();
  });
});
