# Song-recording corpus

Local-only recordings captured by the Import → **Record** mode (in `__DEV__`
the modal also drops the WAV + sidecar here for offline iteration). Each take
is a sung run of one *free-form melody* — not an exercise.

The WAV files are large and **stay local** — `.gitignore` ignores everything
in this folder except this README.

## Capture

1. Run `npx expo start --web`.
2. Open the Import modal and pick the **Record** tab.
3. Fill in song name + key center (+ optional tempo), tap **Start recording**,
   sing the melody without backing music, tap **Stop**.
4. The browser downloads two files; drop both here.

## File pair

```
<song-name-slug>__<voicePart>__<tonic>__<timestamp>.wav
<song-name-slug>__<voicePart>__<tonic>__<timestamp>.json
```

## `.wav`

Mono 16-bit PCM, sample rate as captured (typically 44.1 or 48 kHz).

## `.json` sidecar — `SongSidecar`

Schema in `lib/capture/songTypes.ts`:

| Field | Meaning |
|---|---|
| `kind` | Always `"song"` (discriminator vs the exercise `CaptureSidecar`) |
| `schemaVersion` | `1` |
| `songName` | User-provided name |
| `voicePart` | Voice part used |
| `tonic` | Key center, note string (e.g. `C4`) |
| `mode` | `"major"` \| `"minor"` \| `"chromatic"` |
| `tempoBpm` | Optional BPM override; absent = let `analyzeFile` auto-estimate |
| `sampleRate` | WAV sample rate (Hz) |
| `durationMs` | WAV duration |
| `capturedAt` | ISO timestamp of finalization |
| `note` | Optional free-text take label |

The eval harness for extraction techniques (planned `scripts/eval-songs.ts`)
will sweep `analyzeFile` parameters across these takes and emit candidate
exercise descriptors for audition.
