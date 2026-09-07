import { StockfishEngine } from '../src/engine/stockfish.ts';
import { analyzeGameEngine } from '../src/engine/engineAnalyze.ts';
import { SAMPLE_PGN } from '@shared/engine/analyze';

window.__run = async () => {
  const out = { steps: [] };
  const engine = new StockfishEngine();
  await engine.init();
  out.steps.push('engine initialised');

  // Sanity: evaluate the start position.
  const start = await engine.evaluate('rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR w KQkq - 0 1', { depth: 10, multipv: 2 });
  out.start = { cp: start.cp, bestUci: start.bestUci, nLines: start.lines.length };

  // Full engine review of the Scholar's-mate sample game.
  const report = await analyzeGameEngine(SAMPLE_PGN, engine, { depth: 10 });
  out.report = {
    nMoves: report.moves.length,
    result: report.result,
    whiteAcc: report.white.accuracy,
    blackAcc: report.black.accuracy,
    lastMove: report.moves[report.moves.length - 1],
    evalLast: report.evalSeries[report.evalSeries.length - 1],
    blackMistakes: report.black.mistake + report.black.blunder + report.black.miss,
    classes: report.moves.map((m) => `${m.san}:${m.classification}`),
  };
  engine.quit();
  return out;
};
