import { useLocalSearchParams, useRouter } from "expo-router";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { Pressable, ScrollView, Text, TextInput, View } from "react-native";

import ChunkDividerControls from "@/components/songs/ChunkDividerControls";
import ChunkNameField from "@/components/songs/ChunkNameField";
import SongScoreView, { CHUNK_PALETTE } from "@/components/songs/SongScoreView";
import VexFlowScore from "@/components/songs/VexFlowScore";
import { useTheme } from "@/hooks/use-theme";
import { Fonts, Radii, Spacing, Typography } from "@/constants/theme";
import { createAudioPlayer, type AudioPlayer, type SequenceHandle } from "@/lib/audio";
import { noteToMidi } from "@/lib/exercises/music";
import { reconcileChunkIds } from "@/lib/songs/chunker";
import { previewChunk } from "@/lib/songs/preview";
import { getSong, saveSong } from "@/lib/songs/store";
import { parseSyllables, zipSyllablesToNotes } from "@/lib/songs/syllables";
import type { ChunkSpec, StoredSong } from "@/lib/songs/types";

export default function SongEditorScreen() {
  const router = useRouter();
  const { colors } = useTheme();
  const { songId } = useLocalSearchParams<{ songId?: string }>();

  const [song, setSong] = useState<StoredSong | null>(null);
  const [chunks, setChunks] = useState<ChunkSpec[]>([]);
  const [lyrics, setLyrics] = useState("");
  const [savedMsg, setSavedMsg] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [dirty, setDirty] = useState(false);
  const [playingChunkId, setPlayingChunkId] = useState<string | null>(null);
  const [scoreEngine, setScoreEngine] = useState<"classic" | "beamed">("beamed");
  const playerRef = useRef<AudioPlayer | null>(null);
  const previewHandleRef = useRef<SequenceHandle | null>(null);
  const previewPollRef = useRef<ReturnType<typeof setInterval> | null>(null);

  useEffect(() => {
    if (typeof songId !== "string" || !songId) {
      setError("No song id provided.");
      return;
    }
    let cancelled = false;
    getSong(songId)
      .then((s) => {
        if (cancelled) return;
        if (!s) {
          setError("Song not found.");
          return;
        }
        setSong(s);
        setChunks(s.chunks);
        setLyrics(s.lyrics ?? "");
      })
      .catch((e) => {
        if (!cancelled) setError(e instanceof Error ? e.message : String(e));
      });
    return () => { cancelled = true; };
  }, [songId]);

  const tonicMidi = useMemo(
    () => (song ? safeNoteToMidi(song.tonic) ?? 60 : 60),
    [song],
  );

  // Apply lyrics-aware note splitting before building score data so syllables,
  // chunk dividers, and durations all line up under the matched array.
  const matched = useMemo(() => {
    if (!song) return null;
    return zipSyllablesToNotes(parseSyllables(lyrics), song.allNotes);
  }, [song, lyrics]);

  const scoreNotes = useMemo(() => {
    if (!song || !matched) return [];
    const beatSec = 60 / song.tempoBpm;
    return matched.notes.map((n, i) => {
      const next = matched.notes[i + 1];
      const gapMs = next ? Math.max(0, next.startMs - n.endMs) : 0;
      const restAfterBeats = (gapMs / 1000) / beatSec;
      return {
        midi: n.snappedMidi,
        durationBeats: n.durationBeats,
        restAfterBeats,
        syllable: n.syllable,
      };
    });
  }, [song, matched]);

  const originalIndexMap = useMemo(
    () => (matched ? matched.originalIndexMap : undefined),
    [matched],
  );

  const syllableCount = useMemo(() => parseSyllables(lyrics).length, [lyrics]);
  const noteCount = song?.allNotes.length ?? 0;
  const splitsApplied = Math.max(0, syllableCount - noteCount);

  const handleChunksChange = useCallback((next: ChunkSpec[]) => {
    setChunks(next);
    setDirty(true);
    setSavedMsg(null);
  }, []);

  const handleRenameChunk = useCallback(
    (idx: number, name: string) => {
      setChunks((prev) => prev.map((c, i) => (i === idx ? { ...c, name } : c)));
      setDirty(true);
      setSavedMsg(null);
    },
    [],
  );

  // In-score boundary drag: boundaryIdx is the chunk that starts at the divider
  // (always ≥ 1). Clamp so neither neighbor shrinks below 1 note.
  const handleBoundaryDragMove = useCallback(
    (boundaryIdx: number, newStartNoteIdx: number) => {
      setChunks((prev) => {
        if (boundaryIdx < 1 || boundaryIdx >= prev.length) return prev;
        const left = prev[boundaryIdx - 1]!;
        const right = prev[boundaryIdx]!;
        const minStart = left.startNoteIdx + 1;
        const maxStart = right.endNoteIdx;
        const clamped = Math.max(minStart, Math.min(maxStart, newStartNoteIdx));
        if (clamped === right.startNoteIdx) return prev;
        return prev.map((c, i) => {
          if (i === boundaryIdx - 1) return { ...c, endNoteIdx: clamped - 1 };
          if (i === boundaryIdx) return { ...c, startNoteIdx: clamped };
          return c;
        });
      });
      setDirty(true);
      setSavedMsg(null);
    },
    [],
  );

  const handleSave = useCallback(async () => {
    if (!song) return;
    setError(null);
    try {
      // Reconcile against the song's persisted chunks so IDs survive when
      // boundaries overlap ≥ 50%. User-edited names from local state always win.
      const newRanges = chunks.map((c) => ({ startNoteIdx: c.startNoteIdx, endNoteIdx: c.endNoteIdx }));
      const reconciled = reconcileChunkIds(song.chunks, newRanges);
      const final = reconciled.map((c, i) => ({
        ...c,
        name: chunks[i]?.name ?? c.name,
      }));
      const next: StoredSong = {
        ...song,
        chunks: final,
        ...(lyrics.trim() ? { lyrics } : { lyrics: undefined }),
      };
      await saveSong(next);
      setSong(next);
      setChunks(final);
      setDirty(false);
      setSavedMsg("Saved");
    } catch (e) {
      setError(e instanceof Error ? e.message : String(e));
    }
  }, [song, chunks, lyrics]);

  const stopPreview = useCallback(() => {
    if (previewPollRef.current) {
      clearInterval(previewPollRef.current);
      previewPollRef.current = null;
    }
    if (previewHandleRef.current) {
      try { previewHandleRef.current.stop(); } catch { /* ignore */ }
      previewHandleRef.current = null;
    }
    setPlayingChunkId(null);
  }, []);

  const handlePreview = useCallback(
    async (chunkId: string) => {
      if (!song) return;
      // Toggle off if same chunk is already playing.
      if (playingChunkId === chunkId) {
        stopPreview();
        return;
      }
      stopPreview();
      const chunk = chunks.find((c) => c.id === chunkId);
      if (!chunk) return;
      try {
        if (!playerRef.current) {
          playerRef.current = createAudioPlayer();
        }
        if (!playerRef.current.isReady()) {
          await playerRef.current.init();
        }
        const handle = previewChunk(playerRef.current, song, chunk);
        if (!handle) return;
        previewHandleRef.current = handle;
        setPlayingChunkId(chunkId);
        previewPollRef.current = setInterval(() => {
          if (!previewHandleRef.current) return;
          if (previewHandleRef.current.getProgress() >= 1) {
            stopPreview();
          }
        }, 100);
      } catch (e) {
        setError(e instanceof Error ? e.message : String(e));
        stopPreview();
      }
    },
    [song, chunks, playingChunkId, stopPreview],
  );

  useEffect(() => {
    return () => {
      stopPreview();
      const p = playerRef.current;
      playerRef.current = null;
      if (p) { p.dispose().catch(() => undefined); }
    };
  }, [stopPreview]);

  if (error) {
    return (
      <View style={{ flex: 1, backgroundColor: colors.canvas, padding: Spacing.lg, gap: Spacing.md }}>
        <Pressable onPress={() => router.back()} accessibilityLabel="Back" style={{ alignSelf: "flex-start", minHeight: 44, justifyContent: "center" }}>
          <Text style={{ color: colors.accent, fontSize: Typography.sm.size, lineHeight: Typography.sm.lineHeight, fontFamily: Fonts.bodyMedium }}>← Back</Text>
        </Pressable>
        <Text style={{ color: colors.error, fontFamily: Fonts.body, fontSize: Typography.base.size, lineHeight: Typography.base.lineHeight }}>{error}</Text>
      </View>
    );
  }

  if (!song) {
    return (
      <View style={{ flex: 1, backgroundColor: colors.canvas, padding: Spacing.lg }}>
        <Text style={{ color: colors.textSecondary, fontFamily: Fonts.body }}>Loading…</Text>
      </View>
    );
  }

  return (
    <ScrollView
      style={{ flex: 1, backgroundColor: colors.canvas }}
      contentContainerStyle={{ padding: Spacing.lg, gap: Spacing.md, paddingBottom: Spacing["3xl"] }}
    >
      <View style={{ flexDirection: "row", alignItems: "center", justifyContent: "space-between", gap: Spacing.sm }}>
        <Pressable onPress={() => router.back()} accessibilityLabel="Back" style={{ minHeight: 44, justifyContent: "center" }}>
          <Text style={{ color: colors.accent, fontSize: Typography.sm.size, lineHeight: Typography.sm.lineHeight, fontFamily: Fonts.bodyMedium }}>← Back</Text>
        </Pressable>
        <Pressable
          onPress={handleSave}
          disabled={!dirty}
          style={{ backgroundColor: dirty ? colors.accent : colors.bgSurface, borderRadius: Radii.md, paddingVertical: Spacing.xs, paddingHorizontal: Spacing.md, minHeight: 44, justifyContent: "center", opacity: dirty ? 1 : 0.5 }}
          accessibilityLabel="Save segment edits"
        >
          <Text style={{ color: dirty ? colors.bgCanvas : colors.textPrimary, fontSize: Typography.sm.size, lineHeight: Typography.sm.lineHeight, fontFamily: Fonts.bodySemibold }}>
            {dirty ? "Save" : "Saved"}
          </Text>
        </Pressable>
      </View>

      <View style={{ gap: Spacing["3xs"] }}>
        <Text style={{ color: colors.textTertiary, fontSize: Typography.xs.size, lineHeight: Typography.xs.lineHeight, fontFamily: Fonts.bodyMedium, textTransform: "uppercase", letterSpacing: 0.6 }}>
          Editing segments
        </Text>
        <Text style={{ color: colors.textPrimary, fontSize: Typography.xl.size, lineHeight: Typography.xl.lineHeight, fontFamily: Fonts.display }}>
          {song.name}
        </Text>
        <Text style={{ color: colors.textSecondary, fontSize: Typography.sm.size, lineHeight: Typography.sm.lineHeight, fontFamily: Fonts.body }}>
          {song.tonic} {song.mode} · {song.timeSignature.num}/{song.timeSignature.den} · {song.tempoBpm} BPM · {song.allNotes.length} notes
        </Text>
      </View>

      {savedMsg && (
        <Text style={{ color: colors.success, fontSize: Typography.sm.size, lineHeight: Typography.sm.lineHeight, fontFamily: Fonts.body }}>
          {savedMsg}
        </Text>
      )}

      <View style={{ flexDirection: "row", alignItems: "center", gap: Spacing.xs }}>
        <Text style={{ color: colors.textTertiary, fontSize: Typography.xs.size, lineHeight: Typography.xs.lineHeight, fontFamily: Fonts.bodyMedium, textTransform: "uppercase", letterSpacing: 0.6 }}>
          Notation
        </Text>
        {(["classic", "beamed"] as const).map((opt) => {
          const active = scoreEngine === opt;
          return (
            <Pressable
              key={opt}
              onPress={() => setScoreEngine(opt)}
              style={{
                paddingHorizontal: Spacing.sm,
                paddingVertical: Spacing["2xs"],
                borderRadius: Radii.pill,
                borderWidth: 1,
                borderColor: active ? colors.accent : colors.borderSubtle,
                backgroundColor: active ? colors.accentMuted : colors.bgSurface,
              }}
            >
              <Text style={{ color: active ? colors.accent : colors.textSecondary, fontSize: Typography.xs.size, lineHeight: Typography.xs.lineHeight, fontFamily: Fonts.bodyMedium }}>
                {opt === "classic" ? "Classic" : "Beamed (new)"}
              </Text>
            </Pressable>
          );
        })}
      </View>

      <View style={{ backgroundColor: colors.bgSurface, borderRadius: Radii.md, borderWidth: 1, borderColor: colors.borderSubtle, paddingVertical: Spacing.sm }}>
        {scoreEngine === "classic" ? (
          <ScrollView horizontal showsHorizontalScrollIndicator={false}>
            <SongScoreView
              notes={scoreNotes}
              chunks={chunks}
              tonicMidi={tonicMidi}
              onBoundaryDragMove={handleBoundaryDragMove}
              onLabelRename={handleRenameChunk}
              originalIndexMap={originalIndexMap}
            />
          </ScrollView>
        ) : (
          <VexFlowScore
            notes={scoreNotes}
            chunks={chunks}
            tonicMidi={tonicMidi}
            timeSignature={song.timeSignature}
            targetRowWidth={1000}
            onBoundaryDragMove={handleBoundaryDragMove}
          />
        )}
      </View>

      <View style={{ gap: Spacing.xs }}>
        <Text style={{ color: colors.textTertiary, fontSize: Typography.xs.size, lineHeight: Typography.xs.lineHeight, fontFamily: Fonts.bodyMedium, textTransform: "uppercase", letterSpacing: 0.6 }}>
          Segments
        </Text>
        {chunks.map((c, i) => {
          const color = CHUNK_PALETTE[i % CHUNK_PALETTE.length]!;
          const size = c.endNoteIdx - c.startNoteIdx + 1;
          const isPlaying = playingChunkId === c.id;
          return (
            <View key={c.id} style={{ backgroundColor: colors.bgSurface, borderRadius: Radii.md, borderWidth: 1, borderColor: colors.borderSubtle, padding: Spacing.sm, gap: Spacing["2xs"] }}>
              <View style={{ flexDirection: "row", alignItems: "center", gap: Spacing.xs }}>
                <View style={{ width: 8, height: 24, backgroundColor: color, borderRadius: 2 }} />
                <Pressable
                  onPress={() => handlePreview(c.id)}
                  accessibilityLabel={isPlaying ? `Stop ${c.name}` : `Play ${c.name}`}
                  style={{
                    width: 32,
                    height: 32,
                    borderRadius: 16,
                    backgroundColor: isPlaying ? colors.accent : colors.bgEmphasis,
                    alignItems: "center",
                    justifyContent: "center",
                  }}
                >
                  <Text style={{ color: isPlaying ? colors.bgCanvas : colors.textOnEmphasis, fontSize: Typography.sm.size, lineHeight: Typography.sm.lineHeight, fontFamily: Fonts.bodySemibold }}>
                    {isPlaying ? "■" : "▶"}
                  </Text>
                </Pressable>
                <View style={{ flex: 1 }}>
                  <ChunkNameField value={c.name} onChange={(v) => handleRenameChunk(i, v)} />
                </View>
                <Text style={{ color: colors.textTertiary, fontSize: Typography.xs.size, lineHeight: Typography.xs.lineHeight, fontFamily: Fonts.mono }}>
                  notes {c.startNoteIdx + 1}–{c.endNoteIdx + 1} ({size})
                </Text>
              </View>
            </View>
          );
        })}
      </View>

      <View style={{ gap: Spacing.xs }}>
        <Text style={{ color: colors.textTertiary, fontSize: Typography.xs.size, lineHeight: Typography.xs.lineHeight, fontFamily: Fonts.bodyMedium, textTransform: "uppercase", letterSpacing: 0.6 }}>
          Boundaries
        </Text>
        <ChunkDividerControls chunks={chunks} onChange={handleChunksChange} />
      </View>

      <View style={{ gap: Spacing.xs }}>
        <Text style={{ color: colors.textTertiary, fontSize: Typography.xs.size, lineHeight: Typography.xs.lineHeight, fontFamily: Fonts.bodyMedium, textTransform: "uppercase", letterSpacing: 0.6 }}>
          Lyrics
        </Text>
        <TextInput
          value={lyrics}
          onChangeText={(v) => { setLyrics(v); setDirty(true); setSavedMsg(null); }}
          multiline
          numberOfLines={6}
          placeholder="Type or paste lyrics. Use spaces between words and hyphens within multi-syllable words (e.g. for-ev-er)"
          placeholderTextColor={colors.textTertiary}
          style={{
            backgroundColor: colors.bgSurface,
            borderRadius: Radii.md,
            borderWidth: 1,
            borderColor: colors.borderSubtle,
            padding: Spacing.sm,
            minHeight: 96,
            color: colors.textPrimary,
            fontFamily: Fonts.body,
            fontSize: Typography.base.size,
            lineHeight: Typography.base.lineHeight,
            textAlignVertical: "top",
          }}
        />
        <Text style={{ color: colors.textTertiary, fontSize: Typography.xs.size, lineHeight: Typography.xs.lineHeight, fontFamily: Fonts.body }}>
          {syllableCount} syllables · {noteCount} notes — {splitsApplied} splits applied
        </Text>
      </View>
    </ScrollView>
  );
}

function safeNoteToMidi(name: string): number | null {
  try { return noteToMidi(name); } catch { return null; }
}
