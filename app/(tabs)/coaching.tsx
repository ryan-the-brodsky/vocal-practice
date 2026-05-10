import { useLocalSearchParams, useRouter } from "expo-router";
import { useCallback, useEffect, useMemo, useState } from "react";
import { Pressable, ScrollView, Text, View } from "react-native";

import BookmarkButton from "@/components/coaching/BookmarkButton";
import CauseCardList from "@/components/coaching/CauseCardList";
import ContrastPlayback from "@/components/coaching/ContrastPlayback";
import EmptyStateTip from "@/components/coaching/EmptyStateTip";
import {
  ADVICE_CARDS_BY_ID,
  DETECTOR_MAPPINGS_BY_ID,
  diagnoseSession,
  fromKeyAttempts,
  fromMelodyAnalysis,
  pickRepresentative,
  pickNextGenericTip,
  saveSavedCoaching,
  deleteSavedCoaching,
  type AdviceCard,
  type Diagnosis,
  type FocusNote,
  type NoteObservation,
  type SavedCoaching,
  type SessionInput,
} from "@/lib/coaching";
import { planExercise } from "@/lib/exercises/engine";
import { exerciseLibrary } from "@/lib/exercises/library";
import { exerciseName } from "@/lib/exercises/names";
import type { ExerciseDescriptor, KeyIteration, NoteEvent } from "@/lib/exercises/types";
import { getUserExercise } from "@/lib/exercises/userStore";
import { createAsyncStorageStore, type SessionRecord } from "@/lib/progress";
import type { NotePitchTrace } from "@/lib/scoring/types";
import { useTheme } from "@/hooks/use-theme";
import { Fonts, Radii, Spacing, Typography } from "@/constants/theme";

const sessionStore = createAsyncStorageStore();
const MIN_NOTES_FOR_DIAGNOSIS = 4;

interface RenderModel {
  diagnoses: Diagnosis[];
  topDiagnosis: Diagnosis | null;
  focusObservation: NoteObservation | null;
  focusNote: FocusNote | null;
  iterationEvents: NoteEvent[];
  otherFocuses: FocusNote[];
  symptomCard: AdviceCard | null;
  causeCards: AdviceCard[];
  observations: NoteObservation[];
}

function medianHzFromTrace(trace: NotePitchTrace[] | undefined): number | null {
  if (!trace || trace.length === 0) return null;
  const sorted = [...trace].map((t) => t.hz).sort((a, b) => a - b);
  return sorted[Math.floor(sorted.length / 2)] ?? null;
}

function makeFocusNote(obs: NoteObservation, hzFallback?: number | null): FocusNote | null {
  let hz = medianHzFromTrace(obs.trace);
  if (hz == null && typeof hzFallback === "number") hz = hzFallback;
  if (hz == null || !isFinite(hz) || hz <= 0) return null;
  return {
    positionInIteration: obs.notePosition,
    targetMidi: obs.targetMidi,
    medianHz: hz,
    syllable: obs.syllable ?? "",
  };
}

// Pick up to N additional egregious examples (skipping the primary focus).
function pickOtherFocuses(
  diagnosis: Diagnosis,
  observations: NoteObservation[],
  primary: NoteObservation,
  max: number,
  hzByPos: Map<number, number> | null,
): FocusNote[] {
  // Reuse the engine's scoring rule: |signedCents| × ln(framesAboveClarity + 1).
  const candidates = observations
    .filter((o) => o !== primary)
    .map((o) => ({
      o,
      score: Math.abs(o.signedCents) * Math.log(o.framesAboveClarity + 1),
    }))
    .filter((c) => Number.isFinite(c.score) && c.score > 0)
    .sort((a, b) => b.score - a.score);

  const out: FocusNote[] = [];
  for (const c of candidates) {
    if (out.length >= max) break;
    const fn = makeFocusNote(c.o, hzByPos?.get(c.o.notePosition) ?? null);
    if (fn) out.push(fn);
  }
  // Suppress unused-arg warning while keeping API for future detector-aware filtering.
  void diagnosis;
  return out;
}

function diagnosisHeadlineFor(d: Diagnosis, symptomCard: AdviceCard | null): string {
  // Position-consistent has no symptom card — surface the evidence as the headline.
  if (!symptomCard) return d.evidenceText;
  return symptomCard.title;
}

export default function CoachingScreen() {
  const router = useRouter();
  const { colors } = useTheme();
  const params = useLocalSearchParams<{ sessionId?: string; exerciseId?: string }>();
  const sessionId = params.sessionId ?? null;
  const exerciseId = params.exerciseId ?? null;

  const [record, setRecord] = useState<SessionRecord | null>(null);
  const [iterations, setIterations] = useState<KeyIteration[]>([]);
  // Set when the entry point is an imported exercise (?exerciseId=...).
  const [importedDescriptor, setImportedDescriptor] = useState<ExerciseDescriptor | null>(null);
  const [importedInput, setImportedInput] = useState<SessionInput | null>(null);
  // notePosition → medianHz for imports (NoteObservation.trace is empty for imports;
  // playback's focus-note builder needs medianHz, so we side-channel it from analysis).
  const [importedMedianHzByPos, setImportedMedianHzByPos] = useState<Map<number, number> | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [tip, setTip] = useState<AdviceCard | null>(null);
  const [savedTipId, setSavedTipId] = useState<string | null>(null);
  const [savedDiagnosisId, setSavedDiagnosisId] = useState<string | null>(null);
  // Track which "Other findings" diagnoses (by index) the user has expanded.
  const [otherOpen, setOtherOpen] = useState(false);

  // Load + diagnose
  useEffect(() => {
    let cancelled = false;
    async function load() {
      // Imported-melody entry point: read from userStore, build SessionInput from analysis.
      if (exerciseId) {
        try {
          const stored = await getUserExercise(exerciseId);
          if (cancelled) return;
          if (!stored) {
            setError("This imported melody is no longer available.");
            return;
          }
          if (!stored.analysis) {
            setError("This melody hasn't been analyzed yet — re-import to get coaching.");
            return;
          }
          setImportedDescriptor(stored.descriptor);
          setImportedInput(fromMelodyAnalysis(stored.analysis));
          const hzMap = new Map<number, number>();
          for (let i = 0; i < stored.analysis.notes.length; i++) {
            const n = stored.analysis.notes[i];
            if (typeof n?.medianHz === "number" && isFinite(n.medianHz) && n.medianHz > 0) {
              hzMap.set(i, n.medianHz);
            }
          }
          setImportedMedianHzByPos(hzMap);
        } catch (e) {
          if (!cancelled) setError(e instanceof Error ? e.message : String(e));
        }
        return;
      }
      if (!sessionId) {
        setError("No session id provided.");
        return;
      }
      try {
        const rec = await sessionStore.get(sessionId);
        if (cancelled) return;
        if (!rec) {
          setError("Couldn't find that session.");
          return;
        }
        const ex = exerciseLibrary.find((e) => e.id === rec.exerciseId);
        const iters = ex ? planExercise({ exercise: ex, voicePart: rec.voicePart }) : [];
        setRecord(rec);
        setIterations(iters);
      } catch (e) {
        if (!cancelled) setError(e instanceof Error ? e.message : String(e));
      }
    }
    void load();
    return () => {
      cancelled = true;
    };
  }, [sessionId, exerciseId]);

  const sessionInput: SessionInput | null = useMemo(() => {
    if (importedInput) return importedInput;
    if (!record) return null;
    return fromKeyAttempts(record.keyAttempts, iterations);
  }, [record, iterations, importedInput]);

  const model: RenderModel | null = useMemo(() => {
    if (!sessionInput) return null;
    const diagnoses = diagnoseSession(sessionInput);
    if (diagnoses.length === 0) {
      return {
        diagnoses,
        topDiagnosis: null,
        focusObservation: null,
        focusNote: null,
        iterationEvents: [],
        otherFocuses: [],
        symptomCard: null,
        causeCards: [],
        observations: sessionInput.notes,
      };
    }
    const top = diagnoses[0];
    const mapping = DETECTOR_MAPPINGS_BY_ID[top.detectorId];
    const symptomCard = mapping?.symptomCardId
      ? ADVICE_CARDS_BY_ID[mapping.symptomCardId] ?? null
      : null;
    const causeCards = (mapping?.candidateCauseCardIds ?? [])
      .map((cid) => ADVICE_CARDS_BY_ID[cid])
      .filter((c): c is AdviceCard => Boolean(c));

    const focusObs = pickRepresentative(top, sessionInput.notes);
    let focusNote: FocusNote | null = null;
    let iterEvents: NoteEvent[] = [];
    let otherFocuses: FocusNote[] = [];
    if (focusObs) {
      focusNote = makeFocusNote(
        focusObs,
        importedMedianHzByPos?.get(focusObs.notePosition) ?? null,
      );
      const iter = iterations[focusObs.keyIndex];
      iterEvents = iter ? [...iter.events] : [];
      otherFocuses = pickOtherFocuses(
        top,
        sessionInput.notes,
        focusObs,
        2,
        importedMedianHzByPos,
      );
    }
    return {
      diagnoses,
      topDiagnosis: top,
      focusObservation: focusObs,
      focusNote,
      iterationEvents: iterEvents,
      otherFocuses,
      symptomCard,
      causeCards,
      observations: sessionInput.notes,
    };
  }, [sessionInput, iterations, importedMedianHzByPos]);

  // Choose / persist a generic tip when no diagnoses fired (or too little data).
  const insufficientData =
    sessionInput !== null && sessionInput.notes.length < MIN_NOTES_FOR_DIAGNOSIS;
  const showEmptyState = model !== null && (insufficientData || model.diagnoses.length === 0);

  useEffect(() => {
    if (!showEmptyState) {
      setTip(null);
      return;
    }
    let cancelled = false;
    pickNextGenericTip()
      .then((c) => {
        if (!cancelled) setTip(c);
      })
      .catch(() => {});
    return () => {
      cancelled = true;
    };
  }, [showEmptyState]);

  const exerciseLabel = importedDescriptor
    ? importedDescriptor.name
    : record
      ? exerciseName(record.exerciseId)
      : "";
  const contextExerciseId = importedDescriptor?.id ?? record?.exerciseId;

  // ── Bookmark wiring ────────────────────────────────────────────────────────

  const handleSaveDiagnosis = useCallback(async () => {
    if (!model || !model.topDiagnosis) return;
    if (!record && !importedDescriptor) return;
    const top = model.topDiagnosis;
    const id = generateId();
    const snapshot: SavedCoaching = {
      id,
      savedAt: Date.now(),
      exerciseId: contextExerciseId,
      exerciseName: exerciseLabel,
      // Only attach a sessionId when this came from a session; imports omit it.
      sessionId: record?.id,
      diagnosis: {
        detectorId: top.detectorId,
        severity: top.severity,
        observations: top.observations,
        evidenceText: top.evidenceText,
        signedMeanCents: top.signedMeanCents,
      },
      // Snapshot — see plan §11.1.
      symptomCard: model.symptomCard ? { ...model.symptomCard } : undefined,
      causeCards: model.causeCards.map((c) => ({ ...c })),
    };
    try {
      await saveSavedCoaching(snapshot);
      setSavedDiagnosisId(id);
    } catch {
      // non-fatal
    }
  }, [model, record, importedDescriptor, exerciseLabel, contextExerciseId]);

  const handleUnsaveDiagnosis = useCallback(async () => {
    if (!savedDiagnosisId) return;
    try {
      await deleteSavedCoaching(savedDiagnosisId);
      setSavedDiagnosisId(null);
    } catch {
      // ignore
    }
  }, [savedDiagnosisId]);

  const handleSaveTip = useCallback(async () => {
    if (!tip) return;
    const id = generateId();
    const snapshot: SavedCoaching = {
      id,
      savedAt: Date.now(),
      exerciseId: contextExerciseId,
      exerciseName: exerciseLabel || undefined,
      sessionId: record?.id,
      diagnosis: {
        detectorId: "generic-tip",
        severity: 0,
        observations: 0,
        evidenceText: tip.title,
      },
      symptomCard: undefined,
      causeCards: [{ ...tip }],
    };
    try {
      await saveSavedCoaching(snapshot);
      setSavedTipId(id);
    } catch {
      // ignore
    }
  }, [tip, record, exerciseLabel, contextExerciseId]);

  const handleUnsaveTip = useCallback(async () => {
    if (!savedTipId) return;
    try {
      await deleteSavedCoaching(savedTipId);
      setSavedTipId(null);
    } catch {
      // ignore
    }
  }, [savedTipId]);

  // ── Render ────────────────────────────────────────────────────────────────

  function navigateToSaved() {
    router.push("/coaching-saved");
  }

  function renderHeader() {
    return (
      <View
        style={{
          flexDirection: "row",
          justifyContent: "space-between",
          alignItems: "center",
        }}
      >
        {/* Back — minHeight 44 touch target */}
        <Pressable
          onPress={() => router.back()}
          style={{ minHeight: 44, justifyContent: "center", paddingRight: Spacing.xs }}
          accessibilityLabel="Back"
          accessibilityRole="button"
        >
          <Text
            style={{
              fontSize: Typography.sm.size,
              lineHeight: Typography.sm.lineHeight,
              fontFamily: Fonts.bodyMedium,
              color: colors.accent,
            }}
          >
            ← Back
          </Text>
        </Pressable>
        {/* Saved link — minHeight 44 touch target */}
        <Pressable
          onPress={navigateToSaved}
          style={{ minHeight: 44, justifyContent: "center", paddingHorizontal: Spacing.sm }}
          accessibilityLabel="Open saved tips"
          accessibilityRole="button"
        >
          <Text
            style={{
              fontSize: Typography.sm.size,
              lineHeight: Typography.sm.lineHeight,
              fontFamily: Fonts.bodyMedium,
              color: colors.accent,
            }}
          >
            ☆ Saved
          </Text>
        </Pressable>
      </View>
    );
  }

  if (error) {
    return (
      <ScrollView
        style={{ flex: 1, backgroundColor: colors.canvas }}
        contentContainerStyle={{ padding: Spacing.lg, paddingBottom: Spacing["3xl"], gap: Spacing.md }}
      >
        {renderHeader()}
        <Text
          style={{
            fontSize: Typography["2xl"].size,
            lineHeight: Typography["2xl"].lineHeight,
            fontFamily: Fonts.display,
            color: colors.textPrimary,
          }}
        >
          Coaching
        </Text>
        <Text
          style={{
            fontSize: Typography.base.size,
            lineHeight: Typography.base.lineHeight,
            fontFamily: Fonts.body,
            color: colors.error,
          }}
        >
          {error}
        </Text>
        <Pressable
          style={{
            paddingVertical: Spacing.sm,
            borderRadius: Radii.md,
            alignItems: "center",
            backgroundColor: colors.bgSurface,
            borderWidth: 1,
            borderColor: colors.borderStrong,
          }}
          onPress={() => router.back()}
          accessibilityRole="button"
          accessibilityLabel="Go back"
        >
          <Text
            style={{
              fontSize: Typography.base.size,
              lineHeight: Typography.base.lineHeight,
              fontFamily: Fonts.bodyMedium,
              color: colors.textPrimary,
            }}
          >
            Back
          </Text>
        </Pressable>
      </ScrollView>
    );
  }

  if ((!record && !importedDescriptor) || !model) {
    return (
      <ScrollView
        style={{ flex: 1, backgroundColor: colors.canvas }}
        contentContainerStyle={{ padding: Spacing.lg, paddingBottom: Spacing["3xl"], gap: Spacing.md }}
      >
        {renderHeader()}
        <Text
          style={{
            fontSize: Typography["2xl"].size,
            lineHeight: Typography["2xl"].lineHeight,
            fontFamily: Fonts.display,
            color: colors.textPrimary,
          }}
        >
          Coaching
        </Text>
        <Text
          style={{
            fontSize: Typography.base.size,
            lineHeight: Typography.base.lineHeight,
            fontFamily: Fonts.body,
            color: colors.textTertiary,
          }}
        >
          {exerciseId ? "Loading melody…" : "Loading session…"}
        </Text>
      </ScrollView>
    );
  }

  if (showEmptyState) {
    const emptyContextLine = importedDescriptor
      ? `Coaching melody — ${exerciseLabel}`
      : exerciseLabel
        ? `Coaching session — ${exerciseLabel}`
        : null;
    return (
      <ScrollView
        style={{ flex: 1, backgroundColor: colors.canvas }}
        contentContainerStyle={{ padding: Spacing.lg, paddingBottom: Spacing["3xl"], gap: Spacing.md }}
      >
        {renderHeader()}
        {emptyContextLine && (
          <Text
            style={{
              fontSize: Typography.xs.size,
              lineHeight: Typography.xs.lineHeight,
              fontFamily: Fonts.bodySemibold,
              color: colors.textTertiary,
            }}
          >
            {emptyContextLine}
          </Text>
        )}
        {tip && (
          <EmptyStateTip
            tip={tip}
            saved={savedTipId !== null}
            onSave={handleSaveTip}
            onUnsave={handleUnsaveTip}
            message={
              insufficientData
                ? "Not enough audio for meaningful coaching. Try with headphones in a quieter room."
                : undefined
            }
          />
        )}
      </ScrollView>
    );
  }

  const top = model.topDiagnosis!;
  const headline = diagnosisHeadlineFor(top, model.symptomCard);
  const otherDiagnoses = model.diagnoses.slice(1, 3);
  const contextLine = importedDescriptor
    ? `Coaching melody — ${exerciseLabel}`
    : exerciseLabel
      ? `Coaching session — ${exerciseLabel}`
      : null;
  // For imports, derive a syllable strip directly from the SessionInput notes since we have no iteration events.
  const importedSyllables = importedDescriptor
    ? model.observations.map((n) => n.syllable ?? "")
    : undefined;

  return (
    <ScrollView
      style={{ flex: 1, backgroundColor: colors.canvas }}
      contentContainerStyle={{ padding: Spacing.lg, paddingBottom: Spacing["3xl"], gap: Spacing.md }}
    >
      {renderHeader()}

      {/* Diagnosis section — emphasis surface spotlight */}
      <View
        style={{
          backgroundColor: colors.bgEmphasis,
          borderRadius: Radii.lg,
          borderWidth: 1,
          borderColor: colors.borderOnEmphasis,
          padding: Spacing.md,
          gap: Spacing.xs,
        }}
      >
        {contextLine && (
          <Text
            style={{
              fontSize: Typography.xs.size,
              lineHeight: Typography.xs.lineHeight,
              fontFamily: Fonts.bodySemibold,
              color: colors.textOnEmphasisDim,
            }}
          >
            {contextLine}
          </Text>
        )}
        {/* DiagnosisHeadline renders on emphasis — override colors inline */}
        <Text
          style={{
            fontSize: Typography.xl.size,
            lineHeight: Typography.xl.lineHeight,
            fontFamily: Fonts.display,
            color: colors.textOnEmphasis,
          }}
        >
          {headline}
        </Text>
        {/* Avoid restating evidence verbatim under the headline (position-consistent uses evidence as headline). */}
        {headline !== top.evidenceText && (
          <Text
            style={{
              fontSize: Typography.sm.size,
              lineHeight: Typography.sm.lineHeight,
              fontFamily: Fonts.body,
              color: colors.textOnEmphasisDim,
            }}
          >
            {top.evidenceText}
          </Text>
        )}
      </View>

      {model.focusNote && (
        <ContrastPlayback
          focus={model.focusNote}
          iterationEvents={model.iterationEvents}
          otherFocuses={model.otherFocuses}
          syllables={importedSyllables}
        />
      )}

      {model.symptomCard?.soundsLike && (
        <View style={{ gap: Spacing["2xs"] }}>
          <Text
            style={{
              fontSize: Typography.xs.size,
              lineHeight: Typography.xs.lineHeight,
              fontFamily: Fonts.bodyMedium,
              color: colors.textTertiary,
              textTransform: "uppercase",
              letterSpacing: 0.6,
            }}
          >
            What this sounds like
          </Text>
          <Text
            style={{
              fontSize: Typography.base.size,
              lineHeight: Typography.base.lineHeight,
              fontFamily: Fonts.body,
              color: colors.textPrimary,
            }}
          >
            {model.symptomCard.soundsLike}
          </Text>
        </View>
      )}

      {model.causeCards.length > 0 && (
        <View style={{ gap: Spacing["2xs"] }}>
          <Text
            style={{
              fontSize: Typography.xs.size,
              lineHeight: Typography.xs.lineHeight,
              fontFamily: Fonts.bodyMedium,
              color: colors.textTertiary,
              textTransform: "uppercase",
              letterSpacing: 0.6,
            }}
          >
            Likely causes
          </Text>
          <CauseCardList cards={model.causeCards} />
        </View>
      )}

      {otherDiagnoses.length > 0 && (
        <View style={{ gap: Spacing["2xs"] }}>
          <Pressable
            onPress={() => setOtherOpen((v) => !v)}
            accessibilityRole="button"
            accessibilityLabel={otherOpen ? "Collapse other findings" : "Expand other findings"}
          >
            <Text
              style={{
                fontSize: Typography.xs.size,
                lineHeight: Typography.xs.lineHeight,
                fontFamily: Fonts.bodyMedium,
                color: colors.textTertiary,
                textTransform: "uppercase",
                letterSpacing: 0.6,
              }}
            >
              {otherOpen ? "▼" : "▶"} Other findings ({otherDiagnoses.length})
            </Text>
          </Pressable>
          {otherOpen && (
            <View style={{ gap: Spacing.xs, marginTop: Spacing.xs }}>
              {otherDiagnoses.map((d) => {
                const m = DETECTOR_MAPPINGS_BY_ID[d.detectorId];
                const sCard = m?.symptomCardId ? ADVICE_CARDS_BY_ID[m.symptomCardId] : null;
                return (
                  <View
                    key={d.detectorId}
                    style={{
                      backgroundColor: colors.bgSurface,
                      borderRadius: Radii.md,
                      borderWidth: 1,
                      borderColor: colors.borderSubtle,
                      padding: Spacing.sm,
                      gap: Spacing["2xs"],
                    }}
                  >
                    <Text
                      style={{
                        fontSize: Typography.base.size,
                        lineHeight: Typography.base.lineHeight,
                        fontFamily: Fonts.displaySemibold,
                        color: colors.textPrimary,
                      }}
                    >
                      {sCard?.title ?? d.evidenceText}
                    </Text>
                    <Text
                      style={{
                        fontSize: Typography.sm.size,
                        lineHeight: Typography.sm.lineHeight,
                        fontFamily: Fonts.body,
                        color: colors.textSecondary,
                      }}
                    >
                      {d.evidenceText}
                    </Text>
                  </View>
                );
              })}
            </View>
          )}
        </View>
      )}

      <BookmarkButton
        saved={savedDiagnosisId !== null}
        onSave={handleSaveDiagnosis}
        onUnsave={handleUnsaveDiagnosis}
      />
    </ScrollView>
  );
}

function generateId(): string {
  if (typeof crypto !== "undefined" && "randomUUID" in crypto) {
    return crypto.randomUUID();
  }
  return `c-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
}
