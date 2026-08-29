import { COURSES } from "@/content/courses/courses.generated";
import type { Course, CourseLesson } from "@/content/courses/types";

export type { Course, CourseLesson };

export function getCourse(id: string): Course | undefined {
  return COURSES.find((c) => c.id === id);
}

export function lessonIndex(course: Course, lessonId: string): number {
  return course.lessons.findIndex((l) => l.id === lessonId);
}

export function nextLesson(course: Course, lessonId: string): CourseLesson | undefined {
  const i = lessonIndex(course, lessonId);
  return i >= 0 ? course.lessons[i + 1] : undefined;
}

export function prevLesson(course: Course, lessonId: string): CourseLesson | undefined {
  const i = lessonIndex(course, lessonId);
  return i > 0 ? course.lessons[i - 1] : undefined;
}

export interface CourseProgressSummary {
  completed: number;
  total: number;
  /** First lesson in syllabus order not yet completed; undefined when done. */
  nextLesson: CourseLesson | undefined;
  done: boolean;
}

export function courseProgress(course: Course, completedIds: readonly string[]): CourseProgressSummary {
  const done = new Set(completedIds);
  const completed = course.lessons.filter((l) => done.has(l.id)).length;
  const next = course.lessons.find((l) => !done.has(l.id));
  return { completed, total: course.lessons.length, nextLesson: next, done: next === undefined };
}

export function courseHref(courseId: string): string {
  return `/courses/${courseId}/`;
}

export function lessonHref(courseId: string, lessonId: string): string {
  return `/courses/${courseId}/${lessonId}`;
}
