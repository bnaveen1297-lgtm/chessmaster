/**
 * Standard Elo. Score is 1 (win), 0.5 (draw) or 0 (loss) for the player whose
 * new rating we're computing. K eases off as a player gets more rated games, so
 * fresh accounts move fast and settled ones move slowly — the usual FIDE-style
 * provisional taper.
 */
export function kFactor(ratedGames: number, rating: number): number {
  if (ratedGames < 30) return 40;
  if (rating >= 2100) return 16;
  return 24;
}

export function expectedScore(myRating: number, oppRating: number): number {
  return 1 / (1 + Math.pow(10, (oppRating - myRating) / 400));
}

/** New rating and the (signed) delta after one game. */
export function newRating(
  myRating: number,
  oppRating: number,
  score: 0 | 0.5 | 1,
  ratedGames: number,
): { rating: number; delta: number } {
  const k = kFactor(ratedGames, myRating);
  const delta = Math.round(k * (score - expectedScore(myRating, oppRating)));
  return { rating: myRating + delta, delta };
}

/** Map a game result + my colour to my score. */
export function scoreFor(result: string, myColor: 'w' | 'b'): 0 | 0.5 | 1 {
  if (result === '1/2-1/2') return 0.5;
  if (result === '1-0') return myColor === 'w' ? 1 : 0;
  if (result === '0-1') return myColor === 'b' ? 1 : 0;
  return 0.5;
}
