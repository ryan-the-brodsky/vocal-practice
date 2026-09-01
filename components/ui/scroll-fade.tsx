import { View } from 'react-native';

// A "there's more below" cue for long scroll regions.
//
// Web scroll containers here use OS overlay scrollbars (expo-router's
// ScrollViewStyleReset makes the document itself unscrollable, so only the
// inner RNW div scrolls), and those are invisible at rest on macOS and on every
// touch device. A list whose last visible card ends near the fold therefore
// looks like the end of the page. This paints a short fade over the bottom edge
// and hides it once the user reaches the end.
//
// Built from stacked Views rather than a gradient so it needs no new dependency
// and behaves the same on native.
const STEPS = 8;

export default function ScrollFade({
  color,
  visible,
  height = 56,
}: {
  /** Should match the surface behind the list, e.g. colors.canvas. */
  color: string;
  visible: boolean;
  height?: number;
}) {
  if (!visible) return null;
  return (
    <View
      pointerEvents="none"
      accessibilityElementsHidden
      importantForAccessibility="no-hide-descendants"
      style={{ position: 'absolute', left: 0, right: 0, bottom: 0, height }}
    >
      {Array.from({ length: STEPS }, (_, i) => (
        <View
          key={i}
          style={{
            flex: 1,
            backgroundColor: color,
            // Eased so the top of the fade stays subtle instead of banding.
            opacity: ((i + 1) / STEPS) ** 2,
          }}
        />
      ))}
    </View>
  );
}

/** True when a scroll event is within `slack` px of the bottom. */
export function isAtScrollEnd(
  e: { nativeEvent: { contentOffset: { y: number }; contentSize: { height: number }; layoutMeasurement: { height: number } } },
  slack = 24,
): boolean {
  const { contentOffset, contentSize, layoutMeasurement } = e.nativeEvent;
  return contentOffset.y + layoutMeasurement.height >= contentSize.height - slack;
}
