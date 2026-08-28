import { createContext, useCallback, useContext, useEffect, useMemo, useState, type ReactNode } from 'react';
import { supabase, isSupabaseConfigured } from '@/lib/supabase';
import { useAuth } from '@/auth/AuthProvider';

export type Progress = {
  xp: number;
  streakDays: number;
  lastActiveDate: string;
  puzzlesSolved: number;
  gamesPlayed: number;
  gamesWon: number;
  dailyGoal: number;
  solvedToday: number;
  goalDate: string;
  achievements: string[];
  lessonsCompleted: string[];
};

export const XP_PER_LEVEL = 100;
export const XP_PUZZLE = 20;
export const XP_WIN = 40;
export const XP_PLAY = 10;
export const XP_LESSON = 15;

export type Achievement = { id: string; title: string; icon: string; test: (p: Progress) => boolean };
export const ACHIEVEMENTS: Achievement[] = [
  { id: 'first_puzzle', title: 'First Solve', icon: '✦', test: (p) => p.puzzlesSolved >= 1 },
  { id: 'ten_puzzles', title: 'Tactician', icon: '◆', test: (p) => p.puzzlesSolved >= 10 },
  { id: 'fifty_puzzles', title: 'Puzzle Hunter', icon: '❖', test: (p) => p.puzzlesSolved >= 50 },
  { id: 'first_win', title: 'First Win', icon: '♔', test: (p) => p.gamesWon >= 1 },
  { id: 'streak_3', title: '3-Day Streak', icon: '▲', test: (p) => p.streakDays >= 3 },
  { id: 'streak_7', title: 'Week Warrior', icon: '★', test: (p) => p.streakDays >= 7 },
  { id: 'level_5', title: 'Rising Star', icon: '☆', test: (p) => levelFromXp(p.xp) >= 5 },
  { id: 'first_lesson', title: 'Student', icon: '♟', test: (p) => (p.lessonsCompleted?.length ?? 0) >= 1 },
  { id: 'scholar', title: 'Scholar', icon: '♞', test: (p) => (p.lessonsCompleted?.length ?? 0) >= 20 },
  { id: 'graduate', title: 'Graduate', icon: '♚', test: (p) => (p.lessonsCompleted?.length ?? 0) >= 40 },
];

export function levelFromXp(xp: number): number {
  return Math.floor(xp / XP_PER_LEVEL) + 1;
}
export function xpIntoLevel(xp: number): number {
  return xp % XP_PER_LEVEL;
}

function todayStr(): string {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
}
function isYesterday(dateStr: string): boolean {
  const d = new Date();
  d.setDate(d.getDate() - 1);
  return dateStr === `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
}

const DEFAULT: Progress = {
  xp: 0, streakDays: 0, lastActiveDate: '', puzzlesSolved: 0, gamesPlayed: 0, gamesWon: 0,
  dailyGoal: 3, solvedToday: 0, goalDate: '', achievements: [], lessonsCompleted: [],
};

const STORAGE_KEY = 'chessmaster.progress';

type Ctx = {
  progress: Progress;
  level: number;
  awardPuzzleSolved: () => void;
  awardGameResult: (won: boolean) => void;
  markLessonComplete: (id: string) => void;
  newlyEarned: string | null;
  clearNewlyEarned: () => void;
};
const ProgressContext = createContext<Ctx | undefined>(undefined);

function readLocal(): Progress {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (raw) return { ...DEFAULT, ...JSON.parse(raw) };
  } catch {
    /* ignore */
  }
  return DEFAULT;
}

function fromRow(row: any): Omit<Progress, 'lessonsCompleted'> {
  return {
    xp: row.xp ?? 0, streakDays: row.streak_days ?? 0, lastActiveDate: row.last_active_date ?? '',
    puzzlesSolved: row.puzzles_solved ?? 0, gamesPlayed: row.games_played ?? 0, gamesWon: row.games_won ?? 0,
    dailyGoal: row.daily_goal ?? 3, solvedToday: row.solved_today ?? 0, goalDate: row.goal_date ?? '',
    achievements: row.achievements ?? [],
  };
}
function toRow(p: Progress, userId: string) {
  return {
    user_id: userId, xp: p.xp, streak_days: p.streakDays, last_active_date: p.lastActiveDate || null,
    puzzles_solved: p.puzzlesSolved, games_played: p.gamesPlayed, games_won: p.gamesWon,
    daily_goal: p.dailyGoal, solved_today: p.solvedToday, goal_date: p.goalDate || null,
    achievements: p.achievements, updated_at: new Date().toISOString(),
  };
}

export function ProgressProvider({ children }: { children: ReactNode }) {
  const [progress, setProgress] = useState<Progress>(readLocal);
  const [newlyEarned, setNewlyEarned] = useState<string | null>(null);
  const { user } = useAuth();

  useEffect(() => {
    if (!(isSupabaseConfigured && supabase && user)) return;
    supabase.from('progress').select('*').eq('user_id', user.id).maybeSingle().then(({ data }) => {
      if (data) setProgress((prev) => ({ ...fromRow(data), lessonsCompleted: prev.lessonsCompleted }));
    });
  }, [user?.id]);

  const save = useCallback(
    (next: Progress) => {
      try {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(next));
      } catch {
        /* ignore */
      }
      if (isSupabaseConfigured && supabase && user) supabase.from('progress').upsert(toRow(next, user.id)).then(() => {});
    },
    [user?.id],
  );

  const withDaily = (p: Progress): Progress => {
    const today = todayStr();
    let streakDays = p.streakDays;
    if (p.lastActiveDate !== today) streakDays = isYesterday(p.lastActiveDate) ? p.streakDays + 1 : 1;
    return { ...p, streakDays, lastActiveDate: today, solvedToday: p.goalDate !== today ? 0 : p.solvedToday, goalDate: today };
  };
  const applyAchievements = (p: Progress): Progress => {
    const earned = [...p.achievements];
    let latest: string | null = null;
    for (const a of ACHIEVEMENTS) if (!earned.includes(a.id) && a.test(p)) { earned.push(a.id); latest = a.id; }
    if (latest) setNewlyEarned(latest);
    return { ...p, achievements: earned };
  };

  const awardPuzzleSolved = useCallback(() => {
    setProgress((prev) => {
      let n = withDaily(prev);
      n = { ...n, xp: n.xp + XP_PUZZLE, puzzlesSolved: n.puzzlesSolved + 1, solvedToday: n.solvedToday + 1 };
      n = applyAchievements(n); save(n); return n;
    });
  }, [save]);
  const awardGameResult = useCallback((won: boolean) => {
    setProgress((prev) => {
      let n = withDaily(prev);
      n = { ...n, xp: n.xp + (won ? XP_WIN : XP_PLAY), gamesPlayed: n.gamesPlayed + 1, gamesWon: n.gamesWon + (won ? 1 : 0) };
      n = applyAchievements(n); save(n); return n;
    });
  }, [save]);
  const markLessonComplete = useCallback((id: string) => {
    setProgress((prev) => {
      const done = prev.lessonsCompleted ?? [];
      if (done.includes(id)) return prev;
      let n = withDaily(prev);
      n = { ...n, lessonsCompleted: [...done, id], xp: n.xp + XP_LESSON };
      n = applyAchievements(n); save(n); return n;
    });
  }, [save]);

  const value = useMemo<Ctx>(
    () => ({
      progress, level: levelFromXp(progress.xp), awardPuzzleSolved, awardGameResult, markLessonComplete,
      newlyEarned, clearNewlyEarned: () => setNewlyEarned(null),
    }),
    [progress, newlyEarned, awardPuzzleSolved, awardGameResult, markLessonComplete],
  );
  return <ProgressContext.Provider value={value}>{children}</ProgressContext.Provider>;
}

export function useProgress(): Ctx {
  const ctx = useContext(ProgressContext);
  if (!ctx) throw new Error('useProgress must be used within ProgressProvider');
  return ctx;
}
