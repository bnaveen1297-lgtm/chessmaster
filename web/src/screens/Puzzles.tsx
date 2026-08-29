import { useCallback, useEffect, useRef, useState } from 'react';
import { PageHeader, BackLink } from '@/components/ui';
import { PuzzleSolver } from '@/components/PuzzleSolver';
import { useProgress } from '@/game/progress';
import { puzzles, type Puzzle, type PuzzleDifficulty } from '@shared/data/puzzles';
import { fetchNextPuzzle, type PuzzleFilter } from '@shared/services/puzzleDb';
import { usePrefs } from '@/game/prefs';
import { LeaderboardCard } from '@/components/LeaderboardCard';

const BANDS: (PuzzleDifficulty | 'All')[] = ['All', 'Beginner', 'Intermediate', 'Advanced'];

function bandFilter(band: PuzzleDifficulty | 'All'): PuzzleFilter | undefined {
  if (band === 'Beginner') return { maxRating: 1300 };
  if (band === 'Intermediate') return { minRating: 1300, maxRating: 1900 };
  if (band === 'Advanced') return { minRating: 1900 };
  return undefined;
}

function bundledFor(band: PuzzleDifficulty | 'All'): Puzzle {
  const pool = band === 'All' ? puzzles : puzzles.filter((p) => p.difficulty === band);
  const list = pool.length ? pool : puzzles;
  return list[Math.floor(Math.random() * list.length)];
}

export function Puzzles() {
  const { awardPuzzleSolved } = useProgress();
  const { prefs } = usePrefs();
  const [band, setBand] = useState<PuzzleDifficulty | 'All'>(prefs.level);
  const [puzzle, setPuzzle] = useState<Puzzle>(() => bundledFor(prefs.level));
  const [source, setSource] = useState<'online' | 'offline'>('offline');
  const [loading, setLoading] = useState(true);
  const reqId = useRef(0);

  const load = useCallback((b: PuzzleDifficulty | 'All') => {
    const id = ++reqId.current;
    setLoading(true);
    fetchNextPuzzle(bandFilter(b))
      .then((p) => { if (reqId.current !== id) return; setPuzzle(p); setSource('online'); })
      .catch(() => { if (reqId.current !== id) return; setPuzzle(bundledFor(b)); setSource('offline'); })
      .finally(() => { if (reqId.current === id) setLoading(false); });
  }, []);

  useEffect(() => { load(band); }, [band, load]);

  return (
    <div className="mx-auto max-w-xl">
      <BackLink to="/app/puzzles" label="Puzzle courses" />
      <PageHeader eyebrow="Practice" title="Free practice" sub="Unlimited mixed puzzles from the live database. Solve to earn XP." />
      <div className="mb-4 flex flex-wrap items-center gap-2">
        {BANDS.map((b) => (
          <button key={b} onClick={() => setBand(b)}
            className={`chip ${band === b ? 'bg-ink text-white' : 'bg-plaster-2 text-ink-soft'}`}>{b}</button>
        ))}
        <span className={`ml-auto rounded-full px-2.5 py-1 font-mono text-[10px] font-semibold ${source === 'online' ? 'bg-teal/10 text-teal' : 'bg-plaster-2 text-ink-faint'}`}>
          {source === 'online' ? '● Live' : '○ Offline set'}
        </span>
      </div>
      <PuzzleSolver key={puzzle.id} puzzle={puzzle} loading={loading}
        onSolved={awardPuzzleSolved} onNext={() => load(band)} />
      <LeaderboardCard className="mt-6" />
    </div>
  );
}
