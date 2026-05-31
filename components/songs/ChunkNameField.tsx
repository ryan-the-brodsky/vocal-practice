// Single-line text input for renaming a chunk. Commits on blur or Enter.

import { Fonts, Radii, Spacing, Typography } from "@/constants/theme";
import { useTheme } from "@/hooks/use-theme";
import { useEffect, useState } from "react";
import { StyleSheet, TextInput, View } from "react-native";

export default function ChunkNameField({
  value,
  onChange,
  placeholder,
}: {
  value: string;
  onChange: (next: string) => void;
  placeholder?: string;
}) {
  const { colors } = useTheme();
  const [draft, setDraft] = useState(value);

  // Keep the draft in sync if the source value changes externally (e.g.
  // boundary edits don't touch the name, but a stable-id reuse might).
  useEffect(() => {
    setDraft(value);
  }, [value]);

  function commit() {
    const next = draft.trim() || value;
    if (next !== value) onChange(next);
  }

  return (
    <View style={[styles.wrap, { backgroundColor: colors.bgSurface, borderRadius: Radii.sm, borderColor: colors.borderSubtle }]}>
      <TextInput
        style={[styles.input, {
          color: colors.textPrimary,
          fontFamily: Fonts.bodyMedium,
          fontSize: Typography.sm.size,
          lineHeight: Typography.sm.lineHeight,
          paddingHorizontal: Spacing.sm,
          paddingVertical: Spacing.xs,
        }]}
        value={draft}
        onChangeText={setDraft}
        onBlur={commit}
        onSubmitEditing={commit}
        placeholder={placeholder ?? "Segment name"}
        placeholderTextColor={colors.textTertiary}
        returnKeyType="done"
      />
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: { borderWidth: 1 },
  input: { minHeight: 36 },
});
