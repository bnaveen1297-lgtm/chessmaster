import type { MasterGame } from '../data/masters';

/**
 * Pure converter for master-game database rows (no Supabase import, so it is
 * unit-testable in isolation — see scripts/test-masterdb.js). masterDb.ts uses
 * this to shape rows returned by the `random_master_games` RPC.
 */

export type MasterRow = {
  id: number | string;
  white?: string | null;
  black?: string | null;
  result?: string | null;
  event?: string | null;
  game_date?: string | null;
  white_elo?: number | null;
  black_elo?: number | null;
  eco?: string | null;
  opening?: string | null;
  pgn: string;
};

export function yearFrom(date?: string | null): number {
  if (!date) return 0;
  const y = parseInt(String(date).slice(0, 4), 10);
  return Number.isNaN(y) ? 0 : y;
}

/** Shape a raw DB row into the same MasterGame the app already renders. */
export function rowToMasterGame(row: MasterRow): MasterGame {
  const result =
    row.result === '1-0' || row.result === '0-1' || row.result === '1/2-1/2' ? row.result : '1/2-1/2';
  const elo = row.white_elo && row.black_elo ? ` · ${row.white_elo}/${row.black_elo}` : '';
  return {
    id: `db-${row.id}`,
    white: row.white || 'White',
    black: row.black || 'Black',
    event: (row.event || 'Master game') + elo,
    year: yearFrom(row.game_date),
    result,
    opening: row.opening || 'Unknown',
    eco: row.eco || undefined,
    themes: [],
    pgn: row.pgn,
  };
}
