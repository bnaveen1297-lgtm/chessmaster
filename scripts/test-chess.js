/* Robust chess-logic test suite. Exercises chess.js rules, the engine
 * (src/engine/ai.ts), the analyzer, and helpers. Run: npm run test:chess
 * (compiles the TS engine to .tsc-test first — see package.json). */
const { Chess } = require('chess.js');
const ai = require('../.tsc-test/engine/ai.js');
const analyze = require('../.tsc-test/engine/analyze.js');
const helpers = require('../.tsc-test/game/chessHelpers.js');

let pass = 0, fail = 0;
const ok = (cond, name) => { if (cond) { pass++; } else { fail++; console.error('  ✗ ' + name); } };

console.log('— chess.js rules —');
{
  ok(new Chess().fen().startsWith('rnbqkbnr'), 'start position');

  // illegal move rejected
  let threw = false;
  try { new Chess().move({ from: 'e2', to: 'e5' }); } catch { threw = true; }
  ok(threw, 'illegal move rejected');

  // castling
  const c = new Chess('rnbqk2r/pppp1ppp/5n2/2b1p3/2B1P3/5N2/PPPP1PPP/RNBQK2R w KQkq - 4 4');
  const cast = c.move('O-O');
  ok(cast && c.get('g1')?.type === 'k' && c.get('f1')?.type === 'r', 'kingside castling');

  // en passant
  const ep = new Chess();
  ['e4', 'a6', 'e5', 'd5'].forEach((m) => ep.move(m));
  const epMove = ep.move({ from: 'e5', to: 'd6' });
  ok(!!epMove && epMove.flags.includes('e'), 'en passant capture');

  // promotion
  const pr = new Chess('8/P7/8/8/8/8/8/4K1k1 w - - 0 1');
  const prom = pr.move({ from: 'a7', to: 'a8', promotion: 'q' });
  ok(!!prom && pr.get('a8')?.type === 'q', 'promotion to queen');

  // fool's mate → checkmate
  const fm = new Chess();
  ['f3', 'e5', 'g4', 'Qh4#'].forEach((m) => fm.move(m));
  ok(fm.isCheckmate(), 'checkmate detected (fool\'s mate)');

  // stalemate
  ok(new Chess('7k/5Q2/6K1/8/8/8/8/8 b - - 0 1').isStalemate(), 'stalemate detected');

  // insufficient material
  ok(new Chess('8/8/8/4k3/8/4K3/8/8 w - - 0 1').isInsufficientMaterial(), 'insufficient material (K v K)');

  // threefold repetition
  const tf = new Chess();
  ['Nf3', 'Nf6', 'Ng1', 'Ng8', 'Nf3', 'Nf6', 'Ng1', 'Ng8'].forEach((m) => tf.move(m));
  ok(tf.isThreefoldRepetition(), 'threefold repetition');
}

console.log('— engine (bestMove / self-play) —');
{
  // finds forced mate-in-1
  const mates = [
    ['6k1/5ppp/8/8/8/8/8/R6K w - - 0 1', 'Ra8#'],
    ['6k1/5ppp/8/8/8/8/5PPP/3Q2K1 w - - 0 1', 'Qd8#'],
    ['6rk/6pp/8/6N1/8/8/8/6K1 w - - 0 1', 'Nf7#'],
  ];
  for (const [fen, mate] of mates) {
    const g = new Chess(fen);
    const mv = ai.bestMove(fen, 2);
    const applied = mv ? g.move(mv) : null;
    ok(!!applied && g.isCheckmate(), `engine finds mate ${mate} (got ${mv})`);
  }

  // never returns an illegal move across many random positions
  let illegal = 0;
  for (let i = 0; i < 40; i++) {
    const g = new Chess();
    // random opening walk
    for (let k = 0; k < 6; k++) {
      const ms = g.moves();
      if (!ms.length) break;
      g.move(ms[(i * 7 + k) % ms.length]);
    }
    if (g.isGameOver()) continue;
    const mv = ai.bestMove(g.fen(), 2);
    try { if (mv) g.move(mv); else illegal++; } catch { illegal++; }
  }
  ok(illegal === 0, 'engine never returns an illegal move (40 positions)');

  // full self-play games terminate legally
  let selfPlayOk = true;
  for (let game = 0; game < 3; game++) {
    const g = new Chess();
    let plies = 0;
    while (!g.isGameOver() && plies < 260) {
      const mv = ai.bestMove(g.fen(), 1);
      if (!mv) { selfPlayOk = false; break; }
      try { g.move(mv); } catch { selfPlayOk = false; break; }
      plies++;
    }
  }
  ok(selfPlayOk, 'engine self-play produces only legal moves to game end');

  ok(ai.moveScores(new Chess().fen(), 1).length === 20, 'moveScores returns all 20 opening moves');
}

console.log('— analyzer —');
{
  const rep = analyze.analyzeGame(analyze.SAMPLE_PGN, 2);
  const valid = new Set(['Best', 'Good', 'Inaccuracy', 'Mistake', 'Blunder']);
  ok(rep.white.accuracy >= 0 && rep.white.accuracy <= 100, 'white accuracy in [0,100]');
  ok(rep.black.accuracy >= 0 && rep.black.accuracy <= 100, 'black accuracy in [0,100]');
  ok(rep.moves.every((m) => valid.has(m.classification)), 'all moves have a valid classification');
  const nf6 = rep.moves.find((m) => m.san === 'Nf6');
  ok(nf6 && nf6.classification === 'Blunder', 'Scholar\'s-mate Nf6 flagged as Blunder');

  let threw = false;
  try { analyze.parsePgn('not a pgn at all'); } catch { threw = true; }
  ok(threw, 'invalid PGN rejected');
}

console.log('— helpers —');
{
  const g = new Chess();
  ['e4', 'e5', 'Bc4', 'Nc6', 'Qh5', 'Nf6', 'Qxf7'].forEach((m) => g.move(m)); // Qxf7#? checkmate
  ok(g.isCheckmate(), 'helper scenario reaches checkmate');
  const chk = new Chess('rnb1kbnr/pppp1ppp/8/4p3/6Pq/5P2/PPPPP2P/RNBQKBNR w KQkq - 1 3');
  ok(helpers.checkedKingSquare(chk) === 'e1', 'checkedKingSquare finds the checked king');
  ok(helpers.legalTargets(new Chess(), 'e2').sort().join(',') === 'e3,e4', 'legalTargets for e2 pawn');
  ok(helpers.isOwnPiece(new Chess(), 'e2') === true && helpers.isOwnPiece(new Chess(), 'e7') === false, 'isOwnPiece by side to move');
}

console.log('— puzzles (data integrity) —');
{
  const src = require('fs').readFileSync(__dirname + '/../src/data/puzzles.ts', 'utf8');
  const re = /kind:\s*'([^']+)'[^}]*?fen:\s*'([^']+)'[^}]*?solution:\s*\[([^\]]*)\]/g;
  let m, count = 0, bad = 0;
  while ((m = re.exec(src)) !== null) {
    const kind = m[1];
    const fen = m[2];
    const sol = m[3].split(',').map((s) => s.trim().replace(/^'|'$/g, '')).filter(Boolean);
    const g = new Chess(fen);
    let good = true;
    try {
      for (const san of sol) if (!g.move(san)) good = false;
    } catch { good = false; }
    if (kind === 'mate' && !g.isCheckmate()) good = false;
    if (!good) { bad++; }
    count++;
  }
  ok(count >= 10 && bad === 0, `all ${count} bundled puzzles have a legal, correct solution`);
}

console.log(`\n${pass} passed, ${fail} failed`);
process.exit(fail ? 1 : 0);
