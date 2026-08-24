/**
 * Verifies every puzzle solution in src/data/puzzles.ts using chess.js.
 *  - kind 'mate': the solution move must be checkmate.
 *  - kind 'win': the solution move must capture an undefended piece.
 * Run: npm run verify:puzzles   (also runnable in CI)
 */
const { Chess } = require('chess.js');
const fs = require('fs');
const path = require('path');

const src = fs.readFileSync(path.join(__dirname, '..', 'src', 'data', 'puzzles.ts'), 'utf8');

// Extract the puzzle object literals without importing TS.
const re = /\{\s*id:\s*'([^']+)'[^}]*?kind:\s*'([^']+)'[^}]*?fen:\s*'([^']+)'[^}]*?solution:\s*\[([^\]]*)\]\s*\}/g;
let m;
let count = 0;
let failed = 0;
while ((m = re.exec(src)) !== null) {
  const [, id, kind, fen, sol] = m;
  const moves = sol.split(',').map((s) => s.trim().replace(/^'|'$/g, '')).filter(Boolean);
  const game = new Chess(fen);
  let move;
  try {
    move = game.move(moves[0]);
  } catch (e) {
    console.error(`FAIL ${id}: illegal move ${moves[0]}`);
    failed++;
    continue;
  }
  if (kind === 'mate') {
    if (!game.isCheckmate()) {
      console.error(`FAIL ${id}: ${moves[0]} is not checkmate`);
      failed++;
      continue;
    }
  } else if (kind === 'win') {
    if (!move.captured) {
      console.error(`FAIL ${id}: ${moves[0]} is not a capture`);
      failed++;
      continue;
    }
    const recapture = game.moves({ verbose: true }).some((mv) => mv.to === move.to);
    if (recapture) {
      console.error(`FAIL ${id}: captured piece on ${move.to} is defended`);
      failed++;
      continue;
    }
  }
  count++;
}

if (count === 0) {
  console.error('No puzzles parsed — check the regex / data format.');
  process.exit(1);
}
if (failed > 0) {
  console.error(`\n${failed} puzzle(s) failed verification.`);
  process.exit(1);
}
console.log(`All ${count} puzzles verified.`);
