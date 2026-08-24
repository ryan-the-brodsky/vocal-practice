import type { FinishContext, PracticeContext } from './practiceCounters';

export type { FinishContext, PracticeContext };

// Native ships no analytics (see index.native.ts). First-time shapes keep the
// call sites platform-free.
export function recordPracticeStart(): PracticeContext {
  return { practiceNumber: 1, hasPracticedBefore: false };
}

export function readPracticeContext(): PracticeContext {
  return { practiceNumber: 1, hasPracticedBefore: false };
}

export function recordFinish(): FinishContext {
  return { finishNumber: 1, hasFinishedBefore: false };
}
