/**
 * Placeholder content for the v0 scaffold. In production this comes from the
 * backend (curriculum, live feed, analysis engine, catalog, etc.).
 */
import { colors } from '../theme';

/* ------------------------------------------------------------------ CLASS */

export type ClassLevel = {
  id: string;
  level: 'Beginner' | 'Intermediate' | 'Expert';
  blurb: string;
  color: string;
};

export const classLevels: ClassLevel[] = [
  { id: 'beg', level: 'Beginner', blurb: 'Learn chess fundamentals and the uses of chess in real life.', color: colors.teal },
  { id: 'int', level: 'Intermediate', blurb: 'Learn chess positions and the structure of the game.', color: colors.brown },
  { id: 'exp', level: 'Expert', blurb: 'Master expert-level play and apply chess to real life.', color: colors.purple },
];

export type LanguageSchedule = {
  id: string;
  language: string;
  color: string;
  days: { day: string; time: string }[];
};

const week = [
  { day: 'Monday', time: '10:00 Am - 11:00 Am' },
  { day: 'Tuesday', time: '10:00 Am - 11:00 Am' },
  { day: 'Wednesday', time: '11:00 Am - 12:00 Pm' },
  { day: 'Thursday', time: '11:00 Am - 12:00 Pm' },
  { day: 'Friday', time: '04:00 Pm - 5:30 Pm' },
  { day: 'Saturday', time: '04:00 Pm - 5:30 Pm' },
  { day: 'Sunday', time: '10:00 Am - 11:00 Am' },
];

export const languageSchedules: LanguageSchedule[] = [
  { id: 'en', language: 'English', color: colors.teal, days: week },
  { id: 'hi', language: 'Hindi', color: colors.purple, days: week },
  { id: 'ta', language: 'தமிழ்', color: colors.brown, days: week },
];

/** End-to-end self-learn curriculum (ChessMaster requirement). */
export type Lesson = { id: string; title: string; minutes: number; done: boolean };
export type CurriculumUnit = { id: string; title: string; lessons: Lesson[] };

export const curriculum: CurriculumUnit[] = [
  {
    id: 'u1',
    title: 'Chess Foundations',
    lessons: [
      { id: 'l1', title: 'What is chess', minutes: 6, done: true },
      { id: 'l2', title: 'Uses of playing chess', minutes: 5, done: true },
      { id: 'l3', title: 'Understanding the board', minutes: 7, done: true },
      { id: 'l4', title: 'Understanding the pawn', minutes: 8, done: false },
      { id: 'l5', title: 'Understanding the King & pieces', minutes: 9, done: false },
      { id: 'l6', title: 'Understanding basic tactics', minutes: 10, done: false },
    ],
  },
  {
    id: 'u2',
    title: 'Openings & Tactics',
    lessons: [
      { id: 'l7', title: 'Opening principles', minutes: 9, done: false },
      { id: 'l8', title: 'Forks & double attacks', minutes: 11, done: false },
      { id: 'l9', title: 'Pins and skewers', minutes: 12, done: false },
    ],
  },
  {
    id: 'u3',
    title: 'Endgame Mastery',
    lessons: [
      { id: 'l10', title: 'King & pawn endgames', minutes: 14, done: false },
      { id: 'l11', title: 'Rook endgame essentials', minutes: 16, done: false },
    ],
  },
];

/** All lesson ids in curriculum order. */
export const orderedLessonIds: string[] = curriculum.flatMap((u) => u.lessons.map((l) => l.id));

/** The next lesson after `id` in curriculum order, or null at the end. */
export function nextLessonId(id: string): string | null {
  const i = orderedLessonIds.indexOf(id);
  return i >= 0 && i < orderedLessonIds.length - 1 ? orderedLessonIds[i + 1] : null;
}

/** The first not-yet-completed lesson (for a "Continue learning" resume). */
export function firstIncompleteLesson(completed: string[]): { id: string; title: string } | null {
  for (const u of curriculum) {
    for (const l of u.lessons) {
      if (!completed.includes(l.id)) return { id: l.id, title: l.title };
    }
  }
  return null;
}

/* ------------------------------------------------------------- OLYMPIAD LIVE */

export type LiveGame = {
  id: string;
  white: string;
  black: string;
  event: string;
  /** Result shown on the card. */
  result: string;
  /** Full PGN move text — the board replays these moves. */
  pgn: string;
  status: 'live' | 'starting';
};

// Featured broadcasts are real, famous games that the board replays move by move.
// (We can't legally stream live Olympiad boards from a free API, so ChessMaster
// ships verifiable masterpieces you can watch and learn from — the playback is
// real chess, driven by chess.js.)
export const liveGames: LiveGame[] = [
  {
    id: 'g1',
    white: 'Paul Morphy',
    black: 'Duke & Count',
    event: 'The Opera Game · Paris 1858',
    result: '1-0',
    status: 'live',
    pgn: '1. e4 e5 2. Nf3 d6 3. d4 Bg4 4. dxe5 Bxf3 5. Qxf3 dxe5 6. Bc4 Nf6 7. Qb3 Qe7 8. Nc3 c6 9. Bg5 b5 10. Nxb5 cxb5 11. Bxb5+ Nbd7 12. O-O-O Rd8 13. Rxd7 Rxd7 14. Rd1 Qe6 15. Bxd7+ Nxd7 16. Qb8+ Nxb8 17. Rd8# 1-0',
  },
  {
    id: 'g2',
    white: 'Adolf Anderssen',
    black: 'Lionel Kieseritzky',
    event: 'The Immortal Game · London 1851',
    result: '1-0',
    status: 'live',
    pgn: '1. e4 e5 2. f4 exf4 3. Bc4 Qh4+ 4. Kf1 b5 5. Bxb5 Nf6 6. Nf3 Qh6 7. d3 Nh5 8. Nh4 Qg5 9. Nf5 c6 10. g4 Nf6 11. Rg1 cxb5 12. h4 Qg6 13. h5 Qg5 14. Qf3 Ng8 15. Bxf4 Qf6 16. Nc3 Bc5 17. Nd5 Qxb2 18. Bd6 Bxg1 19. e5 Qxa1+ 20. Ke2 Na6 21. Nxg7+ Kd8 22. Qf6+ Nxf6 23. Be7# 1-0',
  },
  {
    id: 'g3',
    white: 'Adolf Anderssen',
    black: 'Jean Dufresne',
    event: 'The Evergreen Game · Berlin 1852',
    result: '1-0',
    status: 'live',
    pgn: '1. e4 e5 2. Nf3 Nc6 3. Bc4 Bc5 4. b4 Bxb4 5. c3 Ba5 6. d4 exd4 7. O-O d3 8. Qb3 Qf6 9. e5 Qg6 10. Re1 Nge7 11. Ba3 b5 12. Qxb5 Rb8 13. Qa4 Bb6 14. Nbd2 Bb7 15. Ne4 Qf5 16. Bxd3 Qh5 17. Nf6+ gxf6 18. exf6 Rg8 19. Rad1 Qxf3 20. Rxe7+ Nxe7 21. Qxd7+ Kxd7 22. Bf5+ Ke8 23. Bd7+ Kf8 24. Bxe7# 1-0',
  },
];

/* -------------------------------------------------------------- SUBSCRIPTION */

export type Plan = { id: string; name: string; price: string; color: string; blurb: string };

export const plans: Plan[] = [
  { id: 'basic', name: 'Basic', price: '399', color: colors.orange, blurb: 'Access to core classes and puzzles.' },
  { id: 'plus', name: 'Plus', price: '499', color: colors.mint, blurb: 'Everything in Basic + live classes and analysis.' },
  { id: 'yearly', name: 'Yearly', price: '699', color: colors.pink, blurb: 'All classes, a free chess board, and birthday chocolates.' },
];

/* --------------------------------------------------------------------- GAME */

export type GameMode = { id: string; title: string; blurb: string; icon: string };

export const gameModes: GameMode[] = [
  { id: 'tournaments', title: 'Play Tournaments', blurb: 'Join open arenas and climb the boards.', icon: 'trophy' },
  { id: 'friends', title: 'Play with Friends', blurb: 'Two players, one device (pass & play).', icon: 'people' },
  { id: 'computer', title: 'Practice vs Computer', blurb: 'Train against bots at every level.', icon: 'hardware-chip' },
  { id: 'clock', title: 'Digital Chess Clock', blurb: 'Use a real clock for OTB practice.', icon: 'timer' },
];

export type OpenTournament = { id: string; name: string; format: string; players: number; startsIn: string };

export const openTournaments: OpenTournament[] = [
  { id: 't1', name: 'Olympiad Fan Blitz', format: '3+2 · Blitz', players: 1240, startsIn: '12m' },
  { id: 't2', name: 'Daily Rapid Arena', format: '10+0 · Rapid', players: 358, startsIn: '48m' },
  { id: 't3', name: 'Beginner Bullet Cup', format: '1+0 · Bullet', players: 512, startsIn: '1h 5m' },
];

/* --------------------------------------------------------- ANALYZE (my games) */

export const analysisFindings = [
  { id: 'a1', label: 'Blunders', value: '3', color: colors.danger },
  { id: 'a2', label: 'Missed tactics', value: '5', color: colors.warning },
  { id: 'a3', label: 'Accuracy', value: '84%', color: colors.success },
];

export const recurringMistakes = [
  'You hang your light-squared bishop in the opening (40% of games).',
  'You miss back-rank mate threats when short on time.',
  'You trade into losing king-and-pawn endgames.',
];

/* ---------------------------------------------------------------- PREP COACH */

export const prepPlan = [
  { id: 'd1', day: 'Mon', focus: 'Sharpen your Sicilian repertoire (Najdorf lines)' },
  { id: 'd2', day: 'Tue', focus: '30 tactics: forks & discovered attacks' },
  { id: 'd3', day: 'Wed', focus: 'Rook endgame drills (Lucena & Philidor)' },
  { id: 'd4', day: 'Thu', focus: 'Scout opponent: aggressive 1.e4 player' },
  { id: 'd5', day: 'Fri', focus: 'Rest + review one annotated master game' },
];

/* --------------------------------------------------------------------- SHOP */

export type Product = { id: string; name: string; blurb: string; color: string; icon: string };

export const products: Product[] = [
  { id: 's1', name: 'Chess Board Set', blurb: 'Chess board and chess pieces.', color: colors.cyan, icon: 'grid' },
  { id: 's2', name: 'Chess T-Shirt', blurb: 'Customized ChessMaster tees.', color: colors.lavender, icon: 'shirt' },
  { id: 's3', name: 'Chess Pieces', blurb: 'Buy a full set or single pieces.', color: colors.brown, icon: 'cube' },
  { id: 's4', name: 'Chess Clock', blurb: 'Tournament-grade digital clock.', color: colors.teal, icon: 'timer' },
];
