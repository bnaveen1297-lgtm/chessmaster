import type { Level } from '@/game/prefs';
import type { Progress } from '@/game/progress';
import type { ReportCard } from '@/engine/reportCard';

/**
 * The adaptive learning path — chesshub360's differentiator. Chess.com and
 * Lichess let you play, solve and analyze, but they don't close the loop. Here,
 * the analyzer distils your real games into a {@link WeaknessProfile}; this
 * engine turns that (plus your in-app progress and level) into a prioritised
 * skill map and a short daily queue that targets exactly what's holding you
 * back — and re-computes as you improve. "Your games teach you."
 *
 * Everything is pure and deterministic so it's instant and unit-testable.
 */

export type WeaknessProfile = {
  updatedAt: string;
  source: string; // e.g. "Chess.com · magnus"
  games: number;
  avgAccuracy: number;
  worstPhase: 'opening' | 'middlegame' | 'endgame' | null;
  weakerColor: 'white' | 'black' | null;
  dominantError: 'blunder' | 'mistake' | 'inaccuracy' | 'miss' | null;
  blundersPerGame: number;
};

export type SkillId = 'tactics' | 'openings' | 'middlegame' | 'endgame' | 'calculation' | 'time';
export type Skill = {
  id: SkillId;
  name: string;
  icon: string;
  mastery: number;   // 0..100
  priority: number;  // higher = work on this sooner
  why: string;
  action: { label: string; to: string };
};
export type Task = { title: string; detail: string; to: string; tag: string };
export type LearningPath = {
  headline: string;
  sub: string;
  hasGameData: boolean;
  focus: Skill;
  skills: Skill[];       // sorted, weakest/most-urgent first
  today: Task[];
  overall: number;       // 0..100 overall readiness
};

/* --------------------------- weakness profile I/O --------------------------- */

const KEY = (uid?: string | null) => `chesshub360.weakness.${uid ?? 'guest'}`;

/** Distil a report card (built from the player's imported games) into a compact profile. */
export function profileFromReportCard(card: ReportCard, source: string): WeaknessProfile {
  const phases: ('opening' | 'middlegame' | 'endgame')[] = ['opening', 'middlegame', 'endgame'];
  const worstPhase = phases
    .filter((p) => card.byPhase[p].moves >= 5)
    .sort((a, b) => card.byPhase[b].acpl - card.byPhase[a].acpl)[0] ?? null;
  const weakerColor = card.byColor.white.games && card.byColor.black.games
    ? (card.byColor.white.accuracy <= card.byColor.black.accuracy ? 'white' : 'black')
    : null;
  const mq = card.moveQuality;
  const errs: [WeaknessProfile['dominantError'], number][] = [
    ['blunder', mq.blunder], ['miss', mq.miss], ['mistake', mq.mistake], ['inaccuracy', mq.inaccuracy],
  ];
  const dominantError = errs.sort((a, b) => (b[1] as number) - (a[1] as number))[0][1] > 0
    ? errs[0][0] : null;
  return {
    updatedAt: new Date().toISOString(),
    source,
    games: card.games,
    avgAccuracy: card.avgAccuracy,
    worstPhase,
    weakerColor,
    dominantError,
    blundersPerGame: card.blundersPerGame,
  };
}

export function saveWeaknessProfile(uid: string | null | undefined, p: WeaknessProfile): void {
  try { localStorage.setItem(KEY(uid), JSON.stringify(p)); } catch { /* ignore */ }
}
export function readWeaknessProfile(uid: string | null | undefined): WeaknessProfile | null {
  try { const raw = localStorage.getItem(KEY(uid)); return raw ? JSON.parse(raw) as WeaknessProfile : null; }
  catch { return null; }
}

/* ------------------------------- the engine ------------------------------- */

const clamp = (n: number) => Math.max(4, Math.min(98, Math.round(n)));
const levelBase = (l: Level) => (l === 'Advanced' ? 62 : l === 'Intermediate' ? 48 : 32);

export function buildLearningPath(level: Level, p: Progress, profile: WeaknessProfile | null): LearningPath {
  const base = levelBase(level);
  const lessons = p.lessonsCompleted?.length ?? 0;
  const hasGameData = !!profile && profile.games > 0;

  // Baselines from in-app progress (used when there's no game analysis yet).
  let tactics = base + Math.min(35, (p.puzzlesSolved || 0) * 1.1);
  let openings = base - 6 + Math.min(24, lessons * 1.2);
  let middlegame = base - 2 + Math.min(18, lessons * 0.8);
  let endgame = base - 8 + Math.min(20, lessons * 1.0);
  let calculation = base + Math.min(28, (p.puzzlesSolved || 0) * 0.8);
  let time = base; // only measurable from timed games

  // Sharpen with the player's real games when we have them.
  if (profile) {
    const accAdj = (profile.avgAccuracy - 75) * 0.6; // above/below a 75% baseline
    tactics += accAdj - profile.blundersPerGame * 7;
    calculation += accAdj - profile.blundersPerGame * 5;
    middlegame += accAdj * 0.6;
    if (profile.worstPhase === 'opening') openings -= 16;
    if (profile.worstPhase === 'middlegame') middlegame -= 16;
    if (profile.worstPhase === 'endgame') endgame -= 16;
    if (profile.dominantError === 'blunder') { tactics -= 12; calculation -= 8; }
    if (profile.dominantError === 'miss') { calculation -= 10; tactics -= 4; }
    if (profile.dominantError === 'inaccuracy') { middlegame -= 8; }
  }

  const skills: Skill[] = [
    { id: 'tactics', name: 'Tactics', icon: '⚡', mastery: clamp(tactics), priority: 0,
      why: profile?.dominantError === 'blunder' ? 'Blunders are your most common error — sharpen pattern recognition.' : 'Faster pattern recognition wins the most rating.',
      action: { label: 'Train tactics', to: '/app/puzzles' } },
    { id: 'openings', name: 'Openings', icon: '📖', mastery: clamp(openings), priority: 0,
      why: profile?.worstPhase === 'opening' ? 'You lose ground early — deepen your repertoire.' : 'Reach middlegames you understand.',
      action: { label: 'Build repertoire', to: '/app/coach' } },
    { id: 'middlegame', name: 'Middlegame plans', icon: '♟', mastery: clamp(middlegame), priority: 0,
      why: profile?.worstPhase === 'middlegame' ? 'Most of your accuracy is lost in the middlegame.' : 'Turn positions into plans.',
      action: { label: 'Study games', to: '/app/masters' } },
    { id: 'endgame', name: 'Endgames', icon: '♚', mastery: clamp(endgame), priority: 0,
      why: profile?.worstPhase === 'endgame' ? 'Points are slipping in the endgame — drill technique.' : 'Convert winning positions.',
      action: { label: 'Learn endgames', to: '/app/learn' } },
    { id: 'calculation', name: 'Calculation', icon: '🧮', mastery: clamp(calculation), priority: 0,
      why: profile?.dominantError === 'miss' ? 'You’re missing wins — calculate lines to the end.' : 'Look deeper, check candidate moves.',
      action: { label: 'Timed exam', to: '/app/puzzles/exam' } },
    { id: 'time', name: 'Time management', icon: '⏱', mastery: clamp(time), priority: 0,
      why: 'Keep a steady pace — a good move found slowly beats a fast mistake.',
      action: { label: 'Play rapid', to: '/app/play/computer' } },
  ];

  // Priority: weakest first, with a boost to whatever the games flag.
  for (const s of skills) {
    s.priority = 100 - s.mastery;
    if (profile?.worstPhase === 'opening' && s.id === 'openings') s.priority += 18;
    if (profile?.worstPhase === 'middlegame' && s.id === 'middlegame') s.priority += 18;
    if (profile?.worstPhase === 'endgame' && s.id === 'endgame') s.priority += 18;
    if ((profile?.dominantError === 'blunder' || profile?.dominantError === 'miss') && (s.id === 'tactics' || s.id === 'calculation')) s.priority += 12;
  }
  skills.sort((a, b) => b.priority - a.priority);
  const focus = skills[0];
  const overall = Math.round(skills.reduce((a, s) => a + s.mastery, 0) / skills.length);

  // Today's adaptive queue.
  const today: Task[] = [];
  today.push({ title: focus.action.label, detail: focus.why, to: focus.action.to, tag: focus.name });
  if (skills[1]) today.push({ title: skills[1].action.label, detail: skills[1].why, to: skills[1].action.to, tag: skills[1].name });
  if (hasGameData || (p.gamesPlayed || 0) > 0) {
    today.push({ title: 'Review your latest game', detail: 'See the moment it turned — the deep report shows the fix.', to: '/app/analyze', tag: 'Review' });
  }
  if (!hasGameData) {
    today.push({ title: 'Import your online games', detail: 'Connect your Chess.com or Lichess name so your path targets your real weaknesses.', to: '/app/analyze', tag: 'Personalize' });
  }
  today.push({ title: 'Daily puzzle', detail: 'Keep the streak alive — a quick tactical rep.', to: '/app/daily', tag: 'Habit' });

  const headline = hasGameData
    ? `Your biggest lever: ${focus.name.toLowerCase()}`
    : 'Your personalized path — make it yours';
  const sub = hasGameData
    ? `From ${profile!.games} of your games (${profile!.avgAccuracy}% accuracy). This updates as you improve.`
    : 'Import your games or keep playing — your path sharpens to your real weaknesses.';

  return { headline, sub, hasGameData, focus, skills, today, overall };
}
