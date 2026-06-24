import AsyncStorage from "@react-native-async-storage/async-storage";
import {
  ONBOARDING_STORAGE_KEY,
  hasSeenOnboarding,
  markOnboardingSeen,
  resetOnboarding,
} from "../onboarding";

jest.mock("@react-native-async-storage/async-storage", () =>
  require("@react-native-async-storage/async-storage/jest/async-storage-mock"),
);

describe("onboarding flag persistence", () => {
  beforeEach(async () => {
    await AsyncStorage.clear();
  });

  it("hasSeenOnboarding is false when nothing is stored", async () => {
    expect(await hasSeenOnboarding()).toBe(false);
  });

  it("markOnboardingSeen writes a non-empty sentinel under the canonical key", async () => {
    await markOnboardingSeen();
    expect(await AsyncStorage.getItem(ONBOARDING_STORAGE_KEY)).toBe("done");
  });

  it("hasSeenOnboarding is true after markOnboardingSeen", async () => {
    await markOnboardingSeen();
    expect(await hasSeenOnboarding()).toBe(true);
  });

  it("treats any non-null stored value as seen", async () => {
    await AsyncStorage.setItem(ONBOARDING_STORAGE_KEY, "v2-blob");
    expect(await hasSeenOnboarding()).toBe(true);
  });

  it("resetOnboarding re-arms onboarding", async () => {
    await markOnboardingSeen();
    await resetOnboarding();
    expect(await hasSeenOnboarding()).toBe(false);
  });

  it("fails safe to seen when the read throws", async () => {
    const spy = jest
      .spyOn(AsyncStorage, "getItem")
      .mockRejectedValueOnce(new Error("storage unavailable"));
    expect(await hasSeenOnboarding()).toBe(true);
    spy.mockRestore();
  });
});
