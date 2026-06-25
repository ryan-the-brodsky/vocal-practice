import { useMemo } from "react";
import { Pressable, ScrollView, StyleSheet, Text, View } from "react-native";
import { useRouter, type Href } from "expo-router";

import { Fonts, Radii, Spacing, Typography } from "@/constants/theme";
import { useTheme } from "@/hooks/use-theme";
import { LEARN_ARTICLES } from "@/content/learn/articles.generated";
import { capabilityMeta, isCapability, type Capability } from "@/lib/exercises/capabilities";

// Content-only tags (not exercise capabilities) get labels/order here; mirrors
// the /learn web index so the in-app Library and the marketing hub stay aligned.
const CONTENT_TAGS: Record<string, { label: string; order: number }> = {
  foundations: { label: "Foundations", order: 20 },
  "pitch-ear": { label: "Pitch & Ear", order: 21 },
};
const catLabel = (id: string) =>
  (isCapability(id) ? capabilityMeta(id as Capability)?.label : CONTENT_TAGS[id]?.label) ?? id;
const catOrder = (id: string) =>
  (isCapability(id) ? capabilityMeta(id as Capability)?.order : CONTENT_TAGS[id]?.order) ?? 99;

export default function LibraryScreen() {
  const { colors } = useTheme();
  const router = useRouter();

  const groups = useMemo(() => {
    const byCat = new Map<string, typeof LEARN_ARTICLES>();
    for (const a of LEARN_ARTICLES) {
      const arr = byCat.get(a.category) ?? [];
      arr.push(a);
      byCat.set(a.category, arr);
    }
    return [...byCat.entries()]
      .sort((x, y) => catOrder(x[0]) - catOrder(y[0]))
      .map(([cat, arts]) => ({
        cat,
        arts: [...arts].sort((p, q) => p.title.localeCompare(q.title)),
      }));
  }, []);

  return (
    <ScrollView
      style={[styles.container, { backgroundColor: colors.canvas }]}
      contentContainerStyle={[styles.content, { padding: Spacing.lg, paddingBottom: Spacing["3xl"] }]}
    >
      <View style={styles.intro}>
        <Text style={[styles.h1, { color: colors.textPrimary, fontFamily: Fonts.displaySemibold }]}>Learn</Text>
        <Text style={[styles.deck, { color: colors.textSecondary, fontFamily: Fonts.body }]}>
          Science-backed guides and tools — find your range, then dig into technique. Each guide links
          to an exercise you can practice.
        </Text>
      </View>

      <View style={styles.section}>
        <Text style={[styles.eyebrow, { color: colors.textTertiary, fontFamily: Fonts.bodySemibold }]}>TOOLS</Text>
        <Pressable
          onPress={() => router.push("/vocal-range-test")}
          style={[styles.toolCard, { backgroundColor: colors.bgEmphasis, borderColor: colors.borderOnEmphasis }]}
          accessibilityRole="button"
          accessibilityLabel="Open the vocal range test"
        >
          <Text style={[styles.toolTitle, { color: colors.textOnEmphasis, fontFamily: Fonts.displaySemibold }]}>
            Vocal Range Test →
          </Text>
          <Text style={[styles.toolDesc, { color: colors.textOnEmphasisDim, fontFamily: Fonts.body }]}>
            Sing your lowest and highest notes to find your range and likely voice type.
          </Text>
        </Pressable>
      </View>

      {groups.map(({ cat, arts }) => (
        <View key={cat} style={styles.section}>
          <Text style={[styles.eyebrow, { color: colors.textTertiary, fontFamily: Fonts.bodySemibold }]}>
            {catLabel(cat).toUpperCase()}
          </Text>
          <View style={[styles.list, { backgroundColor: colors.bgSurface, borderColor: colors.borderSubtle }]}>
            {arts.map((a, i) => (
              <Pressable
                key={a.slug}
                onPress={() => router.push(`/learn/${a.slug}` as Href)}
                style={[styles.row, i > 0 && { borderTopWidth: 1, borderTopColor: colors.borderSubtle }]}
                accessibilityRole="button"
                accessibilityLabel={a.title}
              >
                <Text style={[styles.rowTitle, { color: colors.textPrimary, fontFamily: Fonts.bodyMedium }]}>
                  {a.title}
                </Text>
                <Text style={[styles.rowChevron, { color: colors.textTertiary, fontFamily: Fonts.mono }]}>›</Text>
              </Pressable>
            ))}
          </View>
        </View>
      ))}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  content: { gap: Spacing.lg, maxWidth: 760, width: "100%", alignSelf: "center" },
  intro: { gap: Spacing.xs },
  h1: { fontSize: Typography["2xl"].size, lineHeight: Typography["2xl"].lineHeight },
  deck: { fontSize: Typography.md.size, lineHeight: Typography.md.lineHeight },
  section: { gap: Spacing.xs },
  eyebrow: { fontSize: Typography.xs.size, lineHeight: Typography.xs.lineHeight, letterSpacing: 0.5 },
  toolCard: { borderWidth: 1, borderRadius: Radii.lg, padding: Spacing.lg, gap: Spacing["2xs"] },
  toolTitle: { fontSize: Typography.xl.size, lineHeight: Typography.xl.lineHeight },
  toolDesc: { fontSize: Typography.base.size, lineHeight: Typography.base.lineHeight },
  list: { borderWidth: 1, borderRadius: Radii.md, overflow: "hidden" },
  row: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    gap: Spacing.sm,
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.sm,
    minHeight: 48,
  },
  rowTitle: { flex: 1, fontSize: Typography.base.size, lineHeight: Typography.md.lineHeight },
  rowChevron: { fontSize: Typography.lg.size },
});
