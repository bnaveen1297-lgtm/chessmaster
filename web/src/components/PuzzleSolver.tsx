import { useCallback, useEffect, useRef, useState } from 'react';
import { Chess } from 'chess.js';
import { Board } from '@/components/Board';
import { legalTargets, tryMove, isOwnPiece } from '@shared/game/chessHelpers';
import { fmtSeconds } from '@/game/puzzleTimer';
import type { Puzzle } from '@shared/data/puzzles';

/**
 * The interactive puzzle board: the solver plays the solution line move by move,
 * wrong moves are rejected, and the opponent's replies auto-play. Shared by the
 * free-practice screen and the curriculum packs.
 */
export function PuzzleSolver({
  puzzle, loading, onSolved, onNext, nextLabel = 'Next puzzle ›', tip, timeLimitSec,
}: {
  puzzle: Puzzle;
  loading: boolean;
  onSolved: () => void;
  onNext: () => void;
  nextLabel?: string;
  tip?: string;
  /** Optional per-puzzle countdown (seconds). Informational — does not block solving. */
  timeLimitSec?: number;
}) {
  const gameRef = useRef(new Chess(puzzle.fen));
  const [fen, setFen] = useState(puzzle.fen);
  const [selected, setSelected] = useState<string | null>(null);
  const [highlights, setHighlights] = useState<string[]>([]);
  const [lastMove, setLastMove] = useState<{ from: string; to: string } | null>(null);
  const [step, setStep] = useState(0);
  const [status, setStatus] = useState<'idle' | 'wrong' | 'solved'>('idle');
  const [left, setLeft] = useState(timeLimitSec ?? 0);
  const awarded = useRef(false);
  const humanColor = new Chess(puzzle.fen).turn();

  // Countdown, reset per puzzle; frozen once solved.
  useEffect(() => {
    if (!timeLimitSec) return;
    setLeft(timeLimitSec);
    const t = setInterval(() => setLeft((s) => (s <= 0 ? 0 : s - 1)), 1000);
    return () => clearInterval(t);
  }, [puzzle.id, timeLimitSec]);
  const frozenLeft = status === 'solved';

  const onSquare = useCallback((sq: string) => {
    if (status === 'solved') return;
    const g = gameRef.current;
    if (g.turn() !== humanColor) return;
    if (selected) {
      const mv = tryMove(g, selected, sq);
      if (mv) {
        if (mv.san === puzzle.solution[step]) {
          setLastMove({ from: mv.from, to: mv.to }); setSelected(null); setHighlights([]);
          let nextStep = step + 1;
          const reply = puzzle.solution[nextStep];
          if (reply) { const r = g.move(reply); if (r) setLastMove({ from: r.from, to: r.to }); nextStep += 1; }
          setStep(nextStep); setFen(g.fen());
          if (nextStep >= puzzle.solution.length) {
            setStatus('solved');
            if (!awarded.current) { awarded.current = true; onSolved(); }
          }
          return;
        }
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
        <div className="flex items-center gap-2">
          {timeLimitSec ? (
            <span className={`rounded-full px-2.5 py-1 font-mono text-xs font-bold tabular-nums ${frozenLeft ? 'bg-success/10 text-success' : left <= 10 ? 'bg-danger/10 text-danger' : 'bg-plaster-2 text-ink-soft'}`}>
              ⏱ {frozenLeft ? '✓' : fmtSeconds(left)}
            </span>
          ) : null}
          <span className="rounded-full bg-plaster-2 px-3 py-1 font-mono text-xs font-semibold text-ink-soft">{humanColor === 'w' ? 'White' : 'Black'} to play</span>
        </div>
      </div>
      <Board fen={fen} onSquarePress={onSquare} selected={selected} highlights={highlights} lastMove={lastMove} flipped={humanColor === 'b'} />
      <div className={`mt-3 rounded-xl px-4 py-3 text-center font-semibold ${status === 'solved' ? 'bg-success/10 text-success' : status === 'wrong' ? 'text-danger' : 'text-ink-soft'}`}>
        {status === 'solved' ? '✓ Solved! +20 XP' : status === 'wrong' ? 'Not the best move — try again.' : puzzle.kind === 'mate' ? 'Find the checkmate.' : 'Find the best move.'}
      </div>
      {status === 'solved' && tip && (
        <div className="mt-2 rounded-xl border border-line bg-plaster-2 px-4 py-3 text-[13px] text-ink-soft"><span className="font-bold text-ink">Pattern:</span> {tip}</div>
      )}
      <div className="mt-3 flex gap-3">
        <button onClick={reset} className="btn-ghost flex-1">Reset</button>
        <button onClick={onNext} disabled={loading} className="btn-dark flex-1 disabled:opacity-60">{loading ? 'Loading…' : nextLabel}</button>
      </div>
    </div>
  );
}
