import { useCallback, useRef, useState } from 'react';
import { Chess } from 'chess.js';
import { Board } from '@/components/Board';
import { PageHeader } from '@/components/ui';
import { useProgress } from '@/game/progress';
import { dailyPuzzle, markDailyDone, dailyDoneToday } from '@/lib/daily';
import { legalTargets, tryMove, isOwnPiece } from '@shared/game/chessHelpers';

export function DailyPuzzle() {
  const { awardPuzzleSolved, progress } = useProgress();
  const puzzle = dailyPuzzle();
  const gameRef = useRef(new Chess(puzzle.fen));
  const [fen, setFen] = useState(puzzle.fen);
  const [selected, setSelected] = useState<string | null>(null);
  const [highlights, setHighlights] = useState<string[]>([]);
  const [lastMove, setLastMove] = useState<{ from: string; to: string } | null>(null);
  const [step, setStep] = useState(0);
  const [status, setStatus] = useState<'idle' | 'wrong' | 'solved'>(dailyDoneToday() ? 'solved' : 'idle');
  const awarded = useRef(false);
  const humanColor = new Chess(puzzle.fen).turn();

  const onSquare = useCallback((sq: string) => {
    if (status === 'solved') return;
    const g = gameRef.current;
    if (g.turn() !== humanColor) return;
    if (selected) {
      const mv = tryMove(g, selected, sq);
      if (mv) {
        if (mv.san === puzzle.solution[step]) {
          setLastMove({ from: mv.from, to: mv.to }); setSelected(null); setHighlights([]);
          let ns = step + 1;
          const reply = puzzle.solution[ns];
          if (reply) { const r = g.move(reply); if (r) setLastMove({ from: r.from, to: r.to }); ns += 1; }
          setStep(ns); setFen(g.fen());
          if (ns >= puzzle.solution.length) {
            setStatus('solved');
            if (!awarded.current) { awarded.current = true; awardPuzzleSolved(); markDailyDone(); }
          }
          return;
        }
        g.undo(); setStatus('wrong'); setSelected(null); setHighlights([]); return;
      }
    }
    if (isOwnPiece(g, sq) && g.get(sq as any)?.color === humanColor) { setSelected(sq); setHighlights(legalTargets(g, sq)); setStatus('idle'); }
    else { setSelected(null); setHighlights([]); }
  }, [selected, step, status, puzzle, humanColor, awardPuzzleSolved]);

  return (
    <div className="mx-auto max-w-xl">
      <PageHeader eyebrow={`Daily Puzzle · ${new Date().toLocaleDateString(undefined, { month: 'short', day: 'numeric' })}`}
        title="Puzzle of the day" sub="The same puzzle for everyone today. Solve it to keep your streak." />
      <div className="mb-3 flex items-center justify-between">
        <span className="rounded-full bg-plaster-2 px-3 py-1 font-mono text-xs font-semibold text-ink-soft">{humanColor === 'w' ? 'White' : 'Black'} to play · {puzzle.difficulty}</span>
        <span className="font-mono text-xs text-ink-faint">🔥 {progress.streakDays}-day streak</span>
      </div>
      <Board fen={fen} onSquarePress={onSquare} selected={selected} highlights={highlights} lastMove={lastMove} flipped={humanColor === 'b'} />
      <div className={`mt-3 rounded-xl px-4 py-3 text-center font-semibold ${status === 'solved' ? 'bg-success/10 text-success' : status === 'wrong' ? 'text-danger' : 'text-ink-soft'}`}>
        {status === 'solved' ? '✓ Solved — see you tomorrow!' : status === 'wrong' ? 'Not the best move — try again.' : puzzle.kind === 'mate' ? 'Find the checkmate.' : 'Find the best move.'}
      </div>
    </div>
  );
}
