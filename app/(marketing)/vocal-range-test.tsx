import Head from 'expo-router/head';
import { Link } from 'expo-router';
import { ScrollView, StyleSheet, Text, View } from 'react-native';

import { Colors, Fonts, Radii, Spacing, Typography } from '@/constants/theme';
import RangeTesterIsland from '@/components/tools/RangeTesterIsland';
import { SITE, socialMetaTags } from '@/lib/seo/socialMeta';

const c = Colors.light;

const TITLE = 'Free Vocal Range Test — Find Your Range & Voice Type | Vocal Habit';
const DESCRIPTION =
  'Find your vocal range and likely voice type free in your browser. We play notes from middle C and you sing them back — no signup, and your audio stays on your device.';
const URL = `${SITE}/vocal-range-test`;

// ── Content (data-driven so prose is plain JS strings, not JSX text) ──────────
// Science claims fact-checked by adversarial review (voice-science + pedagogy
// lenses). See seo/range-tester-content-sources.md for claim-by-claim verdicts.

const INTRO: string[] = [
  'Your vocal range is the full span between the lowest and highest pitches you can produce. It is one of the first things singers want to know — but on its own it tells you less than people assume.',
  'Range is not the same as your tessitura (the part of your range that feels comfortable and sounds best) and it is not the same as your voice type. Those depend on where your voice likes to sit and how it sounds, not just on the two extreme notes you can squeak out.',
];

interface Section {
  h2: string;
  paras: string[];
}

const SECTIONS: Section[] = [
  {
    h2: 'What a vocal range actually measures',
    paras: [
      'A range measurement captures two points: your lowest sustainable note and your highest, and the distance is usually described in octaves. The number depends heavily on whether you count only comfortable notes or every sound you can make — many people have a comfortable singing range of roughly one and a half to two octaves, while the full range they can technically phonate (strained extremes included) is often wider. And here is the honest part: training reliably grows your usable, dependable range along with your control and dynamics, but the evidence on whether it widens your absolute lowest-to-highest span is mixed, so treat big "add an octave in a week" promises with healthy skepticism.',
      'Two caveats worth keeping in mind. First, the very edges of your range — the lowest grumble and the highest squeak — are rarely notes you would actually perform on; your usable range is narrower than your absolute range. Second, range varies day to day with sleep, hydration, warm-up, and health, so treat any single measurement as a snapshot, not a fixed ceiling.',
    ],
  },
  {
    h2: 'Range vs. voice type — why the test only gets you partway',
    paras: [
      'Voice types (soprano, mezzo, alto, tenor, baritone, bass) overlap heavily, and two singers with nearly identical ranges can be classified differently. Pedagogically, voice type is decided more by tessitura, vocal timbre, and where your passaggio — the register transition, sometimes called "the break" — sits, than by your absolute highest and lowest notes.',
      'That is why this tool tells you the voice type your range is closest to, rather than handing down a verdict. It is a useful starting point, especially if you have never had a teacher place your voice, but a careful in-person assessment looks at more than two numbers.',
    ],
  },
  {
    h2: 'How to expand your vocal range (without forcing it)',
    paras: [
      'Range does respond to training, but the gains come from coordination, not from pushing harder. Straining toward notes above your current ability tends to reinforce the exact tension that limits you, and at worst it risks injury.',
      'A few approaches most teachers would recognize: warm up with semi-occluded vocal tract (SOVT) exercises — straw phonation, lip trills, or humming — which lower the pressure needed to set the vocal folds vibrating (a mechanism studied extensively by voice scientist Ingo Titze) and are a gentle way to explore the edges of your range. Work through the passaggio (the register transition) rather than avoiding it. Exactly how is one of the places teachers genuinely disagree: classical training tends to "cover" with a slightly darker vowel up top, while many contemporary methods favor lightening and balancing the registers earlier. The shared goal is to navigate the transition smoothly instead of slamming into it.',
      'To extend the top, most approaches build head voice and a coordinated "mix" rather than dragging chest weight upward; to extend the bottom, aim for clean vocal-fold closure without pressing. Vowel modification helps too — subtly reshaping vowels as you ascend keeps a vocal-tract resonance aligned with your rising pitch — but the exact adjustment depends on the sound you want and the method you follow, so treat any single "EE becomes IH" rule as one school\'s recipe rather than a universal law (belting, in particular, often does the opposite and keeps vowels brighter).',
      'Most of all, range expansion is slow and cumulative. Short, frequent, well-warmed practice beats occasional marathon sessions, and progress is measured in weeks and months, not single sittings.',
    ],
  },
];

interface VoiceRow {
  type: string;
  range: string;
  note: string;
}

// Approximate classical/choral conventions — overlap between types is the rule,
// not the exception, and several boundaries are debated (see content-sources doc).
const VOICE_TABLE: VoiceRow[] = [
  { type: 'Soprano', range: 'C4 – C6', note: 'Highest voice (treble)' },
  { type: 'Mezzo-soprano', range: 'A3 – A5', note: 'Between soprano and alto' },
  { type: 'Alto / Contralto', range: 'E3 – F5', note: 'Lowest typical treble voice' },
  { type: 'Tenor', range: 'C3 – C5', note: 'Highest typical male voice' },
  { type: 'Baritone', range: 'A2 – A4', note: 'Most common male voice' },
  { type: 'Bass', range: 'E2 – E4', note: 'Lowest voice (often extends below)' },
];

interface HowStep {
  name: string;
  text: string;
}

const HOW_IT_WORKS: HowStep[] = [
  {
    name: 'Allow microphone access',
    text: 'Allow microphone access when your browser asks — nothing is recorded or uploaded; the audio is analyzed on your device.',
  },
  {
    name: 'Match the note',
    text: 'Starting from middle C, the tool plays a note on the piano. Sing it back and hold it steady for about a second, and it steps down a half step to the next note.',
  },
  {
    name: 'Tap out at your limit',
    text: 'When a note is too low to reach, tap “Too low.” The tool then walks upward from middle C the same way until you tap “Too high.” That span is your range, plus the voice type it is closest to.',
  },
];

interface Faq {
  q: string;
  a: string;
}

const FAQ: Faq[] = [
  {
    q: 'What is my vocal range?',
    a: 'It is the span from the lowest to the highest note you can sing, usually written as two note names (for example C3 – C5) and often described in octaves. This tool measures it by playing notes from middle C and asking you to sing each one back, stepping down then up until you reach your limits.',
  },
  {
    q: 'Do I need to read music or have perfect pitch?',
    a: 'No. The tool plays each note out loud first, so you always have a pitch to copy rather than having to find your lowest or highest note on your own. When a note is out of reach, you simply tap to say so — no music theory required.',
  },
  {
    q: 'What voice type am I?',
    a: 'Your range gives a strong hint, but voice type also depends on your tessitura (where your voice sits comfortably), your timbre, and where your register transitions fall. This test tells you the type your range is closest to; a teacher can refine it in person.',
  },
  {
    q: 'Can I change my vocal range?',
    a: 'Yes, with training — most singers can extend their usable range over time, especially upward through head-voice and mix development and downward through cleaner cord closure. The gains are gradual and come from better coordination, not from forcing high or low notes.',
  },
  {
    q: 'How accurate is an online vocal range test?',
    a: 'It is a good orientation tool. The main limitation is at the extremes: pitch-detection can occasionally misread very low or very high notes by an octave, and your absolute edge notes are usually not ones you would perform. Hold each note steadily and retest on another day for a more reliable picture.',
  },
  {
    q: 'Is a bigger range better?',
    a: 'Not necessarily. A wide range is useful, but control, tone, and a comfortable, expressive tessitura matter far more for real singing than owning a few extra notes at the top or bottom.',
  },
];

const faqJsonLd = {
  '@context': 'https://schema.org',
  '@type': 'FAQPage',
  mainEntity: FAQ.map((f) => ({
    '@type': 'Question',
    name: f.q,
    acceptedAnswer: { '@type': 'Answer', text: f.a },
  })),
};

const appJsonLd = {
  '@context': 'https://schema.org',
  '@type': 'SoftwareApplication',
  name: 'Vocal Habit — Vocal Range Test',
  applicationCategory: 'MultimediaApplication',
  operatingSystem: 'Web',
  url: URL,
  offers: { '@type': 'Offer', price: '0', priceCurrency: 'USD' },
};

const howToJsonLd = {
  '@context': 'https://schema.org',
  '@type': 'HowTo',
  name: 'How to test your vocal range',
  step: HOW_IT_WORKS.map((s, i) => ({
    '@type': 'HowToStep',
    position: i + 1,
    name: s.name,
    text: s.text,
  })),
};

// Real, verifiable references surfaced and checked during adversarial review.
const SOURCES: string[] = [
  'Titze, I.R. — “Major Benefits of Semi-Occluded Vocal Tract Exercises,” National Center for Voice and Speech (vocology.utah.edu).',
  'Stachler, R.J. et al. — “Clinical Practice Guideline: Hoarseness (Dysphonia) (Update),” American Academy of Otolaryngology–Head and Neck Surgery, 2018 (the four-week evaluation threshold).',
  'Sundberg, J. — “The Science of the Singing Voice,” 1987 (range, tessitura, formant tuning, the passaggio).',
  'Maxfield, L. & colleagues — “Evidence-Based Voice Pedagogy,” NATS / Journal of Singing (practice and training principles).',
];

export default function VocalRangeTestPage() {
  return (
    <>
      <Head>
        <title>{TITLE}</title>
        <meta name="description" content={DESCRIPTION} />
        <link rel="canonical" href={URL} />
        {socialMetaTags({ title: TITLE, description: DESCRIPTION, url: URL })}
        <script type="application/ld+json">{JSON.stringify(appJsonLd)}</script>
        <script type="application/ld+json">{JSON.stringify(howToJsonLd)}</script>
        <script type="application/ld+json">{JSON.stringify(faqJsonLd)}</script>
      </Head>

      <ScrollView style={styles.page} contentContainerStyle={styles.content}>
        <View style={styles.col}>
          <Text style={styles.h1}>Vocal Range Test</Text>
          <Text style={styles.deck}>
            We play a note, you sing it back — stepping down from middle C and then up — to find your
            range and likely voice type. Free, no signup, and your audio never leaves your device.
          </Text>

          <View style={styles.tool}>
            <RangeTesterIsland />
          </View>

          {INTRO.map((p, i) => (
            <Text key={`intro-${i}`} style={styles.p}>
              {p}
            </Text>
          ))}

          <Text style={styles.h2}>How the test works</Text>
          {HOW_IT_WORKS.map((s, i) => (
            <Text key={`how-${i}`} style={styles.li}>
              {i + 1}. {s.text}
            </Text>
          ))}

          {SECTIONS.map((sec) => (
            <View key={sec.h2}>
              <Text style={styles.h2}>{sec.h2}</Text>
              {sec.paras.map((p, i) => (
                <Text key={i} style={styles.p}>
                  {p}
                </Text>
              ))}
            </View>
          ))}

          <Text style={styles.h2}>Voice types and their typical ranges</Text>
          <Text style={styles.p}>
            These are rough classical and choral conventions, included for orientation. Contemporary
            (CCM) singing uses these labels much more loosely, real voices overlap heavily across the
            categories, and several boundaries are genuinely debated — so treat this as a map, not a
            label.
          </Text>
          <View style={styles.table}>
            <View style={[styles.tr, styles.trHead]}>
              <Text style={[styles.th, styles.colType]}>Voice type</Text>
              <Text style={[styles.th, styles.colRange]}>Typical range</Text>
              <Text style={[styles.th, styles.colNote]}>Notes</Text>
            </View>
            {VOICE_TABLE.map((row) => (
              <View key={row.type} style={styles.tr}>
                <Text style={[styles.tdType, styles.colType]}>{row.type}</Text>
                <Text style={[styles.tdMono, styles.colRange]}>{row.range}</Text>
                <Text style={[styles.td, styles.colNote]}>{row.note}</Text>
              </View>
            ))}
          </View>

          <Text style={styles.h2}>Frequently asked questions</Text>
          {FAQ.map((f) => (
            <View key={f.q} style={styles.faqItem}>
              <Text style={styles.faqQ}>{f.q}</Text>
              <Text style={styles.p}>{f.a}</Text>
            </View>
          ))}

          <View style={styles.cta}>
            <Text style={styles.ctaTitle}>Found your range? Put it to work.</Text>
            <Text style={styles.p}>
              Vocal Habit builds daily warm-ups around your voice, with pitch detection and scoring so
              you can hear yourself improve.
            </Text>
            <Link href="/" style={styles.ctaLink}>
              Start practicing — free →
            </Link>
          </View>

          <Link href="/learn/" style={styles.relatedLink}>
            New to singing? Read our free guides →
          </Link>

          <Text style={styles.h2}>Sources &amp; further reading</Text>
          <Text style={styles.p}>
            The guidance on this page was fact-checked against voice-science and pedagogy sources,
            including:
          </Text>
          {SOURCES.map((s, i) => (
            <Text key={`src-${i}`} style={styles.source}>
              • {s}
            </Text>
          ))}

          <Text style={styles.disclaimer}>
            This page is educational and not medical advice. If you have pain, vocal strain, or
            hoarseness that lasts more than about four weeks, see a doctor or laryngologist — and
            sooner if you rely on your voice, since persistent hoarseness can warrant earlier
            evaluation.
          </Text>
        </View>
      </ScrollView>
    </>
  );
}

const styles = StyleSheet.create({
  page: { backgroundColor: c.bgCanvas },
  content: { paddingVertical: Spacing['2xl'], paddingHorizontal: Spacing.lg },
  col: { width: '100%', maxWidth: 720, alignSelf: 'center', gap: Spacing.md },
  h1: {
    fontFamily: Fonts.displaySemibold,
    fontSize: Typography['2xl'].size,
    lineHeight: Typography['2xl'].lineHeight,
    color: c.textPrimary,
  },
  deck: {
    fontFamily: Fonts.body,
    fontSize: Typography.md.size,
    lineHeight: Typography.md.lineHeight,
    color: c.textSecondary,
  },
  tool: { marginVertical: Spacing.md },
  h2: {
    fontFamily: Fonts.displayMedium,
    fontSize: Typography.xl.size,
    lineHeight: Typography.xl.lineHeight,
    color: c.textPrimary,
    marginTop: Spacing.lg,
  },
  p: {
    fontFamily: Fonts.body,
    fontSize: Typography.base.size,
    lineHeight: Typography.base.lineHeight,
    color: c.textPrimary,
  },
  li: {
    fontFamily: Fonts.body,
    fontSize: Typography.base.size,
    lineHeight: Typography.base.lineHeight,
    color: c.textPrimary,
  },
  table: {
    borderWidth: 1,
    borderColor: c.borderSubtle,
    borderRadius: Radii.md,
    overflow: 'hidden',
  },
  tr: { flexDirection: 'row', borderTopWidth: 1, borderTopColor: c.borderSubtle },
  trHead: { borderTopWidth: 0, backgroundColor: c.bgSurface },
  th: {
    fontFamily: Fonts.bodyMedium,
    fontSize: Typography.sm.size,
    color: c.textSecondary,
    padding: Spacing.sm,
  },
  td: { fontFamily: Fonts.body, fontSize: Typography.sm.size, color: c.textPrimary, padding: Spacing.sm },
  tdType: {
    fontFamily: Fonts.bodySemibold,
    fontSize: Typography.sm.size,
    color: c.textPrimary,
    padding: Spacing.sm,
  },
  tdMono: { fontFamily: Fonts.mono, fontSize: Typography.monoBase.size, color: c.accent, padding: Spacing.sm },
  colType: { flex: 1.2 },
  colRange: { flex: 1 },
  colNote: { flex: 1.6 },
  faqItem: { gap: Spacing.xs, marginTop: Spacing.xs },
  faqQ: {
    fontFamily: Fonts.bodySemibold,
    fontSize: Typography.md.size,
    lineHeight: Typography.md.lineHeight,
    color: c.textPrimary,
  },
  cta: {
    backgroundColor: c.bgEmphasis,
    borderRadius: Radii.lg,
    padding: Spacing.lg,
    gap: Spacing.sm,
    marginTop: Spacing.xl,
  },
  ctaTitle: {
    fontFamily: Fonts.displaySemibold,
    fontSize: Typography.xl.size,
    lineHeight: Typography.xl.lineHeight,
    color: c.textOnEmphasis,
  },
  ctaLink: {
    fontFamily: Fonts.bodySemibold,
    fontSize: Typography.md.size,
    color: c.accentOnEmphasis,
    marginTop: Spacing.xs,
  },
  source: {
    fontFamily: Fonts.body,
    fontSize: Typography.sm.size,
    lineHeight: Typography.sm.lineHeight,
    color: c.textSecondary,
  },
  relatedLink: {
    fontFamily: Fonts.bodySemibold,
    fontSize: Typography.md.size,
    color: c.accent,
    marginTop: Spacing.lg,
  },
  disclaimer: {
    fontFamily: Fonts.body,
    fontSize: Typography.sm.size,
    lineHeight: Typography.sm.lineHeight,
    color: c.textTertiary,
    marginTop: Spacing.xl,
  },
});
