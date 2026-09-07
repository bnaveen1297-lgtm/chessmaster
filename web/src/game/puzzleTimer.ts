import type { PuzzleDifficulty } from '@shared/data/puzzles';

/** Target solving time (seconds) by difficulty — used for the on-board timer. */
export function timeForDifficulty(diff: PuzzleDifficulty): number {
  return diff === 'Beginner' ? 60 : diff === 'Intermediate' ? 90 : 120;
}

/** Tighter per-puzzle limit for the graded exam, keyed off the puzzle's rating. */
export function examTimeForRating(rating: number): number {
  if (rating < 1300) return 45;
  if (rating < 1900) return 60;
  return 75;
}

export function fmtSeconds(sec: number): string {
  const s = Math.max(0, Math.ceil(sec));
  return `${Math.floor(s / 60)}:${String(s % 60).padStart(2, '0')}`;
}
