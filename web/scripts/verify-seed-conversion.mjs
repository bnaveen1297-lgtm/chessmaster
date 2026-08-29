// Confirms every seeded DB row converts, via the REAL app converter
// (src/services/lichessPuzzle.rowToPuzzle), into a puzzle whose solution line is
// fully playable — and that mate puzzles end in checkmate. This is exactly what
// the Puzzle solver relies on when the row comes back from random_puzzle().
import { build } from 'esbuild';
import { execSync } from 'node:child_process';
import { Chess } from '/home/user/chessmaster/web/node_modules/chess.js/dist/cjs/chess.js';
import assert from 'node:assert/strict';

// Bundle the pure converter (aliasing chess.js to the web copy).
const out = await build({
  entryPoints: ['/home/user/chessmaster/src/services/lichessPuzzle.ts'],
  bundle: true, format: 'esm', write: false,
  alias: { 'chess.js': '/home/user/chessmaster/web/node_modules/chess.js' },
  logLevel: 'silent',
});
const mod = await import('data:text/javascript;base64,' + Buffer.from(out.outputFiles[0].text).toString('base64'));
const { rowToPuzzle } = mod;

const rows = JSON.parse(execSync('node scripts/gen-puzzles.mjs', { encoding: 'utf8' }));

let pass = 0;
for (const r of rows) {
  const p = rowToPuzzle({ id: r.id, fen: r.fen, moves: r.moves, rating: r.rating, themes: r.themes });
  assert.ok(p, `${r.id}: rowToPuzzle returned null`);
  // Replay the solution on the puzzle position exactly as the solver does.
  const g = new Chess(p.fen);
  for (const san of p.solution) {
    const mv = g.move(san);
    assert.ok(mv, `${r.id}: solution move ${san} illegal`);
  }
  if (p.kind === 'mate') assert.ok(g.isCheckmate(), `${r.id}: mate puzzle not checkmate after solution`);
  pass++;
  console.log(`✓ ${r.id.padEnd(16)} ${p.kind.padEnd(5)} ${p.theme} — ${p.solution.join(' ')}`);
}
console.log(`\n${pass}/${rows.length} seeded rows convert & solve correctly ✓`);
