import AsyncStorage from "@react-native-async-storage/async-storage";

export const TEMPO_STORAGE_KEY = "vocal-training:tempo-scale:v1";

/** Speed multipliers offered by the tempo control, slowest → fastest.
 *  A multiplier (not an absolute bpm) because every exercise carries its own
 *  pedagogically-chosen tempo — "20% slower" transfers across all of them. */
export const TEMPO_SCALES = [0.6, 0.7, 0.8, 0.9, 1, 1.1, 1.2, 1.3, 1.4] as const;

export const DEFAULT_TEMPO_SCALE = 1;

/** Absolute guard rails so a fast descriptor scaled up (or a slow one scaled
 *  down) can't land somewhere unsingable. The ceiling is set by pitch
 *  detection, not by taste: agility-run is 8th notes at 144, so 176 already
 *  means ~0.17 s per note — near the floor where align.ts can still find a
 *  stable segment. Raising it silently wrecks scoring on the fast drills. */
export const MIN_BPM = 40;
export const MAX_BPM = 176;

/** Nearest offered multiplier. Non-finite input falls back to normal speed. */
export function snapTempoScale(value: number): number {
  if (!Number.isFinite(value)) return DEFAULT_TEMPO_SCALE;
  let best: number = TEMPO_SCALES[0];
  let bestDist = Math.abs(value - best);
  for (const s of TEMPO_SCALES) {
    const d = Math.abs(value - s);
    if (d < bestDist) {
      best = s;
      bestDist = d;
    }
  }
  return best;
}

/** One notch faster (+1) or slower (−1); clamps at the ends. */
export function stepTempoScale(value: number, direction: 1 | -1): number {
  const idx = TEMPO_SCALES.indexOf(snapTempoScale(value) as (typeof TEMPO_SCALES)[number]);
  const next = Math.min(TEMPO_SCALES.length - 1, Math.max(0, idx + direction));
  return TEMPO_SCALES[next];
}

/** The bpm the engine should actually run at, rounded and clamped. */
export function effectiveBpm(baseTempo: number, scale: number): number {
  if (!Number.isFinite(baseTempo) || baseTempo <= 0) return baseTempo;
  const raw = Math.round(baseTempo * snapTempoScale(scale));
  return Math.min(MAX_BPM, Math.max(MIN_BPM, raw));
}

/** "Normal" / "20% slower" / "10% faster" — words, not just a number. */
export function tempoScaleLabel(scale: number): string {
  const s = snapTempoScale(scale);
  if (s === DEFAULT_TEMPO_SCALE) return "Normal";
  const pct = Math.round(Math.abs(s - 1) * 100);
  return s < 1 ? `${pct}% slower` : `${pct}% faster`;
}

/** Same wording, but measured against the bpm that survives the guard rails —
 *  so a notch that hits the ceiling reports the speed you actually get. */
export function appliedTempoLabel(baseTempo: number, scale: number): string {
  if (!Number.isFinite(baseTempo) || baseTempo <= 0) return tempoScaleLabel(scale);
  const pct = Math.round((effectiveBpm(baseTempo, scale) / baseTempo - 1) * 100);
  if (pct === 0) return "Normal";
  return pct < 0 ? `${-pct}% slower` : `${pct}% faster`;
}

/** The next notch in `direction` that actually changes the bpm, or null if none
 *  does. Once the guard rails bite, several notches resolve to the same bpm —
 *  stepping one at a time would move the thumb and change nothing, and treating
 *  the first no-op as "spent" would strand the user at the top of the scale. */
export function nextDistinctTempoScale(
  baseTempo: number,
  scale: number,
  direction: 1 | -1,
): number | null {
  const from = snapTempoScale(scale);
  const bpm = effectiveBpm(baseTempo, from);
  let cursor = from;
  for (;;) {
    const next = stepTempoScale(cursor, direction);
    if (next === cursor) return null; // end of the scale
    if (effectiveBpm(baseTempo, next) !== bpm) return next;
    cursor = next;
  }
}

/** Position of a multiplier along the track, 0 (slowest) → 1 (fastest). */
export function fractionForTempoScale(scale: number): number {
  const idx = TEMPO_SCALES.indexOf(snapTempoScale(scale) as (typeof TEMPO_SCALES)[number]);
  return idx / (TEMPO_SCALES.length - 1);
}

/** Inverse of `fractionForTempoScale` — drag position → nearest notch. */
export function tempoScaleFromFraction(fraction: number): number {
  if (!Number.isFinite(fraction)) return DEFAULT_TEMPO_SCALE;
  const clamped = Math.min(1, Math.max(0, fraction));
  return TEMPO_SCALES[Math.round(clamped * (TEMPO_SCALES.length - 1))];
}

/** Persisted multiplier, or the default if unset / unparseable / read failed. */
export async function loadTempoScale(): Promise<number> {
  try {
    const raw = await AsyncStorage.getItem(TEMPO_STORAGE_KEY);
    if (raw == null) return DEFAULT_TEMPO_SCALE;
    const parsed = Number.parseFloat(raw);
    return Number.isFinite(parsed) ? snapTempoScale(parsed) : DEFAULT_TEMPO_SCALE;
  } catch {
    return DEFAULT_TEMPO_SCALE;
  }
}

export async function saveTempoScale(scale: number): Promise<void> {
  await AsyncStorage.setItem(TEMPO_STORAGE_KEY, String(snapTempoScale(scale)));
}
