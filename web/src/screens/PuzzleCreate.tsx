import { useEffect, useRef, useState } from 'react';
import { Chess } from 'chess.js';
import { BackLink, PageHeader, Group, Row } from '@/components/ui';
import { PuzzleSolver } from '@/components/PuzzleSolver';
import { useAuth } from '@/auth/AuthProvider';
import { useProgress } from '@/game/progress';
import { StockfishEngine, pvToSan } from '@/engine/stockfish';
import type { Puzzle, PuzzleDifficulty } from '@shared/data/puzzles';

const DEPTH = 16;
const KEY = 'chesshub360.mypuzzles';
const keyFor = (uid?: string | null) => (uid ? `${KEY}.${uid}` : KEY);

type Saved = Pick<Puzzle, 'id' | 'title' | 'theme' | 'difficulty' | 'kind' | 'fen' | 'solution'>;

function readSaved(uid?: string | null): Saved[] {
  try { const raw = localStorage.getItem(keyFor(uid)); if (raw) return JSON.parse(raw); } catch { /* ignore */ }
  return [];
}
function writeSaved(uid: string | null | undefined, list: Saved[]) {
  try { localStorage.setItem(keyFor(uid), JSON.stringify(list.slice(0, 50))); } catch { /* ignore */ }
}

/** Decide whether a position holds a forcing tactic and, if so, build a puzzle. */
export function buildFromEval(fen: string, best: { cp: number; pv: string[]; mateIn: number | null }, second?: { cp: number }): Puzzle | null {
  const isMate = best.mateIn != null && best.mateIn > 0;
  const gap = second ? best.cp - second.cp : best.cp;
  const decisive = isMate || (best.cp >= 200 && gap >= 150);
  if (!decisive) return null;
  // Take a forcing line, ending on the solver's move (odd number of plies).
  let sanLine = pvToSan(fen, best.pv, isMate ? 12 : 5);
  if (sanLine.length % 2 === 0) sanLine = sanLine.slice(0, -1);
  if (sanLine.length === 0) return null;
  const difficulty: PuzzleDifficulty = isMate || best.cp >= 600 ? 'Advanced' : best.cp >= 300 ? 'Intermediate' : 'Beginner';
  return {
    id: 'fen-' + Date.now().toString(36),
    title: isMate ? `Mate in ${best.mateIn}` : 'Winning tactic',
    theme: isMate ? 'Checkmate' : 'Tactics',
    difficulty,
    kind: isMate ? 'mate' : 'line',
    fen,
    solution: sanLine,
  };
}

export function PuzzleCreate() {
  const { user } = useAuth();
  const { awardPuzzleSolved } = useProgress();
  const [fenInput, setFenInput] = useState('');
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState<string | null>(null);
  const [puzzle, setPuzzle] = useState<Puzzle | null>(null);
  const [saved, setSaved] = useState<Saved[]>(() => readSaved(user?.id));
  const engineRef = useRef<StockfishEngine | null>(null);

  useEffect(() => setSaved(readSaved(user?.id)), [user?.id]);
  useEffect(() => () => engineRef.current?.quit(), []);

  const find = async (fenRaw: string) => {
    const fen = fenRaw.trim();
    setErr(null); setPuzzle(null);
    let g: Chess;
    try { g = new Chess(fen); } catch { setErr('That doesn’t look like a valid FEN.'); return; }
    if (g.isGameOver()) { setErr('That position is already over — try one with a move to find.'); return; }
    setBusy(true);
    try {
      if (!engineRef.current) engineRef.current = new StockfishEngine();
      const r = await engineRef.current.evaluate(fen, { depth: DEPTH, multipv: 2 });
      const p = buildFromEval(fen, r.lines[0], r.lines[1]);
      if (!p) { setErr('No forcing tactic here — the best move isn’t clearly winning. Try a sharper position.'); }
      else setPuzzle(p);
    } catch { setErr('Stockfish couldn’t run here. Try again or a different browser.'); }
    finally { setBusy(false); }
  };

  const save = () => {
    if (!puzzle) return;
    const list = [{ id: puzzle.id, title: puzzle.title, theme: puzzle.theme, difficulty: puzzle.difficulty, kind: puzzle.kind, fen: puzzle.fen, solution: puzzle.solution }, ...readSaved(user?.id)];
    writeSaved(user?.id, list); setSaved(list);
  };

  return (
    <div className="mx-auto max-w-xl">
      <BackLink to="/app/puzzles" label="Puzzle courses" />
      <PageHeader eyebrow="Create" title="Make a puzzle from a position"
        sub="Paste any FEN. Stockfish finds the tactic and turns it into a puzzle you can solve and save." />

      <div className="card p-5">
        <textarea value={fenInput} onChange={(e) => setFenInput(e.target.value)} rows={2}
          placeholder="r1bqk2r/pppp1ppp/2n2n2/2b1p3/2B1P3/2N2N2/PPPP1PPP/R1BQ1RK1 w kq - 0 1"
          className="w-full rounded-xl border border-line bg-surface p-3 font-mono text-[13px] outline-none focus:border-teal" />
        <div className="mt-3 flex flex-wrap gap-3">
          <button onClick={() => find(fenInput)} disabled={busy || !fenInput.trim()} className="btn-primary">{busy ? 'Searching…' : 'Find the tactic'}</button>
          <button onClick={() => { const f = '4q1k1/8/8/8/4N3/8/8/6K1 w - - 0 1'; setFenInput(f); find(f); }} disabled={busy} className="btn-ghost">Try a sample</button>
        </div>
        {err && <p className="mt-3 text-sm font-semibold text-danger">{err}</p>}
      </div>

      {puzzle && (
        <div className="mt-5">
          <div className="mb-2 flex items-center justify-between">
            <h2 className="font-display text-lg font-black">{puzzle.title}</h2>
            <button onClick={save} className="rounded-full bg-ink px-3 py-1.5 text-[13px] font-semibold text-white">Save puzzle</button>
          </div>
          <PuzzleSolver key={puzzle.id} puzzle={puzzle} loading={false} onSolved={awardPuzzleSolved} onNext={() => setPuzzle(null)} nextLabel="Clear" />
        </div>
      )}

      {saved.length > 0 && (
        <div className="mt-6">
          <h2 className="mb-2 font-display text-lg font-black">Your saved puzzles</h2>
          <Group>
            {saved.map((s) => (
              <Row key={s.id} title={s.title} subtitle={`${s.theme} · ${s.difficulty}`}
                onClick={() => setPuzzle({ ...s })} right={<span className="text-sm font-semibold text-teal">Solve</span>} chevron={false} />
            ))}
          </Group>
        </div>
      )}
    </div>
  );
}
