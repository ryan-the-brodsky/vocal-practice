# Raw-audio corpus

Local-only recordings captured by the dev-only "Record raw audio" toggle on the
Practice screen (visible only when `__DEV__`). Each take is a sung run of one
exercise; the corpus lets us replay recordings offline through different
pitch-detection techniques and compare them against expected targets.

The WAV files are large and **stay local** — `.gitignore` ignores everything in
this folder except this README.

## Capture

1. Run `npx expo start --web`.
2. On the Practice screen, open Session settings and turn on **Record raw audio**.
3. Start a session and sing it through.
4. On session end (natural completion or Stop), the browser downloads two files.

## File pair

Each take produces two files sharing one base name:

```
<exerciseId>__<voicePart>__<tonic>__<timestamp>.wav
<exerciseId>__<voicePart>__<tonic>__<timestamp>.json
```

- `<exerciseId>` — the exercise descriptor id (e.g. `five-note-scale-mee-may-mah`)
- `<voicePart>` — `soprano` | `alto` | `tenor` | `baritone`
- `<tonic>` — first iteration's starting tonic note (e.g. `C3`)
- `<timestamp>` — ISO-ish, filename-safe (colons replaced)

Drop both files in this directory to add a take to the corpus.

## `.wav`

Mono 16-bit PCM, sample rate as captured (typically 44.1 or 48 kHz). Covers the
**entire session** including the demo/lead-in — capture starts before the piano.

## `.json` sidecar — `CaptureSidecar`

Schema in `lib/capture/types.ts`:

| Field | Meaning |
|---|---|
| `exerciseId` | Exercise descriptor id |
| `voicePart` | Voice part used |
| `startTonic` | First iteration's tonic, note string |
| `tempo` | BPM |
| `sampleRate` | WAV sample rate (Hz) |
| `durationMs` | WAV duration |
| `capturedAt` | ISO timestamp of finalization |
| `audioStartOffsetMs` | When the piano began, relative to the WAV start (capture/detector start first) |
| `keyStarts` | `{ tonic, startTime }[]` — startTime in seconds, relative to audio start |
| `expectedTargets` | Per key iteration, the planned melody MIDI note numbers |
| `note` | Optional free-text take label |
| `appCommit` | App git short SHA, when available |
| `octaveShift` | Octaves the take was sung relative to `expectedTargets`; score against `expectedTargets + octaveShift*12` |

To align a replay to expected targets: skip `audioStartOffsetMs` into the WAV to
reach the audio start, then each `keyStarts[i].startTime` (seconds) locates that
key iteration, with `expectedTargets[i].midi` the notes to score against — shifted
by `octaveShift` octaves.

## Octave verification (2026-05-21)

The first 8 takes were captured before the octave-shift feature existed, so their
`expectedTargets` hold the notated (octaveShift-0) values. CREPE reference tracks
showed the singer an octave below the notation on the higher exercises and at
notation on the lower ones, so `octaveShift` was back-filled per take from the
CREPE offset: **−1** for mee-may-mah / descending-nay / nay-1-3-5-3-1 (all peak
C5), **0** for goog-octave-arpeggio and rossini-lip-trill (peak ≤ Bb4) — the
singer octave-displaces exactly the exercises that cross their ~Bb4–C5 ceiling.
