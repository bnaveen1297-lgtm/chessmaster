import { useEffect, useMemo, useRef, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { Chess } from 'chess.js';
import { Board } from '@/components/Board';
import { BackLink } from '@/components/ui';
import { masterGames } from '@shared/data/masters';

export function MasterGame() {
  const { id = '' } = useParams();
  const nav = useNavigate();
  const game = masterGames.find((g) => g.id === id);

  const moves = useMemo(() => {
    if (!game) return [];
    const c = new Chess();
    try { c.loadPgn(game.pgn); } catch { return []; }
    return c.history({ verbose: true }) as any[];
  }, [game]);

  // positions[i] = FEN after i plies (0 = start)
  const positions = useMemo(() => {
    const c = new Chess();
    const arr = [c.fen()];
    for (const m of moves) { c.move(m.san); arr.push(c.fen()); }
    return arr;
  }, [moves]);

  const [ply, setPly] = useState(0);
  const [playing, setPlaying] = useState(false);
  const timer = useRef<number | null>(null);

  useEffect(() => {
    if (!playing) return;
    if (ply >= moves.length) { setPlaying(false); return; }
    timer.current = window.setTimeout(() => setPly((p) => Math.min(p + 1, moves.length)), 700);
    return () => { if (timer.current) clearTimeout(timer.current); };
  }, [playing, ply, moves.length]);

  if (!game) return <div className="mx-auto max-w-2xl"><BackLink to="/app/masters" label="Master Base" /><p>Game not found.</p></div>;

  const last = ply > 0 ? moves[ply - 1] : null;
  const lastMove = last ? { from: last.from, to: last.to } : null;

  return (
    <div className="mx-auto max-w-2xl">
      <BackLink to="/app/masters" label="Master Base" />
      {game.nickname && <h1 className="font-display text-2xl font-black">{game.nickname}</h1>}
      <p className="font-semibold">{game.white} vs {game.black}</p>
      <p className="mb-4 text-sm text-ink-faint">{game.event}, {game.year} · {game.opening}{game.eco ? ` (${game.eco})` : ''}</p>

      <Board fen={positions[ply]} interactive={false} lastMove={lastMove} />

      <div className="mt-3 flex items-center justify-center gap-2">
        <button onClick={() => { setPlaying(false); setPly(0); }} className="btn-ghost px-4 py-2">⏮</button>
        <button onClick={() => { setPlaying(false); setPly((p) => Math.max(0, p - 1)); }} className="btn-ghost px-4 py-2">‹</button>
        <button onClick={() => setPlaying((p) => !p)} className="btn-dark px-6 py-2">{playing ? '❚❚ Pause' : '▶ Play'}</button>
        <button onClick={() => { setPlaying(false); setPly((p) => Math.min(moves.length, p + 1)); }} className="btn-ghost px-4 py-2">›</button>
        <button onClick={() => { setPlaying(false); setPly(moves.length); }} className="btn-ghost px-4 py-2">⏭</button>
      </div>
      <div className="mt-2 text-center font-mono text-sm text-ink-faint">
        Move {Math.ceil(ply / 2)} / {Math.ceil(moves.length / 2)} {last ? `· ${last.san}` : ''}
      </div>

      <div className="mt-5">
        <p className="eyebrow mb-2">Play this game</p>
        <p className="mb-3 text-sm text-ink-soft">Take a side. The master plays their real moves against you; leave their path and the engine takes over — try to beat the line.</p>
        <div className="flex flex-wrap gap-3">
          <button onClick={() => nav(`/app/masters/${id}/play?side=w`)} className="btn-primary flex-1">Play as White</button>
          <button onClick={() => nav(`/app/masters/${id}/play?side=b`)} className="btn-ghost flex-1">Play as Black</button>
          <button onClick={() => nav('/app/analyze')} className="btn-dark flex-1">Engine review</button>
        </div>
      </div>
      <div className="mt-4 rounded-2xl border border-line bg-plaster-2 p-4 text-sm text-ink-soft">
        <span className="font-semibold text-ink">Result: {game.result === '1/2-1/2' ? 'Draw' : game.result === '1-0' ? 'White won' : 'Black won'}.</span>{' '}
        Every move is verified — step through the replay above, or play it yourself.
      </div>
    </div>
  );
}
