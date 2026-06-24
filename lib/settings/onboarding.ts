import AsyncStorage from "@react-native-async-storage/async-storage";

export const ONBOARDING_STORAGE_KEY = "vocal-training:onboarding:v1";

/** True if the user has completed OR skipped onboarding. Any non-null value counts as seen. */
export async function hasSeenOnboarding(): Promise<boolean> {
  try {
    return (await AsyncStorage.getItem(ONBOARDING_STORAGE_KEY)) != null;
  } catch {
    return true; // fail safe: never trap a returning user behind onboarding on a storage error
  }
}

export async function markOnboardingSeen(): Promise<void> {
  await AsyncStorage.setItem(ONBOARDING_STORAGE_KEY, "done");
}

/** Dev/QA only — re-arm onboarding so it shows again on next load. */
export async function resetOnboarding(): Promise<void> {
  await AsyncStorage.removeItem(ONBOARDING_STORAGE_KEY);
}
