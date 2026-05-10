import { useState } from "react";
import { Pressable, Text, View } from "react-native";

import type { AdviceCard } from "@/lib/coaching";
import CauseCard from "./CauseCard";
import { useTheme } from "@/hooks/use-theme";
import { Fonts, Spacing, Typography } from "@/constants/theme";

export interface CauseCardListProps {
  cards: AdviceCard[];
  defaultExpandedCount?: number;
}

export default function CauseCardList({ cards, defaultExpandedCount = 2 }: CauseCardListProps) {
  const { colors } = useTheme();
  const [showRest, setShowRest] = useState(false);
  if (cards.length === 0) return null;
  const visible = showRest ? cards : cards.slice(0, defaultExpandedCount);
  const hidden = cards.length - visible.length;
  return (
    <View style={{ gap: Spacing.xs }}>
      {visible.map((card) => (
        <CauseCard key={card.id} card={card} />
      ))}
      {hidden > 0 && (
        <Pressable
          onPress={() => setShowRest(true)}
          style={{ paddingVertical: Spacing.sm, alignItems: "center" }}
          accessibilityRole="button"
          accessibilityLabel={`Show ${hidden} more possible causes`}
        >
          <Text
            style={{
              fontSize: Typography.sm.size,
              lineHeight: Typography.sm.lineHeight,
              fontFamily: Fonts.bodyMedium,
              color: colors.accent,
            }}
          >
            Other possibilities ({hidden})
          </Text>
        </Pressable>
      )}
    </View>
  );
}
