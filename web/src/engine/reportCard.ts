import { analyzeGame } from '@shared/engine/analyze';
import { parseTags } from '@shared/services/importGames';

/**
 * Aggregate "insights" across many imported games — a report card for the
 * player (not the opponent). Each game is scored with the quick analyzer (so a
 * whole batch is instant); the deep Stockfish review stays available per game.
 *
 * The card is intentionally micro: move-quality distribution, accuracy split by
 * colour, a phase breakdown (opening / middlegame / endgame) and the single
 * biggest mistake — not just headline averages.
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

export type MoveQuality = {
  book: number; brilliant: number; great: number; best: number; good: number;
  inaccuracy: number; miss: number; mistake: number; blunder: number;
};

export type Phase = 'opening' | 'middlegame' | 'endgame';
export type PhaseAgg = { moves: number; acpl: number; blunders: number };
export type ColorAgg = { games: number; accuracy: number; winPct: number };
export type BiggestMistake = { gameId: string; opponent: string; san: string; moveNo: number; cpLoss: number; phase: Phase; color: 'w' | 'b' };
export type TimeControlAgg = { category: string; games: number; wins: number; draws: number; losses: number; winPct: number; accuracy: number };
export type TrendPoint = { label: string; accuracy: number; games: number };

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
  // micro breakdowns
  moveQuality: MoveQuality;
  userMoves: number;
  byColor: { white: ColorAgg; black: ColorAgg };
  byPhase: Record<Phase, PhaseAgg>;
  biggest?: BiggestMistake;
  // full-history breakdowns
  byTimeControl: TimeControlAgg[];
  trend: TrendPoint[];
};

/** Map a PGN TimeControl tag to a speed category. */
export function tcCategory(tc: string | undefined): string {
  if (!tc || tc === '-') return 'Correspondence';
  if (tc.includes('/')) return 'Correspondence'; // daily "1/259200"
  const base = parseInt(tc.split('+')[0], 10);
  if (!Number.isFinite(base) || base <= 0) return 'Other';
  if (base < 180) return 'Bullet';
  if (base < 600) return 'Blitz';
  if (base < 1800) return 'Rapid';
  return 'Classical';
}
function monthOf(date: string): string {
  // date is 'YYYY.MM.DD' or 'YYYY-MM-DD'
  const m = date.replace(/-/g, '.').match(/^(\d{4})\.(\d{2})/);
  return m ? `${m[1]}-${m[2]}` : '';
}

type RawGame = { id: string; white: string; black: string; result: string; pgn: string; date?: string };

function colorOf(g: RawGame, username: string): 'w' | 'b' | null {
  const u = username.trim().toLowerCase();
  if (g.white?.toLowerCase() === u) return 'w';
  if (g.black?.toLowerCase() === u) return 'b';
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

function pieceCount(fen: string): number {
  return (fen.split(' ')[0].match(/[a-zA-Z]/g) || []).length;
}
function phaseOf(moveNo: number, fenAfter: string): Phase {
  if (moveNo <= 10) return 'opening';
  if (pieceCount(fenAfter) <= 12) return 'endgame';
  return 'middlegame';
}

/** Build a report card, yielding between games so the UI stays responsive. */
export async function buildReportCard(
  games: RawGame[],
  username: string,
  onProgress?: (fraction: number) => void,
): Promise<ReportCard> {
  const lines: GameLine[] = [];
  const mq: MoveQuality = { book: 0, brilliant: 0, great: 0, best: 0, good: 0, inaccuracy: 0, miss: 0, mistake: 0, blunder: 0 };
  const byPhase: Record<Phase, PhaseAgg> = {
    opening: { moves: 0, acpl: 0, blunders: 0 },
    middlegame: { moves: 0, acpl: 0, blunders: 0 },
    endgame: { moves: 0, acpl: 0, blunders: 0 },
  };
  const phaseLoss: Record<Phase, number> = { opening: 0, middlegame: 0, endgame: 0 };
  let userMoves = 0;
  let biggest: BiggestMistake | undefined;
  const tcMap = new Map<string, { games: number; wins: number; draws: number; losses: number; accSum: number }>();
  const monthMap = new Map<string, { accSum: number; games: number }>();

  for (let i = 0; i < games.length; i++) {
    const g = games[i];
    const color = colorOf(g, username);
    if (color) {
      try {
        const rep = analyzeGame(g.pgn, 2);
        if (rep.moves.length) {
          const side = color === 'w' ? rep.white : rep.black;
          const opponent = color === 'w' ? g.black : g.white;
          lines.push({
            id: g.id, opponent, color,
            result: resultFor(color, g.result),
            accuracy: side.accuracy, acpl: side.acpl,
            blunders: side.blunder + side.miss, mistakes: side.mistake,
            opening: rep.openingName, date: g.date || '', pgn: g.pgn,
          });
          // full-history slices: by time control, and accuracy trend by month
          const tags = parseTags(g.pgn);
          const res = resultFor(color, g.result);
          const cat = tcCategory(tags.TimeControl);
          const tcA = tcMap.get(cat) ?? { games: 0, wins: 0, draws: 0, losses: 0, accSum: 0 };
          tcA.games++; tcA.accSum += side.accuracy;
          if (res === 'win') tcA.wins++; else if (res === 'draw') tcA.draws++; else if (res === 'loss') tcA.losses++;
          tcMap.set(cat, tcA);
          const month = monthOf(g.date || tags.UTCDate || tags.Date || '');
          if (month) { const mA = monthMap.get(month) ?? { accSum: 0, games: 0 }; mA.accSum += side.accuracy; mA.games++; monthMap.set(month, mA); }
          // per-move micro tally for the user's own moves
          for (const m of rep.moves) {
            if (m.color !== color) continue;
            userMoves++;
            const cls = m.classification;
            if (cls === 'Book') mq.book++; else if (cls === 'Brilliant') mq.brilliant++;
            else if (cls === 'Great') mq.great++; else if (cls === 'Best') mq.best++;
            else if (cls === 'Good') mq.good++; else if (cls === 'Inaccuracy') mq.inaccuracy++;
            else if (cls === 'Miss') mq.miss++; else if (cls === 'Mistake') mq.mistake++;
            else mq.blunder++;
            const ph = phaseOf(m.moveNo, m.fenAfter);
            byPhase[ph].moves++; phaseLoss[ph] += m.cpLoss;
            if (cls === 'Blunder' || cls === 'Miss') byPhase[ph].blunders++;
            if ((cls === 'Blunder' || cls === 'Miss') && (!biggest || m.cpLoss > biggest.cpLoss)) {
              biggest = { gameId: g.id, opponent, san: m.san, moveNo: m.moveNo, cpLoss: m.cpLoss, phase: ph, color };
            }
          }
        }
      } catch { /* skip unparseable game */ }
    }
    onProgress?.((i + 1) / games.length);
    await new Promise((r) => setTimeout(r, 0));
  }

  for (const ph of ['opening', 'middlegame', 'endgame'] as Phase[]) {
    byPhase[ph].acpl = byPhase[ph].moves ? Math.round(phaseLoss[ph] / byPhase[ph].moves) : 0;
  }

  const n = lines.length;
  const sum = (f: (l: GameLine) => number) => lines.reduce((a, l) => a + f(l), 0);
  const wins = lines.filter((l) => l.result === 'win').length;
  const draws = lines.filter((l) => l.result === 'draw').length;
  const losses = lines.filter((l) => l.result === 'loss').length;
  const decided = wins + losses;
  const avgAccuracy = n ? Math.round(sum((l) => l.accuracy) / n) : 0;
  const avgAcpl = n ? Math.round(sum((l) => l.acpl) / n) : 0;
  const totals = { blunders: sum((l) => l.blunders), mistakes: sum((l) => l.mistakes), inaccuracies: mq.inaccuracy };
  const blundersPerGame = n ? +(totals.blunders / n).toFixed(1) : 0;
  const mistakesPerGame = n ? +(totals.mistakes / n).toFixed(1) : 0;

  const byAcc = [...lines].sort((a, b) => b.accuracy - a.accuracy);
  const best = byAcc[0];
  const worst = byAcc[byAcc.length - 1];

  const colorAgg = (c: 'w' | 'b'): ColorAgg => {
    const ls = lines.filter((l) => l.color === c);
    const dec = ls.filter((l) => l.result === 'win' || l.result === 'loss').length;
    const w = ls.filter((l) => l.result === 'win').length;
    return { games: ls.length, accuracy: ls.length ? Math.round(ls.reduce((a, l) => a + l.accuracy, 0) / ls.length) : 0, winPct: dec ? Math.round((w / dec) * 100) : 0 };
  };
  const byColor = { white: colorAgg('w'), black: colorAgg('b') };

  // time-control + trend
  const order = ['Bullet', 'Blitz', 'Rapid', 'Classical', 'Correspondence', 'Other'];
  const byTimeControl: TimeControlAgg[] = [...tcMap.entries()]
    .map(([category, v]) => {
      const decided = v.wins + v.losses;
      return { category, games: v.games, wins: v.wins, draws: v.draws, losses: v.losses,
        winPct: decided ? Math.round((v.wins / decided) * 100) : 0,
        accuracy: v.games ? Math.round(v.accSum / v.games) : 0 };
    })
    .sort((a, b) => order.indexOf(a.category) - order.indexOf(b.category));
  const trend: TrendPoint[] = [...monthMap.entries()]
    .sort((a, b) => (a[0] < b[0] ? -1 : 1))
    .map(([label, v]) => ({ label, accuracy: Math.round(v.accSum / v.games), games: v.games }));

  // openings
  const openMap = new Map<string, { games: number; wins: number; asWhite: number }>();
  for (const l of lines) {
    const o = openMap.get(l.opening) ?? { games: 0, wins: 0, asWhite: 0 };
    o.games++; if (l.result === 'win') o.wins++; if (l.color === 'w') o.asWhite++;
    openMap.set(l.opening, o);
  }
  const openings = [...openMap.entries()].map(([name, v]) => ({ name, ...v })).sort((a, b) => b.games - a.games).slice(0, 4);

  // insights (micro)
  const insights: string[] = [];
  if (n) {
    insights.push(`Across ${n} games you scored ${decided ? Math.round((wins / decided) * 100) : 0}% of decided games (${wins}W–${draws}D–${losses}L), ${avgAccuracy}% average accuracy.`);
    if (byColor.white.games && byColor.black.games) {
      const strong = byColor.white.accuracy >= byColor.black.accuracy ? 'White' : 'Black';
      const sA = Math.max(byColor.white.accuracy, byColor.black.accuracy);
      const wA = Math.min(byColor.white.accuracy, byColor.black.accuracy);
      insights.push(`You’re sharper with ${strong} (${sA}% vs ${wA}%). Give your weaker colour extra prep.`);
    }
    const worstPhase = (['opening', 'middlegame', 'endgame'] as Phase[]).filter((p) => byPhase[p].moves >= 5).sort((a, b) => byPhase[b].acpl - byPhase[a].acpl)[0];
    if (worstPhase) insights.push(`Most of your accuracy is lost in the ${worstPhase} (${byPhase[worstPhase].acpl} avg cp loss, ${byPhase[worstPhase].blunders} blunders there).`);
    if (biggest) insights.push(`Biggest slip: ${biggest.san} vs ${biggest.opponent} (move ${biggest.moveNo}, ${biggest.phase}). Review it below.`);
    if (avgAccuracy < 75) insights.push('Try the Forks, Pins and Back-rank puzzle packs — tactical sharpness is your biggest lever right now.');
  }

  return {
    username, games: n, wins, draws, losses,
    winPct: decided ? Math.round((wins / decided) * 100) : 0,
    avgAccuracy, avgAcpl, blundersPerGame, mistakesPerGame, totals,
    grade: gradeFor(avgAccuracy),
    best, worst, openings, insights, lines: byAcc,
    moveQuality: mq, userMoves, byColor, byPhase, biggest,
    byTimeControl, trend,
  };
}
