// COMPONENT TEST: components/learn/__tests__/MarkdownView.test.tsx
import { Fragment } from 'react';
import { Linking, StyleSheet, Text, View } from 'react-native';

import { Colors, Fonts, Radii, Spacing, Typography } from '@/constants/theme';

const c = Colors.light;

// Minimal Markdown renderer for the Learn articles. Covers exactly what the
// generated content uses: # / ## / ### headings, paragraphs, - and 1. lists,
// > blockquotes, and inline **bold**, *italic*, [text](url). No tables/code.
// Renders synchronously (SSG-safe) with DESIGN.md tokens.

type Block =
  | { kind: 'h1' | 'h2' | 'h3' | 'p' | 'quote'; text: string }
  | { kind: 'ul' | 'ol'; items: string[] };

function parse(md: string): Block[] {
  const lines = md.replace(/\r\n/g, '\n').split('\n');
  const blocks: Block[] = [];
  let i = 0;
  while (i < lines.length) {
    const line = lines[i];
    if (!line.trim()) { i++; continue; }
    if (/^### /.test(line)) { blocks.push({ kind: 'h3', text: line.slice(4) }); i++; continue; }
    if (/^## /.test(line)) { blocks.push({ kind: 'h2', text: line.slice(3) }); i++; continue; }
    if (/^# /.test(line)) { blocks.push({ kind: 'h1', text: line.slice(2) }); i++; continue; }
    if (/^>\s?/.test(line)) {
      const buf: string[] = [];
      while (i < lines.length && /^>\s?/.test(lines[i])) { buf.push(lines[i].replace(/^>\s?/, '')); i++; }
      blocks.push({ kind: 'quote', text: buf.join(' ') });
      continue;
    }
    if (/^[-*] /.test(line)) {
      const items: string[] = [];
      while (i < lines.length && /^[-*] /.test(lines[i])) { items.push(lines[i].slice(2)); i++; }
      blocks.push({ kind: 'ul', items });
      continue;
    }
    if (/^\d+\.\s/.test(line)) {
      const items: string[] = [];
      while (i < lines.length && /^\d+\.\s/.test(lines[i])) { items.push(lines[i].replace(/^\d+\.\s/, '')); i++; }
      blocks.push({ kind: 'ol', items });
      continue;
    }
    // paragraph: gather consecutive non-blank, non-special lines
    const buf: string[] = [];
    while (
      i < lines.length && lines[i].trim() &&
      !/^(#{1,3} |>\s?|[-*] |\d+\.\s)/.test(lines[i])
    ) { buf.push(lines[i]); i++; }
    blocks.push({ kind: 'p', text: buf.join(' ') });
  }
  return blocks;
}

const INLINE = /(\[[^\]]+\]\([^)]+\))|(\*\*[^*]+\*\*)|(\*[^*]+\*)/g;

function Inline({ text }: { text: string }) {
  const out: React.ReactNode[] = [];
  let last = 0;
  let m: RegExpExecArray | null;
  INLINE.lastIndex = 0;
  let key = 0;
  while ((m = INLINE.exec(text)) !== null) {
    if (m.index > last) out.push(<Fragment key={key++}>{text.slice(last, m.index)}</Fragment>);
    const tok = m[0];
    if (tok.startsWith('[')) {
      const lm = tok.match(/^\[([^\]]+)\]\(([^)]+)\)$/)!;
      const [, label, url] = lm;
      out.push(
        <Text key={key++} style={styles.link} accessibilityRole="link" onPress={() => Linking.openURL(url)}>
          {label}
        </Text>,
      );
    } else if (tok.startsWith('**')) {
      out.push(<Text key={key++} style={styles.bold}>{tok.slice(2, -2)}</Text>);
    } else {
      out.push(<Text key={key++} style={styles.italic}>{tok.slice(1, -1)}</Text>);
    }
    last = m.index + tok.length;
  }
  if (last < text.length) out.push(<Fragment key={key++}>{text.slice(last)}</Fragment>);
  return <>{out}</>;
}

export default function MarkdownView({ content }: { content: string }) {
  const blocks = parse(content);
  return (
    <View style={styles.root}>
      {blocks.map((b, idx) => {
        switch (b.kind) {
          case 'h1':
            return <Text key={idx} accessibilityRole="header" style={styles.h1}><Inline text={b.text} /></Text>;
          case 'h2':
            return <Text key={idx} accessibilityRole="header" style={styles.h2}><Inline text={b.text} /></Text>;
          case 'h3':
            return <Text key={idx} accessibilityRole="header" style={styles.h3}><Inline text={b.text} /></Text>;
          case 'p':
            return <Text key={idx} style={styles.p}><Inline text={b.text} /></Text>;
          case 'quote':
            return (
              <View key={idx} style={styles.quote}>
                <Text style={styles.quoteText}><Inline text={b.text} /></Text>
              </View>
            );
          case 'ul':
          case 'ol':
            return (
              <View key={idx} style={styles.list}>
                {b.items.map((it, j) => (
                  <View key={j} style={styles.li}>
                    <Text style={styles.bullet}>{b.kind === 'ol' ? `${j + 1}.` : '•'}</Text>
                    <Text style={styles.liText}><Inline text={it} /></Text>
                  </View>
                ))}
              </View>
            );
        }
      })}
    </View>
  );
}

const styles = StyleSheet.create({
  root: { gap: Spacing.md },
  h1: {
    fontFamily: Fonts.displaySemibold,
    fontSize: Typography['2xl'].size,
    lineHeight: Typography['2xl'].lineHeight,
    color: c.textPrimary,
  },
  h2: {
    fontFamily: Fonts.displayMedium,
    fontSize: Typography.xl.size,
    lineHeight: Typography.xl.lineHeight,
    color: c.textPrimary,
    marginTop: Spacing.lg,
  },
  h3: {
    fontFamily: Fonts.bodySemibold,
    fontSize: Typography.lg.size,
    lineHeight: Typography.lg.lineHeight,
    color: c.textPrimary,
    marginTop: Spacing.sm,
  },
  p: {
    fontFamily: Fonts.body,
    fontSize: Typography.base.size,
    lineHeight: Typography.base.lineHeight,
    color: c.textPrimary,
  },
  bold: { fontFamily: Fonts.bodySemibold },
  italic: { fontStyle: 'italic' },
  link: { color: c.accent, textDecorationLine: 'underline' },
  quote: {
    borderLeftWidth: 3,
    borderLeftColor: c.accent,
    paddingLeft: Spacing.md,
    paddingVertical: Spacing.xs,
    backgroundColor: c.bgSurface,
    borderRadius: Radii.sm,
  },
  quoteText: {
    fontFamily: Fonts.body,
    fontSize: Typography.base.size,
    lineHeight: Typography.base.lineHeight,
    color: c.textSecondary,
    fontStyle: 'italic',
  },
  list: { gap: Spacing.xs },
  li: { flexDirection: 'row', gap: Spacing.xs, alignItems: 'flex-start' },
  bullet: {
    fontFamily: Fonts.body,
    fontSize: Typography.base.size,
    lineHeight: Typography.base.lineHeight,
    color: c.textTertiary,
    minWidth: 18,
  },
  liText: {
    flex: 1,
    fontFamily: Fonts.body,
    fontSize: Typography.base.size,
    lineHeight: Typography.base.lineHeight,
    color: c.textPrimary,
  },
});
