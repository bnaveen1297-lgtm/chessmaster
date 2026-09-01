import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { PageHeader } from '@/components/ui';
import { useAuth } from '@/auth/AuthProvider';
import { useProgress } from '@/game/progress';
import { puzzleCourse, packDoneId, allPacks, type PuzzlePack } from '@/data/puzzleCourse';
import { packSolvedCount } from '@/game/puzzleProgress';
import { libraryCount, preloadLibrary } from '@/lib/puzzleLibrary';

export function PuzzleHub() {
  const nav = useNavigate();
  const { user } = useAuth();
  const { progress } = useProgress();
  const done = new Set(progress.lessonsCompleted ?? []);
  const [counts, setCounts] = useState<Record<string, number>>({});

  useEffect(() => {
    preloadLibrary();
    let alive = true;
    Promise.all(allPacks.map((p) => libraryCount(p.theme).then((n) => [p.id, n] as const)))
      .then((pairs) => { if (alive) setCounts(Object.fromEntries(pairs)); });
    return () => { alive = false; };
  }, []);

  return (
    <div className="mx-auto max-w-3xl">
      <PageHeader eyebrow="Puzzles" title="Puzzle courses"
        sub="A guided path through the essential tactics — one theme at a time. Solve a pack to master its pattern." />

      {/* Tactics Rush — the timed survival sprint (headline). */}
      <button onClick={() => nav('/app/puzzles/rush')}
        className="mb-3 flex w-full items-center justify-between rounded-2xl bg-ink p-5 text-left text-white transition hover:-translate-y-0.5">
        <div>
          <div className="text-[11px] font-bold uppercase tracking-wider text-gold-soft">New · timed</div>
          <div className="font-display text-lg font-black">Tactics Rush</div>
          <div className="text-[13px] text-white/70">Solve as many as you can before the clock — 3 strikes and you're out.</div>
        </div>
        <span className="text-3xl">⚡</span>
      </button>

      <div className="mb-6 grid gap-3 sm:grid-cols-2">
        {/* Free practice entry — keeps the endless solver one tap away. */}
        <button onClick={() => nav('/app/puzzles/practice')}
          className="flex w-full items-center justify-between rounded-2xl border border-line bg-plaster-2 p-5 text-left transition hover:-translate-y-0.5">
          <div>
            <div className="font-display text-lg font-black">Free practice</div>
            <div className="text-[13px] text-ink-soft">Endless timed puzzles — no goals, just reps.</div>
          </div>
          <span className="text-2xl">∞</span>
        </button>
        {/* Certification exam */}
        <button onClick={() => nav('/app/puzzles/exam')}
          className="flex w-full items-center justify-between rounded-2xl border-2 border-gold/50 bg-[linear-gradient(135deg,#fffdf5,#f6f1e2)] p-5 text-left transition hover:-translate-y-0.5">
          <div>
            <div className="font-display text-lg font-black">Take the exam</div>
            <div className="text-[13px] text-ink-soft">A graded, timed test — earn your certificate.</div>
          </div>
          <span className="text-2xl">🎖️</span>
        </button>
        {/* Create from FEN */}
        <button onClick={() => nav('/app/puzzles/create')}
          className="flex w-full items-center justify-between rounded-2xl border border-line bg-plaster-2 p-5 text-left transition hover:-translate-y-0.5 sm:col-span-2">
          <div>
            <div className="font-display text-lg font-black">Create a puzzle from a position</div>
            <div className="text-[13px] text-ink-soft">Paste any FEN — Stockfish finds the tactic and makes it solvable.</div>
          </div>
          <span className="text-2xl">✚</span>
        </button>
      </div>

      {puzzleCourse.map((stage) => {
        const total = stage.packs.length;
        const complete = stage.packs.filter((p) => done.has(packDoneId(p.id))).length;
        return (
          <section key={stage.id} className="mb-8">
            <div className="mb-1 flex items-baseline justify-between">
              <h2 className="font-display text-xl font-black">{stage.title}</h2>
              <span className="text-[13px] font-semibold text-ink-faint">{complete}/{total} packs</span>
            </div>
            <p className="mb-4 text-[14px] text-ink-soft">{stage.subtitle}</p>
            <div className="grid gap-4 sm:grid-cols-2">
              {stage.packs.map((pack) => (
                <PackCard key={pack.id} pack={pack} uid={user?.id} done={done.has(packDoneId(pack.id))}
                  poolCount={counts[pack.id]} onClick={() => nav(`/app/puzzles/pack/${pack.id}`)} />
              ))}
            </div>
          </section>
        );
      })}
    </div>
  );
}

function PackCard({ pack, uid, done, poolCount, onClick }: { pack: PuzzlePack; uid?: string; done: boolean; poolCount?: number; onClick: () => void }) {
  const solved = Math.min(packSolvedCount(uid, pack.id), pack.goal);
  const pct = Math.round((solved / pack.goal) * 100);
  return (
    <button onClick={onClick} className="card p-5 text-left transition hover:-translate-y-1">
      <div className="flex items-start justify-between">
        <span className="grid h-11 w-11 place-items-center rounded-xl bg-ink text-xl text-white">{pack.icon}</span>
        <span className={`rounded-full px-2.5 py-1 text-[11px] font-bold uppercase tracking-wide ${done ? 'bg-success/15 text-success' : 'bg-plaster-2 text-ink-faint'}`}>
          {done ? '✓ Done' : pack.band}
        </span>
      </div>
      <div className="mt-3 flex items-baseline gap-2">
        <span className="font-display text-lg font-black">{pack.title}</span>
        {poolCount != null && poolCount > 0 && <span className="text-[11px] font-semibold text-ink-faint">{poolCount.toLocaleString()} puzzles</span>}
      </div>
      <div className="text-[13px] text-ink-soft">{pack.blurb}</div>
      <div className="mt-3">
        <div className="mb-1 flex justify-between text-[12px] font-semibold text-ink-faint">
          <span>{solved} / {pack.goal} solved</span><span>{pct}%</span>
        </div>
        <div className="h-2 overflow-hidden rounded-full bg-plaster-2">
          <div className={`h-full rounded-full ${done ? 'bg-success' : 'bg-teal'}`} style={{ width: `${pct}%` }} />
        </div>
      </div>
    </button>
  );
}
