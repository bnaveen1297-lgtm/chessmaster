/**
 * Curriculum lesson content — an end-to-end self-learn path.
 * Written as plain instructional prose (public chess knowledge). Keyed by the
 * lesson ids in `curriculum` (src/data/content.ts).
 */

export type LessonSection = { heading?: string; text: string };
export type LessonContent = { id: string; title: string; sections: LessonSection[] };

export const lessonContent: Record<string, LessonContent> = {
  l1: {
    id: 'l1',
    title: 'What is chess',
    sections: [
      { text: 'Chess is a two-player strategy game on an 8×8 board. One player commands the white pieces, the other black, and White always moves first.' },
      { heading: 'The goal', text: 'You win by delivering checkmate: attacking the enemy king so it cannot escape capture. It is never actually captured — the game ends the moment escape is impossible.' },
      { heading: 'How a game flows', text: 'Players alternate single moves. Most games have three phases: the opening (development), the middlegame (plans and tactics), and the endgame (converting an advantage).' },
    ],
  },
  l2: {
    id: 'l2',
    title: 'Uses of playing chess',
    sections: [
      { text: 'Chess trains skills that carry far beyond the board.' },
      { heading: 'What it builds', text: 'Pattern recognition, calculation, patience, and planning under pressure. Studies link regular play to stronger focus and problem-solving.' },
      { heading: 'A lifelong game', text: 'It is playable at any age, online or over the board, casually or competitively — which is exactly what ChessMaster is built around.' },
    ],
  },
  l3: {
    id: 'l3',
    title: 'Understanding the board',
    sections: [
      { text: 'The board has 64 squares in 8 files (columns a–h) and 8 ranks (rows 1–8). Each square has a coordinate like e4.' },
      { heading: 'Setup rule', text: '“Light on right”: the near-right corner square is light. Queens start on their own color — white queen on d1 (light), black queen on d8 (dark).' },
      { heading: 'The center', text: 'The four central squares (d4, e4, d5, e5) are the most valuable real estate. Controlling them gives your pieces maximum range.' },
    ],
  },
  l4: {
    id: 'l4',
    title: 'Understanding the pawn',
    sections: [
      { text: 'Pawns move forward one square, or two from their starting square, and capture one square diagonally.' },
      { heading: 'Special moves', text: 'En passant lets a pawn capture a pawn that just passed it with a two-square move. Promotion: reach the last rank and the pawn becomes any piece — almost always a queen.' },
      { heading: 'Why they matter', text: 'Pawns cannot move backward, so every pawn move is permanent. Pawn structure shapes the whole game.' },
    ],
  },
  l5: {
    id: 'l5',
    title: 'Understanding the King & pieces',
    sections: [
      { heading: 'Piece values (rough)', text: 'Pawn 1, Knight 3, Bishop 3, Rook 5, Queen 9. The king is priceless — losing it ends the game.' },
      { heading: 'How they move', text: 'Rook: straight lines. Bishop: diagonals. Queen: both. Knight: an L-shape, and it can jump over pieces. King: one square any direction.' },
      { heading: 'Castling', text: 'A one-time move of king and rook together that tucks the king to safety and activates a rook. Allowed only if neither piece has moved, the path is clear, and the king is not passing through check.' },
    ],
  },
  l6: {
    id: 'l6',
    title: 'Understanding basic tactics',
    sections: [
      { text: 'Tactics are short forcing sequences that win material or deliver mate.' },
      { heading: 'The core patterns', text: 'Fork: one piece attacks two. Pin: a piece cannot move without exposing a more valuable one. Skewer: the reverse of a pin. Discovered attack: moving one piece unveils another’s attack.' },
      { heading: 'How to improve', text: 'Solve puzzles daily. In ChessMaster, the Puzzle tab is organized by these very themes.' },
    ],
  },
  l7: {
    id: 'l7',
    title: 'Opening principles',
    sections: [
      { heading: 'Three golden rules', text: '1) Control the center with a pawn. 2) Develop knights and bishops toward the center. 3) Castle early to keep your king safe.' },
      { heading: 'Common mistakes', text: 'Do not move the same piece twice in the opening without reason, do not bring the queen out too early, and do not grab pawns while behind in development.' },
      { heading: 'Openings to know', text: 'See the Opening Book for named lines like the Ruy López, Italian, Sicilian, and Queen’s Gambit.' },
    ],
  },
  l8: {
    id: 'l8',
    title: 'Forks & double attacks',
    sections: [
      { text: 'A fork attacks two or more targets at once so your opponent cannot save them all.' },
      { heading: 'Knight forks', text: 'Knights are the classic forkers — a knight on the right square can hit the king and queen simultaneously (a “royal fork”).' },
      { heading: 'Practice', text: 'Try the “Win a piece” puzzles in the Puzzle tab to train spotting undefended targets.' },
    ],
  },
  l9: {
    id: 'l9',
    title: 'Pins and skewers',
    sections: [
      { heading: 'Pin', text: 'A piece is pinned when moving it would expose a more valuable piece (or the king) behind it. An absolute pin against the king is illegal to break.' },
      { heading: 'Skewer', text: 'Like a pin reversed: the valuable piece is in front and, when it moves, the piece behind is captured.' },
      { heading: 'Who does it', text: 'Bishops, rooks, and queens create pins and skewers along lines and diagonals.' },
    ],
  },
  l10: {
    id: 'l10',
    title: 'King & pawn endgames',
    sections: [
      { text: 'With few pieces left, the king becomes a strong attacker — activate it.' },
      { heading: 'Opposition', text: 'When kings face off with one square between them, the side NOT to move “has the opposition” and controls key squares — decisive in pawn races.' },
      { heading: 'The rule of the square', text: 'To see if a lone king can catch a passed pawn, draw the square from the pawn to the promotion rank; if the king can step inside it, it catches the pawn.' },
    ],
  },
  l11: {
    id: 'l11',
    title: 'Rook endgame essentials',
    sections: [
      { text: 'Rook endgames are the most common endgame — and the most drawish if you know the technique.' },
      { heading: 'Two must-knows', text: 'The Lucena position (a winning technique using a “bridge”) and the Philidor position (the key drawing defense). Learning both wins and saves countless games.' },
      { heading: 'Rule of thumb', text: 'Put your rook behind passed pawns — yours to push them, the opponent’s to restrain them.' },
    ],
  },
};
