import { Chess } from 'chess.js';
import {
  classifyMove, detectOpening, materialBalance, moveAccuracy, parsePgn, winPct,
  MINOR, PIECE_CP,
  type AnalyzedMove, type GameReport, type MoveClass, type SideReport,
} from '@shared/engine/analyze';
import { StockfishEngine, uciToSan, MATE_CP } from './stockfish';

/**
 * Stockfish-backed game review. Produces the exact same {@link GameReport}
 * shape as the heuristic `analyzeGame`, but every score comes from a real
 * Stockfish search — so accuracy, ACPL, the eval graph and the move labels are
 * engine-grade rather than approximate.
 *
 * Efficiency: each of the game's N+1 positions is evaluated **once** (MultiPV 2).
 * For a move at ply i, the best/second-best come from position i, and the score
 * of the move actually played is read off position i+1 (the opponent is to move
 * there, so its side-to-move score, negated, is the mover's resulting eval).
 * That means one search per position instead of one per candidate move.
 */

type Cell = { best: number; second: number; bestUci: string | null };

const clampLoss = (n: number) => Math.max(0, Math.min(1000, n));

function emptySide() {
  return {
    accuracy: 0, acpl: 0, best: 0, good: 0, inaccuracy: 0, mistake: 0, blunder: 0,
    book: 0, brilliant: 0, great: 0, miss: 0, _sum: 0, _n: 0, _accSum: 0,
  };
}

export type AnalyzeOptions = {
  depth?: number;
  /** Called with progress 0..1 as positions are evaluated. */
  onProgress?: (fraction: number) => void;
};

export async function analyzeGameEngine(
  pgn: string,
  engine: StockfishEngine,
  opts: AnalyzeOptions = {},
): Promise<GameReport> {
  const depth = opts.depth ?? 12;
  const moves = parsePgn(pgn);
  const sans = moves.map((m) => m.san);
  const { name: openingName, bookPlies } = detectOpening(sans);
  const N = moves.length;

  // Replay to collect the FEN before every move, plus the final FEN.
  const fens: string[] = [];
  const replay = new Chess();
  fens.push(replay.fen());
  for (const m of moves) { replay.move(m.san); fens.push(replay.fen()); }

  // Evaluate each of the N+1 positions once (terminal final position is scored
  // from the board, no search needed).
  const cells: Cell[] = new Array(N + 1);
  for (let k = 0; k <= N; k++) {
    const pos = new Chess(fens[k]);
    if (pos.isGameOver()) {
      // Side to move is checkmated ⇒ -MATE_CP; any other end (stale/draw) ⇒ 0.
      const cp = pos.isCheckmate() ? -MATE_CP : 0;
      cells[k] = { best: cp, second: cp, bestUci: null };
    } else {
      const r = await engine.evaluate(fens[k], { depth, multipv: 2 });
      cells[k] = {
        best: r.lines[0]?.cp ?? 0,
        second: r.lines[1]?.cp ?? r.lines[0]?.cp ?? 0,
        bestUci: r.bestUci,
      };
    }
    opts.onProgress?.((k + 1) / (N + 1));
  }

  const analyzed: AnalyzedMove[] = [];
  const evalSeries: number[] = [];
  const white = emptySide();
  const black = emptySide();

  for (let i = 0; i < N; i++) {
    const { san, color } = moves[i];
    const before = cells[i];
    const bestScore = before.best;
    const secondBest = before.second;
    const bestSan = uciToSan(fens[i], before.bestUci) || san;
    // The played move's eval = opponent's side-to-move score at fen[i+1], negated.
    const playedScore = -cells[i + 1].best;
    const cpLoss = clampLoss(bestScore - playedScore);

    const boardBefore = new Chess(fens[i]);
    const matBefore = materialBalance(boardBefore, color);

    const winBefore = winPct(bestScore);
    const winAfter = winPct(playedScore);
    const isBook = i < bookPlies;
    const acc = isBook ? 100 : moveAccuracy(winBefore, winAfter);

    // Sacrifice detection on the post-move position (opponent to move): if their
    // greediest single capture still leaves the mover ≥ a minor down vs before.
    const boardAfter = new Chess(fens[i + 1]);
    let curBal = materialBalance(boardAfter, color);
    let worstBal = curBal;
    if (!boardAfter.isGameOver()) {
      for (const m of boardAfter.moves({ verbose: true })) {
        if (m.captured) {
          const after = curBal - (PIECE_CP[m.captured] ?? 0);
          if (after < worstBal) worstBal = after;
        }
      }
    }
    const isSacrifice = worstBal <= matBefore - MINOR;

    const cls: MoveClass = classifyMove({
      isBook, cpLoss, winBefore, winAfter, secondBestGap: bestScore - secondBest, isSacrifice,
    });

    const cpWhite = color === 'w' ? playedScore : -playedScore;
    analyzed.push({
      ply: i + 1,
      moveNo: Math.floor(i / 2) + 1,
      color, san, cpLoss, classification: cls, bestSan,
      fenAfter: fens[i + 1],
      cp: Math.max(-10000, Math.min(10000, Math.round(cpWhite))),
      winPctBefore: Math.round(winBefore),
      winPctAfter: Math.round(winAfter),
      accuracy: Math.round(acc),
    });
    evalSeries.push(Math.round(winPct(cpWhite)));

    const side = color === 'w' ? white : black;
    side._sum += cpLoss; side._n += 1; side._accSum += acc;
    (side as any)[cls === 'Book' ? 'book' : cls === 'Brilliant' ? 'brilliant' : cls === 'Great' ? 'great'
      : cls === 'Best' ? 'best' : cls === 'Good' ? 'good' : cls === 'Inaccuracy' ? 'inaccuracy'
      : cls === 'Miss' ? 'miss' : cls === 'Mistake' ? 'mistake' : 'blunder']++;
  }

  const finalize = (s: ReturnType<typeof emptySide>): SideReport => ({
    accuracy: s._n ? Math.max(0, Math.min(100, Math.round(s._accSum / s._n))) : 0,
    acpl: s._n ? Math.round(s._sum / s._n) : 0,
    best: s.best, good: s.good, inaccuracy: s.inaccuracy, mistake: s.mistake, blunder: s.blunder,
    book: s.book, brilliant: s.brilliant, great: s.great, miss: s.miss,
  });

  let result = '*';
  try { const g = new Chess(); g.loadPgn(pgn); result = (g.header().Result as string) || '*'; } catch { /* keep * */ }

  return { moves: analyzed, white: finalize(white), black: finalize(black), result, openingName, evalSeries };
}
