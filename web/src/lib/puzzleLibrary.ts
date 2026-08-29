import { rowToPuzzle } from '@shared/services/lichessPuzzle';
import type { Puzzle, PuzzleDifficulty } from '@shared/data/puzzles';

/**
 * The bundled themed puzzle library (~4k verified puzzles: real CC0 Lichess
 * puzzles + correct-by-construction generated ones spanning difficulties). It
 * ships as a static asset and is fetched once, so the curriculum has real depth
 * per theme with no dependency on the (sparse) live database and works offline.
 *
 * Rows are in Lichess format and converted on demand with the same
 * `rowToPuzzle` the DB path uses.
 */
type Row = { id: string; fen: string; moves: string; rating: number; themes: string };

let cache: Row[] | null = null;
let loading: Promise<Row[]> | null = null;

async function load(): Promise<Row[]> {
  if (cache) return cache;
  if (!loading) {
    loading = fetch('/puzzle-library.json')
      .then((r) => (r.ok ? r.json() : []))
      .then((rows: Row[]) => { cache = Array.isArray(rows) ? rows : []; return cache; })
      .catch(() => { cache = []; return cache; });
  }
  return loading;
}

/** Preload in the background (e.g. when the puzzles area mounts). */
export function preloadLibrary(): void { void load(); }

export function bandOf(rating: number): PuzzleDifficulty {
  if (rating < 1300) return 'Beginner';
  if (rating < 1900) return 'Intermediate';
  return 'Advanced';
}

const hasTheme = (row: Row, theme: string) => row.themes.split(/\s+/).includes(theme);

/** How many library puzzles match a theme (and optional band). */
export async function libraryCount(theme?: string, band?: PuzzleDifficulty): Promise<number> {
  const rows = await load();
  return rows.filter((r) => (!theme || hasTheme(r, theme)) && (!band || bandOf(r.rating) === band)).length;
}

/**
 * A random playable puzzle from the library. Filters by theme and (softly) by
 * band — if a theme+band bucket is empty it relaxes the band before giving up.
 * Returns null only if the library couldn't be loaded or the theme is absent.
 */
export async function randomLibraryPuzzle(theme?: string, band?: PuzzleDifficulty): Promise<Puzzle | null> {
  const rows = await load();
  if (!rows.length) return null;
  const pools = [
    rows.filter((r) => (!theme || hasTheme(r, theme)) && (!band || bandOf(r.rating) === band)),
    rows.filter((r) => !theme || hasTheme(r, theme)),
    rows,
  ];
  for (const pool of pools) {
    if (!pool.length) continue;
    // Try a few random picks in case a row fails to convert.
    for (let i = 0; i < 8; i++) {
      const r = pool[Math.floor(Math.random() * pool.length)];
      const p = rowToPuzzle({ id: r.id, fen: r.fen, moves: r.moves, rating: r.rating, themes: r.themes });
      if (p) return p;
    }
  }
  return null;
}

/**
 * A distinct sample of `n` puzzles for an exam, spread across difficulty bands
 * so the test covers easy → hard. Each returned puzzle carries its source rating.
 */
export async function sampleLibraryPuzzles(n: number): Promise<(Puzzle & { rating: number })[]> {
  const rows = await load();
  if (!rows.length) return [];
  const byBand: Record<PuzzleDifficulty, Row[]> = { Beginner: [], Intermediate: [], Advanced: [] };
  for (const r of rows) byBand[bandOf(r.rating)].push(r);
  const order: PuzzleDifficulty[] = ['Beginner', 'Beginner', 'Intermediate', 'Intermediate', 'Advanced'];
  const used = new Set<string>();
  const out: (Puzzle & { rating: number })[] = [];
  let guard = 0;
  while (out.length < n && guard++ < n * 30) {
    const band = order[out.length % order.length];
    const pool = byBand[band].length ? byBand[band] : rows;
    const r = pool[Math.floor(Math.random() * pool.length)];
    if (used.has(r.id)) continue;
    const p = rowToPuzzle({ id: r.id, fen: r.fen, moves: r.moves, rating: r.rating, themes: r.themes });
    if (!p) { used.add(r.id); continue; }
    used.add(r.id);
    out.push({ ...p, rating: r.rating });
  }
  return out;
}
