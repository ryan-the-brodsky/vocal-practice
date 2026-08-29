import AsyncStorage from "@react-native-async-storage/async-storage";
import {
  DEFAULT_ROUTINE,
  addExerciseIds,
  loadRoutine,
  removeExerciseIds,
  saveRoutine,
  toggleExerciseId,
} from "../routine";

jest.mock("@react-native-async-storage/async-storage", () =>
  require("@react-native-async-storage/async-storage/jest/async-storage-mock"),
);

beforeEach(async () => {
  await AsyncStorage.clear();
});

describe("addExerciseIds", () => {
  it("appends new ids in order and dedupes against the stored routine", async () => {
    await saveRoutine({ exerciseIds: ["a", "b"] });
    const r = await addExerciseIds(["b", "c", "c", "d"]);
    expect(r.added).toEqual(["c", "d"]);
    expect(r.exerciseIds).toEqual(["a", "b", "c", "d"]);
    expect((await loadRoutine()).exerciseIds).toEqual(["a", "b", "c", "d"]);
  });

  it("starts from DEFAULT_ROUTINE when nothing is stored", async () => {
    const r = await addExerciseIds(["zzz"]);
    expect(r.exerciseIds).toEqual([...DEFAULT_ROUTINE.exerciseIds, "zzz"]);
  });

  it("reports nothing added when every id is present", async () => {
    await saveRoutine({ exerciseIds: ["a"] });
    const r = await addExerciseIds(["a"]);
    expect(r.added).toEqual([]);
  });
});

describe("removeExerciseIds", () => {
  it("drops every occurrence and reports which ids were present", async () => {
    await saveRoutine({ exerciseIds: ["a", "b", "a", "c"] });
    const r = await removeExerciseIds(["a", "x"]);
    expect(r.removed).toEqual(["a"]);
    expect(r.exerciseIds).toEqual(["b", "c"]);
  });
});

describe("toggleExerciseId", () => {
  it("adds when absent, removes when present", async () => {
    await saveRoutine({ exerciseIds: ["a"] });
    expect(await toggleExerciseId("b")).toEqual({ added: true, exerciseIds: ["a", "b"] });
    expect(await toggleExerciseId("a")).toEqual({ added: false, exerciseIds: ["b"] });
  });

  it("serializes concurrent edits so none are lost", async () => {
    await saveRoutine({ exerciseIds: [] });
    await Promise.all([toggleExerciseId("a"), toggleExerciseId("b"), addExerciseIds(["c"])]);
    expect((await loadRoutine()).exerciseIds).toEqual(["a", "b", "c"]);
  });
});
