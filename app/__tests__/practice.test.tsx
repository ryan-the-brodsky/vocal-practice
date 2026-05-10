// Practice screen tests are deferred until the UX audits harden the screen.
// Practice is the most UX-fluid surface in the app — picker chips, headphones
// modal, settings cluster, mode toggles, demo phase, lead-in countdown — and
// any text-/role-coupled assertion written today will churn through the next
// few iterations. Once the UX is settled, replace this skip block with the
// real coverage:
//
//   1. Render <PracticeScreen /> with installFakeAudio() / installFakePitch().
//      AsyncStorage seed: vocal-training:settings:headphones-confirmed-session=yes
//      and any user-exercise / routine state needed.
//   2. Pick exercise + voice part via the chip picker.
//   3. Tap Start → assert AudioPlayer.init called and Status flips to running.
//   4. Drive synthetic samples via installFakePitch().emit(samples).
//   5. Assert completed-keys list shows ≥1 row with high accuracy and
//      "Log session" / "Discard" controls render after stop.
//
// PR 5 (Playwright) is the better line for the full happy path because
// Tone.Transport timing is real there.

describe.skip("<PracticeScreen /> — deferred until UX audit", () => {
  it("placeholder", () => {
    // intentionally empty
  });
});
