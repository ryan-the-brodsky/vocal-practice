import type { Diagnosis, SessionInput } from "../engine/types";

export type Detector = (input: SessionInput) => Diagnosis[];
