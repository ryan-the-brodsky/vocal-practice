// No-op Tone.js stub for component tests. The real Tone module touches
// AudioContext / browser globals on import, so this short-circuits transitive
// imports without forcing every test to install a fake audio context.

class FakeSampler {
  loaded = Promise.resolve();
  release = 0;
  toDestination() { return this; }
  connect() { return this; }
  triggerAttack() { return this; }
  triggerRelease() { return this; }
  triggerAttackRelease() { return this; }
  dispose() {}
}

class FakeGain {
  value = 1;
  toDestination() { return this; }
  connect() { return this; }
  dispose() {}
}

const fakeTransport = {
  bpm: { value: 120 },
  start: () => {},
  stop: () => {},
  cancel: () => {},
  scheduleOnce: () => 0,
  clear: () => {},
};

const fakeContext = {
  resume: async () => {},
  state: "running",
  baseLatency: 0,
  outputLatency: 0,
};

module.exports = {
  Sampler: FakeSampler,
  Gain: FakeGain,
  Transport: fakeTransport,
  getTransport: () => fakeTransport,
  getContext: () => fakeContext,
  start: async () => {},
  now: () => 0,
};
