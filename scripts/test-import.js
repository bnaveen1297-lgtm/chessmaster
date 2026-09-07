/* Tests for the Chess.com/Lichess PGN import parsers (pure functions).
   The network fetchers are not exercised here. */
const { splitPgnGames, parseTags, pgnToImported } = require('../.tsc-test/importGames.js');

let passed = 0;
let failed = 0;
const ok = (name, cond) => { cond ? passed++ : (failed++, console.error('  ✗ ' + name)); };
const eq = (name, a, b) => ok(`${name} (got ${JSON.stringify(a)})`, JSON.stringify(a) === JSON.stringify(b));

const G1 = `[Event "Rated Blitz game"]
[Site "https://lichess.org/abc123"]
[White "alice"]
[Black "bob"]
[Result "1-0"]
[UTCDate "2026.08.01"]

1. e4 e5 2. Nf3 Nc6 3. Bb5 a6 1-0`;

const G2 = `[Event "Rated Bullet game"]
[Site "https://lichess.org/def456"]
[White "carol"]
[Black "dave"]
[Result "0-1"]
[UTCDate "2026.08.02"]

1. d4 d5 2. c4 e6 0-1`;

// ---- splitPgnGames ----
eq('empty → []', splitPgnGames(''), []);
eq('single game → 1', splitPgnGames(G1).length, 1);
const two = splitPgnGames(`${G1}\n\n${G2}`);
eq('two games → 2', two.length, 2);
ok('crlf handled', splitPgnGames(G1.replace(/\n/g, '\r\n')).length === 1);
ok('first game keeps its Event tag', two[0].includes('[Event "Rated Blitz game"]'));
ok('second game keeps its Event tag', two[1].includes('[Event "Rated Bullet game"]'));

// ---- parseTags ----
const t = parseTags(G1);
eq('White tag', t.White, 'alice');
eq('Black tag', t.Black, 'bob');
eq('Result tag', t.Result, '1-0');
eq('UTCDate tag', t.UTCDate, '2026.08.01');

// ---- pgnToImported ----
const imp = pgnToImported(G2, 'lichess', 'x1');
eq('imported id', imp.id, 'x1');
eq('imported source', imp.source, 'lichess');
eq('imported white', imp.white, 'carol');
eq('imported black', imp.black, 'dave');
eq('imported result', imp.result, '0-1');
ok('imported keeps pgn', imp.pgn.includes('1. d4 d5'));

// missing tags fall back gracefully
const bare = pgnToImported('1. e4 e5 *', 'chesscom');
eq('bare white default', bare.white, 'White');
eq('bare result default', bare.result, '*');

console.log(`\nImport parsers: ${passed} passed, ${failed} failed`);
process.exit(failed === 0 ? 0 : 1);
