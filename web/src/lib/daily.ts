import { puzzles, type Puzzle } from '@shared/data/puzzles';

/** Days since the Unix epoch (UTC) — a stable per-day index. */
export function dayIndex(d = new Date()): number {
  return Math.floor(Date.UTC(d.getFullYear(), d.getMonth(), d.getDate()) / 86_400_000);
}

export function todayStr(d = new Date()): string {
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
}

/** The Daily Puzzle — the same for everyone on a given day. */
export function dailyPuzzle(d = new Date()): Puzzle {
  return puzzles[dayIndex(d) % puzzles.length];
}

const DAILY_KEY = 'chessmaster.dailyDone';

export function dailyDoneToday(): boolean {
  try {
    return localStorage.getItem(DAILY_KEY) === todayStr();
  } catch {
    return false;
  }
}
export function markDailyDone(): void {
  try {
    localStorage.setItem(DAILY_KEY, todayStr());
  } catch {
    /* ignore */
  }
}
