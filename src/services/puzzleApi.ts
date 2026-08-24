import { Chess } from 'chess.js';
import { puzzles, type Puzzle } from '../data/puzzles';

/**
 * Unlimited puzzles from free public APIs.
 *
 * Chess.com's random-puzzle endpoint (no auth, no key) returns a fresh puzzle
 * each call — effectively millions. Lichess's daily puzzle is a fallback. Both
 * are parsed into our Puzzle shape via chess.js. If the network fails (or the
 * host is unreachable), we fall back to a random bundled puzzle so the feature
 * never breaks offline.
 *
 * Note: these hosts may be blocked in some sandboxes but work on real devices.
 * To scale to the full multi-million Lichess set, load the CC0 puzzle database
 * (database.lichess.org) into the backend and serve it through our own API —
 * the service layer already funnels through here.
 */

const CHESSCOM_RANDOM = 'https://api.chess.com/pub/puzzle/random';
const LICHESS_DAILY = 'https://lichess.org/api/puzzle/daily';

function fromPgn(pgn: string, meta: Partial<Puzzle>): Puzzle | null {
  try {
    const game = new Chess();
    game.loadPgn(pgn);
    const fen = (game.header().FEN as string) || undefined;
    const solution = game.history();
    if (!fen || solution.length === 0) return null;
    return {
      id: meta.id ?? `online-${solution.join('')}`,
      title: meta.title ?? 'Online puzzle',
      theme: 'Online',
      difficulty: 'Intermediate',
      kind: 'line',
      fen,
      solution,
    };
  } catch {
    return null;
  }
}

/** A random bundled puzzle — the always-available offline fallback. */
export function randomBundledPuzzle(): Puzzle {
  return puzzles[Math.floor(Math.random() * puzzles.length)];
}

/** Fetch a fresh puzzle from a free API, falling back to the bundled set. */
export async function fetchRandomPuzzle(): Promise<Puzzle> {
  // 1) Chess.com random puzzle (unlimited, no auth)
  try {
    const res = await fetch(CHESSCOM_RANDOM, { headers: { Accept: 'application/json' } });
    if (res.ok) {
      const data: any = await res.json();
      const p = fromPgn(data.pgn, { id: `cc-${data.title ?? Date.now()}`, title: data.title ?? 'Chess.com puzzle' });
      if (p) return p;
    }
  } catch {
    // fall through
  }
  // 2) Lichess daily puzzle
  try {
    const res = await fetch(LICHESS_DAILY, { headers: { Accept: 'application/json' } });
    if (res.ok) {
      const data: any = await res.json();
      if (data?.game?.pgn) {
        const p = fromPgn(data.game.pgn, { id: `li-${data.puzzle?.id ?? Date.now()}`, title: 'Lichess daily' });
        if (p) return p;
      }
    }
  } catch {
    // fall through
  }
  // 3) Offline fallback
  return randomBundledPuzzle();
}
