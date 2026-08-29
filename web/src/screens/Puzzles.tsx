import { useCallback, useMemo, useRef, useState } from 'react';
import { Chess } from 'chess.js';
import { Board } from '@/components/Board';
import { PageHeader } from '@/components/ui';
import { useProgress } from '@/game/progress';
import { puzzles, type Puzzle, type PuzzleDifficulty } from '@shared/data/puzzles';
import { usePrefs } from '@/game/prefs';
import { LeaderboardCard } from '@/components/LeaderboardCard';
import { legalTargets, tryMove, isOwnPiece } from '@shared/game/chessHelpers';

const BANDS: (PuzzleDifficulty | 'All')[] = ['All', 'Beginner', 'Intermediate', 'Advanced'];

export function Puzzles() {
  const { awardPuzzleSolved } = useProgress();
  const { prefs } = usePrefs();
  const [band, setBand] = useState<PuzzleDifficulty | 'All'>(prefs.level);
  const pool = useMemo(() => (band === 'All' ? puzzles : puzzles.filter((p) => p.difficulty === band)), [band]);
  const [idx, setIdx] = useState(0);
  const puzzle = pool[idx % Math.max(1, pool.length)] as Puzzle | undefined;

  return (
    <div className="mx-auto max-w-xl">
      <PageHeader eyebrow="Puzzles" title="Sharpen your tactics" sub="Find the winning move. Solve to earn XP." />
      <div className="mb-4 flex flex-wrap gap-2">
        {BANDS.map((b) => (
          <button key={b} onClick={() => { setBand(b); setIdx(0); }}
            className={`chip ${band === b ? 'bg-ink text-white' : 'bg-plaster-2 text-ink-soft'}`}>{b}</button>
        ))}
      </div>
      {puzzle ? (
        <Solver key={puzzle.id} puzzle={puzzle} onSolved={awardPuzzleSolved} onNext={() => setIdx((i) => i + 1)} />
      ) : (
        <p className="text-ink-soft">No puzzles in this band.</p>
      )}
      <LeaderboardCard className="mt-6" />
    </div>
  );
}

function Solver({ puzzle, onSolved, onNext }: { puzzle: Puzzle; onSolved: () => void; onNext: () => void }) {
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
        <button onClick={() => { reset(); onNext(); }} className="btn-dark flex-1">Next puzzle ›</button>
      </div>
    </div>
  );
}
