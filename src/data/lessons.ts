/**
 * Curriculum lesson content — an end-to-end self-learn path.
 * Written as plain instructional prose (public chess knowledge). Keyed by the
 * lesson ids in `curriculum` (src/data/content.ts).
 */

export type LessonSection = { heading?: string; text: string };

/** An optional "your move" exercise: solve it to complete the lesson. */
export type LessonExercise = {
  fen: string;
  prompt: string;
  /** The single winning move (verified legal). */
  from: string;
  to: string;
  hint: string;
  explain: string;
};

export type LessonContent = {
  id: string;
  title: string;
  sections: LessonSection[];
  exercise?: LessonExercise;
};

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
      { heading: 'A lifelong game', text: 'It is playable at any age, online or over the board, casually or competitively — which is exactly what chesshub360 is built around.' },
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
      { heading: 'How to improve', text: 'Solve puzzles daily. In chesshub360, the Puzzle tab is organized by these very themes.' },
    ],
    exercise: {
      fen: '4r1k1/8/8/8/4N3/8/8/6K1 w - - 0 1',
      prompt: 'White to move. Fork the king and rook with your knight.',
      from: 'e4',
      to: 'f6',
      hint: 'A knight check from f6 hits g8 and e8 at the same time.',
      explain: 'Nf6+ is a fork: it checks the king and attacks the rook at once. The king must move, then you take the rook — winning material.',
    },
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
    exercise: {
      fen: '2q1k3/8/8/1N6/8/8/8/6K1 w - - 0 1',
      prompt: 'White to move. Win the queen with a knight fork.',
      from: 'b5',
      to: 'd6',
      hint: 'From d6 the knight checks the king on e8 and attacks the queen on c8.',
      explain: 'Nd6+ forks the king and queen — a “royal fork”. The king must escape the check, and then the knight captures the queen.',
    },
  },
  l9: {
    id: 'l9',
    title: 'Pins and skewers',
    sections: [
      { heading: 'Pin', text: 'A piece is pinned when moving it would expose a more valuable piece (or the king) behind it. An absolute pin against the king is illegal to break.' },
      { heading: 'Skewer', text: 'Like a pin reversed: the valuable piece is in front and, when it moves, the piece behind is captured.' },
      { heading: 'Who does it', text: 'Bishops, rooks, and queens create pins and skewers along lines and diagonals.' },
    ],
    exercise: {
      fen: '4q3/8/8/4k3/8/8/8/R5K1 w - - 0 1',
      prompt: 'White to move. Skewer the king and win the queen.',
      from: 'a1',
      to: 'e1',
      hint: 'Check along the e-file. The king must step aside…',
      explain: 'Re1+ is a skewer: the king is checked and must move off the e-file, exposing the queen behind it — which the rook then captures.',
    },
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
    exercise: {
      fen: '3k3r/8/8/8/8/8/8/R5K1 w - - 0 1',
      prompt: 'White to move. Use a rook skewer to win the enemy rook.',
      from: 'a1',
      to: 'a8',
      hint: 'Check along the back rank. The king has to step off the 8th rank…',
      explain: 'Ra8+ skewers the king and rook along the 8th rank. The king must move off the rank, and then Rxh8 collects the rook — a decisive extra rook in the endgame.',
    },
  },
  l12: {
    id: 'l12',
    title: 'Discovered attacks',
    sections: [
      { text: 'A discovered attack happens when you move one piece and, by stepping out of the way, unmask an attack from a piece behind it. Two threats appear from a single move.' },
      { heading: 'Discovered check', text: 'The most violent version: the unmasked piece gives check. Because the opponent must answer the check first, the moving piece can grab material or land on a strong square almost for free.' },
      { heading: 'Why it is so strong', text: 'Your opponent can only deal with one threat at a time. If the discovery checks the king while the moving piece attacks the queen, the queen usually falls.' },
    ],
    exercise: {
      fen: '1q2k3/8/8/4N3/8/8/8/4R1K1 w - - 0 1',
      prompt: 'White to move. Unleash a discovered check that also wins the queen.',
      from: 'e5',
      to: 'c6',
      hint: 'Move the knight so the rook checks down the e-file — and land it next to the queen.',
      explain: 'Nc6+ steps the knight aside so the rook on e1 checks the king, while the knight itself attacks the queen on b8. After the king deals with the check, Nxb8 wins the queen.',
    },
  },
  l13: {
    id: 'l13',
    title: 'The double attack',
    sections: [
      { text: 'A double attack is any single move that creates two threats at once. The fork is one form; a checking queen that also eyes a loose piece is another.' },
      { heading: 'The queen as a forker', text: 'The queen moves in every direction, so it is the deadliest double-attacker. A queen check that simultaneously hits an undefended piece is a common way to win material.' },
      { heading: 'Look for alignment', text: 'Before playing a check, ask whether the checking square also touches an enemy piece. If the opponent must move the king, the second target is yours.' },
    ],
    exercise: {
      fen: '7k/8/8/8/8/8/1n6/4Q1K1 w - - 0 1',
      prompt: 'White to move. Find one queen move that checks the king and wins the knight.',
      from: 'e1',
      to: 'e5',
      hint: 'A long diagonal move can hit the king in one corner and the knight in the other.',
      explain: 'Qe5+ checks the king on h8 along one diagonal and attacks the stranded knight on b2 along the other. The knight cannot block or capture, so after the king moves, Qxb2 wins it.',
    },
  },
  l14: {
    id: 'l14',
    title: 'Loose pieces & counting',
    sections: [
      { text: 'Most tactics start with a target: a piece that is undefended, or defended fewer times than it is attacked. A useful motto is “loose pieces drop off.”' },
      { heading: 'Count before you capture', text: 'On any contested square, count attackers versus defenders and picture the sequence of trades. If you come out ahead in material at the end, the capture works.' },
      { heading: 'Even pawns fork', text: 'A single pawn push can attack two pieces at once. Undefended minor pieces sitting side by side are a standing invitation to a pawn fork.' },
    ],
    exercise: {
      fen: '6k1/8/3b1n2/8/4P3/8/8/6K1 w - - 0 1',
      prompt: 'White to move. Push a pawn to fork both minor pieces.',
      from: 'e4',
      to: 'e5',
      hint: 'One pawn advance can attack the bishop and the knight at the same time.',
      explain: 'e5 attacks the bishop on d6 and the knight on f6 simultaneously. They are both undefended, so Black can save only one — White wins a piece.',
    },
  },
  l15: {
    id: 'l15',
    title: 'What checkmate really is',
    sections: [
      { text: 'Checkmate is a check the king cannot escape. To find or avoid mate you must understand the three legal ways to answer any check.' },
      { heading: 'The three defenses', text: 'Against a check you may: move the king to a safe square, block the checking line with another piece, or capture the checking piece. Checkmate is when none of the three is possible.' },
      { heading: 'The mating recipe', text: 'A mate needs two things: the king’s escape squares must be covered (often by its own pieces getting in the way), and the checking piece must be safe from capture or supported by a friend.' },
    ],
  },
  l16: {
    id: 'l16',
    title: 'The back-rank mate',
    sections: [
      { text: 'After castling, the king often sits behind a wall of three pawns. That shelter becomes a trap if a rook or queen invades the undefended back rank.' },
      { heading: 'Why it works', text: 'The king’s own pawns block its escape forward, so a rook delivering check along the back rank leaves nowhere to run. This is one of the most common ways beginners lose — and win.' },
      { heading: 'The defense: luft', text: 'Make an escape hole (called “luft”) by pushing a pawn in front of the king when it is safe to do so. A single tempo spent on ...h6 or h3 can prevent disaster.' },
    ],
    exercise: {
      fen: '6k1/5ppp/8/8/8/8/8/K3R3 w - - 0 1',
      prompt: 'White to move. Deliver back-rank mate in one.',
      from: 'e1',
      to: 'e8',
      hint: 'The black king is boxed in by its own pawns. Invade the 8th rank.',
      explain: 'Re8# is checkmate: the rook checks along the back rank, the f7/g7/h7 pawns block every escape forward, and no black piece can capture or block.',
    },
  },
  l17: {
    id: 'l17',
    title: 'King and queen vs king',
    sections: [
      { text: 'Mating with a queen and king against a lone king is the first checkmate every player should master. The queen does the work; the king delivers the final support.' },
      { heading: 'Drive to the edge', text: 'Use the queen to shrink the enemy king’s box, keeping a knight’s-move distance away so you never accidentally stalemate it. Step by step, herd the king to the side of the board.' },
      { heading: 'Beware stalemate', text: 'When the king is on the edge, do not take away its last square unless it is check. Bring your own king up to guard the mating square, then deliver mate with the queen protected.' },
    ],
  },
  l18: {
    id: 'l18',
    title: 'The two-rook ladder mate',
    sections: [
      { text: 'Two rooks can checkmate a lone king with no help from their own king. The method is a simple “ladder,” and it is worth drilling until it is automatic.' },
      { heading: 'The rolling technique', text: 'One rook cuts off a rank (or file); the other checks on the next one, forcing the king back. Then you climb: alternate the rooks up the board, driving the king to the edge for mate.' },
      { heading: 'Watch the king', text: 'Keep the rooks far apart on opposite sides so the enemy king can never attack one. If the king approaches a rook, swing that rook to the far side of the board and continue.' },
    ],
    exercise: {
      fen: 'k7/1R6/2K5/8/8/8/8/7R w - - 0 1',
      prompt: 'White to move. Complete the ladder with mate in one.',
      from: 'h1',
      to: 'h8',
      hint: 'One rook already fences off the 7th rank. Check on the 8th.',
      explain: 'Rh8# is mate: the second rook checks along the 8th rank while the rook on b7 (guarded by the king) seals the 7th, leaving the king no square.',
    },
  },
  l19: {
    id: 'l19',
    title: 'Smothered mate',
    sections: [
      { text: 'A smothered mate is delivered by a knight when the enemy king is completely hemmed in by its own pieces. Because the knight jumps, no blocking is possible.' },
      { heading: 'The classic pattern', text: 'A king in the corner, boxed in by its own rook and pawns, is mated by a knight check it cannot answer — nothing can capture the knight and there is no square to flee to.' },
      { heading: 'Philidor’s legacy', text: 'The famous full combination sacrifices a queen to force the king’s own rook into the corner, setting up the knight’s final blow. Recognizing the finished picture helps you aim for it.' },
    ],
    exercise: {
      fen: '6rk/6pp/8/6N1/8/8/8/K7 w - - 0 1',
      prompt: 'White to move. Smother the king with a knight — mate in one.',
      from: 'g5',
      to: 'f7',
      hint: 'The king on h8 is boxed in by its rook and pawns. A knight leap finishes it.',
      explain: 'Nf7# is a smothered mate: the knight checks the king on h8, which is trapped by its own rook on g8 and pawns on g7 and h7. Nothing can capture the knight.',
    },
  },
  l20: {
    id: 'l20',
    title: 'Fighting for the center',
    sections: [
      { text: 'Whoever controls the center controls the game. Central pawns and pieces reach more squares and can swing to either wing quickly.' },
      { heading: 'Two ways to hold it', text: 'The classical approach occupies the center with pawns on d4 and e4. The hypermodern approach lets the opponent build a big center, then attacks it with pieces and pawn breaks from the flanks.' },
      { heading: 'A pawn on the fourth rank', text: 'A healthy first move like 1.e4 or 1.d4 stakes a claim in the center and opens lines for a bishop and the queen. Answering in the center (…e5, …d5, …c5) fights back for the same squares.' },
    ],
  },
  l21: {
    id: 'l21',
    title: 'Development and tempo',
    sections: [
      { text: 'Development means bringing your knights and bishops off the back rank to active squares. The side that develops faster usually gets the initiative.' },
      { heading: 'Every move counts', text: 'A tempo is a single move of time. Moving the same piece twice, or chasing enemy pieces that are happy to be chased, wastes tempi your opponent spends developing.' },
      { heading: 'Knights before bishops', text: 'A common guideline: develop knights first (their best squares are obvious — f3, c3, f6, c6) and decide on bishop placement once the pawn structure is clearer.' },
    ],
  },
  l22: {
    id: 'l22',
    title: 'King safety and castling',
    sections: [
      { text: 'The opening is a race to get your king to safety before the position opens up. Castling is the tool that does it.' },
      { heading: 'What castling gives you', text: 'In one move the king hides behind a pawn shield and a rook jumps toward the center. Kingside castling is usually quicker and safer; queenside castling brings a rook into play faster but exposes the king a little more.' },
      { heading: 'Do not delay', text: 'Leaving the king in the center invites tactics down the open files and diagonals. As a rule, castle within the first ten moves unless there is a concrete reason not to.' },
    ],
  },
  l23: {
    id: 'l23',
    title: 'Common opening traps',
    sections: [
      { text: 'Breaking opening principles has a cost. Many quick disasters come from grabbing material or neglecting development, and a single tactic punishes it.' },
      { heading: 'Greed has a price', text: 'Snatching a pawn or bishop with an undeveloped position often walks into a check that forks the loose piece. Always ask what your opponent threatens before you capture.' },
      { heading: 'Know the classics', text: 'Traps like the Scholar’s Mate, the Légal Trap, and the Fried Liver are worth learning from both sides — so you can spring them and, more importantly, sidestep them.' },
    ],
    exercise: {
      fen: '4k3/8/8/8/1b6/8/8/3Q2K1 w - - 0 1',
      prompt: 'White to move. Punish the loose bishop with a checking double attack.',
      from: 'd1',
      to: 'a4',
      hint: 'A queen check on the long light diagonal also eyes the bishop on the 4th rank.',
      explain: 'Qa4+ checks the king along the a4–e8 diagonal and attacks the undefended bishop on b4. Black must answer the check, and then Qxb4 wins the piece.',
    },
  },
  l24: {
    id: 'l24',
    title: 'What is positional chess',
    sections: [
      { text: 'Not every move wins material by force. Positional chess is the art of accumulating small, lasting advantages until they become decisive.' },
      { heading: 'The lasting factors', text: 'Pawn structure, the safety of the kings, control of key squares and files, and the activity of your pieces are all long-term features. Tactics are usually the reward for handling them well.' },
      { heading: 'Make a plan', text: 'Good positional play means asking what your position wants: which piece is worst, which squares are weak in the enemy camp, and where a pawn break can open lines for you.' },
    ],
  },
  l25: {
    id: 'l25',
    title: 'Good and bad bishops',
    sections: [
      { text: 'A bishop is only as good as the diagonals it can use. Your own pawns can either free it or bury it.' },
      { heading: 'The bad bishop', text: 'A bishop trapped behind its own pawns — pawns fixed on its color — is a “bad” bishop. It defends but rarely attacks. Try to trade it off or free it with a pawn break.' },
      { heading: 'The good bishop', text: 'A bishop with open diagonals, unobstructed by its own pawns, radiates power across the board. Placing your pawns on the opposite color to your remaining bishop keeps it strong.' },
    ],
  },
  l26: {
    id: 'l26',
    title: 'Knights and outposts',
    sections: [
      { text: 'Knights are short-range pieces that love stable, advanced homes. Such a square is called an outpost.' },
      { heading: 'What makes an outpost', text: 'An outpost is a square, usually on the 5th or 6th rank, that an enemy pawn can never attack (because the pawns that could challenge it are gone or advanced). A knight planted there, supported by a pawn, can dominate.' },
      { heading: 'Knights vs bishops', text: 'Knights thrive in closed positions with fixed pawns and strong outposts; bishops prefer open positions with long, clear diagonals. Judge the trade by the structure in front of you.' },
    ],
  },
  l27: {
    id: 'l27',
    title: 'Open files and the rooks',
    sections: [
      { text: 'Rooks are clumsy in the opening but become monsters once lines open. Their natural habitat is an open file.' },
      { heading: 'Seize the file', text: 'An open file (one with no pawns) is a highway for a rook. Doubling both rooks on it, or seizing it before the opponent, often lets you invade the 7th rank where rooks feast on pawns.' },
      { heading: 'Half-open files', text: 'A half-open file — pawns of only one color — is a lever to attack the enemy pawn on it. Point your rook down that file and pressure the target.' },
    ],
  },
  l28: {
    id: 'l28',
    title: 'Space and the center',
    sections: [
      { text: 'Space is the room your pieces have to maneuver. The side with more space can shuffle forces from wing to wing faster than the cramped defender.' },
      { heading: 'The space advantage', text: 'Advanced pawns claim territory and push the enemy pieces back, but they can also become targets. Support your space with pieces, and avoid overextending pawns you cannot defend.' },
      { heading: 'The cramped side', text: 'If you are short of space, look to trade pieces — every exchange gives your remaining forces more breathing room — and prepare a freeing pawn break.' },
    ],
  },
  l29: {
    id: 'l29',
    title: 'Why pawn structure matters',
    sections: [
      { text: 'Pawns cannot move backward, so pawn moves are permanent commitments. Their arrangement — the pawn structure — shapes the plans available to both sides for the rest of the game.' },
      { heading: 'The skeleton of the position', text: 'The structure decides which files will open, where the outposts are, and which pieces will be strong. Study the pawns first and the right plan often becomes obvious.' },
      { heading: 'Pawn islands', text: 'A group of connected pawns is an “island.” Fewer islands usually means a healthier structure, because connected pawns defend one another while scattered ones need pieces to babysit them.' },
    ],
  },
  l30: {
    id: 'l30',
    title: 'Isolated and doubled pawns',
    sections: [
      { text: 'Some pawn weaknesses are structural. Isolated and doubled pawns cannot be defended by other pawns and often become long-term targets.' },
      { heading: 'The isolated pawn', text: 'An isolated pawn has no friendly pawns on either neighboring file. It can be a weakness to blockade and attack — but the open lines and the strong square in front of it also give the owner active piece play.' },
      { heading: 'Doubled pawns', text: 'Two pawns on the same file cannot defend each other and struggle to advance. In return they often hand you a half-open file and extra central control, so judge them by the whole position, not by reflex.' },
    ],
  },
  l31: {
    id: 'l31',
    title: 'Passed pawns',
    sections: [
      { text: 'A passed pawn has no enemy pawns in front of it or on the adjacent files to stop it. Nothing but pieces can prevent it from promoting.' },
      { heading: 'Push them', text: 'As the saying goes, “passed pawns must be pushed.” The closer a passer gets to the last rank, the more enemy pieces it ties down, and the greater the threat to promote into a new queen.' },
      { heading: 'Protected and connected', text: 'A protected passed pawn (guarded by another pawn) and connected passed pawns (side by side) are especially powerful in the endgame — they can advance while defending each other.' },
    ],
  },
  l32: {
    id: 'l32',
    title: 'Pawn chains',
    sections: [
      { text: 'A pawn chain is a diagonal line of pawns defending one another. Chains define the character of many openings, from the French to the King’s Indian.' },
      { heading: 'Attack the base', text: 'Each pawn in a chain is defended by the one behind it — except the base, which no pawn guards. The classic plan is to strike at the base with a pawn break, since the whole chain leans on it.' },
      { heading: 'Play on your side', text: 'A chain points in a direction. As a rule, attack on the side where your chain gives you more space: the pawns act as an arrow showing where your play lies.' },
    ],
  },
  l33: {
    id: 'l33',
    title: 'Backward pawns and holes',
    sections: [
      { text: 'A structure can leave squares and pawns that the defender can never properly cover. These are among the most durable of all weaknesses.' },
      { heading: 'The backward pawn', text: 'A backward pawn lags behind its neighbors on a half-open file and cannot advance safely because the square in front is controlled by the enemy. It is a fixed target for rooks and pieces.' },
      { heading: 'Holes', text: 'A hole is a square that can no longer be defended by a pawn, usually created when a pawn advances past it. Hand your opponent a hole and they will plant a knight there for the rest of the game.' },
    ],
  },
  l34: {
    id: 'l34',
    title: 'The opposition and key squares',
    sections: [
      { text: 'King-and-pawn endgames are decided by precise king play. The opposition is the single most important idea for winning or drawing them.' },
      { heading: 'Direct opposition', text: 'When the kings stand on the same line with one square between them, the player who does NOT have to move holds the opposition and can force the enemy king to give ground.' },
      { heading: 'Key squares', text: 'For a passed pawn, there are specific squares in front of it that, if your king reaches them, guarantee promotion. Using the opposition to seize those key squares is the winning method.' },
    ],
  },
  l35: {
    id: 'l35',
    title: 'Promoting a passed pawn',
    sections: [
      { text: 'The whole point of an extra or advanced pawn is to turn it into a queen. In the endgame, escorting a passed pawn home is often the winning plan.' },
      { heading: 'King and pawn together', text: 'A lone pawn usually cannot promote without help. March your king ahead of the pawn to clear the promotion square and shield the pawn from the enemy king.' },
      { heading: 'The moment of truth', text: 'When the path is clear, push the pawn to the last rank and promote — almost always to a queen. Watch for a promotion that comes with check or a fork, winning even more.' },
    ],
    exercise: {
      fen: '7k/1P6/2K5/8/8/8/8/8 w - - 0 1',
      prompt: 'White to move. Promote the pawn and make a new queen.',
      from: 'b7',
      to: 'b8',
      hint: 'The pawn is one step from the last rank, and its own king guards the way.',
      explain: 'b8=Q promotes the pawn into a queen (with check), converting the extra pawn into a decisive material advantage — an easy win from here.',
    },
  },
  l36: {
    id: 'l36',
    title: 'Basic checkmates',
    sections: [
      { text: 'Every player must be able to finish the game once ahead. The essential checkmates use the king together with a queen or a rook to trap the lone enemy king.' },
      { heading: 'Queen and king', text: 'The queen forces the enemy king to the edge while your king marches up to support the mate. Keep the queen a knight’s-move away until the king arrives, then deliver mate with the queen protected.' },
      { heading: 'Rook and king', text: 'A rook and king mate the same way — driving the enemy king to a back rank — but it takes more care, using your king to take the opposition and the rook to deliver the final check.' },
    ],
    exercise: {
      fen: 'k7/8/K7/8/8/8/8/1Q6 w - - 0 1',
      prompt: 'White to move. Use the king’s support to deliver mate in one.',
      from: 'b1',
      to: 'b7',
      hint: 'Bring the queen right next to the enemy king — your own king guards it.',
      explain: 'Qb7# is checkmate: the queen, protected by the king on a6, checks the cornered king on a8 and covers every escape square. This is the standard queen-and-king finish.',
    },
  },
  l37: {
    id: 'l37',
    title: 'Minor-piece endgames',
    sections: [
      { text: 'Endgames with a lone bishop or knight (plus pawns) have their own rules of thumb worth knowing before you reach them.' },
      { heading: 'Bishops of opposite color', text: 'When each side has one bishop on opposite colors, endgames are famously drawish: even an extra pawn or two may not win, because the defending bishop controls squares the attacker can never dislodge it from.' },
      { heading: 'The wrong bishop', text: 'A rook pawn plus a bishop that does not control the promotion square is only a draw — the defending king simply sits in the corner. Knowing this saves half-points and avoids heartbreak.' },
    ],
  },
  l38: {
    id: 'l38',
    title: 'How to study chess',
    sections: [
      { text: 'Improvement comes from deliberate practice, not just playing games. A balanced routine mixes tactics, endgames, and study of complete games.' },
      { heading: 'Tactics first', text: 'For most players, solving tactics puzzles is the single fastest way to gain rating. A little every day builds the pattern recognition that decides club games.' },
      { heading: 'Learn the endgame', text: 'Basic endgame technique wins the games your tactics get you into. Master the essential checkmates and king-and-pawn positions before memorizing deep opening lines.' },
    ],
  },
  l39: {
    id: 'l39',
    title: 'Learning from your own games',
    sections: [
      { text: 'Your own losses are the best textbook you own. Reviewing them turns mistakes into lessons that stick.' },
      { heading: 'Review before the engine', text: 'First go through the game yourself and note where you felt unsure or where the plan went wrong. Only then check with an engine — understanding your thinking matters more than the raw evaluation.' },
      { heading: 'Find the pattern', text: 'Look for recurring mistakes: hanging a certain piece, rushing an attack, drifting in quiet positions. Fixing one repeated error is worth more than a dozen scattered fixes.' },
    ],
  },
  l40: {
    id: 'l40',
    title: 'Building a training routine',
    sections: [
      { text: 'Progress is the product of consistency. A simple, repeatable weekly plan beats occasional bursts of cramming.' },
      { heading: 'A sample week', text: 'Daily tactics to keep sharp, a couple of sessions of endgame or game study, and a few longer games you actually analyze afterward. Quality of review matters more than the number of games played.' },
      { heading: 'Play, review, repeat', text: 'Play with enough time to think, review every serious game, and revisit the themes you keep getting wrong. Over months this loop is what turns a beginner into a strong club player.' },
    ],
  },
};
