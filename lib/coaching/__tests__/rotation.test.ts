jest.mock("@react-native-async-storage/async-storage", () =>
  require("@react-native-async-storage/async-storage/jest/async-storage-mock"),
);

import AsyncStorage from "@react-native-async-storage/async-storage";
import { pickNextGenericTip } from "../rotation";
import { ADVICE_CARDS } from "../library/cards";

const ROTATION_KEY = "vocal-training:coaching:rotation:v1";

function genericIdsSorted(): string[] {
  return ADVICE_CARDS.filter((c) => c.kind === "generic")
    .map((c) => c.id)
    .sort();
}

describe("pickNextGenericTip", () => {
  beforeEach(async () => {
    await AsyncStorage.clear();
  });

  test("returns a generic card on first call", async () => {
    const card = await pickNextGenericTip();
    expect(card.kind).toBe("generic");
    expect(genericIdsSorted()).toContain(card.id);
  });

  test("first call selects the first id in sort order when nothing persisted", async () => {
    const card = await pickNextGenericTip();
    expect(card.id).toBe(genericIdsSorted()[0]);
  });

  test("persists the last-shown id after each call", async () => {
    const first = await pickNextGenericTip();
    const stored = await AsyncStorage.getItem(ROTATION_KEY);
    expect(stored).toBe(first.id);
  });

  test("round-robin advances to the next sorted id", async () => {
    const ids = genericIdsSorted();
    const first = await pickNextGenericTip();
    const second = await pickNextGenericTip();
    expect(first.id).toBe(ids[0]);
    expect(second.id).toBe(ids[1]);
  });

  test("wraps around to the start after the final id", async () => {
    const ids = genericIdsSorted();
    // Seed last-shown to the final id.
    await AsyncStorage.setItem(ROTATION_KEY, ids[ids.length - 1]);
    const next = await pickNextGenericTip();
    expect(next.id).toBe(ids[0]);
  });

  test("unknown last-shown id resets to first", async () => {
    await AsyncStorage.setItem(ROTATION_KEY, "g/does-not-exist");
    const card = await pickNextGenericTip();
    expect(card.id).toBe(genericIdsSorted()[0]);
  });
});
