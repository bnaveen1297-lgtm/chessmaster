import { Chess } from 'chess.js';
import type { GameReport, AnalyzedMove, SideReport, MoveClass } from '@shared/engine/analyze';

/**
 * Turn a {@link GameReport} (from the Stockfish or quick analyzer) into a deep,
 * multi-page "grandmaster review": a written verdict, an opening summary, the
 * annotated eval graph, phase-by-phase commentary, ranked critical moments with
 * board diagrams, a full move-by-move annotation list, a mistakes deep-dive and
 * per-side improvement takeaways.
 *
 * Everything here is derived deterministically from the analyzer's per-move data
 * (eval in centipawns, win% before/played, classification, engine best move) —
 * no extra engine calls — so the report is instant and unit-testable.
 */

const START_FEN = 'rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR w KQkq - 0 1';

export type Phase = 'Opening' | 'Middlegame' | 'Endgame';

export type ReportMove = {
  ply: number;
  moveNo: number;
  color: 'w' | 'b';
  san: string;
  bestSan: string;
  classification: MoveClass;
  glyph: string;
  cpLoss: number;
  /** Eval after the move, in pawns from White's perspective. */
  evalWhite: number;
  /** Win% the mover gave up on this move (0..100). */
  drop: number;
  phase: Phase;
  fenBefore: string;
  fenAfter: string;
  /** Short annotation, present only for notable moves. */
  note?: string;
};

export type CriticalMoment = {
  ply: number;
  moveNo: number;
  color: 'w' | 'b';
  side: 'White' | 'Black';
  san: string;
  bestSan: string;
  classification: MoveClass;
  kind: 'error' | 'brilliant';
  drop: number;
  cpLoss: number;
  evalBefore: number; // white perspective, pawns
  evalAfter: number;
  fenBefore: string;
  fenAfter: string;
  headline: string;
  explanation: string;
};

export type PhaseReport = {
  phase: Phase;
  present: boolean;
  fromMoveNo: number;
  toMoveNo: number;
  whiteAcpl: number;
  blackAcpl: number;
  whiteBlunders: number;
  blackBlunders: number;
  startEval: number; // white win% at phase start
  endEval: number; // white win% at phase end
  narrative: string;
};

export type GraphMarker = { index: number; ply: number; color: 'w' | 'b'; classification: MoveClass; san: string; kind: 'error' | 'brilliant' };

export type DeepReport = {
  whiteName: string;
  blackName: string;
  event: string;
  date: string;
  result: string;
  resultText: string;
  opening: string;
  bookPlies: number;
  leftBook?: { moveNo: number; color: 'w' | 'b'; san: string };
  white: SideReport;
  black: SideReport;
  verdict: string;
  summary: string[];
  openingSummary: string;
  phases: PhaseReport[];
  critical: CriticalMoment[];
  moves: ReportMove[];
  mistakes: CriticalMoment[];
  takeaways: { white: string[]; black: string[] };
  evalSeries: number[];
  markers: GraphMarker[];
  pageEstimate: number;
};

/* ------------------------------- helpers ------------------------------- */

function pieceCount(fen: string): number {
  return (fen.split(' ')[0].match(/[a-zA-Z]/g) || []).length;
}
function phaseOf(moveNo: number, fenAfter: string): Phase {
  if (moveNo <= 10) return 'Opening';
  if (pieceCount(fenAfter) <= 12) return 'Endgame';
  return 'Middlegame';
}
function fenBeforeOf(moves: AnalyzedMove[], i: number): string {
  return i === 0 ? START_FEN : moves[i - 1].fenAfter;
}
const dropOf = (m: AnalyzedMove) => Math.max(0, m.winPctBefore - m.winPctAfter);
const pawns = (cp: number) => (cp / 100).toFixed(1);
const signed = (p: number) => (p >= 0 ? `+${p.toFixed(1)}` : p.toFixed(1));

const GLYPH: Record<MoveClass, string> = {
  Book: '', Brilliant: '!!', Great: '!', Best: '', Good: '',
  Inaccuracy: '?!', Miss: '×', Mistake: '?', Blunder: '??',
};

/** Short verbal read of an eval in pawns from White's perspective. */
function assessWhite(evalPawns: number): string {
  const a = Math.abs(evalPawns);
  const who = evalPawns >= 0 ? 'White' : 'Black';
  if (a < 0.4) return 'the position is level';
  if (a < 1.2) return `${who} is a touch better`;
  if (a < 3) return `${who} is clearly better`;
  if (a < 7) return `${who} is winning`;
  return `${who} is completely winning`;
}

/** How the mover stood before the move, from win% (mover perspective). */
function standBefore(winBefore: number): string {
  if (winBefore >= 80) return 'was completely winning';
  if (winBefore >= 65) return 'stood clearly better';
  if (winBefore >= 55) return 'held a small edge';
  if (winBefore >= 45) return 'had a balanced position';
  if (winBefore >= 30) return 'was already worse';
  return 'was in serious trouble';
}

function errorVerb(cls: MoveClass): string {
  switch (cls) {
    case 'Blunder': return 'throws the advantage away';
    case 'Mistake': return 'lets much of it slip';
    case 'Miss': return 'misses a winning continuation';
    default: return 'is imprecise';
  }
}

function classWord(cls: MoveClass): string {
  switch (cls) {
    case 'Blunder': return 'a blunder';
    case 'Mistake': return 'a mistake';
    case 'Miss': return 'a missed win';
    case 'Inaccuracy': return 'an inaccuracy';
    case 'Brilliant': return 'a brilliant move';
    case 'Great': return 'a great move';
    default: return cls.toLowerCase();
  }
}

function moveLabel(m: { moveNo: number; color: 'w' | 'b'; san: string; classification: MoveClass }): string {
  const num = m.color === 'w' ? `${m.moveNo}.` : `${m.moveNo}...`;
  return `${num} ${m.san}${GLYPH[m.classification]}`;
}

function annotate(m: AnalyzedMove): string | undefined {
  const cls = m.classification;
  if (cls === 'Brilliant') return `Brilliant — ${m.san} finds the strongest resource in the position.`;
  if (cls === 'Great') return `Great — ${m.san} was essentially the only move to hold the line.`;
  if (cls === 'Blunder') return `Blunder — ${m.bestSan && m.bestSan !== m.san ? `${m.bestSan} was called for` : 'a costly slip'}, giving up ~${pawns(m.cpLoss)} pawns.`;
  if (cls === 'Mistake') return `Mistake — the engine preferred ${m.bestSan}, losing ~${pawns(m.cpLoss)} pawns.`;
  if (cls === 'Miss') return `Missed win — ${m.bestSan} kept a winning game; this let it slip.`;
  if (cls === 'Inaccuracy') return `Inaccuracy — ${m.bestSan} was more precise.`;
  return undefined;
}

/* ------------------------------- builder ------------------------------- */

export function buildDeepReport(report: GameReport, pgn: string): DeepReport {
  const moves = report.moves;
  const N = moves.length;

  // headers
  let whiteName = 'White', blackName = 'Black', event = '', date = '';
  try {
    const g = new Chess();
    g.loadPgn(pgn);
    const h = g.header();
    whiteName = h.White || whiteName;
    blackName = h.Black || blackName;
    event = h.Event || '';
    date = h.Date && h.Date !== '????.??.??' ? h.Date : '';
  } catch { /* keep defaults */ }

  const resultText =
    report.result === '1-0' ? `${whiteName} won` :
    report.result === '0-1' ? `${blackName} won` :
    report.result === '1/2-1/2' ? 'The game was drawn' : 'The game was left unfinished';

  // book / leaving theory
  let bookPlies = 0;
  while (bookPlies < N && moves[bookPlies].classification === 'Book') bookPlies++;
  const leftBook = bookPlies < N
    ? { moveNo: moves[bookPlies].moveNo, color: moves[bookPlies].color, san: moves[bookPlies].san }
    : undefined;

  // per-move report rows
  const rows: ReportMove[] = moves.map((m, i) => ({
    ply: m.ply, moveNo: m.moveNo, color: m.color, san: m.san, bestSan: m.bestSan,
    classification: m.classification, glyph: GLYPH[m.classification], cpLoss: m.cpLoss,
    evalWhite: +(m.cp / 100).toFixed(2), drop: dropOf(m),
    phase: phaseOf(m.moveNo, m.fenAfter),
    fenBefore: fenBeforeOf(moves, i), fenAfter: m.fenAfter,
    note: annotate(m),
  }));

  // graph markers
  const markers: GraphMarker[] = [];
  moves.forEach((m, i) => {
    const c = m.classification;
    if (c === 'Blunder' || c === 'Mistake' || c === 'Miss')
      markers.push({ index: i, ply: m.ply, color: m.color, classification: c, san: m.san, kind: 'error' });
    else if (c === 'Brilliant' || c === 'Great')
      markers.push({ index: i, ply: m.ply, color: m.color, classification: c, san: m.san, kind: 'brilliant' });
  });

  // critical moments
  const critical = buildCritical(moves, whiteName, blackName);
  const mistakes = critical.filter((c) => c.kind === 'error');

  // phases
  const phases = buildPhases(moves, report.evalSeries);

  // verdict + summary
  const { verdict, summary } = buildNarrative(report, moves, whiteName, blackName, resultText, critical);

  // opening summary
  const openingSummary = buildOpeningSummary(report.openingName, bookPlies, leftBook, whiteName, blackName);

  // takeaways
  const takeaways = {
    white: buildTakeaways('w', report.white, moves, phases, report.openingName),
    black: buildTakeaways('b', report.black, moves, phases, report.openingName),
  };

  // rough "page" estimate for the header badge
  const pageEstimate = Math.max(
    6,
    Math.round(3 + N / 10 + critical.length * 0.8 + phases.filter((p) => p.present).length),
  );

  return {
    whiteName, blackName, event, date, result: report.result, resultText,
    opening: report.openingName, bookPlies, leftBook,
    white: report.white, black: report.black,
    verdict, summary, openingSummary, phases, critical, moves: rows, mistakes,
    takeaways, evalSeries: report.evalSeries, markers, pageEstimate,
  };
}

function buildCritical(moves: AnalyzedMove[], whiteName: string, blackName: string): CriticalMoment[] {
  const errs = moves
    .map((m, i) => ({ m, i, drop: dropOf(m) }))
    .filter(({ m, drop }) => {
      const c = m.classification;
      if (c === 'Blunder' || c === 'Miss') return drop >= 4;
      if (c === 'Mistake') return drop >= 6;
      return drop >= 12;
    })
    .sort((a, b) => b.drop - a.drop)
    .slice(0, 6);

  const brilliants = moves
    .map((m, i) => ({ m, i }))
    .filter(({ m }) => m.classification === 'Brilliant' || m.classification === 'Great')
    .slice(0, 3);

  const all = [...errs, ...brilliants].sort((a, b) => a.i - b.i);

  return all.map(({ m, i }) => {
    const side: 'White' | 'Black' = m.color === 'w' ? 'White' : 'Black';
    const kind: 'error' | 'brilliant' = m.classification === 'Brilliant' || m.classification === 'Great' ? 'brilliant' : 'error';
    const evalBefore = i === 0 ? 0 : +(moves[i - 1].cp / 100).toFixed(2);
    const evalAfter = +(m.cp / 100).toFixed(2);
    const name = m.color === 'w' ? whiteName : blackName;

    let explanation: string;
    if (kind === 'brilliant') {
      explanation =
        `${name} finds ${classWord(m.classification)}. ${m.san} keeps ${side.toLowerCase()} on top` +
        ` — after it, ${assessWhite(evalAfter)} (${signed(evalAfter)}).`;
    } else {
      const bestClause = m.bestSan && m.bestSan !== m.san ? ` The engine preferred ${m.bestSan}.` : '';
      explanation =
        `${name} ${standBefore(m.winPctBefore)}, but ${m.san} ${errorVerb(m.classification)}` +
        ` — about ${pawns(m.cpLoss)} pawns gone.${bestClause}` +
        ` The evaluation swings to ${signed(evalAfter)} (${assessWhite(evalAfter)}).`;
    }

    return {
      ply: m.ply, moveNo: m.moveNo, color: m.color, side,
      san: m.san, bestSan: m.bestSan, classification: m.classification, kind,
      drop: dropOf(m), cpLoss: m.cpLoss, evalBefore, evalAfter,
      fenBefore: fenBeforeOf(moves, i), fenAfter: m.fenAfter,
      headline: `${moveLabel(m)} — ${classWord(m.classification)}`,
      explanation,
    };
  });
}

function buildPhases(moves: AnalyzedMove[], series: number[]): PhaseReport[] {
  const order: Phase[] = ['Opening', 'Middlegame', 'Endgame'];
  const tagged = moves.map((m) => ({ m, phase: phaseOf(m.moveNo, m.fenAfter) }));

  return order.map((phase) => {
    const inPhase = tagged.filter((t) => t.phase === phase);
    if (inPhase.length === 0) {
      return { phase, present: false, fromMoveNo: 0, toMoveNo: 0, whiteAcpl: 0, blackAcpl: 0, whiteBlunders: 0, blackBlunders: 0, startEval: 50, endEval: 50, narrative: '' };
    }
    const plies = inPhase.map((t) => t.m.ply);
    const firstPly = Math.min(...plies), lastPly = Math.max(...plies);
    const w = inPhase.filter((t) => t.m.color === 'w');
    const b = inPhase.filter((t) => t.m.color === 'b');
    const acpl = (arr: typeof inPhase) => (arr.length ? Math.round(arr.reduce((s, t) => s + t.m.cpLoss, 0) / arr.length) : 0);
    const blun = (arr: typeof inPhase) => arr.filter((t) => t.m.classification === 'Blunder' || t.m.classification === 'Miss').length;
    const startEval = series[firstPly - 2] ?? 50;
    const endEval = series[lastPly - 1] ?? 50;

    const worst = [...inPhase].sort((a, c) => dropOf(c.m) - dropOf(a.m))[0];
    const swing = Math.round(endEval - startEval);
    const trend =
      swing >= 12 ? 'White seized the initiative' :
      swing <= -12 ? 'Black took over' :
      'the balance held';
    let narrative = `Moves ${inPhase[0].m.moveNo}–${inPhase[inPhase.length - 1].m.moveNo}: ${trend} (White ${Math.round(startEval)}% → ${Math.round(endEval)}% win chance).`;
    if (worst && dropOf(worst.m) >= 8) {
      narrative += ` The defining error was ${moveLabel(worst.m)} by ${worst.m.color === 'w' ? 'White' : 'Black'}.`;
    } else {
      narrative += ' Both sides navigated it accurately.';
    }

    return {
      phase, present: true, fromMoveNo: inPhase[0].m.moveNo, toMoveNo: inPhase[inPhase.length - 1].m.moveNo,
      whiteAcpl: acpl(w), blackAcpl: acpl(b), whiteBlunders: blun(w), blackBlunders: blun(b),
      startEval, endEval, narrative,
    };
  });
}

function buildOpeningSummary(
  opening: string, bookPlies: number,
  leftBook: DeepReport['leftBook'], _whiteName: string, _blackName: string,
): string {
  const bookMoves = Math.ceil(bookPlies / 2);
  const base = opening && opening !== 'Unknown opening'
    ? `The game opened with the ${opening}`
    : 'The opening did not match a known main line in our book';
  const depth = bookPlies > 0 ? `, following theory for ${bookMoves} move${bookMoves === 1 ? '' : 's'}` : '';
  const leave = leftBook
    ? `. ${leftBook.color === 'w' ? 'White' : 'Black'} was first to leave theory with ${leftBook.moveNo}${leftBook.color === 'w' ? '.' : '...'} ${leftBook.san}.`
    : '.';
  return `${base}${depth}${leave}`;
}

function buildNarrative(
  report: GameReport, moves: AnalyzedMove[],
  whiteName: string, blackName: string, resultText: string, critical: CriticalMoment[],
): { verdict: string; summary: string[] } {
  const series = report.evalSeries;
  const maxWhite = series.length ? Math.max(...series) : 50;
  const maxBlack = series.length ? Math.min(...series) : 50;
  const finalEval = series.length ? series[series.length - 1] : 50;

  const swings: string[] = [];
  if (maxWhite >= 70) swings.push(`White reached ${maxWhite}% win chance`);
  if (maxBlack <= 30) swings.push(`Black got as high as ${100 - maxBlack}%`);

  const topError = critical.find((c) => c.kind === 'error');
  const decisive = topError
    ? `The turning point was ${moveLabel(topError)} by ${topError.side} — ${pawns(topError.cpLoss)} pawns in a single move.`
    : 'Neither side committed a decisive error; it stayed a fair fight throughout.';

  const verdict =
    `${whiteName} (${report.white.accuracy}%) vs ${blackName} (${report.black.accuracy}%) — ${resultText}. ${decisive}`;

  const summary: string[] = [];
  summary.push(
    `${whiteName} played with ${report.white.accuracy}% accuracy (${report.white.acpl} average centipawn loss); ` +
    `${blackName} scored ${report.black.accuracy}% (${report.black.acpl}). ` +
    (swings.length ? `Momentum shifted through the game — ${swings.join(', ')}. ` : `The evaluation stayed close for long stretches. `) +
    `The result: ${resultText}.`,
  );
  const wErr = report.white.blunder + report.white.miss + report.white.mistake;
  const bErr = report.black.blunder + report.black.miss + report.black.mistake;
  summary.push(
    `Across the game White made ${wErr} significant error${wErr === 1 ? '' : 's'} ` +
    `(${report.white.blunder} blunder${report.white.blunder === 1 ? '' : 's'}, ${report.white.mistake} mistake${report.white.mistake === 1 ? '' : 's'}, ${report.white.miss} missed win${report.white.miss === 1 ? '' : 's'}) ` +
    `and Black made ${bErr} (${report.black.blunder} blunder${report.black.blunder === 1 ? '' : 's'}, ${report.black.mistake} mistake${report.black.mistake === 1 ? '' : 's'}, ${report.black.miss} missed win${report.black.miss === 1 ? '' : 's'}). ` +
    (finalEval >= 55 ? 'By the finish White was the one calling the shots.' : finalEval <= 45 ? 'By the finish Black held the reins.' : 'The finish was tight.'),
  );
  return { verdict, summary };
}

function buildTakeaways(
  color: 'w' | 'b', side: SideReport, moves: AnalyzedMove[], phases: PhaseReport[], opening: string,
): string[] {
  const out: string[] = [];
  const mine = moves.filter((m) => m.color === color);
  const label = color === 'w' ? 'White' : 'Black';

  if (side.blunder > 0)
    out.push(`Cut the blunders (${side.blunder} this game). Before every committal move, ask “what is my opponent threatening?”`);
  if (side.miss > 0)
    out.push(`You missed ${side.miss} winning chance${side.miss === 1 ? '' : 's'}. Drill tactics daily to convert advantages.`);

  const present = phases.filter((p) => p.present);
  const worstPhase = present
    .map((p) => ({ p, acpl: color === 'w' ? p.whiteAcpl : p.blackAcpl }))
    .sort((a, b) => b.acpl - a.acpl)[0];
  if (worstPhase && worstPhase.acpl > 30)
    out.push(`Your accuracy dipped most in the ${worstPhase.p.phase.toLowerCase()} (${worstPhase.acpl} avg cp loss). Focus study there.`);

  const bookOwn = mine.filter((m) => m.classification === 'Book').length;
  if (bookOwn <= 2 && opening && opening !== 'Unknown opening')
    out.push(`You left ${opening} theory early — learning a few more book moves would give you a smoother start.`);

  if (side.accuracy >= 90) out.push(`Excellent ${side.accuracy}% accuracy — this was a clean, well-played game for ${label}.`);
  else if (side.accuracy >= 80 && out.length === 0) out.push(`Solid ${side.accuracy}% accuracy. Tighten the few loose moments and you're at expert precision.`);

  if (out.length === 0) out.push(`Keep playing principled chess — nothing major to fix for ${label} in this game.`);
  return out.slice(0, 4);
}
