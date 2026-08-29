import { StyleSheet } from 'react-native';
import { Colors, Fonts, Radii, Spacing, Typography } from '@/constants/theme';

const c = Colors.light;

// Shared type + surface vocabulary for the course pages (DESIGN.md tokens only).
export const courseStyles = StyleSheet.create({
  page: { backgroundColor: c.bgCanvas },
  content: { paddingVertical: Spacing['2xl'], paddingHorizontal: Spacing.lg },
  col: { width: '100%', maxWidth: 720, alignSelf: 'center', gap: Spacing.md },
  eyebrow: {
    fontFamily: Fonts.bodyMedium,
    fontSize: Typography.xs.size,
    lineHeight: Typography.xs.lineHeight,
    letterSpacing: 0.5,
    textTransform: 'uppercase',
    color: c.textTertiary,
  },
  h1: {
    fontFamily: Fonts.displaySemibold,
    fontSize: Typography['2xl'].size,
    lineHeight: Typography['2xl'].lineHeight,
    color: c.textPrimary,
  },
  h2: {
    fontFamily: Fonts.displayMedium,
    fontSize: Typography.lg.size,
    lineHeight: Typography.lg.lineHeight,
    color: c.textPrimary,
  },
  deck: {
    fontFamily: Fonts.body,
    fontSize: Typography.md.size,
    lineHeight: Typography.md.lineHeight,
    color: c.textSecondary,
  },
  body: {
    fontFamily: Fonts.body,
    fontSize: Typography.base.size,
    lineHeight: Typography.base.lineHeight,
    color: c.textSecondary,
  },
  small: {
    fontFamily: Fonts.body,
    fontSize: Typography.sm.size,
    lineHeight: Typography.sm.lineHeight,
    color: c.textSecondary,
  },
  link: {
    fontFamily: Fonts.bodyMedium,
    fontSize: Typography.sm.size,
    color: c.accent,
  },
  card: {
    backgroundColor: c.bgSurface,
    borderWidth: 1,
    borderColor: c.borderSubtle,
    borderRadius: Radii.md,
    padding: Spacing.md,
    gap: Spacing['2xs'],
  },
  pill: {
    alignSelf: 'flex-start',
    backgroundColor: c.bgSurface,
    borderWidth: 1,
    borderColor: c.borderSubtle,
    borderRadius: Radii.pill,
    paddingHorizontal: Spacing.sm,
    paddingVertical: Spacing['2xs'],
    minHeight: 36,
    justifyContent: 'center',
  },
  pillActive: { backgroundColor: c.accentMuted, borderColor: c.accent },
  pillText: { fontFamily: Fonts.bodySemibold, fontSize: Typography.sm.size, color: c.textPrimary },
  pillTextActive: { color: c.accent },
  primaryBtn: {
    alignSelf: 'flex-start',
    backgroundColor: c.accent,
    borderRadius: Radii.pill,
    paddingHorizontal: Spacing.lg,
    paddingVertical: Spacing.sm,
    minHeight: 44,
    justifyContent: 'center',
  },
  primaryBtnText: { fontFamily: Fonts.bodySemibold, fontSize: Typography.base.size, color: c.bgCanvas },
  dotsRow: { flexDirection: 'row', alignItems: 'center', gap: Spacing['2xs'] },
  dot: { width: Spacing.xs, height: Spacing.xs, borderRadius: Radii.pill, backgroundColor: c.borderStrong },
  dotDone: { backgroundColor: c.accentMuted, borderWidth: 1, borderColor: c.accent },
  dotCurrent: { width: Spacing.lg, backgroundColor: c.accent },
});
