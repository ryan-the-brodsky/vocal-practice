// Capability taxonomy — what each exercise builds. Grounded in the CCM
// deep-research report (EXERCISE_TAXONOMY_RESEARCH.md): SOVT (Titze), onset/
// adduction, resonance/vowel tuning, mix as a graded TA continuum (Kochis-
// Jennings), passaggio as an acoustic event (Bozeman), agility. Ordered
// foundation -> advanced for display. No mastery-gating — these are labels +
// grouping, not locked progressions.

export type Capability =
  | "warmup-sovt"
  | "onset"
  | "resonance"
  | "chest-voice"
  | "mix"
  | "head-voice"
  | "agility"
  | "dynamics"
  | "vibrato"
  | "style";

export interface CapabilityMeta {
  id: Capability;
  /** Short group label for the selection page. */
  label: string;
  /** One-line "what this builds" shown under the group / on each exercise. */
  blurb: string;
  /** Display order, foundation -> advanced. */
  order: number;
  /** Acknowledged technique with no trusted exercises yet — shown as "coming
   *  soon" on the browse so the vocabulary is complete without faking content. */
  comingSoon?: boolean;
}

export const CAPABILITIES: readonly CapabilityMeta[] = [
  {
    id: "warmup-sovt",
    label: "Warm-Up & SOVT",
    blurb: "Gentle semi-occluded sounds — lip trills, sirens — that wake the voice up and bridge registers with minimal effort. Start here.",
    order: 1,
  },
  {
    id: "onset",
    label: "Onset & Clarity",
    blurb: "Clean, balanced vocal-fold contact so notes start crisply — the foundation of clear tone.",
    order: 2,
  },
  {
    id: "resonance",
    label: "Resonance & Vowels",
    blurb: "Tune your vowels for a consistent, ringing tone across the whole scale.",
    order: 3,
  },
  {
    id: "chest-voice",
    label: "Chest Voice",
    blurb: "Build a strong, connected chest register — full, grounded low notes that carry without pushing.",
    order: 4,
  },
  {
    id: "mix",
    label: "Mix & Registration",
    blurb: "Blend chest and head into one connected voice through the bridge — no flip, no strain.",
    order: 5,
  },
  {
    id: "head-voice",
    label: "Head Voice",
    blurb: "Free and strengthen your upper register, and bridge into it smoothly without flipping or straining.",
    order: 6,
  },
  {
    id: "agility",
    label: "Agility & Runs",
    blurb: "Fast, accurate scales and arpeggios that build the control behind runs and riffs.",
    order: 7,
  },
  {
    id: "dynamics",
    label: "Dynamics & Control",
    blurb: "Swell and soften on a held note — messa di voce and volume control for expressive phrasing.",
    order: 8,
  },
  {
    id: "vibrato",
    label: "Vibrato",
    blurb: "Free up an even, natural vibrato — and the control to turn it on and off at will.",
    order: 9,
  },
  {
    id: "style",
    label: "Belt & Style",
    blurb: "Twang, belt, and riff-and-run coordination for contemporary and theatrical singing.",
    order: 10,
  },
];

/** Capabilities that currently have no trusted exercises (browse shows "coming soon"). */
export function isComingSoon(id: Capability): boolean {
  return capabilityMeta(id)?.comingSoon === true;
}

const BY_ID: Record<Capability, CapabilityMeta> = CAPABILITIES.reduce(
  (acc, c) => {
    acc[c.id] = c;
    return acc;
  },
  {} as Record<Capability, CapabilityMeta>,
);

export function capabilityMeta(id: Capability | undefined): CapabilityMeta | null {
  return id ? BY_ID[id] ?? null : null;
}

export function isCapability(value: string): value is Capability {
  return value in BY_ID;
}
