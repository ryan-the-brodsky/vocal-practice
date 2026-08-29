import type { Course } from "@/content/courses/types";
import { courseProgress, getCourse, lessonHref, lessonIndex, nextLesson, prevLesson } from "../index";

const course: Course = {
  id: "c", slug: "c", title: "C", description: "", level: "beginner", estimatedWeeks: 1,
  metaDescription: "", updated: "2026-01-01", body: "",
  lessons: [
    { id: "01-a", title: "A", articleSlug: "x", exerciseIds: ["e1"], updated: "", body: "" },
    { id: "02-b", title: "B", articleSlug: "y", exerciseIds: ["e2"], updated: "", body: "" },
    { id: "03-c", title: "C", articleSlug: "z", exerciseIds: ["e3"], updated: "", body: "" },
  ],
};

describe("lesson navigation", () => {
  it("indexes and walks neighbours", () => {
    expect(lessonIndex(course, "02-b")).toBe(1);
    expect(lessonIndex(course, "nope")).toBe(-1);
    expect(nextLesson(course, "02-b")?.id).toBe("03-c");
    expect(nextLesson(course, "03-c")).toBeUndefined();
    expect(prevLesson(course, "02-b")?.id).toBe("01-a");
    expect(prevLesson(course, "01-a")).toBeUndefined();
    expect(nextLesson(course, "nope")).toBeUndefined();
  });

  it("builds hrefs", () => {
    expect(lessonHref("c", "02-b")).toBe("/courses/c/02-b");
  });
});

describe("courseProgress", () => {
  it("picks the first uncompleted lesson in syllabus order, not last+1", () => {
    const p = courseProgress(course, ["02-b"]);
    expect(p).toMatchObject({ completed: 1, total: 3, done: false });
    expect(p.nextLesson?.id).toBe("01-a");
  });

  it("is done when every lesson is complete and ignores unknown ids", () => {
    const p = courseProgress(course, ["01-a", "02-b", "03-c", "ghost"]);
    expect(p).toMatchObject({ completed: 3, total: 3, done: true, nextLesson: undefined });
  });
});

describe("getCourse", () => {
  it("resolves the flagship course from generated content", () => {
    expect(getCourse("foundations-of-singing")?.lessons.length).toBeGreaterThan(0);
    expect(getCourse("nope")).toBeUndefined();
  });
});
