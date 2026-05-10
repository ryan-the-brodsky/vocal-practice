// Data-only assertions — no React hooks (jest env is node, no RNTL setup).
import { Colors, Fonts, Spacing, Typography } from '../theme';

describe('Colors', () => {
  test('light canvas is warm cream', () => {
    expect(Colors.light.canvas).toBe('#f3ede0');
  });

  test('dark canvas is warm dark', () => {
    expect(Colors.dark.canvas).toBe('#1a1612');
  });

  test('back-compat light.text is set', () => {
    expect(typeof Colors.light.text).toBe('string');
  });

  test('back-compat dark.text is set', () => {
    expect(typeof Colors.dark.text).toBe('string');
  });

  test('light accent is burnt amber', () => {
    expect(Colors.light.accent).toBe('#a86a24');
  });

  test('dark accent is lighter amber', () => {
    expect(Colors.dark.accent).toBe('#e09238');
  });
});

describe('Spacing', () => {
  test('lg is 24', () => {
    expect(Spacing.lg).toBe(24);
  });

  test('md is 16', () => {
    expect(Spacing.md).toBe(16);
  });

  test('xs is 8', () => {
    expect(Spacing.xs).toBe(8);
  });
});

describe('Typography', () => {
  test('xl size is 28', () => {
    expect(Typography.xl.size).toBe(28);
  });

  test('base size is 15', () => {
    expect(Typography.base.size).toBe(15);
  });

  test('monoLg size is 22', () => {
    expect(Typography.monoLg.size).toBe(22);
  });
});

describe('Fonts', () => {
  test('display is a non-empty string', () => {
    expect(typeof Fonts.display).toBe('string');
    expect(Fonts.display.length).toBeGreaterThan(0);
  });

  test('body is a non-empty string', () => {
    expect(typeof Fonts.body).toBe('string');
    expect(Fonts.body.length).toBeGreaterThan(0);
  });

  test('mono is a non-empty string', () => {
    expect(typeof Fonts.mono).toBe('string');
    expect(Fonts.mono.length).toBeGreaterThan(0);
  });
});
