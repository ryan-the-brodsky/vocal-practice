// OnboardingScreen: the always-visible "Skip to singing" persists the flag and
// replaces to "/", the Voice/Routine steps write through the REAL stores
// (saveVoicePart / saveRoutine), a mid-flow Skip keeps already-made choices, and
// the final "Start singing" completes. Mirrors the step list + a11y labels in
// app/onboarding.tsx — edits there must be reflected here.

import React from "react";
import { render, screen, fireEvent, waitFor, act } from "@testing-library/react";
import AsyncStorage from "@react-native-async-storage/async-storage";

import OnboardingScreen from "@/app/onboarding";
import { getMockRouter } from "@/test/setup-component";
import { ONBOARDING_STORAGE_KEY } from "@/lib/settings/onboarding";
import { loadVoicePart } from "@/lib/settings/voicePart";
import { loadRoutine } from "@/lib/progress/routine";

jest.mock("react-native-safe-area-context", () => ({
  useSafeAreaInsets: () => ({ top: 0, bottom: 0, left: 0, right: 0 }),
  SafeAreaProvider: ({ children }: { children: React.ReactNode }) => children,
}));

const SKIP = "Skip onboarding and go straight to singing";

beforeEach(async () => {
  await AsyncStorage.clear();
});

async function clickLabel(label: string): Promise<void> {
  await act(async () => {
    fireEvent.click(screen.getByLabelText(label));
  });
}

describe("<OnboardingScreen />", () => {
  it("Skip persists the onboarding flag and replaces to /", async () => {
    render(<OnboardingScreen />);
    await clickLabel(SKIP);

    await waitFor(async () => {
      expect(await AsyncStorage.getItem(ONBOARDING_STORAGE_KEY)).toBe("done");
    });
    expect(getMockRouter().replace).toHaveBeenCalledWith("/");
  });

  it("a voice pick writes to the voice-part store", async () => {
    render(<OnboardingScreen />);
    await clickLabel("Next"); // welcome → voice
    await clickLabel("alto, Upper-middle range");

    await waitFor(async () => {
      expect(await loadVoicePart()).toBe("alto");
    });
  });

  it("a routine toggle writes to the routine store", async () => {
    render(<OnboardingScreen />);
    await clickLabel("Next"); // → voice
    await clickLabel("Next"); // → routine
    await clickLabel("Ng Siren"); // not in DEFAULT_ROUTINE → adds it

    await waitFor(async () => {
      const routine = await loadRoutine();
      expect(routine.exerciseIds).toContain("ng-siren");
    });
  });

  it("a mid-flow Skip keeps an already-made voice choice", async () => {
    render(<OnboardingScreen />);
    await clickLabel("Next"); // → voice
    await clickLabel("soprano, Highest range");
    await clickLabel(SKIP);

    await waitFor(async () => {
      expect(await AsyncStorage.getItem(ONBOARDING_STORAGE_KEY)).toBe("done");
    });
    expect(await loadVoicePart()).toBe("soprano");
  });

  it("the final step's 'Start singing' completes onboarding", async () => {
    render(<OnboardingScreen />);
    // welcome → voice → routine → mode → import → segment (5 Nexts)
    for (let i = 0; i < 5; i++) {
      await clickLabel("Next");
    }
    await clickLabel("Start singing");

    await waitFor(async () => {
      expect(await AsyncStorage.getItem(ONBOARDING_STORAGE_KEY)).toBe("done");
    });
    expect(getMockRouter().replace).toHaveBeenCalledWith("/");
  });
});
