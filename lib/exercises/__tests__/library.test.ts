jest.mock("@react-native-async-storage/async-storage", () =>
  require("@react-native-async-storage/async-storage/jest/async-storage-mock"),
);

import { exerciseLibrary, routineBuiltinItems } from "../library";

describe("routineBuiltinItems", () => {
  it("returns one {id,label} per built-in exercise", () => {
    const items = routineBuiltinItems();
    expect(items).toHaveLength(exerciseLibrary.length);
  });

  it("maps every built-in id to its display name", () => {
    const items = routineBuiltinItems();
    for (const ex of exerciseLibrary) {
      const match = items.find((it) => it.id === ex.id);
      expect(match).toBeDefined();
      expect(match!.label).toBe(ex.name);
    }
  });

  it("never emits an empty label", () => {
    for (const it of routineBuiltinItems()) {
      expect(it.label.length).toBeGreaterThan(0);
    }
  });
});
