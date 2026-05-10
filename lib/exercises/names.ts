// Static exercise name map — keeps the Progress screen free of JSON imports.
export const EXERCISE_NAMES: Record<string, string> = {
  "rossini-lip-trill": "Rossini Lip Trill",
  "ng-siren": "Ng Siren",
  "five-note-scale-mee-may-mah": "Five-Note Scale: Mee May Mah",
  "descending-five-to-one-nay": "Descending 5-to-1 on Nay",
  "octave-leap-wow": "Octave Leap on Wow",
  "staccato-arpeggio": "Staccato Arpeggio",
  "goog-octave-arpeggio": "Goog Octave Arpeggio",
  "nay-1-3-5-3-1": "Nay 1-3-5-3-1",
};

export function exerciseName(id: string): string {
  return EXERCISE_NAMES[id] ?? id;
}
