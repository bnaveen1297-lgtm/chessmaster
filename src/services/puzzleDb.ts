import { supabase, isSupabaseConfigured } from './supabase';
import { rowToPuzzle, dailyToPuzzle } from './lichessPuzzle';
import { fetchRandomPuzzle } from './puzzleApi';
import type { Puzzle } from '../data/puzzles';

/**
 * Puzzle sourcing with graceful degradation:
 *   1. the Supabase puzzle database (millions of Lichess puzzles) when loaded,
 *   2. else the live free APIs (Chess.com / Lichess),
 *   3. else the bundled offline set (handled inside fetchRandomPuzzle).
 * Plus the Lichess daily puzzle.
 */

export type PuzzleFilter = { minRating?: number; maxRating?: number; theme?: string };

export function puzzleDbAvailable(): boolean {
  return isSupabaseConfigured && !!supabase;
}

/** A random puzzle from the Supabase database (throws if unavailable/empty). */
export async function fetchRandomFromDb(f?: PuzzleFilter): Promise<Puzzle> {
  if (!supabase) throw new Error('Puzzle database not configured.');
  const { data, error } = await supabase.rpc('random_puzzle', {
    min_rating: f?.minRating ?? 0,
    max_rating: f?.maxRating ?? 4000,
    want_theme: f?.theme ?? null,
  });
  if (error) throw error;
  const row = Array.isArray(data) ? data[0] : data;
  if (!row) throw new Error('No puzzles matched.');
  const p = rowToPuzzle({ id: row.id, fen: row.fen, moves: row.moves, rating: row.rating, themes: row.themes, gameUrl: row.game_url });
  if (!p) throw new Error('Could not read that puzzle.');
  return p;
}

/** Best available next puzzle: database → live APIs → bundled. */
export async function fetchNextPuzzle(f?: PuzzleFilter): Promise<Puzzle> {
  if (puzzleDbAvailable()) {
    try {
      return await fetchRandomFromDb(f);
    } catch {
      /* fall through to the API/bundled source */
    }
  }
  return fetchRandomPuzzle();
}

/** The Lichess daily puzzle (same for everyone, changes each day). */
export async function fetchDailyPuzzle(): Promise<Puzzle> {
  const res = await fetch('https://lichess.org/api/puzzle/daily', { headers: { Accept: 'application/json' } });
  if (!res.ok) throw new Error('Could not load the daily puzzle.');
  const j: any = await res.json();
  const p = dailyToPuzzle({
    id: j?.puzzle?.id ?? 'daily',
    pgn: j?.game?.pgn ?? '',
    initialPly: j?.puzzle?.initialPly ?? 0,
    solutionUci: j?.puzzle?.solution ?? [],
    rating: j?.puzzle?.rating,
    themes: j?.puzzle?.themes,
  });
  if (!p) throw new Error('Could not read the daily puzzle.');
  return p;
}
