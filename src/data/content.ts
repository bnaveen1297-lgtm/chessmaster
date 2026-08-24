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

/* ------------------------------------------------------------- OLYMPIAD LIVE */

export type LiveGame = {
  id: string;
  white: string;
  black: string;
  event: string;
  eval: string;
  moves: number;
  status: 'live' | 'starting';
  fen: string;
};

export const liveGames: LiveGame[] = [
  {
    id: 'g1',
    white: 'Gukesh D',
    black: 'Caruana F',
    event: 'Olympiad · Round 7 · Board 1',
    eval: '+0.4',
    moves: 31,
    status: 'live',
    fen: 'r2q1rk1/pp2bppp/2n1bn2/3p4/3P4/2N1BN2/PP2BPPP/R2Q1RK1 w - - 0 12',
  },
  {
    id: 'g2',
    white: 'Ju Wenjun',
    black: 'Goryachkina A',
    event: 'Olympiad · Round 7 · Board 1',
    eval: '−0.2',
    moves: 24,
    status: 'live',
    fen: 'r1bqr1k1/ppp2ppp/2np1n2/2b1p3/2B1P3/2NP1N2/PPP2PPP/R1BQR1K1 w - - 0 9',
  },
  {
    id: 'g3',
    white: 'Firouzja A',
    black: 'Nakamura H',
    event: 'Olympiad · Round 7 · Board 2',
    eval: '=',
    moves: 0,
    status: 'starting',
    fen: 'rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR w KQkq - 0 1',
  },
];

/* -------------------------------------------------------------------- PUZZLE */

export type Puzzle = {
  id: string;
  title: string;
  deadline: string;
  solved: number;
  total: number;
  fen: string;
  toMove: 'WHITE' | 'BLACK';
};

export const puzzles: Puzzle[] = [
  { id: 'p1', title: 'Beginner level tactics', deadline: '10-12-2025', solved: 10, total: 10, fen: 'r1bqkbnr/pppp1ppp/2n5/4p3/2B1P3/5Q2/PPPP1PPP/RNB1K1NR w - - 0 1', toMove: 'WHITE' },
  { id: 'p2', title: 'Mate in one', deadline: '10-12-2025', solved: 20, total: 20, fen: '6k1/5ppp/8/8/8/8/5PPP/R5K1 w - - 0 1', toMove: 'WHITE' },
  { id: 'p3', title: 'Mate in one — Advance', deadline: '01-01-2026', solved: 0, total: 20, fen: '3qk3/3ppp2/8/8/8/8/3PPP2/3QK2R w - - 0 1', toMove: 'WHITE' },
  { id: 'p4', title: 'Capture', deadline: '05-01-2026', solved: 0, total: 20, fen: 'rnbqkbnr/ppp2ppp/8/3pp3/4P3/5N2/PPPP1PPP/RNBQKB1R w - - 0 1', toMove: 'WHITE' },
];

/* -------------------------------------------------------------- SUBSCRIPTION */

export type Plan = { id: string; name: string; price: string; color: string; blurb: string };

export const plans: Plan[] = [
  { id: 'basic', name: 'Basic', price: '399', color: colors.orange, blurb: 'Access to core classes and puzzles.' },
  { id: 'plus', name: 'Plus', price: '499', color: colors.mint, blurb: 'Everything in Basic + live classes and analysis.' },
  { id: 'yearly', name: 'Yearly', price: '699', color: colors.pink, blurb: 'All classes, a free chess board, and birthday chocolates.' },
];

/* --------------------------------------------------------------------- GAME */

export type GameMode = { id: string; title: string; blurb: string; glyph: string };

export const gameModes: GameMode[] = [
  { id: 'tournaments', title: 'Play Tournaments', blurb: 'Join open arenas and climb the boards.', glyph: '🏆' },
  { id: 'friends', title: 'Play with Friends', blurb: 'Challenge a friend to a game.', glyph: '👥' },
  { id: 'computer', title: 'Practice vs Computer', blurb: 'Train against bots at every level.', glyph: '🤖' },
  { id: 'clock', title: 'Digital Chess Clock', blurb: 'Use a real clock for OTB practice.', glyph: '⏱️' },
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

export type Product = { id: string; name: string; blurb: string; color: string; glyph: string };

export const products: Product[] = [
  { id: 's1', name: 'Chess Board Set', blurb: 'Chess board and chess pieces.', color: colors.cyan, glyph: '♟️' },
  { id: 's2', name: 'Chess T-Shirt', blurb: 'Customized ChessMaster tees.', color: colors.lavender, glyph: '👕' },
  { id: 's3', name: 'Chess Pieces', blurb: 'Buy a full set or single pieces.', color: colors.brown, glyph: '♞' },
  { id: 's4', name: 'Chess Clock', blurb: 'Tournament-grade digital clock.', color: colors.teal, glyph: '⏱️' },
];
