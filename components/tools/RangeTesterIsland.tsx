// COMPONENT TEST: components/tools/__tests__/RangeTesterIsland.test.tsx
import { useCallback, useEffect, useRef, useState } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { useRouter, type Href } from 'expo-router';

import { Colors, Fonts, Radii, Spacing, Typography } from '@/constants/theme';
import { midiToNote } from '@/lib/exercises/music';
import { createPitchDetector } from '@/lib/pitch';
import { classifyMicError, micErrorCopy, type MicErrorReason } from '@/lib/pitch/micError';
import type { PitchDetector, PitchSample } from '@/lib/pitch/detector';
import {
  classifyVoice,
  describeSpan,
  SustainedPitchTracker,
  type VoiceClassification,
} from '@/lib/tools/rangeTest';

const c = Colors.light;

type Phase = 'idle' | 'requesting' | 'low' | 'high' | 'result' | 'error';

export default function RangeTesterIsland() {
  const router = useRouter();

  const [phase, setPhase] = useState<Phase>('idle');
  const [liveNote, setLiveNote] = useState<string | null>(null);
  const [lowMidi, setLowMidi] = useState<number | null>(null);
  const [highMidi, setHighMidi] = useState<number | null>(null);
  const [result, setResult] = useState<VoiceClassification | null>(null);
  const [errReason, setErrReason] = useState<MicErrorReason | null>(null);

  const detectorRef = useRef<PitchDetector | null>(null);
  const unsubRef = useRef<(() => void) | null>(null);
  const trackerRef = useRef(new SustainedPitchTracker());
  const phaseRef = useRef<Phase>('idle');
  const lowRef = useRef<number | null>(null);
  const highRef = useRef<number | null>(null);

  const setPhaseBoth = useCallback((p: Phase) => {
    phaseRef.current = p;
    setPhase(p);
  }, []);

  const teardown = useCallback(() => {
    unsubRef.current?.();
    unsubRef.current = null;
    detectorRef.current?.stop().catch(() => {});
    detectorRef.current = null;
  }, []);

  useEffect(() => teardown, [teardown]);

  const onSample = useCallback((sample: PitchSample) => {
    const confirmed = trackerRef.current.push(sample as never);
    if (confirmed == null) return;
    setLiveNote(midiToNote(confirmed));
    if (phaseRef.current === 'low') {
      if (lowRef.current == null || confirmed < lowRef.current) {
        lowRef.current = confirmed;
        setLowMidi(confirmed);
      }
    } else if (phaseRef.current === 'high') {
      if (highRef.current == null || confirmed > highRef.current) {
        highRef.current = confirmed;
        setHighMidi(confirmed);
      }
    }
  }, []);

  const handleStart = useCallback(async () => {
    setPhaseBoth('requesting');
    setErrReason(null);
    try {
      // detector.web is module-load safe (AudioContext/getUserMedia are created
      // inside start(), not at import), so a static import is SSG-safe; this page
      // imports none of the heavy audio deps (tone/Salamander). The mic gesture
      // requirement is satisfied by this Start handler.
      const detector = createPitchDetector();
      detector.setClarityThreshold(0.9);
      detector.setOctaveJumpFrames(3);
      await detector.start();
      detectorRef.current = detector;
      trackerRef.current.reset();
      lowRef.current = null;
      highRef.current = null;
      setLowMidi(null);
      setHighMidi(null);
      setLiveNote(null);
      unsubRef.current = detector.on(onSample);
      setPhaseBoth('low');
    } catch (err) {
      setErrReason(classifyMicError(err));
      setPhaseBoth('error');
    }
  }, [onSample, setPhaseBoth]);

  const goHigh = useCallback(() => {
    trackerRef.current.reset();
    setLiveNote(null);
    setPhaseBoth('high');
  }, [setPhaseBoth]);

  const finish = useCallback(() => {
    teardown();
    if (lowRef.current != null && highRef.current != null) {
      setResult(classifyVoice(lowRef.current, highRef.current));
    }
    setPhaseBoth('result');
  }, [teardown, setPhaseBoth]);

  const reset = useCallback(() => {
    teardown();
    trackerRef.current.reset();
    lowRef.current = null;
    highRef.current = null;
    setLowMidi(null);
    setHighMidi(null);
    setLiveNote(null);
    setResult(null);
    setPhaseBoth('idle');
  }, [teardown, setPhaseBoth]);

  return (
    <View style={styles.card} accessibilityLabel="Vocal range test tool">
      {phase === 'idle' && (
        <View style={styles.center}>
          <Text style={styles.kicker}>FREE · NO SIGNUP · AUDIO STAYS ON YOUR DEVICE</Text>
          <Text style={styles.lead}>
            Sing your lowest note, then your highest. We&apos;ll detect the pitch through your
            microphone and show your range and likely voice type.
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

      {(phase === 'low' || phase === 'high') && (
        <View style={styles.center}>
          <Text style={styles.kicker}>STEP {phase === 'low' ? '1 OF 2' : '2 OF 2'}</Text>
          <Text style={styles.prompt}>
            {phase === 'low'
              ? 'Sing your LOWEST comfortable note — slide down and hold it steady.'
              : 'Now your HIGHEST comfortable note — slide up and hold it steady.'}
          </Text>
          <Text style={styles.liveNote} accessibilityLabel={liveNote ? `Detected ${liveNote}` : 'Listening'}>
            {liveNote ?? '—'}
          </Text>
          <Text style={styles.fine}>
            {phase === 'low'
              ? lowMidi != null
                ? `Lowest so far: ${midiToNote(lowMidi)}`
                : 'Hold a steady note to register it.'
              : highMidi != null
                ? `Highest so far: ${midiToNote(highMidi)}`
                : 'Hold a steady note to register it.'}
          </Text>
          {phase === 'low' ? (
            <PrimaryButton label="Next: highest note →" onPress={goHigh} disabled={lowMidi == null} />
          ) : (
            <PrimaryButton label="See my result" onPress={finish} disabled={highMidi == null} />
          )}
          <Pressable onPress={reset} accessibilityRole="button" accessibilityLabel="Start over" hitSlop={8}>
            <Text style={styles.ghost}>Start over</Text>
          </Pressable>
        </View>
      )}

      {phase === 'result' && (
        <View style={styles.center}>
          {lowMidi != null && highMidi != null ? (
            <>
              <Text style={styles.kicker}>YOUR RANGE</Text>
              <Text style={styles.rangeBig}>
                {describeSpan(lowMidi, highMidi).lowNote} – {describeSpan(lowMidi, highMidi).highNote}
              </Text>
              <Text style={styles.fine}>
                {describeSpan(lowMidi, highMidi).octaves} octaves ({describeSpan(lowMidi, highMidi).semitones} semitones)
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
                onPress={() =>
                  router.push((result ? `/?voicePart=${result.appVoicePart}` : '/') as Href)
                }
              />
              <Pressable onPress={reset} accessibilityRole="button" accessibilityLabel="Test again" hitSlop={8}>
                <Text style={styles.ghost}>Test again</Text>
              </Pressable>
            </>
          ) : (
            <>
              <Text style={styles.prompt}>We didn&apos;t catch a steady note.</Text>
              <Text style={styles.fine}>
                Try again in a quieter spot, and hold each note for about a second.
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
  liveNote: {
    fontFamily: Fonts.display,
    fontSize: Typography['3xl'].size,
    lineHeight: Typography['3xl'].lineHeight,
    color: c.accent,
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
  btnDisabled: { backgroundColor: c.borderStrong },
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
