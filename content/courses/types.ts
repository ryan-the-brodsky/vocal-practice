// Shape of a course. Authored as Markdown under content/courses/<courseId>/
// (course.md + NN-<slug>.md lessons); scripts/gen-courses.mjs parses the flat
// frontmatter + bodies into content/courses/courses.generated.ts (`npm run courses:gen`).

export interface CourseLesson {
  /** Filename stem, e.g. "01-can-anyone-learn-to-sing" — URL segment + progress key. */
  id: string;
  title: string;
  /** content/learn/<slug>.md — the canonical article this lesson wraps. */
  articleSlug: string;
  /** data/exercises/<id>.json ids practiced in this lesson (1–2). */
  exerciseIds: string[];
  updated: string;
  /** Raw Markdown framing body (why this lesson now, what to notice, what "done" means). */
  body: string;
}

export interface Course {
  id: string;
  slug: string;
  title: string;
  description: string;
  level: "beginner" | "intermediate" | "advanced";
  estimatedWeeks: number;
  metaDescription: string;
  updated: string;
  /** Raw Markdown intro rendered on the syllabus page. */
  body: string;
  lessons: CourseLesson[];
}
