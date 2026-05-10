# PRD foundation for a personal vocal warmup app

**The clean architectural answer is a single Web Audio code path on both platforms, driven by JSON exercise descriptors.** Use `react-native-audio-api` (Software Mansion) as the iOS AudioContext, run **Tone.js + Tone.Sampler** with a small Salamander piano MP3 subset on top of it, and use **`pitchy` (MPM)** for pitch detection — fed by the same `react-native-audio-api` mic on iOS and by browser `getUserMedia` on web. Define warmup exercises as JSON (scale degrees, syllables, key range, accompaniment pattern, BPM) and generate Tone events at runtime — **don't use MIDI files as the source of truth**. The biggest pitfalls are real: `expo-av`/`expo-audio` cannot expose real-time mic PCM as of SDK 55, plain Tone.js won't run unmodified in RN, and male voices ≥ A3 cause systematic octave errors in any classical pitch detector unless you add a clarity gate plus an octave-jump constraint. Total bundle impact for the recommended stack is roughly **5–10 MB**, and end-to-end pitch-detection latency is realistically **50–120 ms** with **±5–15 cents** accuracy on sustained sung notes — comfortably inside what the use case demands.

For Ryan specifically (theatrical folk-rock, prominent belt, likely tenor or high baritone), the pedagogical priority is the **E4–G4 male passaggio** — exercises should be parameterized so the *5* or *8* of each pattern lands in that zone. The "Goog" arpeggio (Speech Level Singing), "Nay/Nyah" calling patterns (Saunders-Barton/LoVetri), and descending 5-4-3-2-1 are the most directly relevant building blocks; the lip-trill octave-and-a-half ("Rossini scale") is the most efficient daily SOVT warmup. A defensible v1 ships ~10 exercises covering SOVT, scales, arpeggios, sirens, staccato, mix/belt, and messa di voce.

---

## The 18 warmup exercises that should anchor the exercise library

The selection below merges four pedagogical streams: **classical Italian/bel canto** (Miller, Vaccai, Concone), **Speech Level Singing** (Riggs), **Somatic Voicework / CCM** (LoVetri, Saunders-Barton, Lader), and **modern studio coaches** (Stoney/NYVC, Arceneaux, Henny, Byrne). Patterns and BPMs were cross-verified against at least two sources where possible. Scale degrees use `1` = tonic, `8` = octave; numbers above 8 extend the scale.

| # | Name | Pedagogical purpose | Scale-degree pattern | Tenor / Baritone tonic ascent | BPM (♩=) | Syllables | Piano accompaniment |
|---|---|---|---|---|---|---|---|
| 1 | Lip trill on 5-note scale | SOVT, breath flow, fold relaxation | 1-2-3-4-5-4-3-2-1 | Tenor C3→G3; Bari A2/B♭2→D3/E♭3 (~6–8 semitones) | 80–110 | bilabial "brrr" | Block I chord + light melody doubling (or root+5th drone) |
| 2 | Lip trill octave-and-a-half ("Rossini") | SOVT through full passaggio | 1-3-5-8-10-12-10-8-5-3-1 | Tenor C3→G3; Bari B♭2→E♭3 | 100–140 | lip trill | Doubles melody an octave higher, OR arpeggiated I chord |
| 3 | Tongue trill on scale or arpeggio | SOVT, releases tongue | 1-3-5-3-1 or 1-2-3-4-5-4-3-2-1 | Same as lip trill | 90–120 | rolled "rrr" | Doubled melody or block I chord |
| 4 | Siren / glissando | Range smoothing, passaggio coordination | 1→8→1 continuous slide (≥1.5 octaves per Estill) | Tenor A2/B2↔A4/B4; Bari G2↔G4 | free | "ng", "oo", "ah→ee" | Drone on tonic, or no accompaniment |
| 5 | "Ng" siren / hum | Forward placement, "ng ring" | 1→8→1, 5→1, or 1-5-1 slide | Tenor D3→A3; Bari B2→F3 | 80–100 or free | "ng" | Drone or single block chord |
| 6 | 5-note scale on vowels | Vowel unification, resonance | 1-2-3-4-5-4-3-2-1 | Tenor C3→G3; Bari A♭2→E♭3 | 80–100 | mee-may-mah-moh-moo | Doubled melody; cadential I-IV-V-I at end |
| 7 | Descending 5-4-3-2-1 | Head-down-into-mix, no chest pulling | 5-4-3-2-1 | Tenor *5*=G4 down to tonic D3; Bari *5*=E4 down to A2 | 70–100 | "nay", "mee", "noo", lip trill | Doubled melody, or sustained I chord |
| 8 | Major triad (1-3-5-3-1) | Pitch accuracy, ear training | 1-3-5-3-1 (minor variant 1-♭3-5-♭3-1) | Tenor C3→A3; Bari A2→E♭3 | 90–120 | "ng", "ah", "mum", "goog" | Block I on beat 1, or doubled melody |
| 9 | Octave arpeggio | Range, register coordination | 1-3-5-8-5-3-1 | Tenor C3→G3 (8 lands F4–G4); Bari A2→E♭3 | 100–140 | "ah", "ee", "mee", "goog", "vee", lip trill | Block I chord, or root+octave doubled melody |
| 10 | Octave leap with sustain | Bridge registers, train belt landings | 1 → 8 (held) → 1 | Tenor C3→F3 (8 = F4); Bari A2→D3 | 60–80 | "wee-eee", "yah-ah", "wow", "hey" | Block I chord held; or root+5th drone |
| 11 | Staccato arpeggio | Agility, fold adduction onset | 1-3-5-8-5-3-1 staccato | Tenor C3→G3; Bari A2→D3 | 120–160 | "ha-ha-ha", "hee", staccato "nay" | Single chord stab per arpeggio |
| 12 | Messa di voce | Breath/pressure mastery | sustain on 1 or 5; pp→ff→pp | Tenor D3 chrom. up to F4/G4; Bari B2→E4 | free, 3–8s/phase | "ah", "oh", "ee" | Sustained block I chord, or no accompaniment |
| 13 | "Goog" arpeggio (SLS) | Mix coordination, passaggio bridge | 1-3-5-8-5-3-1 or 1-5-3-8-5-3-1 | Tenor C3→G3 (8 = G4 through 1st bridge); Bari A2→E♭3 | 120–180 | "goog" (hard G + "oo") | Doubled melody or light block chord |
| 14 | "Mum" arpeggio (SLS) | Larynx stabilization, bridging | 1-3-5-8-5-3-1 | Tenor C3→G3; Bari A2→D3 | 100–140 | "mum", "bub" | Doubled melody or block I |
| 15 | "Nay" / "Nyah" pattern | Chest-mix, belt prep | 1-3-5-3-1 or 5-1 or 1-5-3-1 | Tenor C3/D3→G3 (5 sits C4–E4); Bari B2→E3 | 100–130 | "nay", "nyah", "yeah", "hey", bright /æ/-/ɛ/ | Block I chord; speech-rhythmic |
| 16 | 9-note (octave+1) scale | Range, breath endurance | 1-2-3-4-5-6-7-8-9-8-…-1 (or 1-…-8-…-1) | Tenor C3→F3 (top = F4–G4); Bari B♭2→D3 | 90–120 | "ah", "ee", lip trill, vowels rotated | I → V (top half) → I |
| 17 | Vowel modification | Aggiustamento through passaggio | sustain 5 or 1-3-5-8 with vowel shift | Pitches around F#4–A4 (tenor); D4–F4 (bari) | 60–90 | "ee→ih→eh→ah", or "ah→aw→oh→oo" | Sustained tonic chord |
| 18 | Hum on pitch / scale | Resonance, gentle warm-up & cool-down | sustain 1; or 1-2-3-2-1; or 1-3-5-3-1 | Tenor D3→G3; Bari A2→D3 | 70–100 | "mmm", "n", "ng" | Block I chord; root+5th drone |

The pedagogical sequencing principle is **graduation from thin folds, low pressure to thick folds, high pressure** — never the reverse. A canonical 25-minute routine moves: body/breath prep → SOVT (lip/tongue trill, ng) → resonance/placement (humming, "mee-may-mah") → range expansion (octave arpeggios, 9-note scales) → agility/onset (staccato) → register/mix coordination (goog, nay, descending 5-1) → dynamics (messa di voce) → cool-down. **For a male belter in folk-rock repertoire, the highest-leverage exercises are #15 (Nay/Nyah), #13 (Goog), #7 (descending 5-4-3-2-1 on "nay"), #10 (octave leap on "wow"/"hey"), and #2 (Rossini lip trill).** All five should be parameterized so the *5* or *8* sits in **E4–A4**, the male belt sweet spot for theatrical folk-rock (Hadestown, Hamilton, Mumford & Sons, Glen Hansard).

A few defaults the app should encode: tenor exercises start chromatically from C3 and ascend ~5–8 semitones; baritone start from A2/B♭2 and ascend ~5–7 semitones; descending exercises typically start with *5* on G4 and walk the tonic down to D3. Most teachers ascend until effort, then descend chromatically through the start key and 2–4 semitones below. **Direction reversal should be a per-exercise toggle** — Riggs/SLS often skips the descent on stretch exercises; Miller/classical reverses symmetrically.

## How piano accompanists actually keep singers on pitch

The single most important conventional principle: **piano provides harmonic context, not a pitch crutch**. Doubling the melody is a *rehearsal aid*, not an accompaniment — it's appropriate for absolute beginners, lip trills (because the trill obscures internal pitch monitoring), and brand-new exercises, but otherwise should be off so the singer's ear stays active. Every other convention follows from this distinction.

For 5-note scales and arpeggios at intermediate level, **the convention is a single sustained I chord per pattern**: RH plays a closed-position triad in the singer's tessitura (top of triad sits roughly C4–G5, ideally a third to a sixth below the singer's lowest note in the pattern, never landing exactly on the sung melody — that creates beat frequencies), LH plays a root octave on beat 1, sustained with implied pedal until the next chord change. Octave-and-a-half scales get **I (m. 1) → V (top half) → I (descent)** to track the harmonic implication of climbing through the scale's upper register. Octave leaps use an open voicing (1-5-8 in RH, root octave low in LH) that literally contains both leap pitches. Sirens and sustained tones use a drone (open fifth) or no accompaniment at all. Staccato exercises mirror the singer with crisp chord stabs on each note. Lip-trill exercises *do* double the melody because the trill makes pitch self-monitoring impossible — this is the principled exception.

**The most under-documented but most important convention is the chromatic-modulation cue between keys.** John Bertalot's "18 Warm-Ups" gives the cleanest pedagogical answer: when the warmup repeats up by a semitone, **play the dominant 7 of the new key for one beat or one short measure**, then resolve to the new tonic as the singer enters. The V7 contains the leading tone of the new key, which gives the strongest possible pitch lift and helps the singer internalize the new tonic before phonating. In order of musical sophistication, the cue options are: **(1) None** — straight to the new I chord; **(2) Single-note "ding"** — play the starting pitch alone; **(3) Block I chord with starting pitch on top**; **(4) Broken arpeggio "bell"** — 1-3-5 ending on starting pitch; **(5) V7 of new key, resolving to new I**. Most apps stop at option 3; offering 4 and 5 as user settings is a clear differentiator.

Voice-leading between keys deserves a similar treatment. Most apps just reset to root position in each new key, producing a noticeably "blocky" chromatic ascent. **Choosing the inversion of the new I whose top note is closest by half-step to the previous voicing's top note** produces stepwise upper-voice motion across modulations and sounds dramatically more like a real accompanist — and it's a 10-line function. Velocity defaults should keep accompaniment around **75/127** (chord stabs) with **cues at 95/127** so they cut through, and doubled-melody notes at 80; LH should stay above C2 to avoid mud and below the singer's phonation zone.

The PRD should expose **five accompaniment presets**: *Classical/Vaccai* (block I, no doubling, V7 cue, voice-led inversions), *Studio coach* (block I, melody on top, bell cue), *Beginner* (doubled melody throughout, ding cue), *Lip trill mode* (doubled melody only, no chord, ding cue), and *Drone* (open fifth LH only, no rhythm). The underlying data model is a small interface — `{doublesMelody, rhPattern, rhVoicing, lhPattern, reattackOn, cueType, cueDurationBeats}` — that each exercise references by name.

## Pitch detection: the make-or-break is mic capture, not the algorithm

The algorithm question is essentially solved. **YIN, MPM (McLeod), and pYIN all give 5–15 cent accuracy on sustained sung vowels with 30–90 ms windows**, well inside the goal. For a personal warmup app sung close to a phone mic in a quiet room, **CREPE (CNN-based) is overkill** — its real advantage is below 10 dB SNR or for voiced/unvoiced decisions. The dominant practical failure mode is **octave errors on male voices ≥ A3**, where the second harmonic exceeds the fundamental and any classical detector can latch onto the wrong octave. Mitigation is mandatory regardless of algorithm: a **clarity threshold (~0.85), median filter over the last 3–5 frames, and an octave-jump constraint** that ignores any new estimate differing by ≥1 octave from the recent median unless it persists for 3+ consecutive frames. This is ~50 lines of code and fixes the issue.

The library landscape favors **`pitchy` v4.1.0** (MPM, MIT, ~10 KB minified, ESM, last release Jan 2024, returns `[pitch, clarity]`) for the JS path. `pitchfinder` (7.5k★, GPLv3) has more algorithms but the GPL is awkward and pitchy is more than sufficient. `aubiojs` is unmaintained (3 years stale). On the React Native side, `react-native-pitchy` (rnheroes, ~52★, active 2025) is a credible alternative that does mic capture + YIN/MPM/HPS/AMDF natively in a shared C++ core and just emits pitch events — useful as a backup if the recommended path has issues.

**The hard problem is real-time mic PCM access.** As of Expo SDK 55 (Nov 2025), `expo-av` is deprecated and `expo-audio` has a `useAudioSampleListener` hook — but it samples the **playback** path, not the mic. The recorder side (`useAudioRecorder`) still only produces a file URI plus optional dB-level metering. **Neither expo-av nor expo-audio can give you real-time mic PCM buffers.** This is the single hardest fact to absorb when planning the architecture. The viable third-party options:

| Library | Mechanism | Cross-platform? | Notes |
|---|---|---|---|
| **`react-native-audio-api`** (Software Mansion, ~709★, v0.11.2 Jan 2026, MIT) | Web-Audio-shaped API: AudioContext, AnalyserNode, AudioRecorder, WorkletProcessingNode | **iOS, Android, web** | Single API across platforms; official Expo plugin; backed by Reanimated/Gesture-Handler authors; pre-1.0 so test specific SDK pairings |
| `@siteed/audio-studio` | Built-in pitch extractor, MFCC, chroma | iOS, Android, web | Largest "batteries-included" dep; biggest footprint |
| `@picovoice/react-native-voice-processor` | `addFrameListener((frame: number[]))` at configurable frame size | iOS, Android only | Apache-2.0, production-grade, small surface |
| `react-native-live-audio-stream` / `@fugood/...-pcm-stream` | Base64 PCM via JS event | iOS, Android only | Bridge cost from base64 |
| Custom Expo Module wrapping `AVAudioEngine.installTap` | DIY, JSI ArrayBuffer zero-copy | iOS only | Reference: `DonBraulio/tuneo` + Expo's May 2025 blog post |

**`react-native-audio-api` is the right choice** because it's the only one that gives a single Web-Audio-style API on **iOS, Android, and web** — meaning the same Tone.js-style code that does pitch detection on iOS does it on the web with zero conditional code. WASM in RN is not a real option (Hermes/JSC don't expose `WebAssembly` natively, and polyfills are too slow for real-time DSP).

On the web side the standard pattern is `getUserMedia → MediaStreamSource → AnalyserNode { fftSize: 4096 } → pitchy.findPitch()` polled on `requestAnimationFrame`. iOS Safari quirks: HTTPS required for `getUserMedia`, AudioContext must start after a user gesture, and `audioContext.sampleRate` is often 48 kHz — read it dynamically rather than assuming 44.1.

Realistic numbers for the phone path: **±5–15 cents accuracy** on sustained sung notes, **50–120 ms end-to-end latency** (10–20 ms ADC + 30–90 ms algorithm window + 5–20 ms post-processing), reliable down to ~80 Hz with a 4096-sample window (drop to 8192 for E2 and below). The recommended `PitchDetector` interface returns `{hz, midi, cents, clarity, rmsDb, timestamp}` — a clean abstraction that scoring logic can consume identically on both platforms.

## MIDI synthesis: Tone.js + Salamander samples + JSON descriptors

The cross-platform synthesis answer is the same shape as the pitch-detection answer: **a single Web Audio code path on top of `react-native-audio-api`**. Plain Tone.js doesn't run unmodified in React Native — Tone.js's own wiki literally warns about it, and a recent issue (#1319, Feb 2025) reports the WebView attempt produces no sound on iOS. The fix is calling `Tone.setContext(rnAudioApiContext)` so Tone.js routes through Software Mansion's native AudioContext implementation; the same Tone.js code then runs on web (browser AudioContext) and iOS (native AVFoundation/CoreAudio via `react-native-audio-api`). Software Mansion's intro blog explicitly cites Tone.js compatibility as a goal, but this is a relatively new path (2024–2026) — test on a real iPhone before committing, and stay in the well-supported subset (AudioContext, GainNode, AudioBufferSourceNode, BiquadFilter, Oscillator, AudioParam scheduling).

The synthesis primitive is **`Tone.Sampler`** (polyphonic on its own — do NOT wrap in PolySynth), which auto-pitch-shifts samples to fill missing notes. Pitch-shift artifacts of ±2 semitones are essentially inaudible, so you can sample every 3rd or 4th note and cover the whole keyboard. Pure synthesized piano (Tone.PolySynth, FMSynth, Karplus-Strong) is — by every audio-engineering reference — **unconvincing for hours of practice**; the 5 MB of bundle for samples is worth it.

For samples, **Salamander Grand Piano V3** is the gold standard: originally CC-BY 3.0, now public domain since March 2022. The full set is 1.9 GB but a usable subset is tiny:

| Sample option | Size | License | Use case |
|---|---|---|---|
| **Salamander, 8 notes mono 96 kbps MP3** (A1, C2, A2, C3, A3, C4, A4, C5) | **~3–5 MB** | Public domain | **Recommended.** Bundle directly. |
| Salamander C5-Lite SF2 | 15 MB | Public domain | If you want a single .sf2 file |
| FluidR3Mono_GM.sf3 | 13 MB | MIT | Full GM in one file (overkill for piano-only) |
| MuseScore_General.sf3 | 36 MB | MIT | Better balanced piano than FluidR3 |
| Salamander full | 700 MB – 1.9 GB | Public domain | Far too large for an app bundle |

Bundle the 5 MB Salamander MP3 subset directly via `expo-asset` — App Store Connect's max build size is 4 GB and the cellular-download warning is well above 200 MB, so 5 MB is invisible. On-demand download via `expo-file-system` adds first-launch UX delay and complexity for marginal savings.

**The most consequential design call is to skip MIDI files entirely as the source of truth.** Warmups are parametric: the same pattern transposes chromatically, BPM is configurable, range varies by voice. Authoring is by Claude / by hand, not in a DAW. JSON exercise descriptors generate Tone.js note events at runtime — trivially transposable, parameterizable, human-readable, diffable in git, and natural for Claude to produce. A descriptor looks like:

```jsonc
{
  "id": "five-note-scale-mee-may-mah",
  "scaleDegrees": [0,2,4,5,7,5,4,2,0],   // semitones from tonic
  "syllables": ["mee","may","mah","moh","moo","moh","mah","may","mee"],
  "noteValue": "8n",
  "tempo": 96,
  "keyRange": { "lowest": "C3", "highest": "G3", "step": 1 },
  "voicePart": "tenor",
  "accompaniment": { "pattern": "blockChordOnDownbeat", "chord": "I", "doubleMelody": false, "cueType": "bell" }
}
```

Keep `@tonejs/midi` (~21k★, MIT, last release ~4 years ago but feature-complete) as an *optional importer* if Ryan ever wants to drop in a DAW-authored backing — it's pure JSON parsing and runs fine in RN. But the primary representation should be JSON.

The runtime engine is small: a pure-TS `WarmupEngine` iterates through keys, generates absolute MIDI notes for melody and accompaniment from the descriptor and current tonic, and feeds them to `Tone.Transport` and `Tone.Part`, which calls `piano.triggerAttackRelease(noteName, duration, time, velocity)`. Latency under `Tone.Transport.lookAhead = "interactive"` is well under 50 ms — fine for warmups, where the chord is a cue, not phase-locked timing.

## Architecture synthesis

The clean structure is three layers: **data → engine → audio**, with platform conditionality only at the audio context.

```
┌────────────────────────────────────────────────────────┐
│  /data/exercises/*.json   (warmup descriptors)         │
└────────────────────────────┬───────────────────────────┘
                             ▼
                WarmupEngine.ts (pure TS)
                — iterates keys, generates note events,
                  applies accompaniment patterns,
                  emits {noteName, velocity, time}
                             ▼
       AccompanimentPlayer (Tone.js impl, shared)
       — Tone.Sampler (Salamander mp3, bundled)
       — Tone.Transport, Tone.Part
                             ▼
   AudioContext  (only this layer is platform-specific)
   ┌───────────────────────┴──────────────────────────┐
   ▼                                                  ▼
  Web build                                  Expo iOS build
  browser AudioContext                       react-native-audio-api
                                             AudioContext, set via Tone.setContext()
```

The **PitchDetector** layer is parallel and similarly thin: one interface (`start/stop/on(listener)`, returning `{hz, midi, cents, clarity, rmsDb, timestamp}`), one implementation that uses `react-native-audio-api`'s `AudioRecorder` + a `WorkletProcessingNode` running pitchy on the audio thread. On web this resolves to the browser's Web Audio API; on iOS to the native AVAudioEngine. **The platform branch is at the AudioContext, not in the application logic.** Octave-jump and clarity gating live in the post-processing layer above the algorithm, identically on both platforms.

A `FallbackAccompanimentPlayer` that plays prerendered MP3s per (exercise × key) via `expo-audio` is cheap insurance against `react-native-audio-api` regressions on a particular SDK version — keep it as an option behind a feature flag, not as a primary path.

**Concrete dependency list:**
- `tone` ^15.0.4 (~150 KB gzipped)
- `@tonejs/midi` ^2.0.28 (optional, ~30 KB)
- `react-native-audio-api` ^0.11.2 (a few MB native binary)
- `pitchy` ^4.1.0 (~10 KB)
- `expo-asset`, `expo-audio` (fallback), `expo-file-system`
- Expo SDK 53+ (54 preferred), dev build (Expo Go is incompatible)
- Salamander MP3 subset bundled at `assets/salamander/` (~5 MB)
- `app.json`: `react-native-audio-api` config plugin, mic permission usage description, `UIBackgroundModes: ["audio"]` if Ryan wants playback when the screen locks

**Total marginal bundle**: ~5–10 MB. Well within budget for personal sideload.

## Pitfalls Ryan should know before writing a line of code

The five non-obvious traps, in priority order: **(1)** `expo-av` and `expo-audio` cannot stream real-time mic PCM as of SDK 55 — `useAudioSampleListener` samples the playback path only; don't waste hours trying to make `useAudioRecorder` emit samples. **(2)** Plain Tone.js doesn't run in RN — the WebView workaround produces no sound on iOS (issue #1319, Feb 2025); the working path is `react-native-audio-api` + `Tone.setContext()`, which is a 2024-onward path that's still pre-1.0. **(3)** Male voices ≥ A3 cause systematic octave errors in YIN/MPM/pYIN because the 2nd harmonic outweighs the fundamental — clarity gating + median filter + octave-jump constraint are mandatory, not optional. **(4)** `Tone.start()` requires a user gesture on web (autoplay policy); wire it to a "Start session" button. **(5)** WASM in RN is not a real option — there is no production-grade WASM runtime in stock RN/Hermes; don't try to ship aubiojs in RN, only on web (and even there, pitchy is smaller and sufficient).

License notes: pitchfinder is GPLv3 (avoid; pitchy is MIT and equivalent for clean singing); Salamander samples are public domain; Tone.js, `@tonejs/midi`, `react-native-audio-api`, and pitchy are all MIT. For personal sideload via TestFlight none of this matters legally, but the MIT stack keeps options open if Ryan ever wants to share the app.

## What this means for v1

Ship 8–10 exercises drawn from the table — concretely: **Rossini lip trill (#2), 5-note scale on mee-may-mah (#6), Goog octave arpeggio (#13), Nay 1-3-5-3-1 (#15), descending 5-4-3-2-1 on "nay" (#7), octave leap on "wow" (#10), staccato arpeggio (#11), and "ng" siren (#5)**. Each exercise is a JSON descriptor. The accompaniment system supports the five preset patterns (Classical/Studio/Beginner/Lip-trill/Drone) plus the four cue types (none/ding/bell/V7) as user settings. The pitch detection layer scores each sung note against the target with cents-deviation feedback; ship the octave-jump heuristic from day one. The web build is a free byproduct — same code, same exercises, same scoring — useful for testing and for desktop-mic practice. **The total greenfield code (excluding library APIs) is realistically 1,500–2,500 lines, well within Claude's productive range for a personal project.**