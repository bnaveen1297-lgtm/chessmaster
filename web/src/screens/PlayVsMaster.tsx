import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { useLocation, useParams, useSearchParams } from 'react-router-dom';
import { Chess } from 'chess.js';
import { Board } from '@/components/Board';
import { BackLink } from '@/components/ui';
import { useProgress } from '@/game/progress';
import { masterGames } from '@shared/data/masters';
import { legalTargets, tryMove, isOwnPiece, checkedKingSquare, statusText } from '@shared/game/chessHelpers';
import { bestMove } from '@shared/engine/ai';

type Rec = { from: string; to: string; promotion?: string; san: string; color: 'w' | 'b' };

export function PlayVsMaster() {
  const { id = '' } = useParams();
  const [params] = useSearchParams();
  const side = (params.get('side') === 'b' ? 'b' : 'w') as 'w' | 'b';
  const loc = useLocation();
  const stateGame = (loc.state as { game?: typeof masterGames[number] } | null)?.game;
  const master = stateGame ?? masterGames.find((g) => g.id === id);
  const { awardGameResult } = useProgress();

  const recorded = useMemo<Rec[]>(() => {
    if (!master) return [];
    const c = new Chess();
    try { c.loadPgn(master.pgn); } catch { return []; }
    return (c.history({ verbose: true }) as any[]).map((m) => ({ from: m.from, to: m.to, promotion: m.promotion, san: m.san, color: m.color }));
  }, [master]);

  const gameRef = useRef(new Chess());
  const onRails = useRef(true);
  const awarded = useRef(false);
  const [fen, setFen] = useState(gameRef.current.fen());
  const [selected, setSelected] = useState<string | null>(null);
  const [highlights, setHighlights] = useState<string[]>([]);
  const [lastMove, setLastMove] = useState<{ from: string; to: string } | null>(null);
  const [matched, setMatched] = useState(0);
  const [offAt, setOffAt] = useState<number | null>(null);
  const [thinking, setThinking] = useState(false);
  const [msg, setMsg] = useState(`You are ${side === 'w' ? 'White' : 'Black'} — make your move.`);

  const game = gameRef.current;
  const opp: 'w' | 'b' = side === 'w' ? 'b' : 'w';
  const sync = useCallback(() => setFen(gameRef.current.fen()), []);
  const gameOver = game.isGameOver();

  useEffect(() => {
    if (!master) return;
    if (game.turn() !== opp || game.isGameOver()) return;
    setThinking(true);
    const t = setTimeout(() => {
      const g = gameRef.current;
      const ply = g.history().length;
      let played = false;
      if (onRails.current && ply < recorded.length && recorded[ply].color === opp) {
        const r = recorded[ply];
        const mv = g.move({ from: r.from, to: r.to, promotion: r.promotion as any });
        if (mv) { setLastMove({ from: mv.from, to: mv.to }); played = true; }
      }
      if (!played) {
        const san = bestMove(g.fen(), 3);
        if (san) { const mv = g.move(san); if (mv) setLastMove({ from: mv.from, to: mv.to }); }
      }
      setThinking(false); sync();
    }, 400);
    return () => clearTimeout(t);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [fen, master]);

  useEffect(() => {
    if (gameOver && !awarded.current && master) {
      awarded.current = true;
      const won = game.isCheckmate() && game.turn() !== side;
      awardGameResult(won);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [gameOver]);

  const onSquare = useCallback((sq: string) => {
    const g = gameRef.current;
    if (g.isGameOver() || g.turn() !== side || thinking) return;
    if (selected) {
      const ply = g.history().length;
      const rec = recorded[ply];
      const mv = tryMove(g, selected, sq);
      if (mv) {
        setSelected(null); setHighlights([]); setLastMove({ from: mv.from, to: mv.to });
        if (onRails.current && rec && rec.from === mv.from && rec.to === mv.to) {
          setMatched((n) => n + 1);
          setMsg(`Master move ✓ (${mv.san}) — you matched the game.`);
        } else if (onRails.current) {
          onRails.current = false; setOffAt(Math.floor(ply / 2) + 1);
          setMsg(rec ? `Off the master's path — here they played ${rec.san}. The engine takes over. Try to win!` : 'Off-book — the engine takes over now.');
        } else setMsg('Your move.');
        sync(); return;
      }
    }
    if (isOwnPiece(g, sq) && g.get(sq as any)?.color === side) { setSelected(sq); setHighlights(legalTargets(g, sq)); }
    else { setSelected(null); setHighlights([]); }
  }, [selected, side, thinking, recorded, sync]);

  const restart = () => {
    gameRef.current = new Chess(); onRails.current = true; awarded.current = false;
    setSelected(null); setHighlights([]); setLastMove(null); setMatched(0); setOffAt(null);
    setMsg(`You are ${side === 'w' ? 'White' : 'Black'} — make your move.`); sync();
  };

  if (!master) return <div className="mx-auto max-w-xl"><BackLink to="/app/masters" label="Master Base" /><p>Game not found.</p></div>;
  const oppName = side === 'w' ? master.black : master.white;

  return (
    <div className="mx-auto max-w-xl">
      <BackLink to={`/app/masters/${id}`} label={master.nickname || 'Master game'} />
      <div className="mb-3 flex items-center justify-between">
        <div><h1 className="font-display text-xl font-black">vs {oppName}</h1><p className="text-sm text-ink-faint">{master.event}, {master.year}</p></div>
        <span className="rounded-full bg-success/10 px-3 py-1 text-sm font-bold text-success">✓ {matched}</span>
      </div>

      <div className="mb-2 flex items-center gap-2">
        <span className="h-3.5 w-3.5 rounded-full border border-line" style={{ background: opp === 'w' ? '#F4F1E8' : '#2B2B30' }} />
        <span className="font-bold">{oppName}</span>
        <span className={`ml-1 rounded-full px-2 py-0.5 text-[10px] font-bold tracking-wide ${onRails.current ? 'bg-plaster-2 text-ink-soft' : 'bg-violet/15 text-violet'}`}>
          {onRails.current ? 'PLAYING THE REAL GAME' : 'ENGINE'}
        </span>
        {thinking && <span className="h-2 w-2 animate-ping rounded-full bg-teal" />}
      </div>
      <Board fen={fen} onSquarePress={onSquare} selected={selected} highlights={highlights} lastMove={lastMove} checkSquare={checkedKingSquare(game)} flipped={side === 'b'} />
      <div className="mt-2 flex items-center gap-2">
        <span className="h-3.5 w-3.5 rounded-full border border-line" style={{ background: side === 'w' ? '#F4F1E8' : '#2B2B30' }} />
        <span className="font-bold">You</span>
        {offAt && <span className="ml-auto text-sm font-semibold text-warning">off-book at move {offAt}</span>}
      </div>

      <div className={`mt-3 rounded-xl px-4 py-3 text-center font-semibold ${gameOver ? 'bg-ink text-gold-soft' : 'text-ink-soft'}`}>
        {gameOver ? statusText(game) : msg}
      </div>
      <button onClick={restart} className="btn-dark mt-3 w-full">Restart</button>
    </div>
  );
}
