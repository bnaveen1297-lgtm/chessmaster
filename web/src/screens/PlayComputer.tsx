import { useCallback, useEffect, useRef, useState } from 'react';
import { Chess } from 'chess.js';
import { Board } from '@/components/Board';
import { BackLink } from '@/components/ui';
import { useProgress } from '@/game/progress';
import { legalTargets, tryMove, isOwnPiece, checkedKingSquare, statusText } from '@shared/game/chessHelpers';
import { bestMove, LEVELS } from '@shared/engine/ai';

export function PlayComputer() {
  const gameRef = useRef(new Chess());
  const awarded = useRef(false);
  const [fen, setFen] = useState(gameRef.current.fen());
  const [selected, setSelected] = useState<string | null>(null);
  const [highlights, setHighlights] = useState<string[]>([]);
  const [lastMove, setLastMove] = useState<{ from: string; to: string } | null>(null);
  const [thinking, setThinking] = useState(false);
  const [depth, setDepth] = useState(LEVELS[1].depth);
  const [side] = useState<'w' | 'b'>('w');
  const { awardGameResult } = useProgress();

  const game = gameRef.current;
  const sync = useCallback(() => setFen(gameRef.current.fen()), []);
  const gameOver = game.isGameOver();

  // engine reply
  useEffect(() => {
    if (game.turn() === side || game.isGameOver()) return;
    setThinking(true);
    const t = setTimeout(() => {
      const g = gameRef.current;
      const san = bestMove(g.fen(), depth);
      if (san) {
        const mv = g.move(san);
        if (mv) setLastMove({ from: mv.from, to: mv.to });
      }
      setThinking(false);
      sync();
    }, 350);
    return () => clearTimeout(t);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [fen]);

  useEffect(() => {
    if (gameOver && !awarded.current) {
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
      const mv = tryMove(g, selected, sq);
      if (mv) {
        setSelected(null); setHighlights([]); setLastMove({ from: mv.from, to: mv.to }); sync(); return;
      }
    }
    if (isOwnPiece(g, sq) && g.get(sq as any)?.color === side) {
      setSelected(sq); setHighlights(legalTargets(g, sq));
    } else { setSelected(null); setHighlights([]); }
  }, [selected, side, thinking, sync]);

  const restart = () => {
    gameRef.current = new Chess(); awarded.current = false;
    setSelected(null); setHighlights([]); setLastMove(null); sync();
  };

  return (
    <div className="mx-auto max-w-xl">
      <BackLink to="/app/play" label="Play" />
      <div className="mb-4 flex items-center justify-between">
        <h1 className="font-display text-2xl font-black">Play the computer</h1>
        <div className="flex gap-1 rounded-full bg-plaster-2 p-1">
          {LEVELS.map((l) => (
            <button key={l.id} onClick={() => setDepth(l.depth)}
              className={`rounded-full px-3 py-1 text-sm font-semibold ${depth === l.depth ? 'bg-ink text-white' : 'text-ink-soft'}`}>{l.label}</button>
          ))}
        </div>
      </div>

      <PlayerBar name="Computer" dot="#2B2B30" active={game.turn() !== side} thinking={thinking} />
      <div className="my-2"><Board fen={fen} onSquarePress={onSquare} selected={selected} highlights={highlights} lastMove={lastMove} checkSquare={checkedKingSquare(game)} /></div>
      <PlayerBar name="You" dot="#F4F1E8" active={game.turn() === side} />

      <div className={`mt-3 rounded-xl px-4 py-3 text-center font-semibold ${gameOver ? 'bg-ink text-gold-soft' : 'text-ink-soft'}`}>
        {gameOver ? statusText(game) : thinking ? 'Computer is thinking…' : 'Your move.'}
      </div>
      <div className="mt-3 flex gap-3">
        <button onClick={restart} className="btn-dark flex-1">New game</button>
      </div>
    </div>
  );
}

function PlayerBar({ name, dot, active, thinking }: { name: string; dot: string; active: boolean; thinking?: boolean }) {
  return (
    <div className={`flex items-center gap-2 py-1 ${active ? '' : 'opacity-60'}`}>
      <span className="h-3.5 w-3.5 rounded-full border border-line" style={{ background: dot }} />
      <span className="font-bold">{name}</span>
      {thinking && <span className="ml-1 h-2 w-2 animate-ping rounded-full bg-teal" />}
    </div>
  );
}
