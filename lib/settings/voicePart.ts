import AsyncStorage from "@react-native-async-storage/async-storage";
import type { VoicePart } from "@/lib/exercises/types";

export const VOICE_PART_STORAGE_KEY = "vocal-training:voice-part:v1";

const VALID_PARTS: readonly VoicePart[] = ["soprano", "alto", "tenor", "baritone"];

/** Returns the persisted voice part, or null if none / invalid / read failed. */
export async function loadVoicePart(): Promise<VoicePart | null> {
  try {
    const raw = await AsyncStorage.getItem(VOICE_PART_STORAGE_KEY);
    if (raw && (VALID_PARTS as readonly string[]).includes(raw)) {
      return raw as VoicePart;
    }
    return null;
  } catch {
    return null;
  }
}

export async function saveVoicePart(part: VoicePart): Promise<void> {
  await AsyncStorage.setItem(VOICE_PART_STORAGE_KEY, part);
}
