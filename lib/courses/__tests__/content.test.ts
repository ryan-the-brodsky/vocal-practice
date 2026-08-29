import { execFileSync } from "node:child_process";
import { readFileSync } from "node:fs";
import { join } from "node:path";

import { COURSES } from "@/content/courses/courses.generated";
import { LEARN_ARTICLES } from "@/content/learn/articles.generated";
import { getExercise } from "@/lib/exercises/library";

const ROOT = join(__dirname, "..", "..", "..");

describe("course content audit", () => {
  it("ships the flagship course", () => {
    expect(COURSES.map((c) => c.id)).toContain("foundations-of-singing");
  });

  it.each(COURSES.map((c) => [c.id, c] as const))("%s is well-formed", (_id, course) => {
    expect(course.slug).toBe(course.id);
    expect(course.lessons.length).toBeGreaterThanOrEqual(3);
    expect(course.metaDescription.length).toBeGreaterThan(80);
    expect(course.metaDescription.length).toBeLessThanOrEqual(160);
    const ids = course.lessons.map((l) => l.id);
    expect(new Set(ids).size).toBe(ids.length);
    for (const lesson of course.lessons) {
      expect(lesson.id).toMatch(/^\d{2}-/);
      expect(LEARN_ARTICLES.some((a) => a.slug === lesson.articleSlug)).toBe(true);
      expect(lesson.exerciseIds.length).toBeGreaterThanOrEqual(1);
      expect(lesson.exerciseIds.length).toBeLessThanOrEqual(2);
      for (const ex of lesson.exerciseIds) expect(getExercise(ex)).toBeDefined();
      // Framing must be original prose, not a pointer.
      expect(lesson.body.split(/\s+/).length).toBeGreaterThan(200);
    }
  });

  it("generated file matches the markdown on disk (run `npm run courses:gen`)", () => {
    const before = readFileSync(join(ROOT, "content", "courses", "courses.generated.ts"), "utf8");
    execFileSync("node", [join(ROOT, "scripts", "gen-courses.mjs")], { stdio: "ignore" });
    const after = readFileSync(join(ROOT, "content", "courses", "courses.generated.ts"), "utf8");
    expect(after).toBe(before);
  });

  it("public copy carries no em dashes (anti-slop)", () => {
    for (const c of COURSES) {
      expect(c.body).not.toMatch(/—/);
      for (const l of c.lessons) {
        expect(l.body).not.toMatch(/—/);
        for (const ex of l.exerciseIds) expect(getExercise(ex)!.pedagogy).not.toMatch(/—/);
      }
    }
  });
});
