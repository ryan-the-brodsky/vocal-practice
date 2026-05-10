import AsyncStorage from "@react-native-async-storage/async-storage";
import { ADVICE_CARDS } from "./library/cards";
import type { AdviceCard } from "./engine/types";

const ROTATION_KEY = "vocal-training:coaching:rotation:v1";

function genericCardsSorted(): AdviceCard[] {
  return ADVICE_CARDS.filter((c) => c.kind === "generic").sort((a, b) =>
    a.id.localeCompare(b.id),
  );
}

export async function pickNextGenericTip(): Promise<AdviceCard> {
  const cards = genericCardsSorted();
  if (cards.length === 0) {
    // Defensive: a non-generic card is preferable to crashing the empty state.
    return ADVICE_CARDS[0];
  }
  let lastId: string | null = null;
  try {
    lastId = await AsyncStorage.getItem(ROTATION_KEY);
  } catch {
    // ignore
  }
  let nextIdx = 0;
  if (lastId) {
    const lastIdx = cards.findIndex((c) => c.id === lastId);
    nextIdx = lastIdx === -1 ? 0 : (lastIdx + 1) % cards.length;
  }
  const next = cards[nextIdx];
  try {
    await AsyncStorage.setItem(ROTATION_KEY, next.id);
  } catch {
    // ignore
  }
  return next;
}
