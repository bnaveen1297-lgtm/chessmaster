import type { Level } from '@/game/prefs';
import type { Progress } from '@/game/progress';

/**
 * Tournament prep: a countdown-driven *peaking* plan for a real upcoming event
 * (over-the-board or online), distinct from the weekly Prep Coach and from the
 * in-app Tournaments. A coach periodises the run-up — build broadly early, sharpen
 * in the middle, taper and rest right before round one — so the player arrives
 * fresh and at their strongest. The plan adapts to however many days remain and
 * links every task straight into the app's real features.
 */

export type PrepPhase = 'Foundation' | 'Sharpen' | 'Taper' | 'Game day';
export type PrepTask = { label: string; to: string };
export type PrepBlock = {
  phase: PrepPhase;
  window: string;
  headline: string;
  tasks: PrepTask[];
  note: string;
};
export type ReadyItem = { id: string; label: string; hint: string; to: string; auto: boolean };
export type TournamentPlan = {
  daysUntil: number;
  intensity: string;
  phases: PrepBlock[];
  habits: string[];
  readiness: ReadyItem[];
  gameDay: string[];
  inGame: string[];
};

/** Whole days from now until the target date (local midnight to local midnight). */
export function daysUntil(targetISO: string): number | null {
  if (!targetISO) return null;
  const t = new Date(targetISO + 'T00:00:00');
  if (isNaN(t.getTime())) return null;
  const now = new Date();
  const a = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  const b = new Date(t.getFullYear(), t.getMonth(), t.getDate());
  return Math.round((b.getTime() - a.getTime()) / 86400000);
}

function tacticPack(level: Level): { id: string; name: string } {
  if (level === 'Advanced') return { id: 'skewers', name: 'Skewers' };
  if (level === 'Intermediate') return { id: 'forks', name: 'Forks' };
  return { id: 'backrank', name: 'Back-rank Mates' };
}

function dayWord(n: number): string {
  return `${n} day${n === 1 ? '' : 's'}`;
}

export function buildTournamentPlan(days: number, level: Level, p: Progress): TournamentPlan {
  const d = Math.max(0, days);
  const pack = tacticPack(level);

  // Periodise: a short taper of up to 2 days, the rest split ~55/45 into
  // Foundation then Sharpen. Everything scales to whatever time is left.
  const taperLen = Math.min(d, 2);
  const rest = d - taperLen;
  const foundationLen = Math.round(rest * 0.55);
  const sharpenLen = rest - foundationLen;

  const foundation: PrepBlock = {
    phase: 'Foundation',
    window: foundationLen > 0 ? `First ${dayWord(foundationLen)}` : 'If you have time',
    headline: 'Fix weaknesses and build the base',
    tasks: [
      { label: 'Review your recent games to find your leaks', to: '/app/analyze' },
      { label: 'Finish the core curriculum lessons', to: '/app/learn' },
      { label: 'Broad tactics across every theme', to: '/app/puzzles' },
      { label: 'Lock your opening repertoire', to: '/app/coach' },
    ],
    note: 'Study hard now — this is where real improvement happens. Address the mistakes your report card keeps flagging.',
  };
  const sharpen: PrepBlock = {
    phase: 'Sharpen',
    window: sharpenLen > 0 ? `Next ${dayWord(sharpenLen)}` : 'Mid run-up',
    headline: 'Peak your form with match practice',
    tasks: [
      { label: 'Play long games vs the computer at your ceiling, then review each', to: '/app/play/computer' },
      { label: `Drill the ${pack.name} pack for pattern speed`, to: `/app/puzzles/pack/${pack.id}` },
      { label: 'Dry-run your openings against a master', to: '/app/masters' },
      { label: 'Timed puzzle exam — build clock composure', to: '/app/puzzles/exam' },
    ],
    note: 'Simulate the real thing: full-length games at the tournament time control, reviewed the same day. Quality over quantity.',
  };
  const taper: PrepBlock = {
    phase: 'Taper',
    window: `Final ${dayWord(taperLen || 2)}`,
    headline: 'Wind down — arrive fresh, not fried',
    tasks: [
      { label: 'Light, confidence-building tactics only', to: '/app/puzzles/practice' },
      { label: 'Skim your repertoire — no new lines', to: '/app/coach' },
      { label: 'One relaxed game, zero pressure', to: '/app/play/computer' },
    ],
    note: 'No cramming and no hard new material. Sleep 8 hours, eat well, and trust the work you have already done.',
  };
  const gameDayBlock: PrepBlock = {
    phase: 'Game day',
    window: 'Event day',
    headline: 'Execute your routine',
    tasks: [{ label: 'Quick warm-up: 5 easy tactics to switch your brain on', to: '/app/puzzles/practice' }],
    note: 'Follow the game-day routine below. You are prepared — now just play good moves, one at a time.',
  };

  const phases: PrepBlock[] = [];
  if (foundationLen > 0) phases.push(foundation);
  if (sharpenLen > 0 || rest > 0) phases.push(sharpen);
  phases.push(taper);
  phases.push(gameDayBlock);

  const intensity =
    d >= 21 ? 'Full peaking cycle — plenty of runway to build, sharpen and taper.' :
    d >= 10 ? 'Condensed cycle — sharpen your form and taper into the event.' :
    d >= 4 ? 'Short run-up — focus on match sharpness and rest.' :
    d >= 1 ? 'Final days — taper only. Stay fresh and confident.' :
    'Event is here. Warm up lightly and trust your prep.';

  const habits = [
    'A 10-minute tactics warm-up before you study or play — every day.',
    'Run every game you play through the analyzer the same day.',
    'The blunder-check: before each move, ask “is it safe, and what does it attack?”',
    'Protect your streak — steady daily work beats last-minute cramming.',
  ];

  const readiness: ReadyItem[] = [
    { id: 'repertoire', label: 'Repertoire ready', hint: 'A plan with White and vs 1.e4 / 1.d4', to: '/app/coach', auto: false },
    { id: 'tactics', label: 'Tactics sharp', hint: `${p.puzzlesSolved} solved — aim for 50+`, to: '/app/puzzles', auto: p.puzzlesSolved >= 50 },
    { id: 'matches', label: 'Match practice', hint: `${p.gamesPlayed} games — play 5+ long ones`, to: '/app/play/computer', auto: p.gamesPlayed >= 5 },
    { id: 'endgames', label: 'Endgames drilled', hint: 'K+P, rook endings, basic mates', to: '/app/learn', auto: false },
    { id: 'reviewed', label: 'Losses reviewed', hint: 'Know why your recent games went wrong', to: '/app/analyze', auto: false },
    { id: 'logistics', label: 'Logistics set', hint: 'Time control, venue, round times, equipment', to: '/app/tournaments', auto: false },
  ];

  const gameDay = [
    'Sleep well and eat a proper meal before the round — chess burns real energy.',
    'Arrive early so you are settled, not rushed, at the board.',
    'First moves: breathe and play your prepared lines — don’t rush out of the opening.',
    'Blunder-check every single move before you release the piece.',
    'Use your clock; a good move found slowly beats a fast mistake.',
    'Between rounds: walk, hydrate, and reset — don’t re-live the last game.',
  ];

  const inGame = [
    'Sit on your hands — commit only after the safety check.',
    'Threats first: what does my opponent’s last move do? Then make your plan.',
    'When ahead, simplify and trade into a won endgame. When worse, stay patient and set problems.',
    'Manage the clock so you never drift into time trouble in a critical position.',
  ];

  return { daysUntil: d, intensity, phases, habits, readiness, gameDay, inGame };
}
