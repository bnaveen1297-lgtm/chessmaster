import React, { createContext, useContext, useEffect, useMemo, useState, useCallback } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { supabase, isSupabaseConfigured } from '../services/supabase';
import { useAuth } from '../auth/AuthContext';

/**
 * Gamification state — XP, levels, daily streak, a daily goal, lifetime stats,
 * and achievements. Persisted per-device via AsyncStorage. When the backend
 * lands, this syncs to the account; the UI reads it through useProgress().
 */

export type Progress = {
  xp: number;
  streakDays: number;
  lastActiveDate: string; // YYYY-MM-DD
  puzzlesSolved: number;
  gamesPlayed: number;
  gamesWon: number;
  dailyGoal: number;
  solvedToday: number;
  goalDate: string; // YYYY-MM-DD the solvedToday counter belongs to
  achievements: string[];
};

export const XP_PER_LEVEL = 100;
export const XP_PUZZLE = 20;
export const XP_WIN = 40;
export const XP_PLAY = 10;

export type Achievement = { id: string; title: string; emoji: string; test: (p: Progress) => boolean };

export const ACHIEVEMENTS: Achievement[] = [
  { id: 'first_puzzle', title: 'First Solve', emoji: '🧩', test: (p) => p.puzzlesSolved >= 1 },
  { id: 'ten_puzzles', title: 'Tactician', emoji: '🎯', test: (p) => p.puzzlesSolved >= 10 },
  { id: 'fifty_puzzles', title: 'Puzzle Hunter', emoji: '🏹', test: (p) => p.puzzlesSolved >= 50 },
  { id: 'first_win', title: 'First Win', emoji: '🏆', test: (p) => p.gamesWon >= 1 },
  { id: 'streak_3', title: '3-Day Streak', emoji: '🔥', test: (p) => p.streakDays >= 3 },
  { id: 'streak_7', title: 'Week Warrior', emoji: '⚡', test: (p) => p.streakDays >= 7 },
  { id: 'level_5', title: 'Rising Star', emoji: '⭐', test: (p) => levelFromXp(p.xp) >= 5 },
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
  const y = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
  return dateStr === y;
}

const DEFAULT: Progress = {
  xp: 0,
  streakDays: 0,
  lastActiveDate: '',
  puzzlesSolved: 0,
  gamesPlayed: 0,
  gamesWon: 0,
  dailyGoal: 3,
  solvedToday: 0,
  goalDate: '',
  achievements: [],
};

type Ctx = {
  progress: Progress;
  level: number;
  awardPuzzleSolved: () => void;
  awardGameResult: (won: boolean) => void;
  newlyEarned: string | null;
  clearNewlyEarned: () => void;
};

const STORAGE_KEY = 'chessmaster.progress';
const ProgressContext = createContext<Ctx | undefined>(undefined);

function fromRow(row: any): Progress {
  return {
    xp: row.xp ?? 0,
    streakDays: row.streak_days ?? 0,
    lastActiveDate: row.last_active_date ?? '',
    puzzlesSolved: row.puzzles_solved ?? 0,
    gamesPlayed: row.games_played ?? 0,
    gamesWon: row.games_won ?? 0,
    dailyGoal: row.daily_goal ?? 3,
    solvedToday: row.solved_today ?? 0,
    goalDate: row.goal_date ?? '',
    achievements: row.achievements ?? [],
  };
}
function toRow(p: Progress, userId: string) {
  return {
    user_id: userId,
    xp: p.xp,
    streak_days: p.streakDays,
    last_active_date: p.lastActiveDate || null,
    puzzles_solved: p.puzzlesSolved,
    games_played: p.gamesPlayed,
    games_won: p.gamesWon,
    daily_goal: p.dailyGoal,
    solved_today: p.solvedToday,
    goal_date: p.goalDate || null,
    achievements: p.achievements,
    updated_at: new Date().toISOString(),
  };
}

export function ProgressProvider({ children }: { children: React.ReactNode }) {
  const [progress, setProgress] = useState<Progress>(DEFAULT);
  const [newlyEarned, setNewlyEarned] = useState<string | null>(null);
  const { user } = useAuth();

  useEffect(() => {
    (async () => {
      try {
        const raw = await AsyncStorage.getItem(STORAGE_KEY);
        if (raw) setProgress({ ...DEFAULT, ...JSON.parse(raw) });
      } catch {
        // ignore
      }
    })();
  }, []);

  // When signed in with a backend, load cloud progress (source of truth).
  useEffect(() => {
    if (!(isSupabaseConfigured && supabase && user)) return;
    supabase
      .from('progress')
      .select('*')
      .eq('user_id', user.id)
      .maybeSingle()
      .then(({ data }) => {
        if (data) setProgress(fromRow(data));
      });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user?.id]);

  const save = useCallback(
    (next: Progress) => {
      AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(next)).catch(() => {});
      if (isSupabaseConfigured && supabase && user) {
        supabase.from('progress').upsert(toRow(next, user.id)).then(() => {});
      }
    },
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [user?.id],
  );

  /** Apply daily streak + goal rollover, returning an updated draft. */
  const withDaily = (p: Progress): Progress => {
    const today = todayStr();
    let streakDays = p.streakDays;
    if (p.lastActiveDate !== today) {
      streakDays = isYesterday(p.lastActiveDate) ? p.streakDays + 1 : 1;
    }
    const goalReset = p.goalDate !== today;
    return {
      ...p,
      streakDays,
      lastActiveDate: today,
      solvedToday: goalReset ? 0 : p.solvedToday,
      goalDate: today,
    };
  };

  const applyAchievements = (p: Progress): Progress => {
    const earned = [...p.achievements];
    let latest: string | null = null;
    for (const a of ACHIEVEMENTS) {
      if (!earned.includes(a.id) && a.test(p)) {
        earned.push(a.id);
        latest = a.id;
      }
    }
    if (latest) setNewlyEarned(latest);
    return { ...p, achievements: earned };
  };

  const awardPuzzleSolved = useCallback(() => {
    setProgress((prev) => {
      let next = withDaily(prev);
      next = { ...next, xp: next.xp + XP_PUZZLE, puzzlesSolved: next.puzzlesSolved + 1, solvedToday: next.solvedToday + 1 };
      next = applyAchievements(next);
      save(next);
      return next;
    });
  }, [save]);

  const awardGameResult = useCallback((won: boolean) => {
    setProgress((prev) => {
      let next = withDaily(prev);
      next = {
        ...next,
        xp: next.xp + (won ? XP_WIN : XP_PLAY),
        gamesPlayed: next.gamesPlayed + 1,
        gamesWon: next.gamesWon + (won ? 1 : 0),
      };
      next = applyAchievements(next);
      save(next);
      return next;
    });
  }, [save]);

  const value = useMemo<Ctx>(
    () => ({
      progress,
      level: levelFromXp(progress.xp),
      awardPuzzleSolved,
      awardGameResult,
      newlyEarned,
      clearNewlyEarned: () => setNewlyEarned(null),
    }),
    [progress, newlyEarned, awardPuzzleSolved, awardGameResult],
  );

  return <ProgressContext.Provider value={value}>{children}</ProgressContext.Provider>;
}

export function useProgress(): Ctx {
  const ctx = useContext(ProgressContext);
  if (!ctx) throw new Error('useProgress must be used within a ProgressProvider');
  return ctx;
}
