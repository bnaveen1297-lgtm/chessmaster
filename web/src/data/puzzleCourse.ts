import type { PuzzleFilter } from '@shared/services/puzzleDb';

/**
 * The puzzle curriculum: themed packs grouped into stages, each pack sourced
 * live from the puzzle database by its Lichess theme token (see the
 * `random_puzzle` RPC). Nothing is locked — packs show progress and a suggested
 * order. Solve `goal` puzzles to complete a pack.
 */
export type Band = 'Beginner' | 'Intermediate' | 'Advanced';

export type PuzzlePack = {
  id: string;
  title: string;
  /** Lichess theme token passed to random_puzzle(want_theme). */
  theme: string;
  band: Band;
  goal: number;
  icon: string;
  blurb: string;
  /** Shown after each solve to make the pattern stick. */
  tip: string;
};

export type PuzzleStage = {
  id: string;
  title: string;
  subtitle: string;
  packs: PuzzlePack[];
};

/** Rating window for a band, matching the free-solve difficulty bands. */
export function bandFilter(band: Band, theme: string): PuzzleFilter {
  const base: PuzzleFilter = { theme };
  if (band === 'Beginner') return { ...base, maxRating: 1300 };
  if (band === 'Intermediate') return { ...base, minRating: 1300, maxRating: 1900 };
  return { ...base, minRating: 1900 };
}

export const puzzleCourse: PuzzleStage[] = [
  {
    id: 'stage-mate',
    title: 'Checkmate Basics',
    subtitle: 'Learn to finish the game — the patterns every attack aims for.',
    packs: [
      {
        id: 'backrank', title: 'Back-rank Mates', theme: 'backRankMate', band: 'Beginner', goal: 5, icon: '♜',
        blurb: 'Trap the king behind its own pawns.',
        tip: 'A king with no luft (escape square) is mated on the back rank by a rook or queen sweeping the row.',
      },
      {
        id: 'basic-mates', title: 'Queen & Rook Mates', theme: 'mate', band: 'Beginner', goal: 5, icon: '♛',
        blurb: 'The heavy-piece mates you must know cold.',
        tip: 'The heavy piece takes the escape squares while the edge of the board (or a friendly piece) covers the rest.',
      },
      {
        id: 'smother', title: 'Smothered Mate', theme: 'smotheredMate', band: 'Intermediate', goal: 4, icon: '♞',
        blurb: 'The knight mates a king boxed in by its own men.',
        tip: 'When the king is smothered by its own pieces, a knight check nothing can block or capture is mate.',
      },
    ],
  },
  {
    id: 'stage-material',
    title: 'Winning Material',
    subtitle: 'Spot free pieces and the forks that win them.',
    packs: [
      {
        id: 'hanging', title: 'Hanging Pieces', theme: 'hangingPiece', band: 'Beginner', goal: 5, icon: '✦',
        blurb: 'Punish undefended pieces.',
        tip: 'Before every move, scan for enemy pieces that are undefended or attacked more times than defended.',
      },
      {
        id: 'forks', title: 'Forks', theme: 'fork', band: 'Intermediate', goal: 5, icon: '⑂',
        blurb: 'One move, two targets.',
        tip: 'A fork attacks two pieces at once — knights and pawns fork best. Look for checks that also hit a big piece.',
      },
    ],
  },
  {
    id: 'stage-pins',
    title: 'Pins & Skewers',
    subtitle: 'Line up the enemy pieces and win the one behind.',
    packs: [
      {
        id: 'pins', title: 'Pins', theme: 'pin', band: 'Intermediate', goal: 5, icon: '⊥',
        blurb: 'Freeze a piece against a bigger one.',
        tip: 'A pinned piece can’t move without exposing something more valuable — pile more attackers onto it.',
      },
      {
        id: 'skewers', title: 'Skewers', theme: 'skewer', band: 'Intermediate', goal: 5, icon: '⚔',
        blurb: 'A pin in reverse.',
        tip: 'Attack a valuable piece so that when it moves, you capture the piece lined up behind it.',
      },
    ],
  },
];

export const allPacks: PuzzlePack[] = puzzleCourse.flatMap((s) => s.packs);
export function packById(id: string): PuzzlePack | undefined {
  return allPacks.find((p) => p.id === id);
}

/** lessons_completed marker id for a finished pack (syncs across devices). */
export const packDoneId = (packId: string) => `pzl:${packId}`;
