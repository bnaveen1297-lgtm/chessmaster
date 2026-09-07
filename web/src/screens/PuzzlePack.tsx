import { useCallback, useEffect, useRef, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { BackLink } from '@/components/ui';
import { PuzzleSolver } from '@/components/PuzzleSolver';
import { useAuth } from '@/auth/AuthProvider';
import { useProgress } from '@/game/progress';
import { packById, bandFilter, packDoneId } from '@/data/puzzleCourse';
import { bumpPackSolved, packSolvedCount } from '@/game/puzzleProgress';
import { timeForDifficulty } from '@/game/puzzleTimer';
import { fetchNextPuzzle } from '@shared/services/puzzleDb';
import { randomLibraryPuzzle } from '@/lib/puzzleLibrary';
import { puzzles as bundled, type Puzzle } from '@shared/data/puzzles';

/** Offline fallback: a bundled puzzle roughly matching the pack's theme. */
function bundledFor(theme: string): Puzzle {
  const t = theme.toLowerCase();
  const pool = bundled.filter((p) => p.theme.toLowerCase().includes(t) || t.includes(p.theme.toLowerCase().split(' ')[0]));
  const list = pool.length ? pool : bundled;
  return list[Math.floor(Math.random() * list.length)];
}

export function PuzzlePack() {
  const { packId = '' } = useParams();
  const nav = useNavigate();
  const pack = packById(packId);
  const { user } = useAuth();
  const { awardPuzzleSolved, markLessonComplete, progress } = useProgress();

  const [puzzle, setPuzzle] = useState<Puzzle | null>(null);
  const [loading, setLoading] = useState(true);
  const [solved, setSolved] = useState(() => (pack ? Math.min(packSolvedCount(user?.id, pack.id), pack.goal) : 0));
  const [justCompleted, setJustCompleted] = useState(false);
  const reqId = useRef(0);

  const load = useCallback(() => {
    if (!pack) return;
    const id = ++reqId.current;
    setLoading(true);
    // Primary source: the bundled themed library (deep, offline, instant).
    // Fall back to the live DB, then the small bundled set.
    randomLibraryPuzzle(pack.theme, pack.band)
      .then((p) => (p ? p : fetchNextPuzzle(bandFilter(pack.band, pack.theme))))
      .then((p) => { if (reqId.current === id) setPuzzle(p ?? bundledFor(pack.theme)); })
      .catch(() => { if (reqId.current === id) setPuzzle(bundledFor(pack.theme)); })
      .finally(() => { if (reqId.current === id) setLoading(false); });
  }, [pack]);

  useEffect(() => { load(); }, [load]);

  if (!pack) {
    return <div className="mx-auto max-w-xl"><BackLink to="/app/puzzles" label="Puzzle courses" /><p className="mt-4">Pack not found.</p></div>;
  }

  const alreadyDone = (progress.lessonsCompleted ?? []).includes(packDoneId(pack.id));
  const pct = Math.round((solved / pack.goal) * 100);

  const onSolved = () => {
    awardPuzzleSolved(); // XP + streak, synced
    const next = bumpPackSolved(user?.id, pack.id);
    const capped = Math.min(next, pack.goal);
    setSolved(capped);
    if (next >= pack.goal && !alreadyDone) {
      markLessonComplete(packDoneId(pack.id)); // completion syncs via progress
      setJustCompleted(true);
    }
  };

  return (
    <div className="mx-auto max-w-xl">
      <BackLink to="/app/puzzles" label="Puzzle courses" />
      <div className="mb-3 mt-1 flex items-center justify-between">
        <div>
          <h1 className="font-display text-2xl font-black">{pack.icon} {pack.title}</h1>
          <p className="text-[13px] text-ink-soft">{pack.blurb}</p>
        </div>
        <span className="rounded-full bg-plaster-2 px-3 py-1 text-[11px] font-bold uppercase tracking-wide text-ink-faint">{pack.band}</span>
      </div>

      {/* pack progress */}
      <div className="mb-4">
        <div className="mb-1 flex justify-between text-[12px] font-semibold text-ink-faint">
          <span>{solved} / {pack.goal} solved{alreadyDone ? ' · mastered' : ''}</span><span>{pct}%</span>
        </div>
        <div className="h-2 overflow-hidden rounded-full bg-plaster-2">
          <div className={`h-full rounded-full ${solved >= pack.goal ? 'bg-success' : 'bg-teal'}`} style={{ width: `${pct}%` }} />
        </div>
      </div>

      {justCompleted && (
        <div className="mb-4 rounded-2xl border border-success/30 bg-success/10 px-4 py-3 text-center">
          <div className="font-display text-lg font-black text-success">Pack complete! 🎉</div>
          <div className="text-[13px] text-ink-soft">You’ve mastered {pack.title.toLowerCase()}. Keep going or pick the next pack.</div>
          <button onClick={() => nav('/app/puzzles')} className="btn-ghost mt-2">Back to courses</button>
        </div>
      )}

      {puzzle ? (
        <PuzzleSolver
          key={puzzle.id}
          puzzle={puzzle}
          loading={loading}
          onSolved={onSolved}
          onNext={load}
          nextLabel={solved >= pack.goal ? 'Keep practising ›' : 'Next puzzle ›'}
          tip={pack.tip}
          timeLimitSec={timeForDifficulty(puzzle.difficulty)}
        />
      ) : (
        <div className="rounded-xl bg-plaster-2 px-4 py-10 text-center text-ink-soft">Loading first puzzle…</div>
      )}
    </div>
  );
}
