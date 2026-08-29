import { expect, test } from "@playwright/test";

// The Foundations of Singing path a visitor actually clicks, end to end on the
// static export: Learn hub → course card → syllabus → lesson → routine toggle →
// mark complete → next lesson, plus the in-app Courses tab and /plan redirect.

test("Learn hub → syllabus → lesson 1 → add to routine → mark complete → lesson 2", async ({ page }) => {
  // Lesson 1's exercise is in DEFAULT_ROUTINE, so start from an empty routine
  // to exercise the add path (the toggle would otherwise read "✓ In routine").
  await page.goto("/learn/");
  await page.evaluate(() => localStorage.setItem("vocal-training:routine:v1", JSON.stringify({ exerciseIds: [] })));
  await page.reload();
  await page.getByRole("link", { name: /Foundations of Singing/ }).first().click();
  await expect(page).toHaveURL(/\/courses\/foundations-of-singing\/?$/);
  await expect(page.getByRole("heading", { level: 1 })).toContainText(/free online singing course for beginners/i);

  // Static HTML carries the ranking content before any hydration.
  const html = await page.content();
  expect(html).toContain('"@type":"Course"');
  expect(html).toContain('"isAccessibleForFree":true');

  await page.getByRole("link", { name: "Start lesson 1" }).click();
  await expect(page).toHaveURL(/\/courses\/foundations-of-singing\/01-can-anyone-learn-to-sing$/);
  await expect(page.getByRole("heading", { level: 1 })).toContainText(/Can You Learn to Sing/);
  await expect(page.getByText("About this exercise")).toBeVisible();
  await expect(page.getByText("▶ Play")).toBeVisible();

  // Routine toggle writes to localStorage (same-origin as the app).
  const addBtn = page.getByRole("button", { name: /Add .* to your routine/ });
  await addBtn.click();
  await expect(page.getByText("✓ In routine")).toBeVisible();
  const routine = await page.evaluate(() => JSON.parse(localStorage.getItem("vocal-training:routine:v1") ?? "{}"));
  expect(routine.exerciseIds).toContain("five-note-scale-mee-may-mah");

  // Mark complete persists course progress.
  await page.getByRole("button", { name: "Mark this lesson complete" }).click();
  await expect(page.getByText("✓ Lesson completed")).toBeVisible();
  const courses = await page.evaluate(() => JSON.parse(localStorage.getItem("vocal-training:courses:v1") ?? "{}"));
  expect(courses["foundations-of-singing"].completedLessonIds).toEqual(["01-can-anyone-learn-to-sing"]);

  // Next link → lesson 2; syllabus now offers Continue.
  await page.getByRole("link", { name: /^Next: / }).click();
  await expect(page).toHaveURL(/02-breathing-for-singing$/);
  await page.getByRole("link", { name: "Foundations of Singing" }).first().click();
  await expect(page.getByRole("link", { name: "Continue: Lesson 2" })).toBeVisible();
  await expect(page.getByRole("progressbar")).toBeVisible();
});

test("every lesson page renders its H1 and the full-guide link statically", async ({ page }) => {
  await page.goto("/courses/foundations-of-singing/");
  const hrefs = await page.locator('a[href*="/courses/foundations-of-singing/0"]').evaluateAll((as) =>
    Array.from(new Set(as.map((a) => (a as HTMLAnchorElement).getAttribute("href")!))),
  );
  expect(hrefs.length).toBe(9);
  for (const href of hrefs) {
    const res = await page.goto(href);
    expect(res?.status()).toBe(200);
    await expect(page.getByRole("heading", { level: 1 })).not.toBeEmpty();
    await expect(page.getByRole("link", { name: /→$/ }).filter({ hasText: /^(?!Next|Back)/ }).first()).toBeVisible();
  }
});

test("app shell: Courses tab lands on /courses, /plan redirects to /routine", async ({ page }) => {
  // Onboarding gate: mark seen so Practice renders its tab bar.
  await page.goto("/");
  await page.evaluate(() => localStorage.setItem("vocal-training:onboarding:v1", "done"));
  await page.goto("/");
  // The headphones dialog covers the tab bar until answered; a visitor answers it first too.
  await page.getByText("Continue without (less accurate)").click();
  await page.getByRole("tab", { name: /Courses/ }).click();
  await expect(page).toHaveURL(/\/courses\/?$/);
  await expect(page.getByRole("heading", { level: 1 })).toContainText("Free singing courses");

  await page.goto("/plan");
  await expect(page).toHaveURL(/\/routine$/);
  await expect(page.getByText("Routine", { exact: true }).first()).toBeVisible();
  await expect(page.getByRole("tab", { name: /Routine/ })).toHaveAttribute("aria-selected", "true");
});
