import { useEffect, useState } from 'react';
import { PageHeader } from '@/components/ui';
import { useAuth } from '@/auth/AuthProvider';
import { useProgress } from '@/game/progress';
import { fetchLeaderboard, type LeaderRow } from '@/lib/leaderboard';

export function Leaderboard() {
  const { user } = useAuth();
  const { progress } = useProgress();
  const [rows, setRows] = useState<LeaderRow[]>([]);
  const [state, setState] = useState<'loading' | 'ready' | 'empty'>('loading');

  useEffect(() => {
    fetchLeaderboard(50)
      .then((r) => { setRows(r); setState(r.length ? 'ready' : 'empty'); })
      .catch(() => setState('empty'));
  }, []);

  const medal = (i: number) => (i === 0 ? 'bg-gold text-white' : i === 1 ? 'bg-ink-faint text-white' : i === 2 ? 'bg-[#b08d57] text-white' : 'bg-plaster-2 text-ink-soft');

  return (
    <div className="mx-auto max-w-2xl">
      <PageHeader eyebrow="Compete" title="Leaderboard" sub="Top players by XP. Solve puzzles, finish lessons and win games to climb." />

      {/* your standing */}
      <div className="mb-5 flex items-center gap-4 rounded-2xl bg-gradient-to-br from-teal-deep to-teal p-5 text-white">
        <span className="grid h-12 w-12 place-items-center rounded-full bg-white/15 font-display text-xl font-black">{(user?.firstName || 'Y')[0]?.toUpperCase()}</span>
        <div className="flex-1">
          <div className="font-bold">{user?.firstName || 'You'}</div>
          <div className="font-mono text-[11px] uppercase tracking-wider text-white/70">Your XP</div>
        </div>
        <div className="text-right"><div className="font-display text-3xl font-black">{progress.xp}</div><div className="font-mono text-[11px] text-white/70">🔥 {progress.streakDays}d</div></div>
      </div>

      {state === 'loading' && <p className="text-ink-soft">Loading…</p>}
      {state === 'empty' && (
        <div className="rounded-2xl border border-line bg-plaster-2 p-5 text-sm text-ink-soft">
          The leaderboard opens once players sign in and start earning XP. Sign in with an account (guest scores stay on this device) and be the first to top it.
        </div>
      )}
      {state === 'ready' && (
        <div className="overflow-hidden rounded-2xl border border-line bg-surface shadow-soft">
          {rows.map((r, i) => (
            <div key={i} className="flex items-center gap-3 border-b border-line px-4 py-3 last:border-b-0">
              <span className={`grid h-8 w-8 flex-none place-items-center rounded-full text-sm font-black ${medal(i)}`}>{i + 1}</span>
              <span className="flex-1 truncate font-semibold">{r.name}</span>
              {r.streak_days > 0 && <span className="font-mono text-xs text-ink-faint">🔥 {r.streak_days}</span>}
              <span className="font-mono font-bold text-teal">{r.xp} XP</span>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
