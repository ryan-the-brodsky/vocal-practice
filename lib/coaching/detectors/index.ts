import { globalFlat } from "./globalFlat";
import { globalSharp } from "./globalSharp";
import { highNoteFlat } from "./highNoteFlat";
import { highNoteSharp } from "./highNoteSharp";
import { keyFatigueDrift } from "./keyFatigueDrift";
import { lowNoteFlat } from "./lowNoteFlat";
import { phraseEndFlat } from "./phraseEndFlat";
import { positionConsistent } from "./positionConsistent";
import { registerMismatch } from "./registerMismatch";
import type { Detector } from "./types";

export const DETECTORS: Detector[] = [
  globalSharp,
  globalFlat,
  highNoteFlat,
  highNoteSharp,
  lowNoteFlat,
  registerMismatch,
  phraseEndFlat,
  positionConsistent,
  keyFatigueDrift,
];

export type { Detector } from "./types";
