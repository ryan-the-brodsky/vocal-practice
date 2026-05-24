import AsyncStorage from "@react-native-async-storage/async-storage";

export const OCTAVE_SHIFT_STORAGE_KEY = "vocal-training:octave-shift:v1";

const VALID_SHIFTS: readonly number[] = [0, -1];

/** Returns the persisted octave shift (octaves transposed from notated), or null if none / invalid / read failed. */
export async function loadOctaveShift(): Promise<number | null> {
  try {
    const raw = await AsyncStorage.getItem(OCTAVE_SHIFT_STORAGE_KEY);
    if (raw === null) return null;
    const n = Number(raw);
    return VALID_SHIFTS.includes(n) ? n : null;
  } catch {
    return null;
  }
}

export async function saveOctaveShift(shift: number): Promise<void> {
  await AsyncStorage.setItem(OCTAVE_SHIFT_STORAGE_KEY, String(shift));
}
