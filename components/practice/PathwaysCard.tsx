// Growth Paths — curated exercise sets shown with progress, never gated. Every
// exercise stays tappable; rows surface practiced/done-today counts, not locks.
import { useState } from "react";
import { Pressable, StyleSheet, Text, View } from "react-native";

import { PATHWAYS } from "@/lib/exercises/pathways";
import type { Pathway } from "@/lib/exercises/pathways";
import { capabilityMeta } from "@/lib/exercises/capabilities";
import { getExercise } from "@/lib/exercises/library";
import { isDoneToday } from "@/lib/progress/routine";
import type { SessionRecord } from "@/lib/progress";
import { useTheme } from "@/hooks/use-theme";
import { Spacing, Radii, Typography, Fonts } from "@/constants/theme";

interface Props {
  sessions: SessionRecord[];
  onPracticeExercise: (exerciseId: string) => void;
  onUsePath: (exerciseIds: string[]) => void;
}

function ProgressBar({ practiced, total }: { practiced: number; total: number }) {
  const { colors } = useTheme();
  const segments = Array.from({ length: total }, (_, i) => i < practiced);
  return (
    <View style={[styles.bar, { gap: Spacing["3xs"] }]}>
      {segments.map((filled, i) => (
        <View
          key={i}
          style={[
            styles.barSeg,
            {
              backgroundColor: filled ? colors.accent : colors.borderSubtle,
              borderRadius: Radii.sm,
            },
          ]}
        />
      ))}
    </View>
  );
}

function PathwayRow({
  pathway,
  everPracticed,
  doneToday,
  onPracticeExercise,
  onUsePath,
}: {
  pathway: Pathway;
  everPracticed: (id: string) => boolean;
  doneToday: (id: string) => boolean;
  onPracticeExercise: (id: string) => void;
  onUsePath: (ids: string[]) => void;
}) {
  const { colors } = useTheme();
  const [expanded, setExpanded] = useState(false);

  const practiced = pathway.exerciseIds.filter(everPracticed).length;
  const done = pathway.exerciseIds.filter(doneToday).length;
  const total = pathway.exerciseIds.length;
  const focusLabel = capabilityMeta(pathway.focus)?.label ?? pathway.focus;

  return (
    <View style={[styles.row, { borderColor: colors.borderSubtle, borderRadius: Radii.md, backgroundColor: colors.bgSurface }]}>
      <Pressable
        onPress={() => setExpanded((v) => !v)}
        style={[styles.rowHeader, { paddingHorizontal: Spacing.sm, paddingVertical: Spacing.sm, gap: Spacing["2xs"] }]}
        accessibilityLabel={`${pathway.name} — ${practiced} of ${total} practiced`}
      >
        <View style={[styles.rowTitleLine, { gap: Spacing.xs }]}>
          <Text style={{ flex: 1, fontSize: Typography.lg.size, lineHeight: Typography.lg.lineHeight, fontFamily: Fonts.display, color: colors.textPrimary }}>
            {pathway.name}
          </Text>
          <Text style={{ color: colors.textTertiary, fontSize: Typography.monoBase.size, fontFamily: Fonts.mono }}>
            {expanded ? "▲" : "▼"}
          </Text>
        </View>

        <View style={[styles.focusPill, { backgroundColor: colors.accentMuted, borderRadius: Radii.sm }]}>
          <Text style={{ fontSize: Typography.xs.size, lineHeight: Typography.xs.lineHeight, fontFamily: Fonts.bodyMedium, color: colors.accent, textTransform: "uppercase", letterSpacing: 0.5, paddingHorizontal: Spacing["2xs"], paddingVertical: Spacing["3xs"] }}>
            {focusLabel}
          </Text>
        </View>

        <Text style={{ fontSize: Typography.sm.size, lineHeight: Typography.sm.lineHeight, fontFamily: Fonts.body, color: colors.textSecondary }}>
          {pathway.description}
        </Text>

        <ProgressBar practiced={practiced} total={total} />

        <Text style={{ fontSize: Typography.monoBase.size, lineHeight: Typography.monoBase.lineHeight, fontFamily: Fonts.mono, color: colors.textTertiary }}>
          {practiced}/{total} practiced
          {done > 0 ? `  ·  ${done} done today` : ""}
        </Text>
      </Pressable>

      {expanded && (
        <View style={[styles.rowDetail, { borderTopColor: colors.borderSubtle, paddingHorizontal: Spacing.sm, paddingVertical: Spacing.sm, gap: Spacing["2xs"] }]}>
          {pathway.exerciseIds.map((id) => {
            const name = getExercise(id)?.name ?? id;
            const isDone = doneToday(id);
            return (
              <Pressable
                key={id}
                onPress={() => onPracticeExercise(id)}
                style={[styles.exerciseRow, { paddingVertical: Spacing.xs, gap: Spacing.xs }]}
                accessibilityLabel={`Practice ${name}`}
              >
                <Text style={{ flex: 1, fontSize: Typography.base.size, lineHeight: Typography.base.lineHeight, fontFamily: Fonts.body, color: colors.textPrimary }}>
                  {name}
                </Text>
                {isDone && (
                  <Text style={{ fontSize: Typography.base.size, lineHeight: Typography.base.lineHeight, fontFamily: Fonts.bodySemibold, color: colors.success }}>
                    ✓
                  </Text>
                )}
              </Pressable>
            );
          })}

          <Pressable
            onPress={() => onUsePath(pathway.exerciseIds)}
            style={[styles.usePathBtn, { backgroundColor: colors.accent, borderRadius: Radii.md, paddingVertical: Spacing.sm, marginTop: Spacing["2xs"] }]}
            accessibilityLabel={`Make ${pathway.name} today's routine`}
          >
            <Text style={{ color: colors.bgCanvas, fontSize: Typography.base.size, lineHeight: Typography.base.lineHeight, fontFamily: Fonts.bodySemibold }}>
              Practice this path
            </Text>
          </Pressable>
        </View>
      )}
    </View>
  );
}

export default function PathwaysCard({ sessions, onPracticeExercise, onUsePath }: Props) {
  const { colors } = useTheme();
  const everPracticed = (id: string) => sessions.some((s) => s.exerciseId === id);
  const doneToday = (id: string) => isDoneToday(sessions, id);

  return (
    <View style={[styles.card, { backgroundColor: colors.bgSurface, borderColor: colors.borderSubtle, borderRadius: Radii.md, padding: Spacing.lg, gap: Spacing.sm }]}>
      <Text style={{ fontSize: Typography.xs.size, lineHeight: Typography.xs.lineHeight, fontFamily: Fonts.bodyMedium, color: colors.textTertiary, textTransform: "uppercase", letterSpacing: 0.8 }}>
        Growth Paths
      </Text>
      <Text style={{ fontSize: Typography.sm.size, lineHeight: Typography.sm.lineHeight, fontFamily: Fonts.body, color: colors.textSecondary }}>
        Curated sets that build one capability. Pick a path or any single exercise — nothing's locked.
      </Text>
      {PATHWAYS.map((pathway) => (
        <PathwayRow
          key={pathway.id}
          pathway={pathway}
          everPracticed={everPracticed}
          doneToday={doneToday}
          onPracticeExercise={onPracticeExercise}
          onUsePath={onUsePath}
        />
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  card: { borderWidth: 1 },
  row: { borderWidth: 1, overflow: "hidden" },
  rowHeader: {},
  rowTitleLine: { flexDirection: "row", alignItems: "center" },
  focusPill: { alignSelf: "flex-start" },
  rowDetail: { borderTopWidth: 1 },
  exerciseRow: { flexDirection: "row", alignItems: "center" },
  usePathBtn: { alignItems: "center" },
  bar: { flexDirection: "row" },
  barSeg: { flex: 1, height: 6 },
});
