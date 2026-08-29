import { useCallback, useEffect, useRef, useState } from 'react';
import { Chess } from 'chess.js';
import { Board } from '@/components/Board';
import { PageHeader } from '@/components/ui';
import { useProgress } from '@/game/progress';
import { puzzles, type Puzzle, type PuzzleDifficulty } from '@shared/data/puzzles';
import { fetchNextPuzzle, type PuzzleFilter } from '@shared/services/puzzleDb';
import { usePrefs } from '@/game/prefs';
import { LeaderboardCard } from '@/components/LeaderboardCard';
import { legalTargets, tryMove, isOwnPiece } from '@shared/game/chessHelpers';

const BANDS: (PuzzleDifficulty | 'All')[] = ['All', 'Beginner', 'Intermediate', 'Advanced'];

// Rating window used when the Supabase puzzle DB is available; the free
// Chess.com endpoint ignores it and simply serves the next random puzzle.
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
      .then((p) => {
        if (reqId.current !== id) return; // a newer request superseded this one
        setPuzzle(p);
        setSource('online');
      })
      .catch(() => {
        if (reqId.current !== id) return;
        setPuzzle(bundledFor(b));
        setSource('offline');
      })
      .finally(() => {
        if (reqId.current === id) setLoading(false);
      });
  }, []);

  // Load a fresh puzzle on mount and whenever the band changes.
  useEffect(() => { load(band); }, [band, load]);

  return (
    <div className="mx-auto max-w-xl">
      <PageHeader eyebrow="Puzzles" title="Sharpen your tactics" sub="Unlimited puzzles from the live database. Solve to earn XP." />
      <div className="mb-4 flex flex-wrap items-center gap-2">
        {BANDS.map((b) => (
          <button key={b} onClick={() => setBand(b)}
            className={`chip ${band === b ? 'bg-ink text-white' : 'bg-plaster-2 text-ink-soft'}`}>{b}</button>
        ))}
        <span className={`ml-auto rounded-full px-2.5 py-1 font-mono text-[10px] font-semibold ${source === 'online' ? 'bg-teal/10 text-teal' : 'bg-plaster-2 text-ink-faint'}`}>
          {source === 'online' ? '● Live' : '○ Offline set'}
        </span>
      </div>
      <Solver key={puzzle.id} puzzle={puzzle} loading={loading}
        onSolved={awardPuzzleSolved} onNext={() => load(band)} />
      <LeaderboardCard className="mt-6" />
    </div>
  );
}

function Solver({ puzzle, loading, onSolved, onNext }: { puzzle: Puzzle; loading: boolean; onSolved: () => void; onNext: () => void }) {
  const gameRef = useRef(new Chess(puzzle.fen));
  const [fen, setFen] = useState(puzzle.fen);
  const [selected, setSelected] = useState<string | null>(null);
  const [highlights, setHighlights] = useState<string[]>([]);
  const [lastMove, setLastMove] = useState<{ from: string; to: string } | null>(null);
  const [step, setStep] = useState(0); // index into solution
  const [status, setStatus] = useState<'idle' | 'wrong' | 'solved'>('idle');
  const awarded = useRef(false);
  const humanColor = new Chess(puzzle.fen).turn();

  const onSquare = useCallback((sq: string) => {
    if (status === 'solved') return;
    const g = gameRef.current;
    if (g.turn() !== humanColor) return;
    if (selected) {
      const mv = tryMove(g, selected, sq);
      if (mv) {
        // did it match the expected solution move?
        if (mv.san === puzzle.solution[step]) {
          setLastMove({ from: mv.from, to: mv.to }); setSelected(null); setHighlights([]);
          let nextStep = step + 1;
          // auto-play opponent reply if present
          const reply = puzzle.solution[nextStep];
          if (reply) { const r = g.move(reply); if (r) setLastMove({ from: r.from, to: r.to }); nextStep += 1; }
          setStep(nextStep); setFen(g.fen());
          if (nextStep >= puzzle.solution.length) {
            setStatus('solved');
            if (!awarded.current) { awarded.current = true; onSolved(); }
          }
          return;
        }
        // wrong — undo the illegal-for-puzzle move
        g.undo(); setStatus('wrong'); setSelected(null); setHighlights([]); return;
      }
    }
    if (isOwnPiece(g, sq) && g.get(sq as any)?.color === humanColor) { setSelected(sq); setHighlights(legalTargets(g, sq)); setStatus('idle'); }
    else { setSelected(null); setHighlights([]); }
  }, [selected, step, status, puzzle, humanColor, onSolved]);

  const reset = () => { gameRef.current = new Chess(puzzle.fen); setFen(puzzle.fen); setSelected(null); setHighlights([]); setLastMove(null); setStep(0); setStatus('idle'); awarded.current = false; };

  return (
    <div>
      <div className="mb-3 flex items-center justify-between">
        <div><div className="font-bold">{puzzle.title}</div><div className="text-[13px] text-ink-faint">{puzzle.theme} · {puzzle.difficulty}</div></div>
        <span className="rounded-full bg-plaster-2 px-3 py-1 font-mono text-xs font-semibold text-ink-soft">{humanColor === 'w' ? 'White' : 'Black'} to play</span>
      </div>
      <Board fen={fen} onSquarePress={onSquare} selected={selected} highlights={highlights} lastMove={lastMove} flipped={humanColor === 'b'} />
      <div className={`mt-3 rounded-xl px-4 py-3 text-center font-semibold ${status === 'solved' ? 'bg-success/10 text-success' : status === 'wrong' ? 'text-danger' : 'text-ink-soft'}`}>
        {status === 'solved' ? '✓ Solved! +20 XP' : status === 'wrong' ? 'Not the best move — try again.' : puzzle.kind === 'mate' ? 'Find the checkmate.' : 'Find the best move.'}
      </div>
      <div className="mt-3 flex gap-3">
        <button onClick={reset} className="btn-ghost flex-1">Reset</button>
        <button onClick={onNext} disabled={loading} className="btn-dark flex-1 disabled:opacity-60">{loading ? 'Loading…' : 'Next puzzle ›'}</button>
      </div>
    </div>
  );
}
