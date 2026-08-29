// Build a large, themed puzzle library for the curriculum.
//
// Sources, in order of preference:
//   1) Real Lichess puzzles (CC0) reachable from here — TBestLittleHelper/fetchcake
//      and den-run-ai/chessy — genuine rated, human-tagged puzzles.
//   2) Correct-by-construction generated puzzles to fill thin themes and add a
//      Beginner tier the real subset lacks. Every generated puzzle is verified
//      with chess.js (mates must be checkmate; material wins must capture an
//      undefended piece), so nothing invalid can enter the DB.
//
// Output: verified rows in Lichess format (FEN before a setup move; UCI moves,
// first = setup) → JSON on stdout, plus a per-theme/per-band summary on stderr.
//
// Run: node scripts/build-puzzle-library.mjs > out.json         (full)
//      SUMMARY=1 node scripts/build-puzzle-library.mjs          (counts only)
import { Chess } from '/home/user/chessmaster/web/node_modules/chess.js/dist/cjs/chess.js';

const FILES = 'abcdefgh';
const sq = (f, r) => FILES[f] + r;              // f:0..7, r:1..8
const other = (c) => (c === 'w' ? 'b' : 'w');

// ---- FEN construction from a piece map ------------------------------------
function toFen(pieces, side) {
  // pieces: Map "e4" -> "Q"/"q" etc. (uppercase = white)
  let rows = [];
  for (let r = 8; r >= 1; r--) {
    let row = '', empty = 0;
    for (let f = 0; f < 8; f++) {
      const p = pieces.get(sq(f, r));
      if (p) { if (empty) { row += empty; empty = 0; } row += p; }
      else empty++;
    }
    if (empty) row += empty;
    rows.push(row);
  }
  return `${rows.join('/')} ${side} - - 0 1`;
}

function applyUci(g, uci) {
  try { return g.move({ from: uci.slice(0, 2), to: uci.slice(2, 4), promotion: uci.length > 4 ? uci[4] : undefined }); }
  catch { return null; }
}

// ---- Verification (mirrors the app's rowToPuzzle contract) ----------------
function verify(row) {
  const uci = row.moves.trim().split(/\s+/);
  if (uci.length < 2) return false;
  const g = new Chess();
  try { g.load(row.fen); } catch { return false; }
  if (!applyUci(g, uci[0])) return false;               // setup (opponent)
  const first = applyUci(g, uci[1]);                     // solver's first move
  if (!first) return false;
  let winsMaterial = false;
  if (first.captured) winsMaterial = !g.moves({ verbose: true }).some((m) => m.to === first.to);
  for (let i = 2; i < uci.length; i++) if (!applyUci(g, uci[i])) return false;
  const tokens = row.themes.split(/\s+/);
  const isMate = tokens.some((t) => t === 'mate' || t === 'backRankMate' || t === 'smotheredMate' || t.startsWith('mateIn'));
  if (isMate) return g.isCheckmate();
  if (tokens.includes('hangingPiece')) return winsMaterial;
  return true;
}

const seenFen = new Set();
const out = [];
let gid = 0;
function add(fen, moves, rating, themes, idPrefix = 'gen') {
  const key = fen.split(' ')[0];
  if (seenFen.has(key)) return false;
  const row = { id: `${idPrefix}-${gid++}`, fen, moves, rating, themes };
  if (!verify(row)) return false;
  seenFen.add(key);
  out.push(row);
  return true;
}

// A rating within a band, so generated puzzles spread across difficulties.
const BANDS = { beginner: [700, 1250], intermediate: [1300, 1850], advanced: [1900, 2400] };
const rnd = (a, b) => a + Math.floor(Math.random() * (b - a + 1));
const bandRating = (band) => rnd(BANDS[band][0], BANDS[band][1]);

// ---------------------------------------------------------------------------
// Generators
// ---------------------------------------------------------------------------

// Back-rank mate (mate in 1): king boxed by its three shield pawns; a rook or
// queen swings to the back rank. Mirrored for both colors. Setup = a harmless
// spare-pawn push on the far wing.
function genBackrank(target) {
  let made = 0;
  const heavies = ['R', 'Q'];
  for (const white of [true, false]) {
    const mateRank = white ? 8 : 1;       // rank the enemy king sits on
    const shieldRank = white ? 7 : 2;
    const spareRank = white ? 7 : 2;
    const pawn = white ? 'p' : 'P';       // enemy (mated) pawns
    const kEnemy = white ? 'k' : 'K';
    const kOwn = white ? 'K' : 'k';
    // Own-king parking squares (own back two ranks), rotated for FEN variety.
    const parks = [];
    for (const f of [7, 6, 5, 4, 0, 1]) for (const rr of (white ? [1, 2] : [8, 7])) parks.push(sq(f, rr));
    for (const white2 of [white]) void white2;
    for (let kf = 1; kf <= 6; kf++) {     // enemy king file b..g
      for (const heavy of heavies) {
        for (let rf = 1; rf <= 7; rf++) {  // heavy piece file (a-file kept for spare pawn)
          if (Math.abs(rf - kf) < 2) continue;       // king could capture adjacent
          for (let startRank = white ? 1 : 8, steps = 0; steps < 6; steps += 1, startRank += white ? 1 : -1) {
            if (startRank === mateRank) break;         // must be able to move to the 8th
            for (const park of parks) {
              if (made >= target) return made;
              if (park[0] === FILES[rf]) continue;     // don't block the heavy's file
              const heavySq = sq(rf, startRank);
              if (park === heavySq) continue;
              const pieces = new Map();
              pieces.set(sq(kf, mateRank), kEnemy);
              for (const df of [-1, 0, 1]) { const f = kf + df; if (f >= 0 && f <= 7) pieces.set(sq(f, shieldRank), pawn); }
              const spareFrom = sq(0, spareRank), spareTo = sq(0, white ? 6 : 3);
              pieces.set(spareFrom, pawn);
              pieces.set(park, kOwn);
              pieces.set(heavySq, white ? heavy : heavy.toLowerCase());
              const fen = toFen(pieces, white ? 'b' : 'w');
              if (add(fen, `${spareFrom}${spareTo} ${heavySq}${sq(rf, mateRank)}`, bandRating('beginner'), 'backRankMate mate mateIn1 short', 'gen-br')) made++;
            }
          }
        }
      }
    }
  }
  return made;
}

// Smothered mate: enemy king in the corner, boxed by a rook and two pawns; a
// knight delivers Nf7#/Nc2#-style mate. A handful of corner/knight variants,
// each mirrored, with a spare pawn for the setup.
function genSmother(target) {
  let made = 0;
  // white mates black in the h8 corner: k h8, r g8, pawns g7 h7; knight from g5/e5/f5? use g5 & e5.
  const layouts = [
    { king: 'h8', rook: 'g8', pawns: ['g7', 'h7'], from: ['g5', 'e5'], to: 'f7', side: 'b', spare: ['a7', 'a6'], own: 'K', k: 'k', r: 'r', p: 'p', n: 'N' },
    { king: 'a8', rook: 'b8', pawns: ['a7', 'b7'], from: ['b5', 'd5'], to: 'c7', side: 'b', spare: ['h7', 'h6'], own: 'K', k: 'k', r: 'r', p: 'p', n: 'N' },
    { king: 'h1', rook: 'g1', pawns: ['g2', 'h2'], from: ['g4', 'e4'], to: 'f2', side: 'w', spare: ['a2', 'a3'], own: 'k', k: 'K', r: 'R', p: 'P', n: 'n' },
    { king: 'a1', rook: 'b1', pawns: ['a2', 'b2'], from: ['b4', 'd4'], to: 'c2', side: 'w', spare: ['h2', 'h3'], own: 'k', k: 'K', r: 'R', p: 'P', n: 'n' },
  ];
  // Vary the own-king square to multiply legal, distinct positions.
  const ownSquares = [];
  for (const f of 'cdef') for (const r of [3, 4, 5, 6]) ownSquares.push(f + r);
  ownSquares.push('d2', 'e2', 'd7', 'e7', 'c2', 'f2', 'c7', 'f7');
  for (const L of layouts) {
    for (const from of L.from) {
      for (const ok of ownSquares) {
        if (made >= target) return made;
        if ([L.king, L.rook, ...L.pawns, from, L.spare[0]].includes(ok)) continue;
        const pieces = new Map();
        pieces.set(L.king, L.k); pieces.set(L.rook, L.r);
        for (const p of L.pawns) pieces.set(p, L.p);
        pieces.set(L.spare[0], L.p);
        pieces.set(from, L.n);
        pieces.set(ok, L.own);
        const fen = toFen(pieces, L.side);
        if (add(fen, `${L.spare[0]}${L.spare[1]} ${from}${L.to}`, bandRating('intermediate'), 'smotheredMate mate mateIn1 short knight', 'gen-sm')) made++;
      }
    }
  }
  return made;
}

// Hanging piece: the opponent's setup parks a knight/bishop on a file or rank a
// rook covers, undefended; the solver just takes it. Massively parametrizable.
function genHanging(target) {
  let made = 0;
  for (const white of [true, false]) {
    const rookChar = white ? 'R' : 'r';
    const enemyKingChar = white ? 'k' : 'K';
    const ownKingChar = white ? 'K' : 'k';
    const side = white ? 'b' : 'w';         // enemy to move (parks the piece)
    const victims = white
      ? [['n', (f, r) => knightSquares(f, r)], ['b', diagFroms], ['r', (f, r) => rankFroms(f, r)]]
      : [['N', (f, r) => knightSquares(f, r)], ['B', diagFroms], ['R', (f, r) => rankFroms(f, r)]];
    for (const [victimChar, fromsFn] of victims) {
      for (let rf = 0; rf <= 7; rf++) {       // rook file
        for (let vr = 3; vr <= 6; vr++) {     // victim rank (mid-board)
          const targetSq = sq(rf, vr);
          for (const [ff, fr] of fromsFn(rf, vr)) {
            if (made >= target) return made;
            const fromSq = sq(ff, fr);
            const rookSq = sq(rf, white ? 1 : 8);
            if (fromSq === rookSq || fromSq === targetSq) continue;
            for (const pk of [3, 4, 2, 5]) {          // own-king file offset → FEN variety
              const ek = sq((rf + 4) % 8, white ? 8 : 1);
              const owk = sq((rf + pk) % 8, white ? 1 : 8);
              if (new Set([targetSq, fromSq, ek, owk, rookSq]).size < 5) continue;
              const pieces = new Map();
              pieces.set(rookSq, rookChar);
              pieces.set(fromSq, victimChar);
              pieces.set(ek, enemyKingChar);
              pieces.set(owk, ownKingChar);
              const fen = toFen(pieces, side);
              if (add(fen, `${fromSq}${targetSq} ${rookSq}${targetSq}`, bandRating('beginner'), 'hangingPiece advantage crushing oneMove', 'gen-hp')) { made++; break; }
            }
          }
        }
      }
    }
  }
  return made;
}
function knightSquares(f, r) {
  const d = [[1, 2], [2, 1], [-1, 2], [-2, 1], [1, -2], [2, -1], [-1, -2], [-2, -1]];
  return d.map(([a, b]) => [f + a, r + b]).filter(([a, b]) => a >= 0 && a <= 7 && b >= 1 && b <= 8);
}
function diagFroms(f, r) {
  const res = [];
  for (const [df, dr] of [[1, 1], [1, -1], [-1, 1], [-1, -1]]) for (let k = 1; k <= 3; k++) { const a = f + df * k, b = r + dr * k; if (a >= 0 && a <= 7 && b >= 1 && b <= 8) res.push([a, b]); }
  return res;
}
function rankFroms(f, r) {
  const res = [];
  for (let a = 0; a <= 7; a++) if (a !== f && Math.abs(a - f) >= 2) res.push([a, r]);   // arrive along the victim's rank
  return res;
}

// Basic supported queen mates (mate in 1): K+Q vs K on the edge, king shoulder
// supporting the queen. Enumerated over edge squares.
function genQueenMate(target) {
  let made = 0;
  // black king on the 8th rank; white king two ranks below supporting; queen
  // slides to the back rank beside the king.
  for (let kf = 1; kf <= 6; kf++) {
    for (const qf0 of [0, 1, 2, 3, 4, 5, 6, 7]) {
      if (made >= target) return made;
      // white king directly supports the mating square: place Wk on rank6 in front
      const bk = sq(kf, 8);
      const wk = sq(kf, 6);
      const mateSq = sq(kf, 7);         // Qk7# style, supported by Wk on kf6
      const qFrom = sq(qf0, 7);
      if ([bk, wk, mateSq].includes(qFrom)) continue;
      if (qf0 === kf) continue;
      const pieces = new Map();
      pieces.set(bk, 'k'); pieces.set(wk, 'K'); pieces.set(qFrom, 'Q');
      // black spare pawn far away for the setup move
      const spareFile = kf <= 3 ? 7 : 0;
      pieces.set(sq(spareFile, 7), 'p');
      if (sq(spareFile, 7) === qFrom) continue;
      const fen = toFen(pieces, 'b');
      const setup = sq(spareFile, 7) + sq(spareFile, 6);
      const mate = qFrom + mateSq;
      if (add(fen, `${setup} ${mate}`, bandRating('beginner'), 'mate mateIn1 queenEndgame short', 'gen-qm')) made++;
    }
  }
  return made;
}

// Knight fork of king + queen, winning the queen. Enumerated over fork squares.
function genFork(target) {
  let made = 0;
  for (const white of [true, false]) {
    const N = white ? 'N' : 'n';
    const K = white ? 'k' : 'K';   // enemy king
    const Q = white ? 'q' : 'Q';   // enemy queen
    const ownK = white ? 'K' : 'k';
    const side = white ? 'b' : 'w';
    for (let kf = 0; kf <= 7; kf++) {
      for (let kr = 6; kr <= 8; kr++) {
        if (white ? false : kr > 3) continue; // for black-mates-white keep enemy king low; simplify below
        // enemy king square
        const kingSq = sq(kf, white ? kr : 9 - kr);
        for (const [ff, frk] of knightSquares(kf, white ? kr : 9 - kr)) {
          // fork square attacks the king (check). We need it to also hit an enemy queen.
          const forkSq = sq(ff, frk);
          const qOptions = knightSquares(ff, frk).filter(([qf, qr]) => sq(qf, qr) !== kingSq);
          for (const [qf, qr] of qOptions) {
            if (made >= target) return made;
            const queenSq = sq(qf, qr);
            // knight starts a knight-move away from forkSq (and not onto king/queen)
            const froms = knightSquares(ff, frk).filter(([af, ar]) => {
              const s = sq(af, ar); return s !== kingSq && s !== queenSq;
            });
            if (!froms.length) continue;
            const [nf, nr] = froms[0];
            const nFrom = sq(nf, nr);
            const owk = sq((kf + 4) % 8, white ? 1 : 8);
            const cells = new Set([kingSq, queenSq, forkSq, nFrom, owk]);
            if (cells.size < 5) continue;
            const pieces = new Map();
            pieces.set(kingSq, K); pieces.set(queenSq, Q); pieces.set(nFrom, N); pieces.set(owk, ownK);
            // spare pawn for setup
            const spare = sq((kf + 2) % 8, white ? 7 : 2);
            if (cells.has(spare)) continue;
            pieces.set(spare, white ? 'p' : 'P');
            const fen = toFen(pieces, side);
            // sequence: setup (spare push), Nfork+ (check), king moves, Nxqueen
            const g = new Chess();
            try { g.load(fen); } catch { continue; }
            if (!applyUci(g, spare + sq((kf + 2) % 8, white ? 6 : 3))) continue;
            const forkMv = applyUci(g, nFrom + forkSq);
            if (!forkMv || !g.isCheck()) { continue; }
            // opponent king reply (any legal), then capture queen if still there
            const replies = g.moves({ verbose: true });
            let done = false;
            for (const rep of replies) {
              const gg = new Chess(g.fen());
              gg.move(rep.san);
              const cap = applyUci(gg, forkSq + queenSq);
              if (cap && cap.captured === 'q') {
                const setup = spare + sq((kf + 2) % 8, white ? 6 : 3);
                const moves = `${setup} ${nFrom + forkSq} ${rep.from + rep.to}${rep.promotion || ''} ${forkSq + queenSq}`;
                if (add(fen, moves, bandRating('intermediate'), 'fork knight advantage crushing', 'gen-fk')) { made++; done = true; }
                break;
              }
            }
            if (done) break;
          }
        }
      }
    }
  }
  return made;
}

// Absolute pin, then win the pinned piece. Our rook pins an enemy knight to its
// king on a file; our bishop (undefended target) captures the immobile knight.
function genPin(target) {
  let made = 0;
  for (const white of [true, false]) {
    const rookChar = white ? 'R' : 'r';
    const knightChar = white ? 'n' : 'N';   // enemy pinned knight
    const enemyKing = white ? 'k' : 'K';
    const bishopChar = white ? 'B' : 'b';
    const ownKing = white ? 'K' : 'k';
    const side = white ? 'b' : 'w';
    for (let kf = 1; kf <= 6; kf++) {
      const kingSq = sq(kf, white ? 8 : 1);
      for (let nr = white ? 5 : 4; white ? nr >= 4 : nr <= 5; nr += white ? -1 : 1) {
        const knightSq = sq(kf, nr);
        const rookSq = sq(kf, white ? 1 : 8);       // pins along the file
        for (const [bf, br] of diagFroms(kf, nr)) {  // bishop attacks the knight
          if (made >= target) return made;
          const bSq = sq(bf, br);
          for (const pk of [3, 4, 5]) {
            const owk = sq((kf + pk) % 8, white ? 1 : 8);
            const cells = new Set([kingSq, knightSq, rookSq, bSq, owk]);
            if (cells.size < 5) continue;
            // spare enemy pawn far away for the setup
            const spare = sq((kf + 4) % 8, white ? 7 : 2);
            const spareTo = sq((kf + 4) % 8, white ? 6 : 3);
            if (cells.has(spare)) continue;
            const pieces = new Map();
            pieces.set(kingSq, enemyKing); pieces.set(knightSq, knightChar);
            pieces.set(rookSq, rookChar); pieces.set(bSq, bishopChar);
            pieces.set(owk, ownKing); pieces.set(spare, white ? 'p' : 'P');
            const fen = toFen(pieces, side);
            if (add(fen, `${spare}${spareTo} ${bSq}${knightSq}`, bandRating('intermediate'), 'pin advantage crushing', 'gen-pn')) { made++; break; }
          }
        }
      }
    }
  }
  return made;
}

// Skewer: our bishop checks the enemy king along a diagonal with an enemy queen
// behind it; the king steps off and the queen falls.
function genSkewer(target) {
  let made = 0;
  for (const white of [true, false]) {
    const bishopChar = white ? 'B' : 'b';
    const enemyKing = white ? 'k' : 'K';
    const enemyQueen = white ? 'q' : 'Q';
    const ownKing = white ? 'K' : 'k';
    const side = white ? 'b' : 'w';
    // Diagonals as (df,dr). King in the middle, queen two beyond, bishop lands
    // one before the king (checking), starting a knight-ish hop off-diagonal.
    for (const [df, dr] of [[1, 1], [1, -1], [-1, 1], [-1, -1]]) {
      for (let kf = 1; kf <= 6; kf++) {
        for (let kr = 2; kr <= 7; kr++) {
          const bf = kf - df * 2, bRk = kr - dr * 2;         // bishop checks from 2 away (king can't take it)
          const qf = kf + df, qr = kr + dr;                  // queen one square behind the king
          if (![bf, qf].every((x) => x >= 0 && x <= 7)) continue;
          if (![bRk, qr].every((x) => x >= 1 && x <= 8)) continue;
          if (made >= target) return made;
          const kingSq = sq(kf, kr), qSq = sq(qf, qr), bCheck = sq(bf, bRk);
          // bishop origin: OFF the king's diagonal — one step along the other
          // diagonal through bCheck — so the move onto bCheck delivers the check
          // (the bishop isn't already attacking the king before the move).
          const boF = bf - df, boR = bRk + dr;
          if (boF < 0 || boF > 7 || boR < 1 || boR > 8) continue;
          const bFrom = sq(boF, boR);
          const owk = sq((kf + 4) % 8, white ? 1 : 8);
          const spare = sq((kf + 5) % 8, white ? 7 : 2);
          const spareTo = sq((kf + 5) % 8, white ? 6 : 3);
          const cells = new Set([kingSq, qSq, bCheck, bFrom, owk, spare]);
          if (cells.size < 6) continue;
          const pieces = new Map();
          pieces.set(kingSq, enemyKing); pieces.set(qSq, enemyQueen);
          pieces.set(bFrom, bishopChar); pieces.set(owk, ownKing); pieces.set(spare, white ? 'p' : 'P');
          const fen = toFen(pieces, side);
          const g = new Chess();
          try { g.load(fen); } catch { continue; }
          if (g.isCheck()) continue;                          // enemy shouldn't already be in check
          if (!applyUci(g, spare + spareTo)) continue;
          const chk = applyUci(g, bFrom + bCheck);
          if (!chk || !g.isCheck()) continue;
          const replies = g.moves({ verbose: true });
          let done = false;
          for (const rep of replies) {
            const gg = new Chess(g.fen());
            gg.move(rep.san);
            const cap = applyUci(gg, bCheck + qSq);
            if (cap && cap.captured === 'q') {
              const moves = `${spare}${spareTo} ${bFrom}${bCheck} ${rep.from}${rep.to}${rep.promotion || ''} ${bCheck}${qSq}`;
              if (add(fen, moves, bandRating('intermediate'), 'skewer bishop advantage crushing', 'gen-sk')) { made++; done = true; }
              break;
            }
          }
          if (done) continue;
        }
      }
    }
  }
  return made;
}

// ---------------------------------------------------------------------------
// Real puzzles (CC0 Lichess), fetched from reachable GitHub mirrors
// ---------------------------------------------------------------------------
async function fetchReal() {
  const rows = [];
  const base = 'https://raw.githubusercontent.com/TBestLittleHelper/fetchcake/master/src/assets/';
  for (const f of ['mite', 'fish', 'frog', 'rhino', 'camel']) {
    try {
      const r = await fetch(base + f + '.json');
      const j = await r.json();
      for (const p of j.puzzles || []) rows.push({ id: 'lichess-' + p.puzzleId, fen: p.fen, moves: p.moves, rating: p.rating, themes: p.themes || '' });
    } catch (e) { process.stderr.write(`fetch ${f} failed: ${e.message}\n`); }
  }
  try {
    const r = await fetch('https://raw.githubusercontent.com/den-run-ai/chessy/main/eval/corpus/sources/lichess-puzzles-v1.csv');
    const txt = await r.text();
    for (const line of txt.split('\n').slice(1)) {
      const c = line.split(',');
      if (c.length < 8) continue;
      const rating = parseInt(c[3], 10);
      if (!c[0] || !c[1] || !c[2] || Number.isNaN(rating)) continue;
      rows.push({ id: 'lichess-' + c[0], fen: c[1], moves: c[2], rating, themes: c[7] || '' });
    }
  } catch (e) { process.stderr.write(`fetch chessy failed: ${e.message}\n`); }
  return rows;
}

// ---------------------------------------------------------------------------
const TARGET = Number(process.env.TARGET || 1000);

const real = await fetchReal();
let realKept = 0;
for (const r of real) {
  const key = r.fen.split(' ')[0];
  if (seenFen.has(key)) continue;
  if (!verify(r)) continue;
  seenFen.add(key); out.push(r); realKept++;
}

const g = {
  backRankMate: genBackrank(TARGET),
  smotheredMate: genSmother(Math.min(TARGET, 600)),
  hangingPiece: genHanging(TARGET),
  queenMate: genQueenMate(500),
  fork: genFork(Math.min(TARGET, 700)),
  pin: genPin(TARGET),
  skewer: genSkewer(TARGET),
};

// Per curriculum-theme token counts (what random_puzzle(theme) will see).
function tokenCounts(rows) {
  const want = ['backRankMate', 'smotheredMate', 'mate', 'hangingPiece', 'fork', 'pin', 'skewer'];
  const c = Object.fromEntries(want.map((w) => [w, 0]));
  for (const r of rows) for (const t of r.themes.split(/\s+/)) if (t in c) c[t]++;
  return c;
}

if (process.env.SUMMARY) {
  process.stderr.write(`real kept: ${realKept} / ${real.length}\n`);
  process.stderr.write(`generated: ${JSON.stringify(g)}\n`);
  process.stderr.write(`total rows: ${out.length}\n`);
  process.stderr.write(`per-theme token counts: ${JSON.stringify(tokenCounts(out), null, 0)}\n`);
} else {
  process.stdout.write(JSON.stringify(out));
}
