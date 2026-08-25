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

export type TournamentFormat = 'roundrobin' | 'knockout';

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
