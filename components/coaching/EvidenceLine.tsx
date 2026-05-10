import { Text } from "react-native";

import { useTheme } from "@/hooks/use-theme";
import { Fonts, Typography } from "@/constants/theme";

export interface EvidenceLineProps {
  evidenceText: string;
}

// Used to split on cents tokens; capturing group keeps delimiters in the result array.
const CENTS_SPLIT = /([+\-−]?\d+(?:\.\d+)?¢)/g;
// Non-global for per-part testing (avoids stateful lastIndex on a single regex).
const CENTS_TEST = /^[+\-−]?\d+(?:\.\d+)?¢$/;

export default function EvidenceLine({ evidenceText }: EvidenceLineProps) {
  const { colors } = useTheme();

  const parts = evidenceText.split(CENTS_SPLIT);

  return (
    <Text
      style={{
        fontSize: Typography.sm.size,
        lineHeight: Typography.sm.lineHeight,
        fontFamily: Fonts.body,
        color: colors.textSecondary,
      }}
    >
      {parts.map((part, i) =>
        CENTS_TEST.test(part) ? (
          <Text
            key={i}
            style={{
              fontSize: Typography.monoBase.size,
              lineHeight: Typography.monoBase.lineHeight,
              fontFamily: Fonts.mono,
              color: colors.textPrimary,
            }}
          >
            {part}
          </Text>
        ) : (
          part
        ),
      )}
    </Text>
  );
}
