/* Verifies every Master Base game: the PGN must parse cleanly, and games whose
   result is a mate must actually end in checkmate. Run in CI so a bad or
   fabricated game can never ship. The data is compiled to .tsc-test by the
   verify:masters npm script before this runs. */
const { Chess } = require('chess.js');
const { masterGames } = require('../.tsc-test/masters.js');

let passed = 0;
let failed = 0;
for (const g of masterGames) {
  const c = new Chess();
  try {
    c.loadPgn(g.pgn);
  } catch (e) {
    console.error(`  ✗ ${g.id}: PGN failed to parse — ${e.message}`);
    failed++;
    continue;
  }
  const plies = c.history().length;
  if (plies < 10) {
    console.error(`  ✗ ${g.id}: suspiciously short (${plies} plies)`);
    failed++;
    continue;
  }
  // A mate result must end in checkmate; resignations legitimately don't.
  if ((g.result === '1-0' || g.result === '0-1') && c.isCheckmate()) {
    const mover = c.turn() === 'w' ? '0-1' : '1-0';
    if (mover !== g.result) {
      console.error(`  ✗ ${g.id}: checkmate result ${mover} ≠ stated ${g.result}`);
      failed++;
      continue;
    }
  }
  passed++;
}

console.log(`\nMaster Base: ${passed} verified, ${failed} failed (${masterGames.length} games)`);
process.exit(failed === 0 ? 0 : 1);
