/* Tournament pairing tests. Run after compiling src/tournament/pairing.ts
   into .tsc-test (see the test:tournament npm script). */
const {
  roundRobinSchedule,
  knockoutFirstRound,
  pairWinners,
  seedOrder,
  nextPowerOfTwo,
  knockoutRounds,
} = require('../.tsc-test/pairing.js');

let passed = 0;
let failed = 0;
function ok(name, cond) {
  if (cond) {
    passed++;
  } else {
    failed++;
    console.error('  ✗ ' + name);
  }
}
function eq(name, a, b) {
  ok(name + ' (got ' + JSON.stringify(a) + ')', JSON.stringify(a) === JSON.stringify(b));
}

// ---- round-robin --------------------------------------------------------
(() => {
  const players = ['a', 'b', 'c', 'd'];
  const sched = roundRobinSchedule(players);
  eq('RR 4 players → 3 rounds', sched.length, 3);
  ok('RR 4 players → 2 games/round', sched.every((r) => r.pairings.length === 2));

  // every unordered pair appears exactly once, no self-pairings, no byes
  const seen = new Set();
  let byes = 0;
  let selfPair = 0;
  for (const rd of sched) {
    for (const p of rd.pairings) {
      if (p.black === null) byes++;
      if (p.white === p.black) selfPair++;
      seen.add([p.white, p.black].sort().join('-'));
    }
  }
  eq('RR 4 → all 6 pairs once', seen.size, 6);
  eq('RR 4 → no byes', byes, 0);
  eq('RR 4 → no self pairings', selfPair, 0);

  // each player plays every round exactly once
  for (const rd of sched) {
    const inRound = new Set();
    for (const p of rd.pairings) {
      inRound.add(p.white);
      inRound.add(p.black);
    }
    eq('RR 4 → all 4 play in round ' + rd.round, inRound.size, 4);
  }
})();

(() => {
  const players = ['a', 'b', 'c', 'd', 'e'];
  const sched = roundRobinSchedule(players);
  eq('RR 5 players → 5 rounds', sched.length, 5);
  // exactly one bye per round
  for (const rd of sched) {
    const byes = rd.pairings.filter((p) => p.black === null).length;
    eq('RR 5 → one bye in round ' + rd.round, byes, 1);
  }
  // each player gets exactly one bye across the schedule
  const byeCount = {};
  for (const rd of sched)
    for (const p of rd.pairings) if (p.black === null) byeCount[p.white] = (byeCount[p.white] || 0) + 1;
  ok('RR 5 → everyone byes once', players.every((pl) => byeCount[pl] === 1));

  // all 10 real pairings appear once
  const seen = new Set();
  for (const rd of sched)
    for (const p of rd.pairings) if (p.black) seen.add([p.white, p.black].sort().join('-'));
  eq('RR 5 → all 10 pairs once', seen.size, 10);
})();

(() => {
  // color balance: over a full RR, no player should be wildly lopsided
  const players = ['a', 'b', 'c', 'd', 'e', 'f'];
  const sched = roundRobinSchedule(players);
  const whites = {};
  const total = {};
  for (const rd of sched)
    for (const p of rd.pairings) {
      if (!p.black) continue;
      whites[p.white] = (whites[p.white] || 0) + 1;
      total[p.white] = (total[p.white] || 0) + 1;
      total[p.black] = (total[p.black] || 0) + 1;
    }
  const balanced = players.every((pl) => {
    const w = whites[pl] || 0;
    const t = total[pl] || 0;
    return Math.abs(w - (t - w)) <= 1; // at most 1 more of one colour
  });
  ok('RR 6 → colours balanced (±1)', balanced);
})();

// ---- knockout -----------------------------------------------------------
eq('nextPowerOfTwo(5)=8', nextPowerOfTwo(5), 8);
eq('nextPowerOfTwo(8)=8', nextPowerOfTwo(8), 8);
eq('nextPowerOfTwo(1)=1', nextPowerOfTwo(1), 1);
eq('seedOrder(2)', seedOrder(2), [1, 2]);
eq('seedOrder(4)', seedOrder(4), [1, 4, 2, 3]);
eq('seedOrder(8)', seedOrder(8), [1, 8, 4, 5, 2, 7, 3, 6]);
eq('knockoutRounds(8)=3', knockoutRounds(8), 3);
eq('knockoutRounds(5)=3', knockoutRounds(5), 3);

(() => {
  // 8 players, perfect power of two, no byes
  const players = ['s1', 's2', 's3', 's4', 's5', 's6', 's7', 's8'];
  const r1 = knockoutFirstRound(players);
  eq('KO 8 → 4 first-round games', r1.pairings.length, 4);
  ok('KO 8 → no byes', r1.pairings.every((p) => p.black !== null));
  // top seed meets bottom seed
  eq('KO 8 → board 1 is s1 vs s8', [r1.pairings[0].white, r1.pairings[0].black], ['s1', 's8']);
})();

(() => {
  // 5 players → bracket of 8, top 3 seeds get byes
  const players = ['s1', 's2', 's3', 's4', 's5'];
  const r1 = knockoutFirstRound(players);
  const byes = r1.pairings.filter((p) => p.black === null);
  const games = r1.pairings.filter((p) => p.black !== null);
  eq('KO 5 → 3 byes', byes.length, 3);
  eq('KO 5 → 1 real game', games.length, 1);
  // seeds 1,2,3 should be the ones with byes
  ok('KO 5 → seeds 1-3 bye', byes.map((p) => p.white).sort().join(',') === 's1,s2,s3');
  // the real game is s4 vs s5
  ok('KO 5 → s4 vs s5 play', games[0].white === 's4' && games[0].black === 's5');
})();

(() => {
  const r2 = pairWinners(['w1', 'w2', 'w3', 'w4'], 2);
  eq('pairWinners 4 → 2 games', r2.pairings.length, 2);
  eq('pairWinners → adjacent', [r2.pairings[0].white, r2.pairings[0].black], ['w1', 'w2']);
  const fin = pairWinners(['c1', 'c2'], 3);
  eq('pairWinners final → 1 game', fin.pairings.length, 1);
  eq('pairWinners champion → null', pairWinners(['champ'], 4), null);
})();

console.log(`\nTournament pairing: ${passed} passed, ${failed} failed`);
process.exit(failed === 0 ? 0 : 1);
