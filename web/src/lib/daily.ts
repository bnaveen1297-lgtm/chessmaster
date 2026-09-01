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
const dailyKey = (userId?: string | null) => (userId ? `${DAILY_KEY}.${userId}` : DAILY_KEY);

export function dailyDoneToday(userId?: string | null): boolean {
  try {
    return localStorage.getItem(dailyKey(userId)) === todayStr();
  } catch {
    return false;
  }
}
export function markDailyDone(userId?: string | null): void {
  try {
    localStorage.setItem(dailyKey(userId), todayStr());
  } catch {
    /* ignore */
  }
}
