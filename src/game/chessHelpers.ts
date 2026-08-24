import { Chess, type Move } from 'chess.js';

/** Legal destination squares from a given square, for move highlighting. */
export function legalTargets(game: Chess, square: string): string[] {
  const moves = game.moves({ square: square as any, verbose: true }) as Move[];
  return moves.map((m) => m.to);
}

/**
 * Attempt a move from → to. Promotions auto-queen for simplicity.
 * Returns the applied Move, or null if illegal.
 */
export function tryMove(game: Chess, from: string, to: string): Move | null {
  try {
    const move = game.move({ from, to, promotion: 'q' });
    return move ?? null;
  } catch {
    return null; // chess.js throws on illegal moves in v1
  }
}

/** Whether the given square holds a piece of the side to move. */
export function isOwnPiece(game: Chess, square: string): boolean {
  const piece = game.get(square as any);
  return !!piece && piece.color === game.turn();
}

const FILES = ['a', 'b', 'c', 'd', 'e', 'f', 'g', 'h'];

/** The square of the king that is currently in check, or null. */
export function checkedKingSquare(game: Chess): string | null {
  if (!game.inCheck()) return null;
  const turn = game.turn();
  const board = game.board();
  for (let r = 0; r < 8; r++) {
    for (let c = 0; c < 8; c++) {
      const p = board[r][c];
      if (p && p.type === 'k' && p.color === turn) return `${FILES[c]}${8 - r}`;
    }
  }
  return null;
}

/** Human-readable game status for the status line. */
export function statusText(game: Chess): string {
  if (game.isCheckmate()) return `Checkmate — ${game.turn() === 'w' ? 'Black' : 'White'} wins`;
  if (game.isStalemate()) return 'Draw — stalemate';
  if (game.isThreefoldRepetition()) return 'Draw — repetition';
  if (game.isInsufficientMaterial()) return 'Draw — insufficient material';
  if (game.isDraw()) return 'Draw';
  const side = game.turn() === 'w' ? 'White' : 'Black';
  return game.inCheck() ? `${side} to move — check!` : `${side} to move`;
}
