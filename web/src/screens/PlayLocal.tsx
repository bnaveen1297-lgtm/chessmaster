import { useCallback, useRef, useState } from 'react';
import { Chess } from 'chess.js';
import { Board } from '@/components/Board';
import { BackLink } from '@/components/ui';
import { legalTargets, tryMove, isOwnPiece, checkedKingSquare, statusText } from '@shared/game/chessHelpers';

export function PlayLocal() {
  const gameRef = useRef(new Chess());
  const [fen, setFen] = useState(gameRef.current.fen());
  const [selected, setSelected] = useState<string | null>(null);
  const [highlights, setHighlights] = useState<string[]>([]);
  const [lastMove, setLastMove] = useState<{ from: string; to: string } | null>(null);
  const game = gameRef.current;
  const sync = () => setFen(gameRef.current.fen());
  const turn = game.turn();

  const onSquare = useCallback((sq: string) => {
    const g = gameRef.current;
    if (g.isGameOver()) return;
    if (selected) {
      const mv = tryMove(g, selected, sq);
      if (mv) { setSelected(null); setHighlights([]); setLastMove({ from: mv.from, to: mv.to }); sync(); return; }
    }
    if (isOwnPiece(g, sq)) { setSelected(sq); setHighlights(legalTargets(g, sq)); }
    else { setSelected(null); setHighlights([]); }
  }, [selected]);

  const restart = () => { gameRef.current = new Chess(); setSelected(null); setHighlights([]); setLastMove(null); sync(); };

  return (
    <div className="mx-auto max-w-xl">
      <BackLink to="/app/play" label="Play" />
      <h1 className="mb-4 font-display text-2xl font-black">Pass and play</h1>
      <div className={`mb-2 flex items-center gap-2 font-bold ${turn === 'b' ? '' : 'opacity-50'}`}><span className="h-3.5 w-3.5 rounded-full bg-[#2B2B30]" /> Black</div>
      <Board fen={fen} onSquarePress={onSquare} selected={selected} highlights={highlights} lastMove={lastMove} checkSquare={checkedKingSquare(game)} />
      <div className={`mt-2 flex items-center gap-2 font-bold ${turn === 'w' ? '' : 'opacity-50'}`}><span className="h-3.5 w-3.5 rounded-full border border-line bg-[#F4F1E8]" /> White</div>
      <div className={`mt-3 rounded-xl px-4 py-3 text-center font-semibold ${game.isGameOver() ? 'bg-ink text-gold-soft' : 'text-ink-soft'}`}>
        {game.isGameOver() ? statusText(game) : `${turn === 'w' ? 'White' : 'Black'} to move`}
      </div>
      <button onClick={restart} className="btn-dark mt-3 w-full">New game</button>
    </div>
  );
}
