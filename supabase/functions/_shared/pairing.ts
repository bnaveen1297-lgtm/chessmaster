/**
 * Tournament pairing engine — pure, deterministic, and unit-tested.
 *
 * Two formats are supported:
 *   • Round-robin  — everyone plays everyone once (circle method).
 *   • Knockout     — single-elimination bracket with standard seeding.
 *
 * A `null` opponent means a BYE: the listed player advances / scores for free.
 * The engine only computes pairings; persistence + result reporting live in the
 * Supabase layer (see src/services/tournaments.ts).
 */

export type PlayerId = string;

export type Pairing = {
  board: number;
  /** White side. Never null. */
  white: PlayerId;
  /** Black side, or null for a bye (white auto-advances). */
  black: PlayerId | null;
};

export type Round = {
  round: number;
  pairings: Pairing[];
};

export type TournamentFormat = 'roundrobin' | 'knockout' | 'swiss';

// ---------------------------------------------------------------------------
// Round-robin (circle / "polygon" method)
// ---------------------------------------------------------------------------

/**
 * Full round-robin schedule. For n players there are (n-1) rounds when n is
 * even, or n rounds when odd (a rotating bye each round). Colours alternate so
 * nobody is stuck as one colour every game.
 */
export function roundRobinSchedule(players: PlayerId[]): Round[] {
  const list = [...players];
  if (list.length < 2) return [];

  // Odd count → add a bye marker so pairing is even.
  const BYE = '__bye__';
  if (list.length % 2 === 1) list.push(BYE);

  const n = list.length;
  const rounds: Round[] = [];
  // Fixed player at index 0; the rest rotate.
  const arr = [...list];

  // Track colour balance so we can assign White to whoever most needs it.
  const diff: Record<PlayerId, number> = {}; // whites - blacks so far
  const giveWhite = (x: PlayerId, y: PlayerId): [PlayerId, PlayerId] => {
    const dx = diff[x] ?? 0;
    const dy = diff[y] ?? 0;
    // Lower diff = has had more Blacks = should get White. Tie-break by id
    // for determinism.
    const xWhite = dx < dy || (dx === dy && x < y);
    const [white, black] = xWhite ? [x, y] : [y, x];
    diff[white] = (diff[white] ?? 0) + 1;
    diff[black] = (diff[black] ?? 0) - 1;
    return [white, black];
  };

  for (let r = 0; r < n - 1; r++) {
    const pairings: Pairing[] = [];
    let board = 1;
    for (let i = 0; i < n / 2; i++) {
      const a = arr[i];
      const b = arr[n - 1 - i];
      if (a === BYE || b === BYE) {
        const real = a === BYE ? b : a;
        pairings.push({ board: board++, white: real, black: null });
        continue;
      }
      const [white, black] = giveWhite(a, b);
      pairings.push({ board: board++, white, black });
    }
    rounds.push({ round: r + 1, pairings });

    // Rotate: keep index 0 fixed, move the last into position 1.
    const fixed = arr[0];
    const rest = arr.slice(1);
    rest.unshift(rest.pop() as PlayerId);
    arr.splice(0, arr.length, fixed, ...rest);
  }

  return rounds;
}

// ---------------------------------------------------------------------------
// Knockout (single elimination)
// ---------------------------------------------------------------------------

/** Smallest power of two ≥ n. */
export function nextPowerOfTwo(n: number): number {
  let p = 1;
  while (p < n) p *= 2;
  return p;
}

/**
 * Standard tournament seed order for a bracket of size `size` (a power of two),
 * returned as 1-based seed numbers arranged so that seed 1 and seed 2 can only
 * meet in the final, seed 1 vs 4 in the semis, etc.
 *   size 2 → [1,2]; size 4 → [1,4,2,3]; size 8 → [1,8,4,5,2,7,3,6].
 */
export function seedOrder(size: number): number[] {
  let rounds = [1, 2];
  while (rounds.length < size) {
    const n = rounds.length * 2;
    const next: number[] = [];
    for (const s of rounds) {
      next.push(s);
      next.push(n + 1 - s);
    }
    rounds = next;
  }
  return rounds;
}

/**
 * First knockout round. `players` must already be in seed order (strongest
 * first). Players are placed into a power-of-two bracket; empty slots become
 * byes so top seeds advance when the field isn't a power of two.
 */
export function knockoutFirstRound(players: PlayerId[]): Round {
  const size = nextPowerOfTwo(Math.max(2, players.length));
  const order = seedOrder(size); // 1-based seed slots
  const slots: (PlayerId | null)[] = order.map((seed) => players[seed - 1] ?? null);

  const pairings: Pairing[] = [];
  let board = 1;
  for (let i = 0; i < slots.length; i += 2) {
    const a = slots[i];
    const b = slots[i + 1];
    // At least one side of any first-round pair is a real player (seed order
    // guarantees byes land opposite the top seeds).
    if (a && b) pairings.push({ board: board++, white: a, black: b });
    else if (a) pairings.push({ board: board++, white: a, black: null });
    else if (b) pairings.push({ board: board++, white: b, black: null });
  }
  return { round: 1, pairings };
}

/**
 * Given the winners of a round *in bracket order*, pair them for the next round
 * (adjacent winners meet). Returns null when only one remains (champion).
 */
export function pairWinners(winners: PlayerId[], round: number): Round | null {
  if (winners.length <= 1) return null;
  const pairings: Pairing[] = [];
  let board = 1;
  for (let i = 0; i < winners.length; i += 2) {
    const a = winners[i];
    const b = winners[i + 1] ?? null;
    pairings.push({ board: board++, white: a, black: b });
  }
  return { round, pairings };
}

/** Number of rounds a knockout of `n` players will take. */
export function knockoutRounds(n: number): number {
  return Math.log2(nextPowerOfTwo(Math.max(2, n)));
}

// ---------------------------------------------------------------------------
// Swiss (score-group pairing with rematch avoidance)
// ---------------------------------------------------------------------------

/** Recommended number of Swiss rounds for n players. */
export function swissRounds(n: number): number {
  return Math.max(3, Math.ceil(Math.log2(Math.max(2, n))));
}

export type SwissEntrant = {
  id: PlayerId;
  score: number;
  /** ids this player has already faced. */
  opponents: PlayerId[];
  /** whether the player has already received a bye. */
  hadBye: boolean;
};

/** Round 1: pair players in the given (seed / join) order; last odd → bye. */
export function swissFirstRound(players: PlayerId[]): Round {
  const pairings: Pairing[] = [];
  let board = 1;
  for (let i = 0; i + 1 < players.length; i += 2) {
    // Alternate colours a little across boards.
    const [w, b] = i % 4 === 0 ? [players[i], players[i + 1]] : [players[i + 1], players[i]];
    pairings.push({ board: board++, white: w, black: b });
  }
  if (players.length % 2 === 1) pairings.push({ board: board++, white: players[players.length - 1], black: null });
  return { round: 1, pairings };
}

/**
 * Pair a Swiss round from current standings. Players are sorted by score (then
 * id for determinism); each is matched with the nearest-scored opponent they
 * haven't met, falling back to a rematch only if unavoidable. An odd field gives
 * a bye to the lowest-scored player who hasn't had one.
 */
export function swissPairings(entrants: SwissEntrant[], round: number): Round {
  const pool = [...entrants].sort((a, b) => b.score - a.score || (a.id < b.id ? -1 : 1));

  const byePairing: Pairing[] = [];
  if (pool.length % 2 === 1) {
    let idx = pool.length - 1;
    for (let i = pool.length - 1; i >= 0; i--) { if (!pool[i].hadBye) { idx = i; break; } }
    const [bye] = pool.splice(idx, 1);
    byePairing.push({ board: 0, white: bye.id, black: null });
  }

  // Prefer a rematch-free pairing; DFS keeps score-proximity (pool is
  // score-sorted). Fall back to allowing rematches only if none exists.
  const match = (list: SwissEntrant[], allowRematch: boolean): [SwissEntrant, SwissEntrant][] | null => {
    if (list.length === 0) return [];
    const a = list[0];
    for (let j = 1; j < list.length; j++) {
      const b = list[j];
      if (!allowRematch && a.opponents.includes(b.id)) continue;
      const rest = list.filter((_, k) => k !== 0 && k !== j);
      const sub = match(rest, allowRematch);
      if (sub) return [[a, b], ...sub];
    }
    return null;
  };
  const realPairs = match(pool, false) ?? match(pool, true) ?? [];

  const pairings: Pairing[] = [];
  let board = 1;
  realPairs.forEach(([a, b], idx) => {
    const swap = (round + idx) % 2 === 1; // rough colour balancing
    pairings.push({ board: board++, white: swap ? b.id : a.id, black: swap ? a.id : b.id });
  });
  for (const bp of byePairing) { bp.board = board++; pairings.push(bp); }
  return { round, pairings };
}
