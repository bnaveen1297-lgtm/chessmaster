/**
 * Import a player's recent games from Chess.com or Lichess.
 *
 * Both platforms expose public, no-auth game APIs that also send CORS headers,
 * so this works from the app directly (native and web) — no backend needed.
 *   • Chess.com: /pub/player/{u}/games/archives → monthly archive URLs, each
 *     returning games with a `pgn` field.
 *   • Lichess: /api/games/user/{u}?max=N with Accept: application/x-chess-pgn
 *     returns a PGN blob of the most recent games.
 *
 * The PGN parsing helpers are pure and unit-tested (scripts/test-import.js).
 */

export type ImportSource = 'chesscom' | 'lichess';

export type ImportedGame = {
  id: string;
  source: ImportSource;
  white: string;
  black: string;
  result: string; // '1-0' | '0-1' | '1/2-1/2' | '*'
  pgn: string;
  date: string; // YYYY.MM.DD or ''
  event: string;
};

// ---------------------------------------------------------------------------
// Pure PGN helpers (unit-tested)
// ---------------------------------------------------------------------------

/** Split a PGN blob containing multiple games into individual game strings. */
export function splitPgnGames(text: string): string[] {
  if (!text) return [];
  const normalized = text.replace(/\r\n/g, '\n').trim();
  if (!normalized) return [];
  // Each game starts with an [Event "..."] tag. Split before every [Event that
  // begins a line, keeping the tag with its game.
  const parts = normalized.split(/\n(?=\[Event )/g);
  return parts.map((p) => p.trim()).filter((p) => p.length > 0);
}

/** Extract PGN header tags ([Key "Value"]) into a map. */
export function parseTags(pgn: string): Record<string, string> {
  const tags: Record<string, string> = {};
  const re = /\[(\w+)\s+"([^"]*)"\]/g;
  let m: RegExpExecArray | null;
  while ((m = re.exec(pgn)) !== null) {
    tags[m[1]] = m[2];
  }
  return tags;
}

/** Build an ImportedGame from a single game's PGN. */
export function pgnToImported(pgn: string, source: ImportSource, idHint?: string): ImportedGame {
  const t = parseTags(pgn);
  return {
    id: idHint || t.Site || t.Link || `${source}-${t.White}-${t.Black}-${t.Date || ''}-${t.Round || ''}`,
    source,
    white: t.White || 'White',
    black: t.Black || 'Black',
    result: t.Result || '*',
    pgn,
    date: t.UTCDate || t.Date || '',
    event: t.Event || (source === 'chesscom' ? 'Chess.com' : 'Lichess'),
  };
}

// ---------------------------------------------------------------------------
// Fetchers
// ---------------------------------------------------------------------------

async function getJson(url: string): Promise<any> {
  const res = await fetch(url, { headers: { Accept: 'application/json' } });
  if (res.status === 404) throw new Error('Player not found.');
  if (!res.ok) throw new Error(`Request failed (${res.status}).`);
  return res.json();
}

/** Recent Chess.com games (most recent first). */
export async function fetchChessComGames(username: string, limit = 15): Promise<ImportedGame[]> {
  const u = username.trim().toLowerCase();
  if (!u) throw new Error('Enter a Chess.com username.');
  const { archives } = await getJson(`https://api.chess.com/pub/player/${encodeURIComponent(u)}/games/archives`);
  if (!Array.isArray(archives) || archives.length === 0) return [];

  const out: ImportedGame[] = [];
  // Walk months newest-first until we have enough.
  for (const archiveUrl of [...archives].reverse()) {
    const { games } = await getJson(archiveUrl);
    const list = Array.isArray(games) ? games : [];
    for (const g of list.reverse()) {
      if (!g?.pgn) continue;
      const result =
        g.white?.result === 'win' ? '1-0' : g.black?.result === 'win' ? '0-1' : '1/2-1/2';
      out.push({
        id: g.url || `chesscom-${out.length}`,
        source: 'chesscom',
        white: g.white?.username || 'White',
        black: g.black?.username || 'Black',
        result,
        pgn: g.pgn,
        date: (g.end_time ? new Date(g.end_time * 1000).toISOString().slice(0, 10) : '').replace(/-/g, '.'),
        event: g.time_class ? `Chess.com · ${g.time_class}` : 'Chess.com',
      });
      if (out.length >= limit) return out;
    }
  }
  return out;
}

/** Recent Lichess games (most recent first). */
export async function fetchLichessGames(username: string, limit = 15): Promise<ImportedGame[]> {
  const u = username.trim();
  if (!u) throw new Error('Enter a Lichess username.');
  const url = `https://lichess.org/api/games/user/${encodeURIComponent(u)}?max=${limit}&clocks=false&evals=false&opening=true`;
  const res = await fetch(url, { headers: { Accept: 'application/x-chess-pgn' } });
  if (res.status === 404) throw new Error('Player not found.');
  if (!res.ok) throw new Error(`Request failed (${res.status}).`);
  const text = await res.text();
  return splitPgnGames(text).map((pgn, i) => pgnToImported(pgn, 'lichess', `lichess-${u}-${i}`));
}

export async function fetchGames(source: ImportSource, username: string, limit = 15): Promise<ImportedGame[]> {
  return source === 'chesscom' ? fetchChessComGames(username, limit) : fetchLichessGames(username, limit);
}
