// COMPONENT TEST: app/__tests__/onboarding.test.tsx asserts on the "Skip to
// singing" affordance persisting the onboarding flag + replacing to "/", the
// per-step Next/Back flow, and that the Voice/Routine steps write to the real
// stores (saveVoicePart / saveRoutine). Edits to the step list, button labels,
// or accessibility labels here MUST be mirrored in that test file.
import { useCallback, useEffect, useRef, useState } from "react";
import { useRouter } from "expo-router";

import OnboardingScaffold from "@/components/onboarding/OnboardingScaffold";
import WelcomeStep from "@/components/onboarding/steps/WelcomeStep";
import VoiceStep from "@/components/onboarding/steps/VoiceStep";
import RoutineStep from "@/components/onboarding/steps/RoutineStep";
import ModeIntroStep from "@/components/onboarding/steps/ModeIntroStep";
import ImportIntroStep from "@/components/onboarding/steps/ImportIntroStep";
import SongSegmentIntroStep from "@/components/onboarding/steps/SongSegmentIntroStep";
import { markOnboardingSeen } from "@/lib/settings/onboarding";
import { track } from "@/lib/analytics";
import { saveVoicePart } from "@/lib/settings/voicePart";
import { saveRoutine, DEFAULT_ROUTINE } from "@/lib/progress/routine";
import type { VoicePart } from "@/lib/exercises/types";

// Stable step names for analytics. Kept module-level (not derived from `steps`
// below) so the finish callback doesn't take a dependency that changes identity
// on every render. Must stay in the same order as the `steps` array.
const stepKeys = ["voice", "welcome", "routine", "mode", "import", "segment"] as const;

export default function OnboardingScreen() {
  const router = useRouter();
  const [step, setStep] = useState(0);

  // Preferences seed from the app's existing defaults, so "Next" without touching
  // anything is a no-op (Practice defaults to alto + DEFAULT_ROUTINE).
  // Each is persisted through the real store on change — never a parallel store.
  // null until the singer actually picks. Seeding a value here rendered it as
  // pre-selected, and analytics showed most first-run users simply pressing
  // Next through it — a soprano then gets a mismatched-range exercise she can't sing.
  const [voice, setVoice] = useState<VoicePart | null>(null);
  const [routineIds, setRoutineIds] = useState<string[]>(DEFAULT_ROUTINE.exerciseIds);

  // Persist on change (skipping the seeded mount value) so any exit — Next, Back,
  // or Skip — keeps whatever the user last chose.
  // Persist only a real choice. The mount value is now null, so there's no
  // seeded value to skip past — writing anything before the user picks would
  // re-introduce the silent default this change exists to remove.
  useEffect(() => {
    if (voice === null) return;
    saveVoicePart(voice).catch(() => {});
  }, [voice]);

  const firstRoutine = useRef(true);
  useEffect(() => {
    if (firstRoutine.current) {
      firstRoutine.current = false;
      return;
    }
    // Never persist an empty routine — a fully-deselected list would leave Practice
    // with no warmups. Keep the last non-empty choice (or the seeded default).
    if (routineIds.length === 0) return;
    saveRoutine({ exerciseIds: routineIds }).catch(() => {});
  }, [routineIds]);

  const toggleRoutine = useCallback((id: string) => {
    setRoutineIds((prev) => (prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]));
  }, []);

  // The ordered step list: voice FIRST — it's load-bearing (every exercise is
  // transposed from it, and analytics show ~3 in 4 pickers choose a non-default
  // part), then welcome, the routine preference, and three feature intros.
  const steps = [
    { key: stepKeys[0], render: () => <VoiceStep value={voice} onChange={setVoice} /> },
    { key: stepKeys[1], render: () => <WelcomeStep /> },
    { key: stepKeys[2], render: () => <RoutineStep selectedIds={routineIds} onToggle={toggleRoutine} /> },
    { key: stepKeys[3], render: () => <ModeIntroStep /> },
    { key: stepKeys[4], render: () => <ImportIntroStep /> },
    { key: stepKeys[5], render: () => <SongSegmentIntroStep /> },
  ];
  const isLast = step === steps.length - 1;

  // One event on the way out rather than one per step: the useful question is
  // how far people get and whether they skip, and `stepReached` answers both
  // without six near-duplicate events.
  const finish = useCallback(
    async (skipped: boolean) => {
      track("onboarding_finished", {
        skipped,
        stepReached: step,
        stepKey: stepKeys[step] ?? "unknown",
        stepCount: stepKeys.length,
        // null means they skipped past the voice step, so Practice will fall
        // back to its own default. Distinguishing that from a deliberate
        // "tenor" is the whole point of the change.
        voicePart: voice,
        voicePartChosen: voice !== null,
        routineSize: routineIds.length,
      });
      await markOnboardingSeen();
      router.replace("/");
    },
    [router, step, voice, routineIds.length],
  );

  const handleNext = useCallback(() => {
    if (isLast) {
      void finish(false);
    } else {
      setStep((current) => Math.min(current + 1, steps.length - 1));
    }
  }, [isLast, finish, steps.length]);

  return (
    <OnboardingScaffold
      step={step}
      stepCount={steps.length}
      onSkip={() => void finish(true)}
      onBack={step > 0 ? () => setStep((current) => Math.max(current - 1, 0)) : undefined}
      onNext={handleNext}
      // The voice step is the only one that blocks: every later exercise is
      // transposed from this answer. "Skip to singing" is still available.
      nextDisabled={stepKeys[step] === "voice" && voice === null}
      nextLabel={isLast ? "Start singing" : "Next"}
      footnote={
        isLast ? "Pop in headphones if you've got them — we'll ask for mic access the first time you start." : undefined
      }
    >
      {steps[step].render()}
    </OnboardingScaffold>
  );
}
