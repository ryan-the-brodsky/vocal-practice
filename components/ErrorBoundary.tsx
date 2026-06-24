// Top-level error boundary — catches render errors and shows a recovery card
// instead of a white screen. Web-only interactive features (reload, clipboard)
// are guarded against SSR and native environments.
import React from 'react';
import { Platform, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';

import { Colors, Fonts, Radii, Spacing, Typography } from '@/constants/theme';

const C = Colors.light;

interface Props {
  children: React.ReactNode;
}

interface State {
  error: Error | null;
  copied: boolean;
}

export default class ErrorBoundary extends React.Component<Props, State> {
  state: State = { error: null, copied: false };

  static getDerivedStateFromError(error: Error): Partial<State> {
    return { error };
  }

  componentDidCatch(error: Error, info: React.ErrorInfo): void {
    // Log to console so dev tooling still captures it.
    console.error('[ErrorBoundary]', error, info.componentStack);
  }

  private handleReload = (): void => {
    if (typeof window !== 'undefined') {
      window.location.reload();
    }
  };

  private handleCopy = async (): Promise<void> => {
    const { error } = this.state;
    if (!error) return;
    const text = `${error.message}\n\n${error.stack ?? ''}`.trim();
    if (typeof navigator !== 'undefined' && navigator.clipboard?.writeText) {
      await navigator.clipboard.writeText(text);
      this.setState({ copied: true });
      // Reset label after 2 s so it doesn't stay "Copied" forever.
      setTimeout(() => this.setState({ copied: false }), 2000);
    }
  };

  override render(): React.ReactNode {
    const { error, copied } = this.state;

    if (!error) return this.props.children;

    const isWeb = Platform.OS === 'web';

    return (
      <ScrollView contentContainerStyle={styles.canvas}>
        <View style={styles.card}>
          <Text style={styles.headline}>Something hiccuped</Text>
          <Text style={styles.body}>
            The app hit an unexpected error. Your saved data is safe.
          </Text>

          {/* Error detail block — JetBrains Mono, emphasis panel per DESIGN.md */}
          <View style={styles.codeBlock}>
            <Text style={styles.codeText} selectable>
              {error.message}
            </Text>
          </View>

          <View style={styles.actions}>
            {/* Primary: Reload — web only (no meaningful native equivalent) */}
            {isWeb && (
              <Pressable
                accessibilityRole="button"
                accessibilityLabel="Reload the app"
                onPress={this.handleReload}
                style={({ pressed }) => [
                  styles.primaryBtn,
                  pressed && styles.primaryBtnPressed,
                ]}
              >
                <Text style={styles.primaryBtnLabel}>Reload</Text>
              </Pressable>
            )}

            {/* Ghost: Copy details — clipboard API is web-only */}
            {isWeb && (
              <Pressable
                accessibilityRole="button"
                accessibilityLabel="Copy error details to clipboard"
                onPress={this.handleCopy}
                style={({ pressed }) => [
                  styles.ghostBtn,
                  pressed && styles.ghostBtnPressed,
                ]}
              >
                <Text style={styles.ghostBtnLabel}>
                  {copied ? 'Copied' : 'Copy details'}
                </Text>
              </Pressable>
            )}
          </View>
        </View>
      </ScrollView>
    );
  }
}

const styles = StyleSheet.create({
  canvas: {
    flexGrow: 1,
    backgroundColor: C.bgCanvas,
    alignItems: 'center',
    justifyContent: 'center',
    padding: Spacing.lg,
  },
  card: {
    width: '100%',
    maxWidth: 480,
    backgroundColor: C.bgSurface,
    borderRadius: Radii.md,
    borderWidth: 1,
    borderColor: C.borderSubtle,
    padding: Spacing.lg,
    gap: Spacing.md,
    // Lift the card slightly off the canvas.
    ...Platform.select({
      web: { boxShadow: '0 2px 8px rgba(29, 19, 10, 0.10)' } as object,
      default: {
        shadowColor: C.textPrimary,
        shadowOpacity: 0.10,
        shadowRadius: 8,
        shadowOffset: { width: 0, height: 2 },
        elevation: 3,
      },
    }),
  },
  headline: {
    fontSize: Typography.xl.size,
    lineHeight: Typography.xl.lineHeight,
    fontFamily: Fonts.display,
    color: C.textPrimary,
  },
  body: {
    fontSize: Typography.base.size,
    lineHeight: Typography.base.lineHeight,
    fontFamily: Fonts.body,
    color: C.textSecondary,
  },
  // Error-detail block: emphasis panel per DESIGN.md (code/data terminal role).
  codeBlock: {
    backgroundColor: C.bgEmphasis,
    borderRadius: Radii.sm,
    padding: Spacing.sm,
  },
  codeText: {
    fontSize: Typography.monoBase.size,
    lineHeight: Typography.monoBase.lineHeight,
    fontFamily: Fonts.mono,
    color: C.textOnEmphasis,
  },
  actions: {
    flexDirection: 'row',
    gap: Spacing.sm,
    flexWrap: 'wrap',
  },
  // Primary button — amber fill (DESIGN.md Primary variant)
  primaryBtn: {
    backgroundColor: C.accent,
    borderRadius: Radii.md,
    paddingVertical: Spacing.sm,
    paddingHorizontal: Spacing.md,
    alignItems: 'center',
    justifyContent: 'center',
  },
  primaryBtnPressed: {
    backgroundColor: C.accentHover,
  },
  primaryBtnLabel: {
    fontSize: Typography.base.size,
    lineHeight: Typography.base.lineHeight,
    fontFamily: Fonts.bodyMedium,
    color: C.bgCanvas,
  },
  // Ghost button — transparent, secondary text (DESIGN.md Ghost variant)
  ghostBtn: {
    backgroundColor: 'transparent',
    borderRadius: Radii.md,
    paddingVertical: Spacing.sm,
    paddingHorizontal: Spacing.md,
    alignItems: 'center',
    justifyContent: 'center',
  },
  ghostBtnPressed: {
    backgroundColor: C.accentMuted,
  },
  ghostBtnLabel: {
    fontSize: Typography.base.size,
    lineHeight: Typography.base.lineHeight,
    fontFamily: Fonts.bodyMedium,
    color: C.textSecondary,
  },
});
