import { Fonts, Spacing, Typography } from "@/constants/theme";
import { StyleSheet, Text, View } from "react-native";
import { useTheme } from "@/hooks/use-theme";

export default function Section({
  title,
  children,
}: {
  title: string;
  children: React.ReactNode;
}) {
  const { colors } = useTheme();
  return (
    <View style={styles.section}>
      <Text style={[styles.h2, { color: colors.textTertiary }]}>{title}</Text>
      {children}
    </View>
  );
}

const styles = StyleSheet.create({
  section: { gap: Spacing["2xs"] },
  h2: {
    fontSize: Typography.xs.size,
    lineHeight: Typography.xs.lineHeight,
    fontFamily: Fonts.bodySemibold,
    textTransform: "uppercase",
    letterSpacing: 1,
    marginBottom: Spacing.xs,
  },
});
