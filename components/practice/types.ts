export type Tone = "good" | "warn" | "bad" | "idle";

export interface Coaching {
  text: string;
  tone: Tone;
  cents: number | null;
  pegged: boolean;
}
