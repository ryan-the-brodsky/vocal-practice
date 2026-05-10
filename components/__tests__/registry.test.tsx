// Component-project smoke test: proves jest-expo + the DI registry pattern work.
// installFakeAudio() / installFakePitch() must override the factory so that
// createAudioPlayer() / createPitchDetector() return the fakes.

import { createAudioPlayer } from "@/lib/audio";
import { createPitchDetector } from "@/lib/pitch";
import {
  installFakeAudio,
  installFakePitch,
} from "../../test/setup-component";

describe("DI registry", () => {
  it("installFakeAudio() makes createAudioPlayer() return the fake", () => {
    const { player, log } = installFakeAudio();
    const got = createAudioPlayer();
    expect(got).toBe(player);
    got.playNote("C4", 1);
    expect(log.playNoteCalls).toEqual([{ noteName: "C4", durationSec: 1, velocity: undefined }]);
  });

  it("installFakePitch() captures listeners and forwards emitted samples", async () => {
    const { detector, emit, listenerCount } = installFakePitch();
    const got = createPitchDetector();
    expect(got).toBe(detector);
    const received: number[] = [];
    const unsub = got.on((s) => {
      if (s.midi !== null) received.push(s.midi);
    });
    expect(listenerCount()).toBe(1);
    await got.start();
    expect(got.isActive()).toBe(true);
    emit({ hz: 440, midi: 69, cents: 0, clarity: 0.95, rmsDb: -18, timestamp: 100 });
    emit({ hz: null, midi: null, cents: null, clarity: 0, rmsDb: -60, timestamp: 200 });
    expect(received).toEqual([69]);
    unsub();
    expect(listenerCount()).toBe(0);
  });
});
