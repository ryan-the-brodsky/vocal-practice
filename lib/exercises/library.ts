// Sync API (`exerciseLibrary`, `getExercise`, `exercisesByTag`) returns built-in JSON only.
// Async API (`getAllExercises`, `getExerciseAsync`) merges built-ins with the AsyncStorage user store.
import type { ExerciseDescriptor } from './types';
import { listUserExercises, getUserExercise } from './userStore';

import rossiniLipTrill from '../../data/exercises/rossini-lip-trill.json';
import ngSiren from '../../data/exercises/ng-siren.json';
import fiveNoteScaleMeeMayMah from '../../data/exercises/five-note-scale-mee-may-mah.json';
import descendingFiveToOneNay from '../../data/exercises/descending-five-to-one-nay.json';
import octaveLeapWow from '../../data/exercises/octave-leap-wow.json';
import staccatoArpeggio from '../../data/exercises/staccato-arpeggio.json';
import googOctaveArpeggio from '../../data/exercises/goog-octave-arpeggio.json';
import nay13531 from '../../data/exercises/nay-1-3-5-3-1.json';

export const exerciseLibrary: ExerciseDescriptor[] = [
  rossiniLipTrill as ExerciseDescriptor,
  ngSiren as ExerciseDescriptor,
  fiveNoteScaleMeeMayMah as ExerciseDescriptor,
  descendingFiveToOneNay as ExerciseDescriptor,
  octaveLeapWow as ExerciseDescriptor,
  staccatoArpeggio as ExerciseDescriptor,
  googOctaveArpeggio as ExerciseDescriptor,
  nay13531 as ExerciseDescriptor,
];

export function getExercise(id: string): ExerciseDescriptor | undefined {
  return exerciseLibrary.find((ex) => ex.id === id);
}

export function exercisesByTag(tag: string): ExerciseDescriptor[] {
  return exerciseLibrary.filter((ex) => ex.tags?.includes(tag) ?? false);
}

// Built-ins first for stable ordering; user-imported appended.
export async function getAllExercises(): Promise<ExerciseDescriptor[]> {
  const userItems = await listUserExercises().catch(() => []);
  return [...exerciseLibrary, ...userItems.map((it) => it.descriptor)];
}

export async function getExerciseAsync(
  id: string
): Promise<ExerciseDescriptor | undefined> {
  const builtIn = getExercise(id);
  if (builtIn) return builtIn;
  const stored = await getUserExercise(id).catch(() => undefined);
  return stored?.descriptor;
}
