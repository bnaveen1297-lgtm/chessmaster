import { useCallback, useEffect, useRef, useState } from 'react';
import { PageHeader, BackLink } from '@/components/ui';
import { PuzzleSolver } from '@/components/PuzzleSolver';
import { useProgress } from '@/game/progress';
import { puzzles, type Puzzle, type PuzzleDifficulty } from '@shared/data/puzzles';
import { fetchNextPuzzle, type PuzzleFilter } from '@shared/services/puzzleDb';
import { randomLibraryPuzzle } from '@/lib/puzzleLibrary';
import { timeForDifficulty } from '@/game/puzzleTimer';
import { usePrefs } from '@/game/prefs';
import { LeaderboardCard } from '@/components/LeaderboardCard';
import { sayCoach } from '@/game/coach';

const SOLVE_LINES = ['Solved! On to the next.', 'Nice — you saw it.', 'Clean. Keep the streak going.', 'That’s the pattern — well spotted.'];

const BANDS: (PuzzleDifficulty | 'All')[] = ['All', 'Beginner', 'Intermediate', 'Advanced'];

// Topics the bundled library has real depth in — pick one and solve endlessly.
const TOPICS: { id: string; label: string }[] = [
  { id: '', label: 'Mixed' },
  { id: 'mateIn1', label: 'Mate in 1' },
  { id: 'mateIn2', label: 'Mate in 2' },
  { id: 'backRankMate', label: 'Back-rank mate' },
  { id: 'smotheredMate', label: 'Smothered mate' },
  { id: 'fork', label: 'Forks' },
  { id: 'pin', label: 'Pins' },
  { id: 'skewer', label: 'Skewers' },
  { id: 'hangingPiece', label: 'Hanging pieces' },
  { id: 'discoveredAttack', label: 'Discovered attack' },
  { id: 'deflection', label: 'Deflection' },
  { id: 'attraction', label: 'Attraction' },
  { id: 'sacrifice', label: 'Sacrifice' },
  { id: 'endgame', label: 'Endgames' },
  { id: 'advancedPawn', label: 'Passed pawns' },
];

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
  const [topic, setTopic] = useState('');
  const [puzzle, setPuzzle] = useState<Puzzle>(() => bundledFor(prefs.level));
  const [source, setSource] = useState<'library' | 'online' | 'offline'>('offline');
  const [loading, setLoading] = useState(true);
  const reqId = useRef(0);

  const load = useCallback((b: PuzzleDifficulty | 'All', theme: string) => {
    const id = ++reqId.current;
    setLoading(true);
    const bandArg = b === 'All' ? undefined : b;
    randomLibraryPuzzle(theme || undefined, bandArg)
      .then((p) => {
        if (reqId.current !== id) return null;
        if (p) { setPuzzle(p); setSource('library'); return null; }
        return fetchNextPuzzle(bandFilter(b)).then((q) => { if (reqId.current === id) { setPuzzle(q); setSource('online'); } });
      })
      .catch(() => { if (reqId.current !== id) return; setPuzzle(bundledFor(b)); setSource('offline'); })
      .finally(() => { if (reqId.current === id) setLoading(false); });
  }, []);

  useEffect(() => { load(band, topic); }, [band, topic, load]);

  return (
    <div className="mx-auto max-w-xl">
      <BackLink to="/app/puzzles" label="Puzzle courses" />
      <PageHeader eyebrow="Practice" title="Solve by topic" sub="Pick a tactic and a level, then solve as many as you like — each solve earns XP." />

      {/* topic picker */}
      <p className="mb-1.5 text-[11px] font-bold uppercase tracking-wide text-ink-faint">Topic</p>
      <div className="mb-3 flex flex-wrap gap-2">
        {TOPICS.map((t) => (
          <button key={t.id} onClick={() => setTopic(t.id)}
            className={`chip ${topic === t.id ? 'bg-teal text-white' : 'bg-plaster-2 text-ink-soft'}`}>{t.label}</button>
        ))}
      </div>

      {/* level picker */}
      <p className="mb-1.5 text-[11px] font-bold uppercase tracking-wide text-ink-faint">Level</p>
      <div className="mb-4 flex flex-wrap items-center gap-2">
        {BANDS.map((b) => (
          <button key={b} onClick={() => setBand(b)}
            className={`chip ${band === b ? 'bg-ink text-white' : 'bg-plaster-2 text-ink-soft'}`}>{b}</button>
        ))}
        <span className={`ml-auto rounded-full px-2.5 py-1 font-mono text-[10px] font-semibold ${source === 'offline' ? 'bg-plaster-2 text-ink-faint' : 'bg-teal/10 text-teal'}`}>
          {source === 'library' ? '● Library' : source === 'online' ? '● Live' : '○ Offline set'}
        </span>
      </div>
      <PuzzleSolver key={puzzle.id} puzzle={puzzle} loading={loading}
        onSolved={() => { awardPuzzleSolved(); sayCoach(SOLVE_LINES[Math.floor(Math.random() * SOLVE_LINES.length)], 'happy'); }}
        onNext={() => load(band, topic)} timeLimitSec={timeForDifficulty(puzzle.difficulty)} />
      <LeaderboardCard className="mt-6" />
    </div>
  );
}
