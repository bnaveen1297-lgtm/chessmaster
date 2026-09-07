/* Tests for the Lichess puzzle converter (pure). Builds a self-consistent
   synthetic Lichess row with chess.js, then checks rowToPuzzle reconstructs the
   post-setup FEN and the SAN solution. Also checks CSV parsing + daily. */
const { Chess } = require('chess.js');
const { parseCsvLine, rowToPuzzle, dailyToPuzzle } = require('../.tsc-test/services/lichessPuzzle.js');

let passed = 0, failed = 0;
const ok = (name, cond) => { cond ? passed++ : (failed++, console.error('  ✗ ' + name)); };
const eq = (name, a, b) => ok(`${name} (got ${JSON.stringify(a)})`, JSON.stringify(a) === JSON.stringify(b));

// --- build a synthetic Ruy López position ---
const setup = new Chess();
['e4', 'e5', 'Nf3', 'Nc6', 'Bb5'].forEach((m) => setup.move(m));
const fen = setup.fen(); // position BEFORE the setup move (Black to move)

// setup move a6, then solver line Ba4, Nf6, O-O (tests castling UCI e1g1)
const uci = ['a7a6', 'b5a4', 'g8f6', 'e1g1'];
const row = { id: 'synthetic', fen, moves: uci.join(' '), rating: 1500, themes: 'fork middlegame short', gameUrl: '' };

// independent expected values via chess.js
const g = new Chess(fen);
g.move({ from: 'a7', to: 'a6' });
const expectedFen = g.fen();
const expectedSolution = [];
for (const u of uci.slice(1)) {
  const mv = g.move({ from: u.slice(0, 2), to: u.slice(2, 4), promotion: u[4] });
  expectedSolution.push(mv.san);
}

const p = rowToPuzzle(row);
ok('rowToPuzzle returns a puzzle', !!p);
eq('puzzle fen = after setup move', p.fen, expectedFen);
eq('solution SAN correct (incl castling)', p.solution, expectedSolution);
ok('solution includes O-O', p.solution.includes('O-O'));
eq('difficulty from rating 1500', p.difficulty, 'Intermediate');
ok('theme prettified', typeof p.theme === 'string' && p.theme.length > 0);

// --- promotion handling --- (Black to move sets up, White solves with a8=Q)
const prow = { id: 'promo', fen: '8/P6k/8/8/8/8/7K/8 b - - 0 1', moves: 'h7g6 a7a8q', rating: 900, themes: 'promotion', gameUrl: '' };
const pp = rowToPuzzle(prow);
ok('promotion puzzle parses', !!pp);
ok('promotion SAN has =Q', pp && pp.solution.some((s) => s.includes('=Q')));

// --- illegal row → null (robustness) ---
ok('illegal setup move → null', rowToPuzzle({ id: 'bad', fen: '8/P6k/8/8/8/8/7K/8 b - - 0 1', moves: 'a1a8 x', rating: 1, themes: '', gameUrl: '' }) === null);

// --- CSV parsing ---
const line = '00abc,' + fen + ',' + uci.join(' ') + ',1777,75,90,1234,pin endgame,https://lichess.org/x#5,';
const parsed = parseCsvLine(line);
eq('csv id', parsed.id, '00abc');
eq('csv rating', parsed.rating, 1777);
eq('csv themes', parsed.themes, 'pin endgame');
ok('bad csv → null', parseCsvLine('too,few') === null);

// --- daily ---
const dgame = new Chess();
['e4', 'e5', 'Nf3', 'Nc6', 'Bc4', 'Bc5', 'b4'].forEach((m) => dgame.move(m));
const dpgn = dgame.pgn();
// after 5 plies (e4 e5 Nf3 Nc6 Bc4) it's Black to move; solver plays Bc5 (f8c5)
const daily = dailyToPuzzle({ id: 'D1', pgn: dpgn, initialPly: 5, solutionUci: ['f8c5'], rating: 1600, themes: ['opening'] });
ok('daily parses', !!daily);
ok('daily solution non-empty', daily && daily.solution.length === 1);

console.log(`\nPuzzle DB converter: ${passed} passed, ${failed} failed`);
process.exit(failed === 0 ? 0 : 1);
