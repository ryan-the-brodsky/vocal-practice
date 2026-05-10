import { useCallback, useEffect, useMemo, useState } from "react";
import {
  Modal,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from "react-native";
import { useRouter } from "expo-router";

import {
  analyzeFile,
  toExerciseDescriptor,
  ANALYZE_CONFIG,
  type AnalysisMode,
  type DecodeInput,
  type MelodyAnalysis,
} from "@/lib/analyze";
import { saveUserExercise, type StoredExtractedExercise } from "@/lib/exercises/userStore";
import type { AccompanimentPreset, VoicePart } from "@/lib/exercises/types";
import { useTheme } from "@/hooks/use-theme";
import { Spacing, Radii, Typography, Fonts } from "@/constants/theme";

import GlaringHeadline from "./GlaringHeadline";
import ImportForm from "./ImportForm";
import ImportProgressOverlay from "./ImportProgressOverlay";
import MelodyTimeline from "./MelodyTimeline";
import PerDegreeTable from "./PerDegreeTable";
import SaveSheet from "./SaveSheet";

type Phase = "picking" | "analyzing" | "reviewing" | "saving" | "saved";

interface PendingForm {
  file: DecodeInput;
  filename: string;
  tonic: string;
  mode: AnalysisMode;
  voicePart: VoicePart;
  tempoBpm?: number;
}

interface ReviewState {
  analysis: MelodyAnalysis;
  form: PendingForm;
}

function defaultAccompanimentFor(analysis: MelodyAnalysis): AccompanimentPreset {
  if (analysis.mode === "chromatic") return "drone";
  const total = analysis.notes.length;
  if (total === 0) return "classical";
  const out = analysis.notes.filter((n) => n.outOfKey).length;
  if (out / total > ANALYZE_CONFIG.chromaticFallbackFraction) return "drone";
  return "classical";
}

function defaultName(filename: string): string {
  const base = filename.replace(/\.[^.]+$/, "").trim();
  if (base) return base;
  const d = new Date();
  const yyyy = d.getFullYear();
  const mm = String(d.getMonth() + 1).padStart(2, "0");
  const dd = String(d.getDate()).padStart(2, "0");
  return `Imported melody — ${yyyy}-${mm}-${dd}`;
}

export default function ImportModal({
  visible,
  initialVoicePart,
  onClose,
  onSaved,
}: {
  visible: boolean;
  initialVoicePart?: VoicePart;
  onClose: () => void;
  onSaved?: (id: string) => void;
}) {
  const { colors } = useTheme();
  const [phase, setPhase] = useState<Phase>("picking");
  const [review, setReview] = useState<ReviewState | null>(null);
  const [selectedNoteIdx, setSelectedNoteIdx] = useState<number | undefined>(undefined);
  const [error, setError] = useState<string | null>(null);
  // Saved-exercise id, populated after successful save so we can deep-link to coaching.
  const [savedId, setSavedId] = useState<string | null>(null);
  const [savedName, setSavedName] = useState<string | null>(null);
  const router = useRouter();

  // Reset internal state whenever the modal closes — no orphaned state.
  useEffect(() => {
    if (!visible) {
      setPhase("picking");
      setReview(null);
      setSelectedNoteIdx(undefined);
      setError(null);
      setSavedId(null);
      setSavedName(null);
    }
  }, [visible]);

  const handleAnalyze = useCallback(async (form: PendingForm) => {
    setError(null);
    setPhase("analyzing");
    try {
      const analysis = await analyzeFile(form.file, {
        tonic: form.tonic,
        mode: form.mode,
        tempoBpm: form.tempoBpm,
      });
      setReview({ analysis, form });
      setSelectedNoteIdx(undefined);
      setPhase("reviewing");
    } catch (e: unknown) {
      const msg = e instanceof Error ? e.message : String(e);
      setError(humanizeAnalyzeError(msg));
      setPhase("picking");
    }
  }, []);

  const handleSave = useCallback(
    async (saveState: { name: string; voicePart: VoicePart; accompaniment: AccompanimentPreset }) => {
      if (!review) return;
      setPhase("saving");
      setError(null);
      try {
        const { descriptor, warnings: synthWarnings } = toExerciseDescriptor(review.analysis, {
          name: saveState.name,
          voicePart: saveState.voicePart,
          accompaniment: saveState.accompaniment,
        });
        void synthWarnings;
        const stored: StoredExtractedExercise = {
          descriptor,
          source: {
            importedAt: Date.now(),
            sourceFilename: review.form.filename,
            durationSec: review.analysis.durationSec,
          },
          analysis: review.analysis,
        };
        await saveUserExercise(stored);
        onSaved?.(descriptor.id);
        setSavedId(descriptor.id);
        setSavedName(saveState.name);
        setPhase("saved");
      } catch (e: unknown) {
        const msg = e instanceof Error ? e.message : String(e);
        setError(`Failed to save: ${msg}`);
        setPhase("reviewing");
      }
    },
    [review, onSaved, onClose],
  );

  const defaultAccomp = useMemo(
    () => (review ? defaultAccompanimentFor(review.analysis) : "classical" as AccompanimentPreset),
    [review],
  );

  const handleCoachThis = useCallback(() => {
    if (!savedId) return;
    onClose();
    router.push({ pathname: "/coaching", params: { exerciseId: savedId } });
  }, [savedId, onClose, router]);

  return (
    <Modal
      visible={visible}
      animationType="slide"
      presentationStyle={Platform.OS === "web" ? "overFullScreen" : "pageSheet"}
      transparent={Platform.OS === "web"}
      onRequestClose={onClose}
    >
      <View style={[styles.container, { backgroundColor: colors.canvas }]}>
        <View style={[styles.header, { backgroundColor: colors.bgSurface, borderBottomColor: colors.borderSubtle, paddingHorizontal: Spacing.lg, paddingTop: Spacing.lg, paddingBottom: Spacing.sm }]}>
          <Text style={{ fontSize: Typography.md.size, lineHeight: Typography.md.lineHeight, fontFamily: Fonts.display, color: colors.textPrimary }}>
            Import melody
          </Text>
          <Pressable
            onPress={onClose}
            style={[styles.closeBtn, { paddingHorizontal: Spacing['2xs'], paddingVertical: Spacing['2xs'] }]}
            hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
          >
            <Text style={{ color: colors.textSecondary, fontSize: Typography.base.size, lineHeight: Typography.base.lineHeight, fontFamily: Fonts.bodyMedium }}>
              Cancel
            </Text>
          </Pressable>
        </View>

        <ScrollView
          style={styles.body}
          contentContainerStyle={[styles.bodyContent, { padding: Spacing.lg, gap: Spacing.md, paddingBottom: Spacing['3xl'] }]}
          keyboardShouldPersistTaps="handled"
        >
          {phase === "picking" && (
            <>
              {error && (
                <Text style={{ color: colors.error, fontSize: Typography.sm.size, lineHeight: Typography.sm.lineHeight, fontFamily: Fonts.body }}>
                  {error}
                </Text>
              )}
              <Text style={{ color: colors.textSecondary, fontSize: Typography.base.size, lineHeight: Typography.base.lineHeight, fontFamily: Fonts.body }}>
                Pick a clean isolated vocal recording. Set the key center and we&apos;ll
                snap detected notes to it.
              </Text>
              <ImportForm
                initialVoicePart={initialVoicePart ?? "tenor"}
                onAnalyze={handleAnalyze}
              />
            </>
          )}

          {phase === "reviewing" && review && (
            <ReviewBody
              review={review}
              selectedNoteIdx={selectedNoteIdx}
              onSelectNote={setSelectedNoteIdx}
              defaultAccomp={defaultAccomp}
              onSave={handleSave}
              onBack={() => {
                setReview(null);
                setSelectedNoteIdx(undefined);
                setPhase("picking");
              }}
              saving={false}
              error={error}
            />
          )}

          {phase === "saving" && review && (
            <ReviewBody
              review={review}
              selectedNoteIdx={selectedNoteIdx}
              onSelectNote={setSelectedNoteIdx}
              defaultAccomp={defaultAccomp}
              onSave={handleSave}
              onBack={() => {}}
              saving
              error={error}
            />
          )}

          {phase === "saved" && (
            <SavedSection
              savedName={savedName}
              onCoachThis={handleCoachThis}
              onClose={onClose}
            />
          )}
        </ScrollView>

        {phase === "analyzing" && <ImportProgressOverlay />}
        {phase === "saving" && <ImportProgressOverlay message="Saving exercise…" />}
      </View>
    </Modal>
  );
}

function humanizeAnalyzeError(msg: string): string {
  if (/decode/i.test(msg) || /unsupported/i.test(msg)) {
    return `Couldn't decode the audio file. Supported on web: WAV, MP3, M4A, OGG, FLAC. ${msg}`;
  }
  if (/too long/i.test(msg)) return msg;
  if (/Invalid note/i.test(msg)) return `${msg}. Use a name like C4 or F#3.`;
  return `Analysis failed: ${msg}`;
}

function SavedSection({
  savedName,
  onCoachThis,
  onClose,
}: {
  savedName: string | null;
  onCoachThis: () => void;
  onClose: () => void;
}) {
  const { colors } = useTheme();

  return (
    <View style={[styles.savedSection, { backgroundColor: colors.bgSurface, borderRadius: Radii.lg, borderWidth: 1, borderColor: colors.borderSubtle, padding: Spacing.lg, gap: Spacing.sm, alignItems: "stretch" }]}>
      <Text style={{ fontSize: Typography.xl.size, lineHeight: Typography.xl.lineHeight, fontFamily: Fonts.display, color: colors.textPrimary }}>
        Saved!
      </Text>
      {savedName && (
        <Text style={{ fontSize: Typography.base.size, lineHeight: Typography.base.lineHeight, fontFamily: Fonts.bodySemibold, color: colors.textSecondary }}>
          {savedName}
        </Text>
      )}
      <Text style={{ fontSize: Typography.sm.size, lineHeight: Typography.sm.lineHeight, fontFamily: Fonts.body, color: colors.textSecondary }}>
        Get coaching feedback on this melody&apos;s pitch accuracy, or close this dialog
        to practice it from your library.
      </Text>
      <Pressable
        style={[styles.btn, { backgroundColor: colors.accent, borderRadius: Radii.md, paddingVertical: Spacing.sm, alignItems: "center", minHeight: 44 }]}
        onPress={onCoachThis}
        accessibilityLabel="Coach this melody"
      >
        <Text style={{ color: colors.bgCanvas, fontSize: Typography.base.size, lineHeight: Typography.base.lineHeight, fontFamily: Fonts.bodySemibold }}>
          Coach this melody
        </Text>
      </Pressable>
      <Pressable
        style={[styles.btn, { backgroundColor: colors.bgSurface, borderWidth: 1, borderColor: colors.borderStrong, borderRadius: Radii.md, paddingHorizontal: Spacing.md, paddingVertical: Spacing.xs, alignItems: "center", minHeight: 44 }]}
        onPress={onClose}
        accessibilityLabel="Done"
      >
        <Text style={{ color: colors.textPrimary, fontSize: Typography.base.size, lineHeight: Typography.base.lineHeight, fontFamily: Fonts.bodyMedium }}>
          Done
        </Text>
      </Pressable>
    </View>
  );
}

function ReviewBody({
  review,
  selectedNoteIdx,
  onSelectNote,
  defaultAccomp,
  onSave,
  onBack,
  saving,
  error,
}: {
  review: ReviewState;
  selectedNoteIdx: number | undefined;
  onSelectNote: (idx: number | undefined) => void;
  defaultAccomp: AccompanimentPreset;
  onSave: (state: { name: string; voicePart: VoicePart; accompaniment: AccompanimentPreset }) => void;
  onBack: () => void;
  saving: boolean;
  error: string | null;
}) {
  const { colors } = useTheme();
  const { analysis, form } = review;
  const noteCount = analysis.notes.length;
  const empty = noteCount === 0;

  return (
    <View style={[styles.review, { gap: Spacing.sm }]}>
      <GlaringHeadline glaring={analysis.glaring} noteCount={noteCount} />

      {analysis.warnings.length > 0 && (
        <View style={[styles.warningCard, { backgroundColor: colors.bgSurface, borderColor: colors.warning, borderWidth: 1, borderRadius: Radii.md, padding: Spacing.xs, gap: Spacing['2xs'] }]}>
          {analysis.warnings.map((w, i) => (
            <Text key={i} style={{ color: colors.warning, fontSize: Typography.sm.size, lineHeight: Typography.sm.lineHeight, fontFamily: Fonts.body }}>
              {w}
            </Text>
          ))}
        </View>
      )}

      <View style={[styles.metaRow, { gap: Spacing.sm }]}>
        <MetaStat label="Tonic" value={`${analysis.tonic} ${analysis.mode}`} />
        <MetaStat label="Tempo" value={`${analysis.tempoBpm} BPM`} />
        <MetaStat label="Notes" value={String(noteCount)} />
        <MetaStat label="Duration" value={`${analysis.durationSec.toFixed(1)} s`} />
      </View>

      <View style={[styles.section, { gap: Spacing['2xs'] }]}>
        <Text style={{ fontSize: Typography.xs.size, lineHeight: Typography.xs.lineHeight, fontFamily: Fonts.bodyMedium, color: colors.textTertiary, textTransform: "uppercase", letterSpacing: 0.6 }}>
          TIMELINE
        </Text>
        <MelodyTimeline
          notes={analysis.notes}
          onSelect={(i) => onSelectNote(selectedNoteIdx === i ? undefined : i)}
          selectedIdx={selectedNoteIdx}
        />
      </View>

      <View style={[styles.section, { gap: Spacing['2xs'] }]}>
        <Text style={{ fontSize: Typography.xs.size, lineHeight: Typography.xs.lineHeight, fontFamily: Fonts.bodyMedium, color: colors.textTertiary, textTransform: "uppercase", letterSpacing: 0.6 }}>
          PER-SCALE-DEGREE
        </Text>
        <PerDegreeTable stats={analysis.perScaleDegree} mode={analysis.mode} />
      </View>

      {error && (
        <Text style={{ color: colors.error, fontSize: Typography.sm.size, lineHeight: Typography.sm.lineHeight, fontFamily: Fonts.body }}>
          {error}
        </Text>
      )}

      {!empty ? (
        <SaveSheet
          defaultName={defaultName(form.filename)}
          defaultVoicePart={form.voicePart}
          defaultAccompaniment={defaultAccomp}
          saving={saving}
          onConfirm={onSave}
          onCancel={onBack}
        />
      ) : (
        <View style={[styles.emptySection, { backgroundColor: colors.bgSurface, borderRadius: Radii.md, borderWidth: 1, borderColor: colors.borderSubtle, padding: Spacing.md, gap: Spacing.xs, alignItems: "center" }]}>
          <Text style={{ fontSize: Typography.base.size, lineHeight: Typography.base.lineHeight, fontFamily: Fonts.bodySemibold, color: colors.textPrimary }}>
            No singing detected
          </Text>
          <Text style={{ color: colors.textSecondary, fontSize: Typography.sm.size, lineHeight: Typography.sm.lineHeight, fontFamily: Fonts.body, textAlign: "center" }}>
            Try another file, or check that the recording is a clean vocal stem.
          </Text>
          <Pressable
            style={[styles.btn, { backgroundColor: colors.bgSurface, borderWidth: 1, borderColor: colors.borderStrong, borderRadius: Radii.md, paddingHorizontal: Spacing.md, paddingVertical: Spacing.xs, alignItems: "center", minHeight: 44 }]}
            onPress={onBack}
            accessibilityLabel="Pick another file"
          >
            <Text style={{ color: colors.textPrimary, fontSize: Typography.base.size, lineHeight: Typography.base.lineHeight, fontFamily: Fonts.bodyMedium }}>
              Pick another file
            </Text>
          </Pressable>
        </View>
      )}
    </View>
  );
}

function MetaStat({ label, value }: { label: string; value: string }) {
  const { colors } = useTheme();
  return (
    <View style={[styles.metaStat, { paddingVertical: Spacing['2xs'], paddingHorizontal: Spacing.xs, backgroundColor: colors.bgSurface, borderRadius: Radii.sm, borderWidth: 1, borderColor: colors.borderSubtle }]}>
      <Text style={{ fontSize: Typography.xs.size, lineHeight: Typography.xs.lineHeight, fontFamily: Fonts.bodyMedium, color: colors.textTertiary, textTransform: "uppercase", letterSpacing: 0.5 }}>
        {label}
      </Text>
      <Text style={{ fontSize: Typography.monoBase.size, lineHeight: Typography.monoBase.lineHeight, fontFamily: Fonts.monoMedium, color: colors.textPrimary, marginTop: Spacing['3xs'] }}>
        {value}
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    borderBottomWidth: 1,
  },
  closeBtn: {},
  body: { flex: 1 },
  bodyContent: {},
  review: {},
  warningCard: {},
  metaRow: { flexDirection: "row", flexWrap: "wrap" },
  metaStat: { minWidth: 80 },
  section: {},
  savedSection: {},
  btn: {},
  emptySection: {},
});
