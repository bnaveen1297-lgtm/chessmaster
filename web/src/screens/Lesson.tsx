import { useCallback, useMemo, useRef, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { Chess } from 'chess.js';
import { Board } from '@/components/Board';
import { BackLink } from '@/components/ui';
import { useProgress } from '@/game/progress';
import { lessonContent, type LessonExercise } from '@shared/data/lessons';
import { nextLessonId } from '@shared/data/content';
import { legalTargets, isOwnPiece } from '@shared/game/chessHelpers';

export function Lesson() {
  const { id = '' } = useParams();
  const nav = useNavigate();
  const { progress, markLessonComplete } = useProgress();
  const lesson = lessonContent[id];
  const isDone = progress.lessonsCompleted.includes(id);
  const next = nextLessonId(id);

  if (!lesson) return <div className="mx-auto max-w-2xl"><BackLink to="/app/learn" label="Learn" /><p>Lesson not found.</p></div>;

  return (
    <div className="mx-auto max-w-2xl">
      <BackLink to="/app/learn" label="Learn" />
      <h1 className="font-display text-3xl font-black">{lesson.title}</h1>
      <div className="mt-5 space-y-5">
        {lesson.sections.map((s, i) => (
          <div key={i}>
            {s.heading && <h2 className="mb-1 font-display text-lg font-black text-teal-deep">{s.heading}</h2>}
            <p className="text-[16px] leading-relaxed text-ink-soft">{s.text}</p>
          </div>
        ))}
      </div>

      {lesson.exercise && <Exercise ex={lesson.exercise} />}

      <div className="mt-8 flex flex-wrap gap-3">
        {!isDone ? (
          <button onClick={() => markLessonComplete(id)} className="btn-gold">Mark complete (+15 XP)</button>
        ) : (
          <span className="btn border border-success/30 bg-success/10 px-5 py-3 font-semibold text-success">✓ Completed</span>
        )}
        {next && <button onClick={() => nav(`/app/learn/${next}`)} className="btn-dark">Next lesson ›</button>}
      </div>
    </div>
  );
}

function Exercise({ ex }: { ex: LessonExercise }) {
  const gameRef = useRef(new Chess(ex.fen));
  const [fen, setFen] = useState(ex.fen);
  const [selected, setSelected] = useState<string | null>(null);
  const [highlights, setHighlights] = useState<string[]>([]);
  const [state, setState] = useState<'idle' | 'wrong' | 'solved'>('idle');
  const [showHint, setShowHint] = useState(false);

  const onSquare = useCallback((sq: string) => {
    if (state === 'solved') return;
    const g = gameRef.current;
    if (selected) {
      if (selected === ex.from && sq === ex.to) {
        g.move({ from: ex.from, to: ex.to, promotion: 'q' });
        setFen(g.fen()); setSelected(null); setHighlights([]); setState('solved'); return;
      }
      // wrong target — reset selection, flash
      if (sq !== selected) { setState('wrong'); setSelected(null); setHighlights([]); return; }
    }
    if (isOwnPiece(g, sq)) { setSelected(sq); setHighlights(legalTargets(g, sq)); setState('idle'); }
    else { setSelected(null); setHighlights([]); }
  }, [selected, state, ex]);

  const reset = () => { gameRef.current = new Chess(ex.fen); setFen(ex.fen); setSelected(null); setHighlights([]); setState('idle'); setShowHint(false); };

  return (
    <div className="mt-8 rounded-2xl border border-line bg-plaster-2 p-5">
      <p className="eyebrow mb-1">Your turn</p>
      <p className="mb-3 font-semibold">{ex.prompt}</p>
      <div className="mx-auto max-w-sm"><Board fen={fen} onSquarePress={onSquare} selected={selected} highlights={highlights} /></div>
      {state === 'solved' ? (
        <div className="mt-3 rounded-xl bg-success/10 p-3 text-sm font-semibold text-success">✓ {ex.explain}</div>
      ) : (
        <div className="mt-3 flex flex-wrap items-center gap-3">
          {state === 'wrong' && <span className="text-sm font-semibold text-danger">Not quite — try again.</span>}
          <button onClick={() => setShowHint((h) => !h)} className="text-sm font-semibold text-teal">{showHint ? 'Hide hint' : 'Show hint'}</button>
          <button onClick={reset} className="text-sm font-semibold text-ink-faint">Reset</button>
          {showHint && <span className="w-full text-sm text-ink-soft">💡 {ex.hint}</span>}
        </div>
      )}
    </div>
  );
}
