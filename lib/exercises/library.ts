// Sync API (`exerciseLibrary`, `getExercise`, `exercisesByTag`) returns built-in JSON only.
// Async API (`getAllExercises`, `getExerciseAsync`) merges built-ins with the AsyncStorage user store
// AND expands stored songs into one synthetic chunk descriptor per chunk.
import type { ExerciseDescriptor } from './types';
import { listUserExercises, getUserExercise } from './userStore';
import { listSongs, getSong } from '../songs/store';
import { chunkToDescriptor } from '../songs/toDescriptor';
import { parseChunkId } from '../songs/types';

import rossiniLipTrill from '../../data/exercises/rossini-lip-trill.json';
import ngSiren from '../../data/exercises/ng-siren.json';
import fiveNoteScaleMeeMayMah from '../../data/exercises/five-note-scale-mee-may-mah.json';
import descendingFiveToOneNay from '../../data/exercises/descending-five-to-one-nay.json';
import octaveLeapWow from '../../data/exercises/octave-leap-wow.json';
import staccatoArpeggio from '../../data/exercises/staccato-arpeggio.json';
import googOctaveArpeggio from '../../data/exercises/goog-octave-arpeggio.json';
import nay13531 from '../../data/exercises/nay-1-3-5-3-1.json';
import headVoiceVwohm from '../../data/exercises/head-voice-vwohm.json';
import bubMixVoice from '../../data/exercises/bub-mix-voice.json';

export const exerciseLibrary: ExerciseDescriptor[] = [
  rossiniLipTrill as ExerciseDescriptor,
  ngSiren as ExerciseDescriptor,
  fiveNoteScaleMeeMayMah as ExerciseDescriptor,
  descendingFiveToOneNay as ExerciseDescriptor,
  octaveLeapWow as ExerciseDescriptor,
  staccatoArpeggio as ExerciseDescriptor,
  googOctaveArpeggio as ExerciseDescriptor,
  nay13531 as ExerciseDescriptor,
  headVoiceVwohm as ExerciseDescriptor,
  bubMixVoice as ExerciseDescriptor,
];

export function getExercise(id: string): ExerciseDescriptor | undefined {
  return exerciseLibrary.find((ex) => ex.id === id);
}

export function exercisesByTag(tag: string): ExerciseDescriptor[] {
  return exerciseLibrary.filter((ex) => ex.tags?.includes(tag) ?? false);
}

// Built-in exercises as {id,label} for routine pickers (onboarding + Progress
// editor) — one source of truth so the two selectable lists can't drift.
export function routineBuiltinItems(): { id: string; label: string }[] {
  return exerciseLibrary.map((ex) => ({ id: ex.id, label: ex.name }));
}

// Built-ins first, then user exercises, then song chunks (grouped by song, in chunk order).
export async function getAllExercises(): Promise<ExerciseDescriptor[]> {
  const [userItems, songs] = await Promise.all([
    listUserExercises().catch(() => []),
    listSongs().catch(() => []),
  ]);
  const songChunks = songs.flatMap((s) => s.chunks.map((c) => chunkToDescriptor(s, c)));
  return [
    ...exerciseLibrary,
    ...userItems.map((it) => it.descriptor),
    ...songChunks,
  ];
}

export async function getExerciseAsync(
  id: string,
): Promise<ExerciseDescriptor | undefined> {
  const builtIn = getExercise(id);
  if (builtIn) return builtIn;
  const parsed = parseChunkId(id);
  if (parsed) {
    const song = await getSong(parsed.songId).catch(() => undefined);
    const chunk = song?.chunks.find((c) => c.id === parsed.chunkId);
    if (song && chunk) return chunkToDescriptor(song, chunk);
    return undefined;
  }
  const stored = await getUserExercise(id).catch(() => undefined);
  return stored?.descriptor;
}
