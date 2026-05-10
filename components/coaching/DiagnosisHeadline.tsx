import { Text, View } from "react-native";

import { useTheme } from "@/hooks/use-theme";
import { Fonts, Spacing, Typography } from "@/constants/theme";

export interface DiagnosisHeadlineProps {
  headline: string;
}

export default function DiagnosisHeadline({ headline }: DiagnosisHeadlineProps) {
  const { colors } = useTheme();
  return (
    <View style={{ gap: Spacing["2xs"] }}>
      <Text
        style={{
          fontSize: Typography.xl.size,
          lineHeight: Typography.xl.lineHeight,
          fontFamily: Fonts.display,
          color: colors.textPrimary,
        }}
      >
        {headline}
      </Text>
    </View>
  );
}
