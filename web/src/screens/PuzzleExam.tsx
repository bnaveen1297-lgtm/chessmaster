import { useCallback, useEffect, useRef, useState } from 'react';
import { Chess } from 'chess.js';
import { Board } from '@/components/Board';
import { BackLink, PageHeader } from '@/components/ui';
import { Certificate, gradeFor } from '@/components/Certificate';
import { useAuth } from '@/auth/AuthProvider';
import { useProgress } from '@/game/progress';
import { legalTargets, tryMove, isOwnPiece } from '@shared/game/chessHelpers';
import { sampleLibraryPuzzles, preloadLibrary } from '@/lib/puzzleLibrary';
import { examTimeForRating, fmtSeconds } from '@/game/puzzleTimer';
import type { Puzzle } from '@shared/data/puzzles';

const EXAM_SIZE = 12;
type ExamPuzzle = Puzzle & { rating: number };

export function PuzzleExam() {
  const { user } = useAuth();
  const { awardPuzzleSolved, markLessonComplete } = useProgress();
  const [phase, setPhase] = useState<'intro' | 'loading' | 'running' | 'done'>('intro');
  const [puzzles, setPuzzles] = useState<ExamPuzzle[]>([]);
  const [idx, setIdx] = useState(0);
  const [correct, setCorrect] = useState(0);
  const [name, setName] = useState(() => (user?.email ? user.email.split('@')[0] : 'Chess Player'));

  useEffect(() => { preloadLibrary(); }, []);

  const start = async () => {
    setPhase('loading'); setIdx(0); setCorrect(0);
    const set = await sampleLibraryPuzzles(EXAM_SIZE);
    if (!set.length) { setPhase('intro'); return; }
    setPuzzles(set); setPhase('running');
  };

  const onResult = useCallback((solved: boolean) => {
    if (solved) { setCorrect((c) => c + 1); awardPuzzleSolved(); }
    setIdx((i) => {
      const next = i + 1;
      if (next >= puzzles.length) {
        markLessonComplete('exam:done');
        setPhase('done');
      }
      return next;
    });
  }, [puzzles.length, awardPuzzleSolved, markLessonComplete]);

  const pct = puzzles.length ? Math.round((correct / puzzles.length) * 100) : 0;
  const today = new Date().toLocaleDateString(undefined, { year: 'numeric', month: 'long', day: 'numeric' });

  return (
    <div className="mx-auto max-w-xl">
      <BackLink to="/app/puzzles" label="Puzzle courses" />

      {phase === 'intro' && (
        <>
          <PageHeader eyebrow="Certification" title="Tactics exam"
            sub={`${EXAM_SIZE} puzzles, easy to hard, each on the clock. Solve in one attempt — no retries. Score to earn your chesshub360 certificate.`} />
          <div className="card p-5">
            <label className="text-[13px] font-semibold text-ink-soft">Name on certificate</label>
            <input value={name} onChange={(e) => setName(e.target.value)} maxLength={40}
              className="mt-1 w-full rounded-lg border border-line bg-plaster px-4 py-2.5 outline-none focus:border-teal" />
            <ul className="mt-4 space-y-1.5 text-[14px] text-ink-soft">
              <li>• One attempt per puzzle — a wrong move ends it.</li>
              <li>• Beat the clock: harder puzzles give more time.</li>
              <li>• 50%+ certifies; 70% Intermediate; 85% Advanced.</li>
            </ul>
            <button onClick={start} className="btn-primary mt-5 w-full">Start exam</button>
          </div>
        </>
      )}

      {phase === 'loading' && <div className="rounded-xl bg-plaster-2 px-4 py-16 text-center text-ink-soft">Preparing your exam…</div>}

      {phase === 'running' && puzzles[idx] && (
        <>
          <div className="mb-3 flex items-center justify-between">
            <h1 className="font-display text-xl font-black">Question {idx + 1} <span className="text-ink-faint">/ {puzzles.length}</span></h1>
            <span className="font-mono text-sm font-semibold text-ink-soft">Score {correct}</span>
          </div>
          <div className="mb-3 h-2 overflow-hidden rounded-full bg-plaster-2">
            <div className="h-full rounded-full bg-teal transition-[width]" style={{ width: `${(idx / puzzles.length) * 100}%` }} />
          </div>
          <ExamBoard key={idx} puzzle={puzzles[idx]} timeLimit={examTimeForRating(puzzles[idx].rating)} onResult={onResult} />
        </>
      )}

      {phase === 'done' && (
        <>
          <div className="mb-4 text-center">
            <div className="font-display text-2xl font-black">{gradeFor(pct).certified ? 'You passed! 🎉' : 'Exam complete'}</div>
            <div className="text-ink-soft">You solved {correct} of {puzzles.length} — {pct}%.</div>
          </div>
          <Certificate name={name} pct={pct} correct={correct} total={puzzles.length} date={today} />
          <div className="mt-4 flex gap-3">
            <button onClick={() => window.print()} className="btn-dark flex-1">Print / Save</button>
            <button onClick={start} className="btn-ghost flex-1">Retake</button>
          </div>
          <p className="mt-3 text-center text-[12px] text-ink-faint">Tip: “Print / Save” lets you save the certificate as a PDF or image.</p>
        </>
      )}
    </div>
  );
}

/** One exam question: single attempt, on the clock; reports pass/fail once. */
function ExamBoard({ puzzle, timeLimit, onResult }: { puzzle: ExamPuzzle; timeLimit: number; onResult: (solved: boolean) => void }) {
  const gameRef = useRef(new Chess(puzzle.fen));
  const [fen, setFen] = useState(puzzle.fen);
  const [selected, setSelected] = useState<string | null>(null);
  const [highlights, setHighlights] = useState<string[]>([]);
  const [lastMove, setLastMove] = useState<{ from: string; to: string } | null>(null);
  const [step, setStep] = useState(0);
  const [left, setLeft] = useState(timeLimit);
  const [msg, setMsg] = useState<'idle' | 'right' | 'wrong' | 'timeout'>('idle');
  const doneRef = useRef(false);
  const humanColor = new Chess(puzzle.fen).turn();

  const finish = useCallback((solved: boolean, why: 'right' | 'wrong' | 'timeout') => {
    if (doneRef.current) return;
    doneRef.current = true;
    setMsg(why);
    setTimeout(() => onResult(solved), 700); // brief feedback before advancing
  }, [onResult]);

  useEffect(() => {
    const t = setInterval(() => setLeft((s) => {
      if (s <= 1) { clearInterval(t); finish(false, 'timeout'); return 0; }
      return s - 1;
    }), 1000);
    return () => clearInterval(t);
  }, [finish]);

  const onSquare = useCallback((sqr: string) => {
    if (doneRef.current) return;
    const g = gameRef.current;
    if (g.turn() !== humanColor) return;
    if (selected) {
      const mv = tryMove(g, selected, sqr);
      if (mv) {
        if (mv.san === puzzle.solution[step]) {
          setLastMove({ from: mv.from, to: mv.to }); setSelected(null); setHighlights([]);
          let next = step + 1;
          const reply = puzzle.solution[next];
          if (reply) { const r = g.move(reply); if (r) setLastMove({ from: r.from, to: r.to }); next += 1; }
          setStep(next); setFen(g.fen());
          if (next >= puzzle.solution.length) finish(true, 'right');
          return;
        }
        g.undo(); finish(false, 'wrong'); setSelected(null); setHighlights([]); return; // one attempt
      }
    }
    if (isOwnPiece(g, sqr) && g.get(sqr as any)?.color === humanColor) { setSelected(sqr); setHighlights(legalTargets(g, sqr)); }
    else { setSelected(null); setHighlights([]); }
  }, [selected, step, puzzle, humanColor, finish]);

  return (
    <div>
      <div className="mb-2 flex items-center justify-between">
        <span className="rounded-full bg-plaster-2 px-3 py-1 font-mono text-xs font-semibold text-ink-soft">{humanColor === 'w' ? 'White' : 'Black'} to play · {puzzle.difficulty}</span>
        <span className={`rounded-full px-2.5 py-1 font-mono text-sm font-bold tabular-nums ${left <= 10 ? 'bg-danger/10 text-danger' : 'bg-ink text-white'}`}>⏱ {fmtSeconds(left)}</span>
      </div>
      <Board fen={fen} onSquarePress={onSquare} selected={selected} highlights={highlights} lastMove={lastMove} flipped={humanColor === 'b'} />
      <div className={`mt-3 rounded-xl px-4 py-3 text-center font-semibold ${msg === 'right' ? 'bg-success/10 text-success' : msg === 'wrong' || msg === 'timeout' ? 'bg-danger/10 text-danger' : 'text-ink-soft'}`}>
        {msg === 'right' ? '✓ Correct!' : msg === 'wrong' ? '✗ Not the move — next…' : msg === 'timeout' ? "⏱ Time's up — next…" : 'Find the best move. One attempt.'}
      </div>
    </div>
  );
}
