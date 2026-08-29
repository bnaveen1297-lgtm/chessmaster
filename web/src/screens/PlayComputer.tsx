import { useCallback, useEffect, useRef, useState } from 'react';
import { Chess } from 'chess.js';
import { Board } from '@/components/Board';
import { BackLink } from '@/components/ui';
import { ClockFace, TimeControlPicker } from '@/components/Clock';
import { DEFAULT_TIME_CONTROL, isTimed, useChessClock, type TimeControl } from '@/game/clock';
import { useProgress } from '@/game/progress';
import { computerLevelUnlock, type EngineLevelId } from '@/game/unlocks';
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
  const [tc, setTc] = useState<TimeControl>(DEFAULT_TIME_CONTROL);
  const { awardGameResult, progress } = useProgress();

  // Lock harder engine levels behind XP; if the selected one is locked (e.g. a
  // fresh account), fall back to the easiest.
  const levelLocked = (id: string) => !computerLevelUnlock(id as EngineLevelId, progress).unlocked;
  useEffect(() => {
    const sel = LEVELS.find((l) => l.depth === depth);
    if (sel && levelLocked(sel.id)) setDepth(LEVELS[0].depth);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [progress.xp]);

  const game = gameRef.current;
  const sync = useCallback(() => setFen(gameRef.current.fen()), []);
  const boardOver = game.isGameOver();
  const inProgress = game.history().length > 0;

  const clock = useChessClock(tc, game.turn(), boardOver);
  const flagged = clock.flagged;
  const over = boardOver || !!flagged;

  // engine reply
  useEffect(() => {
    if (flagged || game.turn() === side || game.isGameOver()) return;
    setThinking(true);
    const t = setTimeout(() => {
      const g = gameRef.current;
      const san = bestMove(g.fen(), depth);
      if (san) {
        const mv = g.move(san);
        if (mv) { setLastMove({ from: mv.from, to: mv.to }); clock.press(mv.color); }
      }
      setThinking(false);
      sync();
    }, 350);
    return () => clearTimeout(t);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [fen, flagged]);

  // award result once, whether by board end or by flag fall
  useEffect(() => {
    if (!over || awarded.current) return;
    awarded.current = true;
    const won = flagged ? flagged !== side : game.isCheckmate() && game.turn() !== side;
    awardGameResult(won);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [over]);

  const onSquare = useCallback((sq: string) => {
    const g = gameRef.current;
    if (g.isGameOver() || flagged || g.turn() !== side || thinking) return;
    if (selected) {
      const mv = tryMove(g, selected, sq);
      if (mv) {
        setSelected(null); setHighlights([]); setLastMove({ from: mv.from, to: mv.to });
        clock.press(mv.color); sync(); return;
      }
    }
    if (isOwnPiece(g, sq) && g.get(sq as any)?.color === side) {
      setSelected(sq); setHighlights(legalTargets(g, sq));
    } else { setSelected(null); setHighlights([]); }
  }, [selected, side, thinking, flagged, clock, sync]);

  const restart = () => {
    gameRef.current = new Chess(); awarded.current = false;
    setSelected(null); setHighlights([]); setLastMove(null);
    clock.reset(tc); sync();
  };

  const timed = isTimed(tc);
  const status = over
    ? flagged
      ? `${flagged === 'w' ? 'White' : 'Black'} flagged — ${flagged === side ? 'Computer wins' : 'you win'} on time`
      : statusText(game)
    : thinking ? 'Computer is thinking…' : 'Your move.';

  return (
    <div className="mx-auto max-w-xl">
      <BackLink to="/app/play" label="Play" />
      <div className="mb-4 flex items-center justify-between">
        <h1 className="font-display text-2xl font-black">Play the computer</h1>
        <div className="flex gap-1 rounded-full bg-plaster-2 p-1">
          {LEVELS.map((l) => {
            const u = computerLevelUnlock(l.id as EngineLevelId, progress);
            return (
              <button key={l.id} onClick={() => u.unlocked && setDepth(l.depth)} disabled={!u.unlocked}
                title={u.unlocked ? '' : u.requirement}
                className={`rounded-full px-3 py-1 text-sm font-semibold transition disabled:cursor-not-allowed ${depth === l.depth ? 'bg-ink text-white' : u.unlocked ? 'text-ink-soft' : 'text-ink-faint opacity-60'}`}>
                {u.unlocked ? l.label : `🔒 ${l.label}`}
              </button>
            );
          })}
        </div>
      </div>
      {(levelLocked('medium') || levelLocked('hard')) && (
        <p className="-mt-2 mb-3 text-[13px] text-ink-faint">Win games to earn XP and unlock {levelLocked('medium') ? 'Medium' : 'Hard'}{levelLocked('medium') && levelLocked('hard') ? ' & Hard' : ''}.</p>
      )}

      <TimeControlPicker value={tc} onChange={setTc} disabled={inProgress} className="mb-4" />

      <div className="flex items-center justify-between">
        <PlayerBar name="Computer" dot="#2B2B30" active={game.turn() !== side} thinking={thinking} />
        {timed && <ClockFace ms={clock.blackMs} active={clock.running === 'b'} />}
      </div>
      <div className="my-2"><Board fen={fen} onSquarePress={onSquare} selected={selected} highlights={highlights} lastMove={lastMove} checkSquare={checkedKingSquare(game)} /></div>
      <div className="flex items-center justify-between">
        <PlayerBar name="You" dot="#F4F1E8" active={game.turn() === side} />
        {timed && <ClockFace ms={clock.whiteMs} active={clock.running === 'w'} />}
      </div>

      <div className={`mt-3 rounded-xl px-4 py-3 text-center font-semibold ${over ? 'bg-ink text-gold-soft' : 'text-ink-soft'}`}>
        {status}
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
