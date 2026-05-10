import { useCallback, useEffect, useState } from "react";
import { ScrollView, Text, View } from "react-native";

import {
  deleteSavedCoaching,
  listSavedCoaching,
  type SavedCoaching,
} from "@/lib/coaching";
import SavedTipRow from "./SavedTipRow";
import { useTheme } from "@/hooks/use-theme";
import { Fonts, Spacing, Typography } from "@/constants/theme";

export default function SavedTipsList() {
  const { colors } = useTheme();
  const [items, setItems] = useState<SavedCoaching[] | null>(null);

  const reload = useCallback(async () => {
    try {
      const list = await listSavedCoaching();
      setItems(list);
    } catch {
      setItems([]);
    }
  }, []);

  useEffect(() => {
    void reload();
  }, [reload]);

  const handleDelete = useCallback(
    async (id: string) => {
      await deleteSavedCoaching(id).catch(() => {});
      await reload();
    },
    [reload],
  );

  if (items === null) {
    return (
      <View style={{ flex: 1, padding: Spacing.xl, alignItems: "center", justifyContent: "center" }}>
        <Text
          style={{
            fontSize: Typography.base.size,
            lineHeight: Typography.base.lineHeight,
            fontFamily: Fonts.body,
            color: colors.textTertiary,
          }}
        >
          Loading…
        </Text>
      </View>
    );
  }

  if (items.length === 0) {
    return (
      <View
        style={{
          flex: 1,
          padding: Spacing.xl,
          alignItems: "center",
          justifyContent: "center",
          gap: Spacing.xs,
        }}
      >
        <Text
          style={{
            fontSize: Typography.lg.size,
            lineHeight: Typography.lg.lineHeight,
            fontFamily: Fonts.display,
            color: colors.textPrimary,
          }}
        >
          No saved tips yet
        </Text>
        <Text
          style={{
            fontSize: Typography.base.size,
            lineHeight: Typography.base.lineHeight,
            fontFamily: Fonts.body,
            color: colors.textTertiary,
            textAlign: "center",
          }}
        >
          Bookmark a coaching tip to keep it here.
        </Text>
      </View>
    );
  }

  return (
    <ScrollView
      contentContainerStyle={{
        padding: Spacing.lg,
        gap: Spacing.xs,
        paddingBottom: Spacing["3xl"],
      }}
    >
      {items.map((rec) => (
        <SavedTipRow key={rec.id} record={rec} onDelete={handleDelete} />
      ))}
    </ScrollView>
  );
}
