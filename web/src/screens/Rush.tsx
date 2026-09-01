import { useCallback, useEffect, useRef, useState } from 'react';
import { Chess } from 'chess.js';
import { BackLink, PageHeader } from '@/components/ui';
import { Board } from '@/components/Board';
import { useAuth } from '@/auth/AuthProvider';
import { useProgress, XP_PUZZLE } from '@/game/progress';
import { legalTargets, tryMove, isOwnPiece } from '@shared/game/chessHelpers';
import { rushPuzzles } from '@/lib/puzzleLibrary';
import type { Puzzle } from '@shared/data/puzzles';

/**
 * Tactics Rush — a timed survival sprint (in the spirit of Puzzle Rush / Storm):
 * solve as many puzzles as you can before the clock runs out or you hit three
 * strikes. Puzzles ramp from easy to hard. Entirely client-side on the bundled
 * library; a personal best is kept per mode.
 */

type Mode = '3min' | '5min' | 'survival';
const MODES: { id: Mode; label: string; secs: number; sub: string }[] = [
  { id: '3min', label: '3 minutes', secs: 180, sub: 'The classic sprint' },
  { id: '5min', label: '5 minutes', secs: 300, sub: 'A longer run' },
  { id: 'survival', label: 'Survival', secs: 0, sub: 'No clock — 3 strikes' },
];
const MAX_STRIKES = 3;

const bestKey = (uid: string | undefined, mode: Mode) => `chesshub360.rush.${uid ?? 'guest'}.${mode}`;
function readBest(uid: string | undefined, mode: Mode): number {
  try { return Number(localStorage.getItem(bestKey(uid, mode)) || 0); } catch { return 0; }
}
function writeBest(uid: string | undefined, mode: Mode, v: number) {
  try { localStorage.setItem(bestKey(uid, mode), String(v)); } catch { /* ignore */ }
}

export function Rush() {
  const { user } = useAuth();
  const { awardPuzzleSolved } = useProgress();
  const [mode, setMode] = useState<Mode>('3min');
  const [phase, setPhase] = useState<'menu' | 'loading' | 'playing' | 'over'>('menu');
  const [queue, setQueue] = useState<(Puzzle & { rating: number })[]>([]);
  const [idx, setIdx] = useState(0);
  const [score, setScore] = useState(0);
  const [strikes, setStrikes] = useState(0);
  const [streak, setStreak] = useState(0);
  const [best, setBest] = useState(0);
  const [left, setLeft] = useState(0);
  const [flash, setFlash] = useState<'good' | 'bad' | null>(null);

  const modeMeta = MODES.find((m) => m.id === mode)!;

  // countdown for timed modes
  useEffect(() => {
    if (phase !== 'playing' || modeMeta.secs === 0) return;
    if (left <= 0) { end(); return; }
    const t = setTimeout(() => setLeft((s) => s - 1), 1000);
    return () => clearTimeout(t);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [phase, left]);

  const start = async () => {
    setPhase('loading'); setBest(readBest(user?.id, mode));
    const qs = await rushPuzzles(90);
    if (!qs.length) { setPhase('menu'); return; }
    setQueue(qs); setIdx(0); setScore(0); setStrikes(0); setStreak(0);
    setLeft(modeMeta.secs); setPhase('playing');
  };

  const end = useCallback(() => {
    setPhase('over');
    setScore((s) => {
      if (s > readBest(user?.id, mode)) { writeBest(user?.id, mode, s); setBest(s); }
      return s;
    });
  }, [user?.id, mode]);

  const advance = () => setIdx((i) => {
    const next = i + 1;
    if (next >= queue.length) { end(); return i; }
    return next;
  });

  const onSolved = () => {
    setFlash('good'); setTimeout(() => setFlash(null), 250);
    awardPuzzleSolved(); // real solve: XP + puzzles-solved credit
    setScore((s) => s + 1); setStreak((s) => s + 1); advance();
  };
  const onWrong = () => {
    setFlash('bad'); setTimeout(() => setFlash(null), 300);
    setStreak(0);
    setStrikes((n) => { const v = n + 1; if (v >= MAX_STRIKES) end(); return v; });
    advance();
  };

  if (phase === 'menu' || phase === 'loading') {
    return (
      <div className="mx-auto max-w-xl">
        <BackLink to="/app/puzzles" label="Puzzles" />
        <PageHeader eyebrow="Tactics Rush" title="How many can you solve?"
          sub="A timed sprint through tactics that ramp from easy to hard. Three wrong moves ends the run — chase your best." />
        <div className="mb-5 grid gap-3 sm:grid-cols-3">
          {MODES.map((m) => (
            <button key={m.id} onClick={() => setMode(m.id)}
              className={`rounded-2xl border-2 p-4 text-left transition ${mode === m.id ? 'border-teal bg-teal/5' : 'border-line hover:border-ink-faint'}`}>
              <div className="font-display text-lg font-black">{m.label}</div>
              <div className="text-[13px] text-ink-soft">{m.sub}</div>
              <div className="mt-2 text-[12px] font-semibold text-ink-faint">Best: {readBest(user?.id, m.id)}</div>
            </button>
          ))}
        </div>
        <button onClick={start} disabled={phase === 'loading'} className="btn-primary w-full">
          {phase === 'loading' ? 'Loading puzzles…' : 'Start rush →'}
        </button>
      </div>
    );
  }

  if (phase === 'over') {
    const isBest = score >= best && score > 0;
    return (
      <div className="mx-auto max-w-xl">
        <div className="rounded-2xl bg-ink p-8 text-center text-white">
          <p className="text-[11px] font-bold uppercase tracking-wider text-gold-soft">Tactics Rush · {modeMeta.label}</p>
          <div className="mt-2 font-display text-6xl font-black">{score}</div>
          <div className="mt-1 text-[14px] text-white/70">puzzles solved{isBest ? ' · new best! 🎉' : ` · best ${best}`}</div>
          <div className="mt-4 inline-block rounded-full bg-white/10 px-3 py-1.5 text-sm font-bold">+{score * XP_PUZZLE} XP earned</div>
        </div>
        <div className="mt-4 flex gap-3">
          <button onClick={() => setPhase('menu')} className="btn-ghost flex-1">Change mode</button>
          <button onClick={start} className="btn-primary flex-1">Play again →</button>
        </div>
      </div>
    );
  }

  // playing
  const puzzle = queue[idx];
  return (
    <div className="mx-auto max-w-xl">
      <div className="mb-3 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="rounded-xl bg-ink px-3 py-1.5 text-center text-white">
            <div className="font-display text-xl font-black leading-none">{score}</div>
            <div className="text-[9px] font-bold uppercase tracking-wide text-white/50">solved</div>
          </div>
          <div className="flex gap-1">
            {Array.from({ length: MAX_STRIKES }).map((_, i) => (
              <span key={i} className={`text-lg ${i < strikes ? 'text-danger' : 'text-line'}`}>✕</span>
            ))}
          </div>
          {streak >= 3 && <span className="rounded-full bg-gold/15 px-2 py-0.5 text-[12px] font-bold text-gold">🔥 {streak}</span>}
        </div>
        {modeMeta.secs > 0 && (
          <span className={`rounded-full px-3 py-1.5 font-mono text-sm font-bold tabular-nums ${left <= 15 ? 'bg-danger/10 text-danger' : 'bg-plaster-2 text-ink-soft'}`}>
            {Math.floor(left / 60)}:{String(left % 60).padStart(2, '0')}
          </span>
        )}
      </div>

      {puzzle && (
        <div className={`rounded-2xl transition ${flash === 'good' ? 'ring-4 ring-success/50' : flash === 'bad' ? 'ring-4 ring-danger/50' : ''}`}>
          <RushBoard key={puzzle.id} puzzle={puzzle} onSolved={onSolved} onWrong={onWrong} />
        </div>
      )}
      <div className="mt-3 flex items-center justify-between text-[12px] text-ink-faint">
        <span>Puzzle #{idx + 1} · rating ~{puzzle?.rating}</span>
        <button onClick={end} className="font-semibold text-ink-soft hover:text-ink">End run</button>
      </div>
    </div>
  );
}

/** A fast solver board for rush: solve → onSolved; any wrong move → onWrong (a strike). */
function RushBoard({ puzzle, onSolved, onWrong }: { puzzle: Puzzle; onSolved: () => void; onWrong: () => void }) {
  const gameRef = useRef(new Chess(puzzle.fen));
  const [fen, setFen] = useState(puzzle.fen);
  const [selected, setSelected] = useState<string | null>(null);
  const [highlights, setHighlights] = useState<string[]>([]);
  const [lastMove, setLastMove] = useState<{ from: string; to: string } | null>(null);
  const [step, setStep] = useState(0);
  const done = useRef(false);
  const humanColor = new Chess(puzzle.fen).turn();

  const onSquare = useCallback((sq: string) => {
    if (done.current) return;
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
          if (nextStep >= puzzle.solution.length) { done.current = true; onSolved(); }
          return;
        }
        g.undo(); done.current = true; onWrong(); return; // wrong move = strike
      }
    }
    if (isOwnPiece(g, sq) && g.get(sq as any)?.color === humanColor) { setSelected(sq); setHighlights(legalTargets(g, sq)); }
    else { setSelected(null); setHighlights([]); }
  }, [selected, step, puzzle, humanColor, onSolved, onWrong]);

  return (
    <div>
      <div className="mb-2 text-center text-[13px] font-semibold text-ink-soft">{humanColor === 'w' ? 'White' : 'Black'} to play — find the best move</div>
      <Board fen={fen} onSquarePress={onSquare} selected={selected} highlights={highlights} lastMove={lastMove} flipped={humanColor === 'b'} />
    </div>
  );
}
