import { openings, type Opening } from '@shared/data/openings';
import { orderedLessonIds } from '@shared/data/content';
import type { Level } from '@/game/prefs';
import type { Progress } from '@/game/progress';

/**
 * The prep coach: instead of a static page, it reads the player's level and
 * progress and builds a personalised plan that links straight into the app's
 * real features (lessons, puzzle packs, play, analysis) — the "coach that
 * builds your plan" from the product vision, made actionable.
 */
export type CoachAction = { label: string; to: string };
export type CoachDay = { day: string; focus: string; action: CoachAction };
export type FocusArea = { title: string; detail: string; done: boolean; to: string };
export type RepertoireLine = { role: string; opening: Opening };

export type CoachPlan = {
  headline: string;
  subline: string;
  focusAreas: FocusArea[];
  days: CoachDay[];
  repertoire: RepertoireLine[];
};

const byName = (name: string): Opening =>
  openings.find((o) => o.name === name) ?? openings[0];

function repertoireFor(level: Level): RepertoireLine[] {
  if (level === 'Advanced') {
    return [
      { role: 'With White', opening: byName("Queen's Gambit") },
      { role: 'vs 1.e4', opening: byName('Sicilian Defense') },
      { role: 'vs 1.d4', opening: byName('Indian Defense') },
    ];
  }
  if (level === 'Intermediate') {
    return [
      { role: 'With White', opening: byName('Ruy López') },
      { role: 'vs 1.e4', opening: byName('Sicilian Defense') },
      { role: 'vs 1.d4', opening: byName('Indian Defense') },
    ];
  }
  return [
    { role: 'With White', opening: byName('Italian Game') },
    { role: 'vs 1.e4', opening: byName('Caro-Kann Defense') },
    { role: 'vs 1.d4', opening: byName('Indian Defense') },
  ];
}

export function buildCoachPlan(level: Level, p: Progress): CoachPlan {
  const lessonsDone = p.lessonsCompleted?.length ?? 0;
  const lessonsTotal = orderedLessonIds.length;

  const focusAreas: FocusArea[] = [
    {
      title: 'Master the fundamentals',
      detail: `${lessonsDone}/${lessonsTotal} lessons complete — finish the core curriculum.`,
      done: lessonsDone >= Math.min(10, lessonsTotal),
      to: '/app/learn',
    },
    {
      title: 'Sharpen your tactics',
      detail: `${p.puzzlesSolved} puzzles solved — aim for a daily set across every theme.`,
      done: p.puzzlesSolved >= 25,
      to: '/app/puzzles',
    },
    {
      title: 'Get real game experience',
      detail: `${p.gamesPlayed} games played, ${p.gamesWon} won — play and review to convert study into results.`,
      done: p.gamesPlayed >= 5,
      to: '/app/play',
    },
  ];

  // Order the week so the weakest area comes first.
  const weak = focusAreas.filter((f) => !f.done);
  const strong = focusAreas.filter((f) => f.done);
  const priority = [...weak, ...strong];

  const tacticPack = level === 'Advanced' ? 'skewers' : level === 'Intermediate' ? 'forks' : 'backrank';
  const days: CoachDay[] = [
    { day: 'Mon', focus: `Tactics: the ${tacticPack === 'backrank' ? 'Back-rank Mates' : tacticPack === 'forks' ? 'Forks' : 'Skewers'} pack`, action: { label: 'Open pack', to: `/app/puzzles/pack/${tacticPack}` } },
    { day: 'Tue', focus: 'Study: your next curriculum lesson', action: { label: 'Go to Learn', to: '/app/learn' } },
    { day: 'Wed', focus: 'Play two games and keep your clock', action: { label: 'Play the computer', to: '/app/play/computer' } },
    { day: 'Thu', focus: 'Tactics: mixed practice at your level', action: { label: 'Free practice', to: '/app/puzzles/practice' } },
    { day: 'Fri', focus: 'Review: analyze one of your games', action: { label: 'Open analyzer', to: '/app/analyze' } },
  ];

  const headline =
    priority[0] && !priority[0].done
      ? `This week: ${priority[0].title.toLowerCase()}`
      : 'You’re on track — keep the streak going';

  const sub = `A ${level.toLowerCase()} plan tuned to your progress. Do a little every day — it compounds.`;

  return { headline, subline: sub, focusAreas: priority, days, repertoire: repertoireFor(level) };
}
