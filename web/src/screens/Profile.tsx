import { useAuth } from '@/auth/AuthProvider';
import { useProgress, levelFromXp, ACHIEVEMENTS } from '@/game/progress';
import { PageHeader } from '@/components/ui';
import { orderedLessonIds } from '@shared/data/content';

export function Profile() {
  const { user, signOut } = useAuth();
  const { progress } = useProgress();
  const earned = new Set(progress.achievements);
  const stats: [string, string | number][] = [
    ['Level', levelFromXp(progress.xp)],
    ['XP', progress.xp],
    ['Day streak', progress.streakDays],
    ['Puzzles solved', progress.puzzlesSolved],
    ['Games played', progress.gamesPlayed],
    ['Games won', progress.gamesWon],
    ['Lessons', `${progress.lessonsCompleted.length}/${orderedLessonIds.length}`],
  ];

  return (
    <div>
      <PageHeader eyebrow="Profile" title={user?.firstName || 'Player'} sub={user?.email} />

      <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
        {stats.map(([l, v]) => (
          <div key={l} className="card px-4 py-3">
            <div className="font-mono text-[11px] uppercase tracking-wider text-ink-faint">{l}</div>
            <div className="mt-0.5 font-display text-2xl font-black">{v}</div>
          </div>
        ))}
      </div>

      <h2 className="mb-3 mt-8 font-display text-xl font-black">Achievements</h2>
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-5">
        {ACHIEVEMENTS.map((a) => {
          const got = earned.has(a.id);
          return (
            <div key={a.id} className={`card flex flex-col items-center gap-1 p-4 text-center ${got ? '' : 'opacity-40'}`}>
              <span className={`grid h-11 w-11 place-items-center rounded-full text-xl ${got ? 'bg-gold text-white' : 'bg-plaster-2 text-ink-faint'}`}>{a.icon}</span>
              <span className="text-xs font-semibold">{a.title}</span>
            </div>
          );
        })}
      </div>

      <button onClick={signOut} className="btn-ghost mt-8">Sign out</button>
    </div>
  );
}
