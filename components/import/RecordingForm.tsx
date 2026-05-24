import { useEffect, useRef, useState } from "react";
import { Platform, Pressable, StyleSheet, Text, TextInput, View } from "react-native";
import type { AnalysisMode, DecodeInput } from "@/lib/analyze";
import type { VoicePart } from "@/lib/exercises/types";
import { createPitchDetector } from "@/lib/pitch";
import type { PitchDetector } from "@/lib/pitch/detector";
import { encodeWav } from "@/lib/capture/wav";
import { downloadBlob, captureTimestamp } from "@/lib/capture/download";
import type { SongSidecar } from "@/lib/capture/songTypes";
import { useTheme } from "@/hooks/use-theme";
import { Spacing, Radii, Typography, Fonts } from "@/constants/theme";

const VOICE_PARTS: VoicePart[] = ["tenor", "baritone", "bass", "alto", "soprano", "mezzo"];
const MODES: { value: AnalysisMode; label: string }[] = [
  { value: "major", label: "Major" },
  { value: "minor", label: "Minor" },
  { value: "chromatic", label: "Chromatic" },
];
const TONIC_PRESETS = [
  "C3", "D3", "E3", "F3", "G3", "A3", "B3",
  "C4", "D4", "E4", "F4", "G4", "A4", "B4",
  "C5",
];

function slugify(name: string): string {
  return name
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 40) || "recording";
}

function formatElapsed(ms: number): string {
  const total = Math.floor(ms / 1000);
  const m = Math.floor(total / 60);
  const s = total % 60;
  return `${String(m).padStart(2, "0")}:${String(s).padStart(2, "0")}`;
}

type RecState = "idle" | "starting" | "recording" | "encoding";

export default function RecordingForm({
  initialVoicePart,
  onAnalyze,
  disabled,
}: {
  initialVoicePart: VoicePart;
  onAnalyze: (state: {
    file: DecodeInput;
    filename: string;
    tonic: string;
    mode: AnalysisMode;
    voicePart: VoicePart;
    tempoBpm?: number;
  }) => void;
  disabled?: boolean;
}) {
  const { colors } = useTheme();
  const [songName, setSongName] = useState<string>("");
  const [tonic, setTonic] = useState<string>("C4");
  const [tonicCustom, setTonicCustom] = useState<string>("");
  const [mode, setMode] = useState<AnalysisMode>("major");
  const [voicePart, setVoicePart] = useState<VoicePart>(initialVoicePart);
  const [tempoText, setTempoText] = useState<string>("");
  const [error, setError] = useState<string | null>(null);
  const [recState, setRecState] = useState<RecState>("idle");
  const [elapsedMs, setElapsedMs] = useState<number>(0);

  const detectorRef = useRef<PitchDetector | null>(null);
  const startedAtRef = useRef<number>(0);
  const tickRef = useRef<ReturnType<typeof setInterval> | null>(null);

  // Cleanup on unmount — stop the mic if the modal closes mid-recording.
  useEffect(() => {
    return () => {
      detectorRef.current?.stop().catch(() => {});
      if (tickRef.current) clearInterval(tickRef.current);
    };
  }, []);

  async function handleStartRecording() {
    setError(null);
    if (!songName.trim()) { setError("Give the song a name first."); return; }
    setRecState("starting");
    try {
      const detector = createPitchDetector();
      detectorRef.current = detector;
      detector.enableRawCapture?.();
      await detector.start();
      startedAtRef.current = Date.now();
      setElapsedMs(0);
      tickRef.current = setInterval(() => {
        setElapsedMs(Date.now() - startedAtRef.current);
      }, 250);
      setRecState("recording");
    } catch (e: unknown) {
      const msg = e instanceof Error ? e.message : String(e);
      setError(`Couldn't start recording: ${msg}`);
      setRecState("idle");
      detectorRef.current = null;
    }
  }

  async function handleStopRecording() {
    if (recState !== "recording") return;
    setRecState("encoding");
    if (tickRef.current) { clearInterval(tickRef.current); tickRef.current = null; }
    try {
      const detector = detectorRef.current;
      if (!detector) throw new Error("No active recording");
      await detector.stop();
      const cap = detector.getRawCapture?.() ?? null;
      detectorRef.current = null;
      if (!cap || cap.pcm.length === 0) throw new Error("Recording was empty");

      const finalTonic = tonicCustom.trim() || tonic;
      const trimmedName = songName.trim();
      let tempoBpm: number | undefined;
      const parsed = tempoText.trim();
      if (parsed) {
        const n = Number(parsed);
        if (Number.isFinite(n) && n >= 30 && n <= 240) tempoBpm = Math.round(n);
      }

      const wav = encodeWav(cap.pcm, cap.sampleRate);
      const sidecar: SongSidecar = {
        kind: "song",
        schemaVersion: 1,
        songName: trimmedName,
        voicePart,
        tonic: finalTonic,
        mode,
        tempoBpm,
        sampleRate: cap.sampleRate,
        durationMs: (cap.pcm.length / cap.sampleRate) * 1000,
        capturedAt: new Date().toISOString(),
      };

      // Dev-only: drop a copy into the local songs corpus (browser download).
      if (__DEV__ && Platform.OS === "web") {
        const base = `${slugify(trimmedName)}__${voicePart}__${finalTonic}__${captureTimestamp()}`;
        downloadBlob(wav, `${base}.wav`);
        downloadBlob(
          new Blob([JSON.stringify(sidecar, null, 2)], { type: "application/json" }),
          `${base}.json`,
        );
      }

      onAnalyze({
        file: wav,
        filename: `${slugify(trimmedName)}.wav`,
        tonic: finalTonic,
        mode,
        voicePart,
        tempoBpm,
      });
      setRecState("idle");
      setElapsedMs(0);
    } catch (e: unknown) {
      const msg = e instanceof Error ? e.message : String(e);
      setError(`Couldn't finalize recording: ${msg}`);
      setRecState("idle");
      detectorRef.current = null;
    }
  }

  const isRecording = recState === "recording";
  const isBusy = recState === "starting" || recState === "encoding";
  const formLocked = disabled || isRecording || isBusy;

  return (
    <View style={[styles.container, { gap: Spacing.md }]}>
      {/* Song name */}
      <View style={[styles.field, { gap: Spacing['2xs'] }]}>
        <Text style={{ fontSize: Typography.xs.size, lineHeight: Typography.xs.lineHeight, fontFamily: Fonts.bodyMedium, color: colors.textTertiary, textTransform: "uppercase", letterSpacing: 0.6 }}>
          Song name
        </Text>
        <TextInput
          style={[styles.input, { borderColor: colors.borderStrong, borderRadius: Radii.md, paddingHorizontal: Spacing.sm, paddingVertical: Spacing.xs, fontSize: Typography.base.size, color: colors.textPrimary, backgroundColor: colors.canvas, fontFamily: Fonts.body }]}
          placeholder="e.g. Happy Birthday"
          placeholderTextColor={colors.textTertiary}
          value={songName}
          onChangeText={setSongName}
          editable={!formLocked}
        />
      </View>

      {/* Tonic */}
      <View style={[styles.field, { gap: Spacing['2xs'] }]}>
        <Text style={{ fontSize: Typography.xs.size, lineHeight: Typography.xs.lineHeight, fontFamily: Fonts.bodyMedium, color: colors.textTertiary, textTransform: "uppercase", letterSpacing: 0.6 }}>
          Tonic (key center)
        </Text>
        <View style={[styles.row, { gap: Spacing['2xs'] }]}>
          {TONIC_PRESETS.map((t) => {
            const active = !tonicCustom && tonic === t;
            return (
              <Pressable
                key={t}
                onPress={() => { setTonic(t); setTonicCustom(""); }}
                style={[
                  styles.chip,
                  {
                    paddingHorizontal: Spacing.sm,
                    paddingVertical: Spacing['2xs'],
                    borderRadius: Radii.pill,
                    backgroundColor: active ? colors.accentMuted : colors.bgSurface,
                    borderColor: active ? colors.accent : colors.borderSubtle,
                  },
                  formLocked && styles.btnDisabled,
                ]}
                disabled={formLocked}
              >
                <Text style={{ color: active ? colors.accent : colors.textSecondary, fontSize: Typography.sm.size, lineHeight: Typography.sm.lineHeight, fontFamily: active ? Fonts.bodyMedium : Fonts.body }}>
                  {t}
                </Text>
              </Pressable>
            );
          })}
        </View>
        <TextInput
          style={[styles.input, { borderColor: colors.borderStrong, borderRadius: Radii.md, paddingHorizontal: Spacing.sm, paddingVertical: Spacing.xs, fontSize: Typography.base.size, color: colors.textPrimary, backgroundColor: colors.canvas, fontFamily: Fonts.body }]}
          placeholder="Or type a custom tonic, e.g. F#3"
          placeholderTextColor={colors.textTertiary}
          value={tonicCustom}
          onChangeText={setTonicCustom}
          autoCapitalize="characters"
          editable={!formLocked}
        />
      </View>

      {/* Mode */}
      <View style={[styles.field, { gap: Spacing['2xs'] }]}>
        <Text style={{ fontSize: Typography.xs.size, lineHeight: Typography.xs.lineHeight, fontFamily: Fonts.bodyMedium, color: colors.textTertiary, textTransform: "uppercase", letterSpacing: 0.6 }}>
          Mode
        </Text>
        <View style={[styles.row, { gap: Spacing['2xs'] }]}>
          {MODES.map((m) => (
            <Pressable
              key={m.value}
              onPress={() => setMode(m.value)}
              style={[
                styles.chip,
                {
                  paddingHorizontal: Spacing.sm,
                  paddingVertical: Spacing['2xs'],
                  borderRadius: Radii.pill,
                  backgroundColor: mode === m.value ? colors.accentMuted : colors.bgSurface,
                  borderColor: mode === m.value ? colors.accent : colors.borderSubtle,
                },
                formLocked && styles.btnDisabled,
              ]}
              disabled={formLocked}
            >
              <Text style={{ color: mode === m.value ? colors.accent : colors.textSecondary, fontSize: Typography.sm.size, lineHeight: Typography.sm.lineHeight, fontFamily: mode === m.value ? Fonts.bodyMedium : Fonts.body }}>
                {m.label}
              </Text>
            </Pressable>
          ))}
        </View>
      </View>

      {/* Voice part */}
      <View style={[styles.field, { gap: Spacing['2xs'] }]}>
        <Text style={{ fontSize: Typography.xs.size, lineHeight: Typography.xs.lineHeight, fontFamily: Fonts.bodyMedium, color: colors.textTertiary, textTransform: "uppercase", letterSpacing: 0.6 }}>
          Voice part
        </Text>
        <View style={[styles.row, { gap: Spacing['2xs'] }]}>
          {VOICE_PARTS.map((vp) => (
            <Pressable
              key={vp}
              onPress={() => setVoicePart(vp)}
              style={[
                styles.chip,
                {
                  paddingHorizontal: Spacing.sm,
                  paddingVertical: Spacing['2xs'],
                  borderRadius: Radii.pill,
                  backgroundColor: voicePart === vp ? colors.accentMuted : colors.bgSurface,
                  borderColor: voicePart === vp ? colors.accent : colors.borderSubtle,
                },
                formLocked && styles.btnDisabled,
              ]}
              disabled={formLocked}
            >
              <Text style={{ color: voicePart === vp ? colors.accent : colors.textSecondary, fontSize: Typography.sm.size, lineHeight: Typography.sm.lineHeight, fontFamily: voicePart === vp ? Fonts.bodyMedium : Fonts.body }}>
                {vp}
              </Text>
            </Pressable>
          ))}
        </View>
      </View>

      {/* Tempo */}
      <View style={[styles.field, { gap: Spacing['2xs'] }]}>
        <Text style={{ fontSize: Typography.xs.size, lineHeight: Typography.xs.lineHeight, fontFamily: Fonts.bodyMedium, color: colors.textTertiary, textTransform: "uppercase", letterSpacing: 0.6 }}>
          Tempo (BPM)
        </Text>
        <TextInput
          style={[styles.input, { borderColor: colors.borderStrong, borderRadius: Radii.md, paddingHorizontal: Spacing.sm, paddingVertical: Spacing.xs, fontSize: Typography.base.size, color: colors.textPrimary, backgroundColor: colors.canvas, fontFamily: Fonts.body }]}
          placeholder="Leave blank to auto-estimate"
          placeholderTextColor={colors.textTertiary}
          value={tempoText}
          onChangeText={setTempoText}
          keyboardType="numeric"
          editable={!formLocked}
        />
      </View>

      {error && (
        <Text style={{ color: colors.error, fontSize: Typography.sm.size, lineHeight: Typography.sm.lineHeight, fontFamily: Fonts.body }}>
          {error}
        </Text>
      )}

      {/* Record / Stop button */}
      <Pressable
        style={[
          styles.recordBtn,
          {
            backgroundColor: isRecording ? colors.error : colors.accent,
            paddingVertical: Spacing.md,
            borderRadius: Radii.md,
            alignItems: "center",
            minHeight: 56,
            justifyContent: "center",
          },
          (disabled || isBusy) && styles.btnDisabled,
        ]}
        onPress={isRecording ? handleStopRecording : handleStartRecording}
        disabled={disabled || isBusy}
        accessibilityLabel={isRecording ? "Stop recording" : "Start recording"}
      >
        <Text style={{ color: isRecording ? "#fff" : colors.bgCanvas, fontSize: Typography.md.size, lineHeight: Typography.md.lineHeight, fontFamily: Fonts.bodySemibold }}>
          {recState === "starting" ? "Starting…"
            : recState === "encoding" ? "Encoding…"
            : isRecording ? `Stop  ·  ${formatElapsed(elapsedMs)}`
            : "Start recording"}
        </Text>
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {},
  field: {},
  row: { flexDirection: "row", flexWrap: "wrap" },
  chip: { borderWidth: 1 },
  input: { borderWidth: 1 },
  recordBtn: {},
  btnDisabled: { opacity: 0.4 },
});
