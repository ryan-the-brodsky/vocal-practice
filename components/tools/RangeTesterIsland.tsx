// COMPONENT TEST: components/tools/__tests__/RangeTesterIsland.test.tsx
//
// Guided chromatic walk: play a note on the piano, wait for the singer to match
// it (reusing the app's guided hold-and-match), then step a semitone. Descend
// from middle C until the singer taps "too low", then ascend from middle C until
// they tap "too high". The matched extremes are the measured range. This is
// friendlier than "find your own lowest/highest note blind" — the singer always
// has a reference pitch to copy, and can honestly admit when a note is beyond them.
//
// The pitch detector is imported statically — it's module-load safe (mic /
// AudioContext are created inside start(), not at import) so it's SSG-safe. The
// heavy piano (Tone + Salamander) is lazy-loaded on Start so the static
// marketing route stays light, and it's a best-effort enhancement: the walk
// works mic-only if it fails to load. The mic gesture is satisfied by Start.
import { useCallback, useEffect, useRef, useState } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { useRouter, type Href } from 'expo-router';

import { Colors, Fonts, Radii, Spacing, Typography } from '@/constants/theme';
import { midiToNote } from '@/lib/exercises/music';
import { createPitchDetector } from '@/lib/pitch';
import { classifyMicError, micErrorCopy, type MicErrorReason } from '@/lib/pitch/micError';
import type { PitchDetector, PitchSample } from '@/lib/pitch/detector';
import type { AudioPlayer } from '@/lib/audio';
import {
  centsFromTarget,
  classifyVoice,
  describeSpan,
  onMatch,
  onTapOut,
  startWalk,
  type VoiceClassification,
  type WalkState,
} from '@/lib/tools/rangeTest';

const c = Colors.light;

// Tuning. The piano reference plays for REF_SEC and we wait PRE_LISTEN_MS (just
// past it) before listening, so the held note doesn't bleed into the match.
const REF_SEC = 0.65;
const PRE_LISTEN_MS = 700;
const MATCH_HOLD_MS = 350; // sustain within tolerance this long to count as matched
const MATCH_TOLERANCE_CENTS = 75; // forgiving — we want "can you phonate this pitch?"
const POST_MATCH_MS = 450;
const PLAY_AGAIN_IGNORE_MS = 800; // ignore the mic while a manual replay rings
const RMS_GATE_DB = -45;

type Phase = 'idle' | 'requesting' | 'walking' | 'result' | 'error';
type Outcome = 'matched' | 'tapout' | 'abort';

export default function RangeTesterIsland() {
  const router = useRouter();

  const [phase, setPhase] = useState<Phase>('idle');
  const [walk, setWalk] = useState<WalkState>(() => startWalk());
  const [listening, setListening] = useState(false);
  const [justMatched, setJustMatched] = useState(false);
  const [matchProgress, setMatchProgress] = useState(0);
  const [liveNote, setLiveNote] = useState<string | null>(null);
  const [result, setResult] = useState<VoiceClassification | null>(null);
  const [errReason, setErrReason] = useState<MicErrorReason | null>(null);

  const playerRef = useRef<AudioPlayer | null>(null);
  const detectorRef = useRef<PitchDetector | null>(null);
  const abortRef = useRef<{ aborted: boolean }>({ aborted: false });
  const walkRef = useRef<WalkState>(walk);
  const pendingResolveRef = useRef<((o: Outcome) => void) | null>(null);
  const tapQueuedRef = useRef(false);
  const ignoreUntilRef = useRef(0);

  const applyWalk = useCallback((next: WalkState) => {
    walkRef.current = next;
    setWalk(next);
  }, []);

  const teardown = useCallback(() => {
    pendingResolveRef.current = null;
    detectorRef.current?.stop().catch(() => {});
    detectorRef.current = null;
  }, []);

  useEffect(() => {
    return () => {
      abortRef.current.aborted = true;
      detectorRef.current?.stop().catch(() => {});
      playerRef.current?.dispose().catch(() => {});
    };
  }, []);

  const playReference = useCallback((target: number) => {
    playerRef.current?.playNote(midiToNote(target), REF_SEC);
  }, []);

  // Lazy-load the piano on Start. Heavy (Tone + Salamander) and web-only, so it
  // stays out of the static bundle; failure is non-fatal (mic-only fallback).
  const loadPlayer = useCallback(async () => {
    if (playerRef.current) return;
    try {
      const { createAudioPlayer } = await import('@/lib/audio');
      if (abortRef.current.aborted) return;
      const p = createAudioPlayer();
      await p.init();
      if (abortRef.current.aborted) {
        p.dispose().catch(() => {});
        return;
      }
      playerRef.current = p;
    } catch {
      // Reference tones just won't play — the walk still works from the mic.
    }
  }, []);

  const waitForOutcome = useCallback((detector: PitchDetector, target: number): Promise<Outcome> => {
    return new Promise((resolve) => {
      if (tapQueuedRef.current) {
        tapQueuedRef.current = false;
        resolve('tapout');
        return;
      }
      let matchStart: number | null = null;
      let active = true;
      setListening(true);

      const settle = (o: Outcome) => {
        if (!active) return;
        active = false;
        unsub();
        if (pendingResolveRef.current === settle) pendingResolveRef.current = null;
        setListening(false);
        resolve(o);
      };
      pendingResolveRef.current = settle;

      const unsub = detector.on((sample: PitchSample) => {
        if (!active) return;
        if (abortRef.current.aborted) {
          settle('abort');
          return;
        }
        if (Date.now() < ignoreUntilRef.current) return; // a manual replay is ringing
        if (sample.midi != null && (sample.rmsDb ?? -100) >= RMS_GATE_DB) {
          setLiveNote(midiToNote(sample.midi));
        }
        if (sample.midi == null || (sample.rmsDb ?? -100) < RMS_GATE_DB) {
          matchStart = null;
          setMatchProgress(0);
          return;
        }
        const cents = centsFromTarget(sample.midi, sample.cents, target);
        if (cents != null && Math.abs(cents) <= MATCH_TOLERANCE_CENTS) {
          if (matchStart == null) matchStart = sample.timestamp;
          const dur = sample.timestamp - matchStart;
          setMatchProgress(Math.min(1, dur / MATCH_HOLD_MS));
          if (dur >= MATCH_HOLD_MS) settle('matched');
        } else {
          matchStart = null;
          setMatchProgress(0);
        }
      });
    });
  }, []);

  const runWalk = useCallback(async () => {
    const detector = detectorRef.current;
    if (!detector) return;
    let state = startWalk();
    applyWalk(state);

    while (state.phase !== 'done' && !abortRef.current.aborted) {
      setMatchProgress(0);
      setJustMatched(false);
      setLiveNote(null);
      playReference(state.target);
      await delay(PRE_LISTEN_MS);
      if (abortRef.current.aborted) return;

      const outcome = await waitForOutcome(detector, state.target);
      if (outcome === 'abort') return;

      const next = outcome === 'matched' ? onMatch(state) : onTapOut(state);
      if (outcome === 'matched') {
        setJustMatched(true);
        setMatchProgress(1);
        await delay(POST_MATCH_MS);
        if (abortRef.current.aborted) return;
      }
      state = next;
      applyWalk(state);
    }

    teardown();
    if (state.lowMidi != null && state.highMidi != null) {
      setResult(classifyVoice(state.lowMidi, state.highMidi));
    }
    setPhase('result');
  }, [applyWalk, playReference, waitForOutcome, teardown]);

  const handleStart = useCallback(async () => {
    setPhase('requesting');
    setErrReason(null);
    setResult(null);
    setListening(false);
    setJustMatched(false);
    abortRef.current = { aborted: false };
    tapQueuedRef.current = false;
    ignoreUntilRef.current = 0;
    try {
      const detector = createPitchDetector();
      detector.setClarityThreshold(0.9);
      detector.setOctaveJumpFrames(3);
      await detector.start();
      detectorRef.current = detector;
      setPhase('walking');
      await loadPlayer();
      if (abortRef.current.aborted) return;
      runWalk();
    } catch (err) {
      setErrReason(classifyMicError(err));
      setPhase('error');
    }
  }, [loadPlayer, runWalk]);

  const handleTapOut = useCallback(() => {
    if (pendingResolveRef.current) pendingResolveRef.current('tapout');
    else tapQueuedRef.current = true;
  }, []);

  const handlePlayAgain = useCallback(() => {
    const t = walkRef.current.target;
    ignoreUntilRef.current = Date.now() + PLAY_AGAIN_IGNORE_MS;
    playReference(t);
  }, [playReference]);

  const reset = useCallback(() => {
    abortRef.current.aborted = true;
    pendingResolveRef.current?.('abort');
    teardown();
    applyWalk(startWalk());
    setResult(null);
    setLiveNote(null);
    setListening(false);
    setJustMatched(false);
    setMatchProgress(0);
    setPhase('idle');
  }, [teardown, applyWalk]);

  return (
    <View style={styles.card} accessibilityLabel="Vocal range test tool">
      {phase === 'idle' && (
        <View style={styles.center}>
          <Text style={styles.kicker}>FREE · NO SIGNUP · AUDIO STAYS ON YOUR DEVICE</Text>
          <Text style={styles.lead}>
            We&apos;ll play a note, you sing it back. Starting from middle C we step down until you
            tap out, then up — so you always have a pitch to match instead of guessing your limits.
          </Text>
          <PrimaryButton label="Start the test" onPress={handleStart} />
          <Text style={styles.fine}>Works best with headphones in a quiet room.</Text>
        </View>
      )}

      {phase === 'requesting' && (
        <View style={styles.center}>
          <Text style={styles.lead}>Requesting microphone access…</Text>
          <Text style={styles.fine}>Choose “Allow” when your browser asks.</Text>
        </View>
      )}

      {phase === 'walking' && (
        <View style={styles.center}>
          <Text style={styles.kicker}>
            {walk.phase === 'descend' ? 'GOING DOWN ↓' : 'GOING UP ↑'}
          </Text>
          <Text style={styles.prompt}>Sing this note</Text>
          <Text style={styles.targetNote} accessibilityLabel={`Target note ${midiToNote(walk.target)}`}>
            {midiToNote(walk.target)}
          </Text>

          <View style={styles.matchBarTrack}>
            <View
              style={[
                styles.matchBarFill,
                {
                  width: `${Math.round(matchProgress * 100)}%`,
                  backgroundColor: matchProgress >= 1 ? c.success : c.success + '88',
                },
              ]}
            />
          </View>

          <Text style={styles.statusLine}>
            {justMatched
              ? 'Got it ✓'
              : listening
                ? liveNote
                  ? `Now sing it back — you’re on ${liveNote}`
                  : 'Now sing it back and hold it steady'
                : 'Listen…'}
          </Text>

          <Pressable
            onPress={handleTapOut}
            disabled={justMatched}
            accessibilityRole="button"
            accessibilityLabel={
              walk.phase === 'descend' ? 'Too low, I cannot go lower' : 'Too high, I cannot go higher'
            }
            style={({ pressed }) => [
              styles.tapOutBtn,
              justMatched && styles.btnDisabled,
              pressed && !justMatched && styles.tapOutBtnPressed,
            ]}
          >
            <Text style={styles.tapOutText}>
              {walk.phase === 'descend' ? "Too low — I can't go lower" : "Too high — I can't go higher"}
            </Text>
          </Pressable>

          <Pressable onPress={handlePlayAgain} accessibilityRole="button" accessibilityLabel="Play the note again" hitSlop={8}>
            <Text style={styles.ghost}>🔊 Play the note again</Text>
          </Pressable>

          <Text style={styles.fine}>
            {rangeSoFar(walk)}
          </Text>
          <Pressable onPress={reset} accessibilityRole="button" accessibilityLabel="Start over" hitSlop={8}>
            <Text style={styles.ghost}>Start over</Text>
          </Pressable>
        </View>
      )}

      {phase === 'result' && (
        <View style={styles.center}>
          {walk.lowMidi != null && walk.highMidi != null ? (
            <>
              <Text style={styles.kicker}>YOUR RANGE</Text>
              <Text style={styles.rangeBig}>
                {describeSpan(walk.lowMidi, walk.highMidi).lowNote} –{' '}
                {describeSpan(walk.lowMidi, walk.highMidi).highNote}
              </Text>
              <Text style={styles.fine}>
                {describeSpan(walk.lowMidi, walk.highMidi).octaves} octaves (
                {describeSpan(walk.lowMidi, walk.highMidi).semitones} semitones)
              </Text>
              {result && (
                <Text style={styles.voiceType}>
                  Closest voice type: <Text style={styles.voiceTypeEm}>{result.label}</Text>
                  {result.alsoConsider ? ` (with overlap into ${result.alsoConsider})` : ''}
                </Text>
              )}
              <Text style={styles.fine}>
                This is a starting point, not a verdict — voice type also depends on where your voice
                sits comfortably and its tone, not just your highest and lowest notes.
              </Text>
              <PrimaryButton
                label="Practice warm-ups in your range →"
                onPress={() => router.push((result ? `/?voicePart=${result.appVoicePart}` : '/') as Href)}
              />
              <Pressable onPress={reset} accessibilityRole="button" accessibilityLabel="Test again" hitSlop={8}>
                <Text style={styles.ghost}>Test again</Text>
              </Pressable>
            </>
          ) : (
            <>
              <Text style={styles.prompt}>We didn&apos;t catch a steady note.</Text>
              <Text style={styles.fine}>
                Try again in a quieter spot, with headphones, and hold each note for about a second.
              </Text>
              <PrimaryButton label="Try again" onPress={reset} />
            </>
          )}
        </View>
      )}

      {phase === 'error' && errReason && (
        <View style={styles.errorBox} accessibilityLabel="Microphone error">
          <Text style={styles.errorTitle}>{micErrorCopy(errReason).title}</Text>
          <Text style={styles.fine}>{micErrorCopy(errReason).body}</Text>
          {micErrorCopy(errReason).steps?.map((s, i) => (
            <Text key={i} style={styles.step}>
              {i + 1}. {s}
            </Text>
          ))}
          <PrimaryButton label="Retry" onPress={handleStart} />
        </View>
      )}
    </View>
  );
}

function rangeSoFar(walk: WalkState): string {
  if (walk.lowMidi == null && walk.highMidi == null) return 'Match the note to keep going.';
  const lo = walk.lowMidi != null ? midiToNote(walk.lowMidi) : '—';
  const hi = walk.highMidi != null ? midiToNote(walk.highMidi) : '—';
  return `Range so far: ${lo} – ${hi}`;
}

function delay(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

function PrimaryButton({ label, onPress, disabled }: { label: string; onPress: () => void; disabled?: boolean }) {
  return (
    <Pressable
      onPress={onPress}
      disabled={disabled}
      accessibilityRole="button"
      accessibilityLabel={label}
      style={({ pressed }) => [
        styles.btn,
        disabled && styles.btnDisabled,
        pressed && !disabled && styles.btnPressed,
      ]}
    >
      <Text style={styles.btnText}>{label}</Text>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: c.bgSurface,
    borderColor: c.borderSubtle,
    borderWidth: 1,
    borderRadius: Radii.lg,
    padding: Spacing.lg,
    minHeight: 280,
    justifyContent: 'center',
  },
  center: { alignItems: 'center', gap: Spacing.sm },
  kicker: {
    fontFamily: Fonts.bodyMedium,
    fontSize: Typography.xs.size,
    lineHeight: Typography.xs.lineHeight,
    letterSpacing: 0.5,
    color: c.textTertiary,
    textAlign: 'center',
  },
  lead: {
    fontFamily: Fonts.body,
    fontSize: Typography.md.size,
    lineHeight: Typography.md.lineHeight,
    color: c.textSecondary,
    textAlign: 'center',
  },
  prompt: {
    fontFamily: Fonts.bodyMedium,
    fontSize: Typography.lg.size,
    lineHeight: Typography.lg.lineHeight,
    color: c.textPrimary,
    textAlign: 'center',
  },
  targetNote: {
    fontFamily: Fonts.display,
    fontSize: Typography['3xl'].size,
    lineHeight: Typography['3xl'].lineHeight,
    color: c.accent,
  },
  statusLine: {
    fontFamily: Fonts.bodyMedium,
    fontSize: Typography.sm.size,
    lineHeight: Typography.sm.lineHeight,
    color: c.textSecondary,
    textAlign: 'center',
    minHeight: Typography.sm.lineHeight,
  },
  rangeBig: {
    fontFamily: Fonts.display,
    fontSize: Typography['2xl'].size,
    lineHeight: Typography['2xl'].lineHeight,
    color: c.textPrimary,
    textAlign: 'center',
  },
  voiceType: {
    fontFamily: Fonts.body,
    fontSize: Typography.md.size,
    lineHeight: Typography.md.lineHeight,
    color: c.textPrimary,
    textAlign: 'center',
  },
  voiceTypeEm: { fontFamily: Fonts.displaySemibold, color: c.accent },
  fine: {
    fontFamily: Fonts.body,
    fontSize: Typography.sm.size,
    lineHeight: Typography.sm.lineHeight,
    color: c.textTertiary,
    textAlign: 'center',
  },
  ghost: {
    fontFamily: Fonts.bodyMedium,
    fontSize: Typography.sm.size,
    color: c.textSecondary,
    paddingVertical: Spacing.xs,
  },
  matchBarTrack: {
    width: '100%',
    height: Spacing.xs,
    borderRadius: Radii.sm,
    backgroundColor: c.borderSubtle,
    overflow: 'hidden',
  },
  matchBarFill: { height: '100%', borderRadius: Radii.sm },
  tapOutBtn: {
    borderColor: c.borderStrong,
    borderWidth: 1,
    borderRadius: Radii.md,
    paddingVertical: Spacing.sm,
    paddingHorizontal: Spacing.lg,
    marginTop: Spacing.xs,
    minHeight: 44,
    justifyContent: 'center',
    backgroundColor: c.bgElevated,
  },
  tapOutBtnPressed: { backgroundColor: c.accentMuted },
  tapOutText: {
    fontFamily: Fonts.bodyMedium,
    fontSize: Typography.base.size,
    color: c.textPrimary,
    textAlign: 'center',
  },
  btn: {
    backgroundColor: c.accent,
    borderRadius: Radii.md,
    paddingVertical: Spacing.sm,
    paddingHorizontal: Spacing.lg,
    marginTop: Spacing.xs,
    minHeight: 44,
    justifyContent: 'center',
  },
  btnPressed: { backgroundColor: c.accentHover },
  btnDisabled: { backgroundColor: c.borderStrong, opacity: 0.6 },
  btnText: {
    fontFamily: Fonts.bodyMedium,
    fontSize: Typography.base.size,
    color: c.bgCanvas,
    textAlign: 'center',
  },
  errorBox: { gap: Spacing.xs },
  errorTitle: {
    fontFamily: Fonts.bodySemibold,
    fontSize: Typography.md.size,
    color: c.error,
  },
  step: {
    fontFamily: Fonts.body,
    fontSize: Typography.sm.size,
    lineHeight: Typography.sm.lineHeight,
    color: c.textSecondary,
  },
});
