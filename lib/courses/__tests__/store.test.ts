import AsyncStorage from "@react-native-async-storage/async-storage";
import {
  COURSES_STORAGE_KEY,
  loadCourseProgress,
  loadCourses,
  markLessonComplete,
  touchLesson,
  unmarkLessonComplete,
} from "../store";

jest.mock("@react-native-async-storage/async-storage", () =>
  require("@react-native-async-storage/async-storage/jest/async-storage-mock"),
);

beforeEach(async () => {
  await AsyncStorage.clear();
});

describe("course progress store", () => {
  it("is empty until a lesson is touched", async () => {
    expect(await loadCourses()).toEqual({});
    const p = await touchLesson("c", "01-a");
    expect(p.completedLessonIds).toEqual([]);
    expect(p.lastLessonId).toBe("01-a");
    expect(typeof p.startedAt).toBe("string");
  });

  it("keeps startedAt from the first touch", async () => {
    const first = await touchLesson("c", "01-a");
    const second = await touchLesson("c", "02-b");
    expect(second.startedAt).toBe(first.startedAt);
    expect(second.lastLessonId).toBe("02-b");
  });

  it("marks, dedupes and unmarks completion", async () => {
    await markLessonComplete("c", "01-a");
    await markLessonComplete("c", "01-a");
    expect((await loadCourseProgress("c"))?.completedLessonIds).toEqual(["01-a"]);
    await unmarkLessonComplete("c", "01-a");
    expect((await loadCourseProgress("c"))?.completedLessonIds).toEqual([]);
  });

  it("keeps courses independent and survives concurrent writes", async () => {
    await Promise.all([
      markLessonComplete("c", "01-a"),
      markLessonComplete("c", "02-b"),
      markLessonComplete("d", "01-a"),
    ]);
    const all = await loadCourses();
    expect(all.c.completedLessonIds.sort()).toEqual(["01-a", "02-b"]);
    expect(all.d.completedLessonIds).toEqual(["01-a"]);
  });

  it("tolerates corrupt storage", async () => {
    await AsyncStorage.setItem(COURSES_STORAGE_KEY, "not json");
    expect(await loadCourses()).toEqual({});
    await AsyncStorage.setItem(COURSES_STORAGE_KEY, JSON.stringify({ c: { bogus: true }, d: { startedAt: "x", completedLessonIds: [] } }));
    expect(Object.keys(await loadCourses())).toEqual(["d"]);
  });
});
