import AsyncStorage from "@react-native-async-storage/async-storage";

// Local course progress. A course gets a record only once the user touches a
// lesson, so the store stays empty for people who never open a course.
// Pattern mirrors lib/songs/store.ts (serialized writes, tolerant reads).

export const COURSES_STORAGE_KEY = "vocal-training:courses:v1";

export interface CourseProgress {
  startedAt: string;
  completedLessonIds: string[];
  lastLessonId?: string;
}

export type CoursesState = Record<string, CourseProgress>;

let writeQueue: Promise<unknown> = Promise.resolve();
function enqueue<T>(fn: () => Promise<T>): Promise<T> {
  const next = writeQueue.then(fn, fn);
  writeQueue = next.catch(() => {});
  return next;
}

function isProgress(v: unknown): v is CourseProgress {
  return (
    v !== null &&
    typeof v === "object" &&
    typeof (v as CourseProgress).startedAt === "string" &&
    Array.isArray((v as CourseProgress).completedLessonIds)
  );
}

async function readAll(): Promise<CoursesState> {
  try {
    const raw = await AsyncStorage.getItem(COURSES_STORAGE_KEY);
    if (!raw) return {};
    const parsed: unknown = JSON.parse(raw);
    if (parsed === null || typeof parsed !== "object" || Array.isArray(parsed)) return {};
    const out: CoursesState = {};
    for (const [k, v] of Object.entries(parsed as Record<string, unknown>)) {
      if (isProgress(v)) out[k] = v;
    }
    return out;
  } catch {
    return {};
  }
}

async function writeAll(state: CoursesState): Promise<void> {
  await AsyncStorage.setItem(COURSES_STORAGE_KEY, JSON.stringify(state));
}

export async function loadCourses(): Promise<CoursesState> {
  return readAll();
}

export async function loadCourseProgress(courseId: string): Promise<CourseProgress | undefined> {
  return (await readAll())[courseId];
}

function update(
  courseId: string,
  mutate: (p: CourseProgress) => CourseProgress,
  now: () => string,
): Promise<CourseProgress> {
  return enqueue(async () => {
    const state = await readAll();
    const existing = state[courseId] ?? { startedAt: now(), completedLessonIds: [] };
    const next = mutate(existing);
    await writeAll({ ...state, [courseId]: next });
    return next;
  });
}

const isoNow = () => new Date().toISOString();

/** Records that the user opened a lesson (creates the course record on first touch). */
export function touchLesson(courseId: string, lessonId: string): Promise<CourseProgress> {
  return update(courseId, (p) => ({ ...p, lastLessonId: lessonId }), isoNow);
}

export function markLessonComplete(courseId: string, lessonId: string): Promise<CourseProgress> {
  return update(
    courseId,
    (p) =>
      p.completedLessonIds.includes(lessonId)
        ? p
        : { ...p, completedLessonIds: [...p.completedLessonIds, lessonId], lastLessonId: lessonId },
    isoNow,
  );
}

export function unmarkLessonComplete(courseId: string, lessonId: string): Promise<CourseProgress> {
  return update(
    courseId,
    (p) => ({ ...p, completedLessonIds: p.completedLessonIds.filter((id) => id !== lessonId) }),
    isoNow,
  );
}
