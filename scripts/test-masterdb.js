/* Tests for the master-games DB row converter (pure). Verifies rowToMasterGame
   maps raw Supabase rows into the MasterGame shape the app renders, including
   result validation, year extraction, Elo annotation, and null-field defaults. */
const { rowToMasterGame, yearFrom } = require('../.tsc-test/services/masterRow.js');

let passed = 0, failed = 0;
const ok = (name, cond) => { cond ? passed++ : (failed++, console.error('  ✗ ' + name)); };
const eq = (name, a, b) => ok(`${name} (got ${JSON.stringify(a)})`, JSON.stringify(a) === JSON.stringify(b));

// --- a fully-populated row ---
const full = rowToMasterGame({
  id: 42,
  white: 'Magnus Carlsen',
  black: 'Fabiano Caruana',
  result: '1-0',
  event: 'World Championship',
  game_date: '2018.11.28',
  white_elo: 2835,
  black_elo: 2832,
  eco: 'B33',
  opening: 'Sicilian, Sveshnikov',
  pgn: '1. e4 c5 2. Nf3 *',
});
eq('id prefixed with db-', full.id, 'db-42');
eq('white', full.white, 'Magnus Carlsen');
eq('black', full.black, 'Fabiano Caruana');
eq('result kept', full.result, '1-0');
eq('year from game_date', full.year, 2018);
eq('event annotated with Elos', full.event, 'World Championship · 2835/2832');
eq('opening', full.opening, 'Sicilian, Sveshnikov');
eq('eco', full.eco, 'B33');
eq('themes empty', full.themes, []);
ok('pgn preserved', full.pgn === '1. e4 c5 2. Nf3 *');

// --- invalid result normalised to draw ---
eq('bad result → draw', rowToMasterGame({ id: 1, result: '*', pgn: 'x' }).result, '1/2-1/2');
eq('draw result kept', rowToMasterGame({ id: 2, result: '1/2-1/2', pgn: 'x' }).result, '1/2-1/2');
eq('0-1 kept', rowToMasterGame({ id: 3, result: '0-1', pgn: 'x' }).result, '0-1');

// --- null / missing fields get sensible defaults ---
const bare = rowToMasterGame({ id: 'abc', pgn: '1. d4 *' });
eq('missing white default', bare.white, 'White');
eq('missing black default', bare.black, 'Black');
eq('missing event default (no elos)', bare.event, 'Master game');
eq('missing opening default', bare.opening, 'Unknown');
eq('missing eco → undefined', bare.eco, undefined);
eq('missing date → year 0', bare.year, 0);

// --- Elo annotation only when BOTH present ---
eq('one elo missing → no annotation', rowToMasterGame({ id: 4, event: 'E', white_elo: 2700, pgn: 'x' }).event, 'E');

// --- yearFrom edge cases ---
eq('yearFrom null', yearFrom(null), 0);
eq('yearFrom garbage', yearFrom('????.??.??'), 0);
eq('yearFrom ISO', yearFrom('1972-07-11'), 1972);

console.log(`\nMaster DB converter: ${passed} passed, ${failed} failed`);
process.exit(failed === 0 ? 0 : 1);
