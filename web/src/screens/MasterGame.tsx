import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { useLocation, useNavigate, useParams } from 'react-router-dom';
import { Chess } from 'chess.js';
import { Board } from '@/components/Board';
import { BackLink } from '@/components/ui';
import { masterGames, type MasterGame as MG } from '@shared/data/masters';
import { legalTargets, tryMove, isOwnPiece } from '@shared/game/chessHelpers';

export function MasterGame() {
  const { id = '' } = useParams();
  const nav = useNavigate();
  const loc = useLocation();
  const stateGame = (loc.state as { game?: MG } | null)?.game;
  const game = stateGame ?? masterGames.find((g) => g.id === id);

  const [mode, setMode] = useState<'replay' | 'guess'>('replay');

  const moves = useMemo(() => {
    if (!game) return [];
    const c = new Chess();
    try { c.loadPgn(game.pgn); } catch { return []; }
    return c.history({ verbose: true }) as any[];
  }, [game]);

  if (!game) return <div className="mx-auto max-w-2xl"><BackLink to="/app/masters" label="Master Base" /><p>Game not found.</p></div>;

  return (
    <div className="mx-auto max-w-2xl">
      <BackLink to="/app/masters" label="Master Base" />
      {game.nickname && <h1 className="font-display text-2xl font-black">{game.nickname}</h1>}
      <p className="font-semibold">{game.white} vs {game.black}</p>
      <p className="mb-4 text-sm text-ink-faint">{game.event}{game.year ? `, ${game.year}` : ''} · {game.opening}{game.eco ? ` (${game.eco})` : ''}</p>

      <div className="mb-4 inline-flex rounded-full bg-plaster-2 p-1">
        <button onClick={() => setMode('replay')} className={`rounded-full px-4 py-1.5 text-sm font-semibold ${mode === 'replay' ? 'bg-ink text-white' : 'text-ink-soft'}`}>Watch replay</button>
        <button onClick={() => setMode('guess')} className={`rounded-full px-4 py-1.5 text-sm font-semibold ${mode === 'guess' ? 'bg-ink text-white' : 'text-ink-soft'}`}>Learn: guess the move</button>
      </div>

      {mode === 'replay' ? <Replay moves={moves} /> : <Guess moves={moves} />}

      <div className="mt-5">
        <p className="eyebrow mb-2">Play this game</p>
        <div className="flex flex-wrap gap-3">
          <button onClick={() => nav(`/app/masters/${id}/play?side=w`, { state: { game } })} className="btn-primary flex-1">Play as White</button>
          <button onClick={() => nav(`/app/masters/${id}/play?side=b`, { state: { game } })} className="btn-ghost flex-1">Play as Black</button>
          <button onClick={() => nav('/app/analyze')} className="btn-dark flex-1">Engine review</button>
        </div>
      </div>
    </div>
  );
}

/* ---------------- replay ---------------- */
function Replay({ moves }: { moves: any[] }) {
  const positions = useMemo(() => {
    const c = new Chess(); const arr = [c.fen()];
    for (const m of moves) { c.move(m.san); arr.push(c.fen()); }
    return arr;
  }, [moves]);
  const [ply, setPly] = useState(0);
  const [playing, setPlaying] = useState(false);
  useEffect(() => {
    if (!playing) return;
    if (ply >= moves.length) { setPlaying(false); return; }
    const t = setTimeout(() => setPly((p) => Math.min(p + 1, moves.length)), 700);
    return () => clearTimeout(t);
  }, [playing, ply, moves.length]);
  const last = ply > 0 ? moves[ply - 1] : null;
  return (
    <>
      <Board fen={positions[ply]} interactive={false} lastMove={last ? { from: last.from, to: last.to } : null} />
      <div className="mt-3 flex items-center justify-center gap-2">
        <button onClick={() => { setPlaying(false); setPly(0); }} className="btn-ghost px-4 py-2">⏮</button>
        <button onClick={() => { setPlaying(false); setPly((p) => Math.max(0, p - 1)); }} className="btn-ghost px-4 py-2">‹</button>
        <button onClick={() => setPlaying((p) => !p)} className="btn-dark px-6 py-2">{playing ? '❚❚' : '▶ Play'}</button>
        <button onClick={() => { setPlaying(false); setPly((p) => Math.min(moves.length, p + 1)); }} className="btn-ghost px-4 py-2">›</button>
        <button onClick={() => { setPlaying(false); setPly(moves.length); }} className="btn-ghost px-4 py-2">⏭</button>
      </div>
      <div className="mt-2 text-center font-mono text-sm text-ink-faint">Move {Math.ceil(ply / 2)} / {Math.ceil(moves.length / 2)} {last ? `· ${last.san}` : ''}</div>
    </>
  );
}

/* ---------------- iterative learning: guess the move ---------------- */
function Guess({ moves }: { moves: any[] }) {
  const gameRef = useRef(new Chess());
  const [fen, setFen] = useState(gameRef.current.fen());
  const [ply, setPly] = useState(0);
  const [selected, setSelected] = useState<string | null>(null);
  const [highlights, setHighlights] = useState<string[]>([]);
  const [lastMove, setLastMove] = useState<{ from: string; to: string } | null>(null);
  const [correct, setCorrect] = useState(0);
  const [msg, setMsg] = useState('Find the move that was actually played.');
  const [tone, setTone] = useState<'idle' | 'good' | 'bad'>('idle');

  const expected = moves[ply];
  const done = ply >= moves.length;
  const turn = gameRef.current.turn();

  const advance = useCallback((asGuess: boolean) => {
    const g = gameRef.current;
    const m = moves[ply];
    if (!m) return;
    const mv = g.move(m.san);
    if (mv) setLastMove({ from: mv.from, to: mv.to });
    setFen(g.fen());
    setPly((p) => p + 1);
    if (asGuess) setCorrect((c) => c + 1);
  }, [moves, ply]);

  const onSquare = useCallback((sq: string) => {
    if (done) return;
    const g = gameRef.current;
    if (selected) {
      if (isOwnPiece(g, sq)) { setSelected(sq); setHighlights(legalTargets(g, sq)); return; }
      // check against the actual played move without committing an illegal one
      if (selected === expected.from && sq === expected.to) {
        setSelected(null); setHighlights([]); setTone('good'); setMsg(`✓ ${expected.san} — exactly the move.`);
        advance(true);
        return;
      }
      // was it at least a legal move? (undo to keep the study line intact)
      const trial = tryMove(g, selected, sq);
      if (trial) { g.undo(); setTone('bad'); setMsg('Legal, but not the game move — try again.'); setSelected(null); setHighlights([]); return; }
    }
    if (isOwnPiece(g, sq)) { setSelected(sq); setHighlights(legalTargets(g, sq)); setTone('idle'); }
    else { setSelected(null); setHighlights([]); }
  }, [selected, expected, done, advance]);

  const reveal = () => { if (!done) { setTone('idle'); setMsg(`It was ${expected.san}.`); advance(false); } };
  const restart = () => { gameRef.current = new Chess(); setFen(gameRef.current.fen()); setPly(0); setSelected(null); setHighlights([]); setLastMove(null); setCorrect(0); setTone('idle'); setMsg('Find the move that was actually played.'); };

  return (
    <>
      <div className="mb-2 flex items-center justify-between text-sm">
        <span className="font-bold">{turn === 'w' ? 'White' : 'Black'} to move</span>
        <span className="font-mono text-ink-faint">Found {correct} / {moves.length}</span>
      </div>
      <Board fen={fen} onSquarePress={onSquare} selected={selected} highlights={highlights} lastMove={lastMove} interactive={!done} />
      <div className={`mt-3 rounded-xl px-4 py-3 text-center font-semibold ${done ? 'bg-ink text-gold-soft' : tone === 'good' ? 'bg-success/10 text-success' : tone === 'bad' ? 'text-danger' : 'text-ink-soft'}`}>
        {done ? `Done — you found ${correct} of ${moves.length} moves.` : msg}
      </div>
      <div className="mt-3 flex gap-3">
        {!done && <button onClick={reveal} className="btn-ghost flex-1">Reveal move</button>}
        <button onClick={restart} className="btn-dark flex-1">Restart</button>
      </div>
    </>
  );
}
