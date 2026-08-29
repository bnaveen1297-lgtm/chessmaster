import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/auth/AuthProvider';
import { useProgress, levelFromXp, xpIntoLevel, XP_PER_LEVEL } from '@/game/progress';
import { usePrefs } from '@/game/prefs';
import { firstIncompleteLesson, orderedLessonIds } from '@shared/data/content';
import { Ring } from '@/components/Ring';
import { dailyPuzzle, dailyDoneToday } from '@/lib/daily';
import { fetchLeaderboard, type LeaderRow } from '@/lib/leaderboard';
import { IconPlay, IconPuzzle, IconLearn, IconCrown, IconGlobe, IconTrophy } from '@/components/icons';

const QUICK = [
  { to: '/app/play', label: 'Play', desc: 'Computer · friend · online', Icon: IconPlay, c: '#1C1C1E' },
  { to: '/app/puzzles', label: 'Puzzles', desc: 'Millions + daily', Icon: IconPuzzle, c: '#2FA6CE' },
  { to: '/app/learn', label: 'Learn', desc: '40 lessons', Icon: IconLearn, c: '#C9A24B' },
  { to: '/app/masters', label: 'Master Base', desc: 'Play a legend', Icon: IconCrown, c: '#1C1C1E' },
  { to: '/app/tournaments', label: 'Tournaments', desc: 'Round-robin · knockout', Icon: IconTrophy, c: '#2FA6CE' },
  { to: '/app/olympiad', label: 'Olympiad', desc: 'Samarkand 2026', Icon: IconGlobe, c: '#C9A24B' },
];

function greeting() {
  const h = new Date().getHours();
  return h < 12 ? 'Good morning' : h < 18 ? 'Good afternoon' : 'Good evening';
}

export function Home() {
  const { user } = useAuth();
  const { progress } = useProgress();
  const { prefs } = usePrefs();
  const nav = useNavigate();
  const lvl = levelFromXp(progress.xp);
  const next = firstIncompleteLesson(progress.lessonsCompleted);
  const doneCount = progress.lessonsCompleted.length;
  const total = orderedLessonIds.length;
  const daily = dailyPuzzle();
  const dailyDone = dailyDoneToday();
  const goal = progress.dailyGoal || 3;

  const [board, setBoard] = useState<LeaderRow[]>([]);
  useEffect(() => {
    fetchLeaderboard(3).then(setBoard).catch(() => setBoard([]));
  }, []);

  return (
    <div className="space-y-6">
      {/* header */}
      <div className="flex items-end justify-between">
        <div>
          <p className="font-mono text-[11px] uppercase tracking-[0.18em] text-ink-faint">
            {new Date().toLocaleDateString(undefined, { weekday: 'long', month: 'long', day: 'numeric' })}
          </p>
          <h1 className="mt-1 font-display text-3xl font-black tracking-tight sm:text-[34px]">
            {greeting()}{user?.firstName ? `, ${user.firstName}` : ''}.
          </h1>
        </div>
      </div>

      {prefs.wantsCoach && (
        <button onClick={() => nav(next ? `/app/learn/${next.id}` : '/app/learn')}
          className="flex w-full items-center gap-3 rounded-xl border border-teal/30 bg-teal/10 px-4 py-3 text-left">
          <span className="text-lg">🎯</span>
          <span className="flex-1 text-sm font-semibold text-ink">Coach tip · {prefs.level} plan — {next ? `next up: ${next.title}` : 'review a lesson to stay sharp'}</span>
          <span className="text-teal">›</span>
        </button>
      )}

      {/* TODAY card — rings + streak + level */}
      <div className="card p-5 sm:p-6">
        <div className="flex flex-col items-center gap-6 sm:flex-row sm:items-center sm:gap-8">
          <Ring value={progress.solvedToday} max={goal} size={128} color="#0E9AA7">
            <div>
              <div className="font-display text-3xl font-black leading-none">{progress.solvedToday}<span className="text-ink-faint">/{goal}</span></div>
              <div className="mt-1 font-mono text-[10px] uppercase tracking-wider text-ink-faint">Daily goal</div>
            </div>
          </Ring>
          <div className="grid flex-1 grid-cols-3 gap-3 text-center sm:text-left">
            <Stat big={`${progress.streakDays}`} label="Day streak" accent="🔥" />
            <Stat big={`${lvl}`} label="Level" />
            <Stat big={`${progress.puzzlesSolved}`} label="Solved" />
            <div className="col-span-3">
              <div className="mb-1 flex items-center justify-between font-mono text-[11px] text-ink-faint">
                <span>Level {lvl}</span><span>{xpIntoLevel(progress.xp)}/{XP_PER_LEVEL} XP</span>
              </div>
              <div className="h-2.5 overflow-hidden rounded-full bg-plaster-2">
                <div className="h-full rounded-full bg-gradient-to-r from-teal to-gold transition-all duration-700" style={{ width: `${xpIntoLevel(progress.xp)}%` }} />
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Daily puzzle + Continue learning */}
      <div className="grid gap-4 md:grid-cols-2">
        <button onClick={() => nav('/app/daily')}
          className="group relative overflow-hidden rounded-2xl bg-gradient-to-br from-ink to-[#403c38] p-5 text-left text-white shadow-lift transition hover:-translate-y-0.5">
          <div className="absolute -right-6 -top-6 text-8xl opacity-15 transition group-hover:scale-110">♟</div>
          <p className="font-mono text-[11px] uppercase tracking-[0.16em] text-white/80">Puzzle of the day</p>
          <div className="mt-2 font-display text-2xl font-black">{dailyDone ? 'Solved today ✓' : 'Today’s puzzle'}</div>
          <p className="mt-1 text-sm text-white/85">{dailyDone ? 'Come back tomorrow for a new one.' : `${daily.theme} · ${daily.difficulty} — keep your streak alive.`}</p>
          <span className="mt-4 inline-block rounded-full bg-white/20 px-4 py-1.5 text-sm font-bold">{dailyDone ? 'Review' : 'Solve now'}</span>
        </button>

        <button onClick={() => nav(next ? `/app/learn/${next.id}` : '/app/learn')}
          className="group relative overflow-hidden rounded-2xl bg-gradient-to-br from-teal-deep to-teal p-5 text-left text-white shadow-lift transition hover:-translate-y-0.5">
          <div className="absolute -right-4 -top-4 text-8xl opacity-15 transition group-hover:scale-110">♞</div>
          <p className="font-mono text-[11px] uppercase tracking-[0.16em] text-white/70">Continue learning · {doneCount}/{total}</p>
          <div className="mt-2 truncate font-display text-2xl font-black">{next ? next.title : 'Course complete'}</div>
          <p className="mt-1 text-sm text-white/85">{next ? 'Pick up where you left off.' : 'Replay any lesson to sharpen up.'}</p>
          <span className="mt-4 inline-block rounded-full bg-white/15 px-4 py-1.5 text-sm font-bold">Resume</span>
        </button>
      </div>

      {/* Today's leaders */}
      <div className="card p-5">
        <div className="mb-3 flex items-center justify-between">
          <h2 className="font-display text-lg font-black">Today’s leaders</h2>
          <button onClick={() => nav('/app/leaderboard')} className="text-sm font-semibold text-teal">See all ›</button>
        </div>
        {board.length === 0 ? (
          <p className="text-sm text-ink-soft">Be the first on the board — solve puzzles and win games to climb.</p>
        ) : (
          <div className="space-y-1.5">
            {board.map((r, i) => (
              <div key={i} className="flex items-center gap-3 rounded-xl px-2 py-1.5">
                <span className={`grid h-7 w-7 flex-none place-items-center rounded-full text-xs font-black ${i === 0 ? 'bg-gold text-white' : i === 1 ? 'bg-ink-faint text-white' : 'bg-plaster-2 text-ink-soft'}`}>{i + 1}</span>
                <span className="flex-1 truncate font-semibold">{r.name}</span>
                <span className="font-mono text-sm font-bold text-teal">{r.xp} XP</span>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* quick actions */}
      <div>
        <h2 className="mb-3 font-display text-lg font-black">Jump in</h2>
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {QUICK.map(({ to, label, desc, Icon, c }) => (
            <button key={to} onClick={() => nav(to)} className="card flex items-center gap-4 p-4 text-left transition hover:-translate-y-0.5">
              <span className="grid h-11 w-11 flex-none place-items-center rounded-xl text-white" style={{ background: c }}><Icon /></span>
              <div><div className="font-bold">{label}</div><div className="text-[13px] text-ink-faint">{desc}</div></div>
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}

function Stat({ big, label, accent }: { big: string; label: string; accent?: string }) {
  return (
    <div>
      <div className="font-display text-2xl font-black leading-none">{big}{accent && <span className="text-lg"> {accent}</span>}</div>
      <div className="mt-1 font-mono text-[10px] uppercase tracking-wider text-ink-faint">{label}</div>
    </div>
  );
}
