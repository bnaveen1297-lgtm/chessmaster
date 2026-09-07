/**
 * Live Olympiad board streaming via the Lichess Broadcast API.
 *
 * Lichess re-broadcasts major over-the-board events — including the FIDE
 * Chess Olympiad. The organizer's DGT boards feed the official relay, which
 * Lichess mirrors as PGN. The endpoints are public, need no auth, and send
 * CORS headers, so the app can read them directly (native + web), no backend.
 *
 *   • List:   GET https://lichess.org/api/broadcast
 *             → NDJSON (one JSON tour object per line).
 *   • Boards: GET https://lichess.org/api/broadcast/round/{roundId}.pgn
 *             → a PGN text blob of every board in that round.
 *
 * PGN parsing reuses the pure, unit-tested helpers in importGames.ts
 * (splitPgnGames + parseTags) — no duplication here.
 */

import { splitPgnGames, parseTags } from './importGames';

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export type BroadcastRound = {
  id: string;
  name: string;
  slug: string;
  finished: boolean;
  ongoing: boolean;
  startsAt?: number;
  url: string;
};

export type BroadcastTour = {
  id: string;
  name: string;
  slug: string;
  url: string;
  rounds: BroadcastRound[];
};

export type Board = {
  id: string;
  white: string;
  black: string;
  result: string; // '1-0' | '0-1' | '1/2-1/2' | '*'
  event: string;
  pgn: string;
  board: number; // 1-based board index
};

const BASE = 'https://lichess.org/api/broadcast';

/**
 * The screens gate on whether the live fetch succeeds, not on any build-time
 * config — this simply reports that the feature is wired up.
 */
export function broadcastAvailable(): boolean {
  return true;
}

// ---------------------------------------------------------------------------
// Pure parsers
// ---------------------------------------------------------------------------

/**
 * Parse an NDJSON broadcast-list body into tours. Robust to blank lines and
 * malformed rows: split on newlines, JSON.parse each non-empty line, and skip
 * anything that fails to parse.
 */
export function parseBroadcastList(text: string): BroadcastTour[] {
  if (!text) return [];
  const out: BroadcastTour[] = [];
  for (const line of text.split('\n')) {
    const trimmed = line.trim();
    if (!trimmed) continue;
    let obj: any;
    try {
      obj = JSON.parse(trimmed);
    } catch {
      continue; // ignore parse errors
    }
    const tour = obj?.tour;
    if (!tour?.id) continue;
    const rounds: BroadcastRound[] = Array.isArray(obj?.rounds)
      ? obj.rounds
          .filter((r: any) => r?.id)
          .map((r: any) => ({
            id: String(r.id),
            name: r.name ?? '',
            slug: r.slug ?? '',
            finished: !!r.finished,
            ongoing: !!r.ongoing,
            startsAt: typeof r.startsAt === 'number' ? r.startsAt : undefined,
            url: r.url ?? '',
          }))
      : [];
    out.push({
      id: String(tour.id),
      name: tour.name ?? '',
      slug: tour.slug ?? '',
      url: tour.url ?? '',
      rounds,
    });
  }
  return out;
}

/** Pick the best round to follow for an Olympiad tour. */
function pickRound(rounds: BroadcastRound[]): BroadcastRound | null {
  if (!rounds || rounds.length === 0) return null;
  const ongoing = rounds.find((r) => r.ongoing);
  if (ongoing) return ongoing;
  const notFinished = [...rounds].reverse().find((r) => !r.finished);
  if (notFinished) return notFinished;
  return rounds[rounds.length - 1];
}

/** Build the list of Board objects from a round's PGN blob. */
export function parseRoundBoards(pgnBlob: string): Board[] {
  return splitPgnGames(pgnBlob).map((pgn, i) => {
    const t = parseTags(pgn);
    const boardNo = Number.parseInt(t.Board ?? '', 10);
    return {
      id: t.GameId || t.Site || `board-${i}`,
      white: t.White || 'White',
      black: t.Black || 'Black',
      result: t.Result || '*',
      event: t.Event || 'Live broadcast',
      pgn,
      board: Number.isFinite(boardNo) && boardNo > 0 ? boardNo : i + 1,
    };
  });
}

// ---------------------------------------------------------------------------
// Fetchers
// ---------------------------------------------------------------------------

/** Fetch and parse the full broadcast list (NDJSON). */
export async function listBroadcasts(): Promise<BroadcastTour[]> {
  let res: Response;
  try {
    res = await fetch(BASE, { headers: { Accept: 'application/x-ndjson' } });
  } catch {
    throw new Error('Could not reach the live broadcast.');
  }
  if (!res.ok) throw new Error('Could not reach the live broadcast.');
  const text = await res.text();
  return parseBroadcastList(text);
}

/**
 * From the broadcast list, find the FIDE Olympiad tour and the round worth
 * following (ongoing → last not-finished → last). Returns null if no Olympiad
 * broadcast is live yet.
 */
export async function findOlympiadRound(): Promise<{ tour: BroadcastTour; round: BroadcastRound } | null> {
  const tours = await listBroadcasts();
  const tour = tours.find((t) => /olympiad/i.test(t.name));
  if (!tour) return null;
  const round = pickRound(tour.rounds);
  if (!round) return null;
  return { tour, round };
}

/** Fetch every board in a round as parsed Board objects. */
export async function fetchRoundBoards(roundId: string): Promise<Board[]> {
  const url = `${BASE}/round/${encodeURIComponent(roundId)}.pgn`;
  let res: Response;
  try {
    res = await fetch(url, { headers: { Accept: 'application/x-chess-pgn' } });
  } catch {
    throw new Error('Could not reach the live broadcast.');
  }
  if (res.status === 404) throw new Error('That live round is no longer available.');
  if (!res.ok) throw new Error('Could not reach the live broadcast.');
  const text = await res.text();
  return parseRoundBoards(text);
}
