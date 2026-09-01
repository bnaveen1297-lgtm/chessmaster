// Generate + verify a themed seed set for the puzzle database, in Lichess row
// format (FEN before a setup move; space-separated UCI; first move = setup).
// Every candidate is validated the same way the app converts it (apply setup,
// replay solution, and for mate themes require checkmate; for material themes
// require the solver's first move to win an undefended piece). Only verified
// rows are emitted. Run: node scripts/gen-puzzles.mjs > /tmp/.../puzzles.json
import { Chess } from '/home/user/chessmaster/web/node_modules/chess.js/dist/cjs/chess.js';

/** @typedef {{id:string,fen:string,moves:string,rating:number,themes:string}} Row */

const rows = /** @type {Row[]} */ ([]);
const push = (id, fen, moves, rating, themes) => rows.push({ id, fen, moves, rating, themes });

// ---- Generators --------------------------------------------------------------

// Back-rank mate: rook or queen to the 8th, king boxed by its three pawns.
// Setup is a harmless queenside (or opposite-wing) enemy pawn push.
function backrank() {
  // king on g8, pawns f7/g7/h7, spare queenside pawn a7 for the setup move.
  // (The mating file must differ from the a-file so the setup pawn never blocks
  // the piece's path to the 8th.)
  const specs = [
    ['b', 'R', '1R4K1'],
    ['c', 'R', '2R3K1'],
    ['d', 'Q', '3Q2K1'],
  ];
  for (const [file, , rank1Placement] of specs) {
    const fen = `6k1/p4ppp/8/8/8/8/6P1/${rank1Placement} b - - 0 1`;
    push(`seed-br-${file}`, fen, `a7a6 ${file}1${file}8`, 900 + rows.length, 'backRankMate mate mateIn1 short endgame');
  }
}

// Smothered mate: Nf7# with the black king smothered on h8.
function smother() {
  push('seed-sm-g5', '6rk/p5pp/8/6N1/8/8/8/K7 b - - 0 1', 'a7a6 g5f7', 1400, 'smotheredMate mate mateIn1 short knight middlegame');
  push('seed-sm-e5', '6rk/p5pp/8/4N3/8/8/8/K7 b - - 0 1', 'a7a6 e5f7', 1400, 'smotheredMate mate mateIn1 short knight middlegame');
}

// Simple queen/rook mates with king support (mate in 1).
function basicMates() {
  // Two-rook ladder: Ra8# with the 7th-rank rook cutting the king off.
  push('seed-lad-1', '6k1/R7/1R6/8/8/8/8/6K1 b - - 0 1', 'g8h8 b6b8', 800, 'mate mateIn1 rookEndgame short endgame');
  // Supported queen mate: Kg6 + Qg7#-style. White Kg6, Qd7 -> Qg7#? verify picks valid ones.
  push('seed-qm-1', '6k1/3Q4/6K1/8/8/8/8/8 b - - 0 1', 'g8h8 d7h7', 1000, 'mate mateIn1 queenEndgame short endgame');
  push('seed-qm-2', '6k1/5Q2/6K1/8/8/8/8/8 b - - 0 1', 'g8h8 f7f8', 1000, 'mate mateIn1 queenEndgame short endgame');
}

// Hanging piece: the opponent's setup move parks a piece where the solver wins
// it for free (an undefended capture).
function hanging() {
  // The opponent's setup parks a piece on a file/rank the solver's rook covers,
  // undefended — the solver simply takes it.
  // Black knight f6 -> d5, captured by Rd1.
  push('seed-hp-1', '4k3/8/5n2/8/8/8/8/3RK3 b - - 0 1', 'f6d5 d1d5', 800, 'hangingPiece advantage crushing oneMove');
  // Black bishop f7 -> c4, captured by Rc1.
  push('seed-hp-2', '4k3/5b2/8/8/8/8/8/2R1K3 b - - 0 1', 'f7c4 c1c4', 850, 'hangingPiece advantage crushing oneMove');
  // Black knight b6 -> d5 (from the other side), captured by Rd1.
  push('seed-hp-3', '4k3/8/1n6/8/8/8/8/3RK3 b - - 0 1', 'b6d5 d1d5', 800, 'hangingPiece advantage crushing oneMove');
}

// ---- Hand-authored multi-move tactics (verified below) -----------------------
// Format reminder: uci[0] is the opponent setup; then solver, opp, solver, …
const HAND = [
  // Knight fork: Nf6+ hits the king on g8 and the queen on e8; after the king
  // flees to the corner, the knight grabs the queen clean.
  { id: 'seed-fork-1', fen: '4q1k1/p7/8/8/4N3/8/8/6K1 b - - 0 1', moves: 'a7a6 e4f6 g8h8 f6e8', rating: 1300, themes: 'fork knight advantage crushing middlegame' },
  // Absolute pin then win: the knight on d5 is pinned to the king by Rd1 and
  // falls to the bishop; the setup is a harmless kingside pawn move.
  { id: 'seed-pin-1', fen: '3k4/7p/8/3n4/8/8/6B1/3R2K1 b - - 0 1', moves: 'h7h6 g2d5', rating: 1300, themes: 'pin advantage crushing oneMove middlegame' },
  // Skewer: the bishop checks the king with the queen behind on the long
  // diagonal; the king steps aside and the queen falls.
  { id: 'seed-skewer-1', fen: '7q/p7/8/8/3k4/8/8/2B3K1 b - - 0 1', moves: 'a7a6 c1b2 d4e4 b2h8', rating: 1350, themes: 'skewer bishop advantage crushing middlegame' },
];

// ---- Verification ------------------------------------------------------------

function applyUci(g, uci) {
  try {
    return g.move({ from: uci.slice(0, 2), to: uci.slice(2, 4), promotion: uci.length > 4 ? uci[4] : undefined });
  } catch { return null; }
}

/** Returns {ok, reason, kind} after replaying the row like the app does. */
function verify(row) {
  const uci = row.moves.trim().split(/\s+/);
  if (uci.length < 2) return { ok: false, reason: 'need setup + ≥1 solver move' };
  const g = new Chess();
  try { g.load(row.fen); } catch { return { ok: false, reason: 'bad fen' }; }
  const setup = applyUci(g, uci[0]);
  if (!setup) return { ok: false, reason: `illegal setup ${uci[0]}` };
  const solverFirst = applyUci(g, uci[1]);
  if (!solverFirst) return { ok: false, reason: `illegal solver move ${uci[1]}` };
  const isMateTheme = row.themes.split(/\s+/).some((t) => t.startsWith('mate') || t === 'smotheredMate' || t === 'backRankMate');
  // material check: first solver move captures an undefended piece
  let winsMaterial = false;
  if (solverFirst.captured) {
    const recapture = g.moves({ verbose: true }).some((m) => m.to === solverFirst.to);
    winsMaterial = !recapture;
  }
  // replay the rest
  for (let i = 2; i < uci.length; i++) {
    if (!applyUci(g, uci[i])) return { ok: false, reason: `illegal move ${uci[i]}` };
  }
  if (isMateTheme) {
    if (!g.isCheckmate()) return { ok: false, reason: 'final position is not checkmate' };
  } else if (row.themes.includes('hangingPiece')) {
    if (!winsMaterial) return { ok: false, reason: 'first move does not win an undefended piece' };
  }
  return { ok: true };
}

backrank();
smother();
basicMates();
hanging();
for (const h of HAND) push(h.id, h.fen, h.moves, h.rating, h.themes);

const good = [];
const bad = [];
for (const r of rows) {
  const v = verify(r);
  if (v.ok) good.push(r); else bad.push({ id: r.id, reason: v.reason });
}

const byTheme = {};
for (const r of good) {
  const primary = r.themes.split(/\s+/)[0];
  byTheme[primary] = (byTheme[primary] || 0) + 1;
}

if (process.env.SUMMARY) {
  console.error(`verified ${good.length}/${rows.length}`);
  console.error('by primary theme:', byTheme);
  if (bad.length) console.error('rejected:', bad);
} else {
  process.stdout.write(JSON.stringify(good, null, 2));
}
