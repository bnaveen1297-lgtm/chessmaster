import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { fetchLeaderboard, type LeaderRow } from '@/lib/leaderboard';

/** Compact "Today's leaders" card, reused across screens. */
export function LeaderboardCard({ limit = 3, className = '' }: { limit?: number; className?: string }) {
  const nav = useNavigate();
  const [rows, setRows] = useState<LeaderRow[]>([]);
  const [loaded, setLoaded] = useState(false);

  useEffect(() => {
    fetchLeaderboard(limit).then(setRows).catch(() => setRows([])).finally(() => setLoaded(true));
  }, [limit]);

  return (
    <div className={`card p-5 ${className}`}>
      <div className="mb-3 flex items-center justify-between">
        <h2 className="font-display text-lg font-black">Today’s leaders</h2>
        <button onClick={() => nav('/app/leaderboard')} className="text-sm font-semibold text-teal">See all ›</button>
      </div>
      {loaded && rows.length === 0 ? (
        <p className="text-sm text-ink-soft">Be the first on the board — solve puzzles and win games to climb.</p>
      ) : (
        <div className="space-y-1.5">
          {rows.map((r, i) => (
            <div key={i} className="flex items-center gap-3 rounded-xl px-1 py-1.5">
              <span className={`grid h-7 w-7 flex-none place-items-center rounded-full text-xs font-black ${i === 0 ? 'bg-gold text-white' : i === 1 ? 'bg-ink-faint text-white' : 'bg-plaster-2 text-ink-soft'}`}>{i + 1}</span>
              <span className="flex-1 truncate font-semibold">{r.name}</span>
              <span className="font-mono text-sm font-bold text-teal">{r.xp} XP</span>
            </div>
          ))}
          {!loaded && <p className="text-sm text-ink-faint">Loading…</p>}
        </div>
      )}
    </div>
  );
}
