import { analyzeGame } from '@shared/engine/analyze';

/**
 * Aggregate "insights" across many imported games — a report card for the
 * player (not the opponent). Each game is scored with the quick analyzer (so a
 * whole batch is instant); the deep Stockfish review stays available per game.
 */
export type GameLine = {
  id: string;
  opponent: string;
  color: 'w' | 'b';
  result: 'win' | 'loss' | 'draw' | '?';
  accuracy: number;
  acpl: number;
  blunders: number;
  mistakes: number;
  opening: string;
  date: string;
  pgn: string;
};

export type ReportCard = {
  username: string;
  games: number;
  wins: number;
  draws: number;
  losses: number;
  winPct: number;
  avgAccuracy: number;
  avgAcpl: number;
  blundersPerGame: number;
  mistakesPerGame: number;
  totals: { blunders: number; mistakes: number; inaccuracies: number };
  grade: string;
  best?: GameLine;
  worst?: GameLine;
  openings: { name: string; games: number; wins: number; asWhite: number }[];
  insights: string[];
  lines: GameLine[];
};

type RawGame = { id: string; white: string; black: string; result: string; pgn: string; date?: string };

function colorOf(g: RawGame, username: string): 'w' | 'b' | null {
  const u = username.trim().toLowerCase();
  if (g.white?.toLowerCase() === u) return 'w';
  if (g.black?.toLowerCase() === u) return 'b';
  // fall back to a looser contains-match (handles titles/suffixes)
  if (g.white?.toLowerCase().includes(u)) return 'w';
  if (g.black?.toLowerCase().includes(u)) return 'b';
  return null;
}

function resultFor(color: 'w' | 'b', result: string): 'win' | 'loss' | 'draw' | '?' {
  if (result === '1/2-1/2') return 'draw';
  if (result === '1-0') return color === 'w' ? 'win' : 'loss';
  if (result === '0-1') return color === 'b' ? 'win' : 'loss';
  return '?';
}

function gradeFor(acc: number): string {
  if (acc >= 90) return 'A · Excellent';
  if (acc >= 82) return 'B · Strong';
  if (acc >= 73) return 'C · Solid';
  if (acc >= 64) return 'D · Developing';
  return 'E · Keep training';
}

/** Build a report card, yielding between games so the UI stays responsive. */
export async function buildReportCard(
  games: RawGame[],
  username: string,
  onProgress?: (fraction: number) => void,
): Promise<ReportCard> {
  const lines: GameLine[] = [];
  for (let i = 0; i < games.length; i++) {
    const g = games[i];
    const color = colorOf(g, username);
    if (color) {
      try {
        const rep = analyzeGame(g.pgn, 2);
        if (rep.moves.length) {
          const side = color === 'w' ? rep.white : rep.black;
          lines.push({
            id: g.id,
            opponent: color === 'w' ? g.black : g.white,
            color,
            result: resultFor(color, g.result),
            accuracy: side.accuracy,
            acpl: side.acpl,
            blunders: side.blunder + side.miss,
            mistakes: side.mistake,
            opening: rep.openingName,
            date: g.date || '',
            pgn: g.pgn,
          });
        }
      } catch { /* skip unparseable game */ }
    }
    onProgress?.((i + 1) / games.length);
    await new Promise((r) => setTimeout(r, 0)); // yield to the event loop
  }

  const n = lines.length;
  const sum = (f: (l: GameLine) => number) => lines.reduce((a, l) => a + f(l), 0);
  const wins = lines.filter((l) => l.result === 'win').length;
  const draws = lines.filter((l) => l.result === 'draw').length;
  const losses = lines.filter((l) => l.result === 'loss').length;
  const decided = wins + losses;
  const avgAccuracy = n ? Math.round(sum((l) => l.accuracy) / n) : 0;
  const avgAcpl = n ? Math.round(sum((l) => l.acpl) / n) : 0;
  const totals = {
    blunders: sum((l) => l.blunders),
    mistakes: sum((l) => l.mistakes),
    inaccuracies: 0,
  };
  const blundersPerGame = n ? +(totals.blunders / n).toFixed(1) : 0;
  const mistakesPerGame = n ? +(totals.mistakes / n).toFixed(1) : 0;

  const byAcc = [...lines].sort((a, b) => b.accuracy - a.accuracy);
  const best = byAcc[0];
  const worst = byAcc[byAcc.length - 1];

  // Opening performance (top by frequency).
  const openMap = new Map<string, { games: number; wins: number; asWhite: number }>();
  for (const l of lines) {
    const o = openMap.get(l.opening) ?? { games: 0, wins: 0, asWhite: 0 };
    o.games++; if (l.result === 'win') o.wins++; if (l.color === 'w') o.asWhite++;
    openMap.set(l.opening, o);
  }
  const openings = [...openMap.entries()]
    .map(([name, v]) => ({ name, ...v }))
    .sort((a, b) => b.games - a.games)
    .slice(0, 4);

  // Insights.
  const insights: string[] = [];
  if (n) {
    insights.push(`Across ${n} games you scored ${decided ? Math.round((wins / decided) * 100) : 0}% of decided games (${wins}W–${draws}D–${losses}L).`);
    insights.push(`Your average accuracy is ${avgAccuracy}% (${avgAcpl} avg centipawn loss).`);
    if (blundersPerGame >= 1.5) insights.push(`You average ${blundersPerGame} blunders per game — slowing down on checks & captures is the fastest way to gain rating.`);
    else insights.push(`Blunders are under control (${blundersPerGame}/game). Keep sharpening tactics to convert more wins.`);
    const worstOpening = [...openings].sort((a, b) => a.wins / a.games - b.wins / b.games)[0];
    if (worstOpening && worstOpening.games >= 2) insights.push(`Your toughest opening lately is “${worstOpening.name}” (${worstOpening.wins}/${worstOpening.games}). Study a clear plan there.`);
    if (avgAccuracy < 75) insights.push('Try the Forks, Pins and Back-rank puzzle packs — tactical sharpness is your biggest lever right now.');
  }

  return {
    username,
    games: n,
    wins, draws, losses,
    winPct: decided ? Math.round((wins / decided) * 100) : 0,
    avgAccuracy, avgAcpl,
    blundersPerGame, mistakesPerGame,
    totals,
    grade: gradeFor(avgAccuracy),
    best, worst,
    openings,
    insights,
    lines: byAcc,
  };
}
