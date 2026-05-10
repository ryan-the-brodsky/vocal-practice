import type { PitchDetector } from "./detector";

export interface MicSniffResult {
  ok: boolean;
  rmsDb: number | null;
  error?: string;
}

/**
 * Spin up a PitchDetector for up to `timeoutMs`, await the first sample, and
 * tear it down. Used by the Practice screen's pre-Start mic check so the user
 * gets a fast yes/no on whether the microphone is reachable before they
 * commit to a full session.
 *
 * The factory is passed in (rather than resolved from the module-level DI
 * registry) so the unit test for this helper doesn't pull the real
 * `detector.web.ts` import chain (and therefore pitchy ESM) into ts-jest.
 */
export async function sniffMicrophone(
  factory: () => PitchDetector,
  timeoutMs = 1000,
): Promise<MicSniffResult> {
  const detector = factory();

  try {
    await detector.start();
  } catch (e) {
    return {
      ok: false,
      rmsDb: null,
      error: e instanceof Error ? e.message : String(e),
    };
  }

  return new Promise<MicSniffResult>((resolve) => {
    let settled = false;
    let unsubscribe: (() => void) | null = null;
    let timeoutId: ReturnType<typeof setTimeout> | null = null;

    const finish = (result: MicSniffResult): void => {
      if (settled) return;
      settled = true;
      if (timeoutId !== null) clearTimeout(timeoutId);
      unsubscribe?.();
      detector.stop().catch(() => {});
      resolve(result);
    };

    unsubscribe = detector.on((sample) => {
      finish({ ok: true, rmsDb: sample.rmsDb });
    });

    timeoutId = setTimeout(() => {
      finish({ ok: false, rmsDb: null, error: "No mic signal within timeout" });
    }, timeoutMs);
  });
}
