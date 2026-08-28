import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/auth/AuthProvider';
import { useProgress, levelFromXp, xpIntoLevel } from '@/game/progress';
import { firstIncompleteLesson, orderedLessonIds } from '@shared/data/content';
import { IconPlay, IconPuzzle, IconLearn, IconCrown, IconGlobe, IconTrophy } from '@/components/icons';

const QUICK = [
  { to: '/app/play', label: 'Play', desc: 'Computer · friend · online', Icon: IconPlay, c: '#5B4BE0' },
  { to: '/app/puzzles', label: 'Puzzles', desc: 'Millions + daily', Icon: IconPuzzle, c: '#B8912F' },
  { to: '/app/learn', label: 'Learn', desc: '40 lessons', Icon: IconLearn, c: '#0E9AA7' },
  { to: '/app/masters', label: 'Master Base', desc: 'Play a legend', Icon: IconCrown, c: '#2E9E6B' },
  { to: '/app/tournaments', label: 'Tournaments', desc: 'Round-robin · knockout', Icon: IconTrophy, c: '#C8524B' },
  { to: '/app/olympiad', label: 'Olympiad', desc: 'Samarkand 2026', Icon: IconGlobe, c: '#0A5C6B' },
];

export function Home() {
  const { user } = useAuth();
  const { progress } = useProgress();
  const nav = useNavigate();
  const lvl = levelFromXp(progress.xp);
  const next = firstIncompleteLesson(progress.lessonsCompleted);
  const doneCount = progress.lessonsCompleted.length;
  const total = orderedLessonIds.length;

  return (
    <div>
      <p className="eyebrow mb-1">Welcome back</p>
      <h1 className="font-display text-3xl font-black sm:text-4xl">{user?.firstName ? `Hi, ${user.firstName}.` : 'Ready to play?'}</h1>

      {/* stat strip */}
      <div className="mt-5 grid grid-cols-3 gap-3">
        {[['Level', lvl], ['Streak', `${progress.streakDays}🔥`], ['Solved', progress.puzzlesSolved]].map(([l, v]) => (
          <div key={l as string} className="card px-4 py-3">
            <div className="font-mono text-[11px] uppercase tracking-wider text-ink-faint">{l}</div>
            <div className="mt-0.5 font-display text-2xl font-black">{v}</div>
          </div>
        ))}
      </div>
      <div className="mt-2 h-2 overflow-hidden rounded-full bg-line">
        <div className="h-full rounded-full bg-gradient-to-r from-teal to-gold" style={{ width: `${xpIntoLevel(progress.xp)}%` }} />
      </div>

      {/* continue learning */}
      <button onClick={() => nav(next ? `/app/learn/${next.id}` : '/app/learn')}
        className="mt-6 flex w-full items-center gap-4 rounded-2xl bg-gradient-to-br from-teal-deep to-teal p-5 text-left text-white shadow-lift transition hover:brightness-110">
        <span className="grid h-12 w-12 flex-none place-items-center rounded-xl bg-white/15 text-2xl">♞</span>
        <div className="min-w-0 flex-1">
          <div className="font-mono text-[11px] uppercase tracking-wider text-white/70">Continue learning · {doneCount}/{total}</div>
          <div className="truncate text-lg font-bold">{next ? next.title : 'Course complete — replay any lesson'}</div>
        </div>
        <span className="text-2xl">›</span>
      </button>

      {/* quick actions */}
      <h2 className="mb-3 mt-8 font-display text-xl font-black">Jump in</h2>
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {QUICK.map(({ to, label, desc, Icon, c }) => (
          <button key={to} onClick={() => nav(to)} className="card flex items-center gap-4 p-5 text-left transition hover:-translate-y-0.5">
            <span className="grid h-11 w-11 flex-none place-items-center rounded-xl text-white" style={{ background: c }}><Icon /></span>
            <div><div className="font-bold">{label}</div><div className="text-[13px] text-ink-faint">{desc}</div></div>
          </button>
        ))}
      </div>
    </div>
  );
}
