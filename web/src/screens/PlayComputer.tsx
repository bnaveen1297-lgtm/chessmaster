import { useCallback, useEffect, useRef, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import { Chess } from 'chess.js';
import { Board } from '@/components/Board';
import { BackLink } from '@/components/ui';
import { ClockFace, TimeControlPicker } from '@/components/Clock';
import { DEFAULT_TIME_CONTROL, isTimed, useChessClock, type TimeControl } from '@/game/clock';
import { useProgress } from '@/game/progress';
import type { EngineLevelId } from '@/game/unlocks';
import { StockfishEngine } from '@/engine/stockfish';
import { sayCoach } from '@/game/coach';
import { legalTargets, tryMove, isOwnPiece, checkedKingSquare, statusText } from '@shared/game/chessHelpers';
import { bestMove, LEVELS } from '@shared/engine/ai';

const GM_DEPTH = 16;

export function PlayComputer() {
  const [params] = useSearchParams();
  const gameRef = useRef(new Chess());
  const awarded = useRef(false);
  const engineRef = useRef<StockfishEngine | null>(null);
  const [fen, setFen] = useState(gameRef.current.fen());
  const [selected, setSelected] = useState<string | null>(null);
  const [highlights, setHighlights] = useState<string[]>([]);
  const [lastMove, setLastMove] = useState<{ from: string; to: string } | null>(null);
  const [thinking, setThinking] = useState(false);
  const [levelId, setLevelId] = useState<EngineLevelId>('medium');
  const [side] = useState<'w' | 'b'>('w');
  const [tc, setTc] = useState<TimeControl>(DEFAULT_TIME_CONTROL);
  const { awardGameResult } = useProgress();

  const level = LEVELS.find((l) => l.id === levelId) ?? LEVELS[1];
  const isGM = levelId === 'gm';

  // Deep-link: /app/play/computer?level=gm preselects the Grandmaster.
  useEffect(() => {
    const l = params.get('level');
    if (l && LEVELS.some((x) => x.id === l)) setLevelId(l as EngineLevelId);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);
  useEffect(() => () => engineRef.current?.quit(), []);

  const game = gameRef.current;
  const sync = useCallback(() => setFen(gameRef.current.fen()), []);
  const boardOver = game.isGameOver();
  const inProgress = game.history().length > 0;

  const clock = useChessClock(tc, game.turn(), boardOver);
  const flagged = clock.flagged;
  const over = boardOver || !!flagged;

  // engine reply — Grandmaster uses real Stockfish; other levels the fast heuristic.
  useEffect(() => {
    if (flagged || game.turn() === side || game.isGameOver()) return;
    let cancelled = false;
    setThinking(true);
    (async () => {
      const g = gameRef.current;
      let mv: { from: string; to: string; color: 'w' | 'b' } | null = null;
      if (isGM) {
        try {
          if (!engineRef.current) engineRef.current = new StockfishEngine();
          const r = await engineRef.current.evaluate(g.fen(), { depth: GM_DEPTH, multipv: 1 });
          if (cancelled) return;
          const uci = r.bestUci;
          if (uci) mv = g.move({ from: uci.slice(0, 2), to: uci.slice(2, 4), promotion: uci[4] || undefined }) as any;
        } catch { /* fall through to heuristic */ }
        if (!mv) { const san = bestMove(g.fen(), 3); if (san) mv = g.move(san) as any; }
      } else {
        await new Promise((r) => setTimeout(r, 350));
        if (cancelled) return;
        const san = bestMove(g.fen(), level.depth);
        if (san) mv = g.move(san) as any;
      }
      if (cancelled) return;
      if (mv) { setLastMove({ from: mv.from, to: mv.to }); clock.press(mv.color); }
      setThinking(false); sync();
    })();
    return () => { cancelled = true; };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [fen, flagged]);

  // award result once + a word from the coach
  useEffect(() => {
    if (!over || awarded.current) return;
    awarded.current = true;
    const won = flagged ? flagged !== side : game.isCheckmate() && game.turn() !== side;
    awardGameResult(won);
    const opp = isGM ? 'the Grandmaster' : 'the computer';
    if (game.isDraw?.()) sayCoach('A hard-fought draw. Review it to find the winning try.', 'think');
    else if (won) sayCoach(`You beat ${opp}! Run it through the analyzer to see your best moves.`, 'happy');
    else sayCoach(`Tough loss to ${opp}. Let's find the turning point in the analyzer.`, 'sad');
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
    sayCoach(isGM ? 'A new game against the Grandmaster — play solid and take your time.' : 'New game! Control the centre and develop your pieces.', 'happy');
  };

  const timed = isTimed(tc);
  const oppName = isGM ? 'Grandmaster' : 'Computer';
  const status = over
    ? flagged
      ? `${flagged === 'w' ? 'White' : 'Black'} flagged — ${flagged === side ? `${oppName} wins` : 'you win'} on time`
      : statusText(game)
    : thinking ? `${oppName} is thinking…` : 'Your move.';

  return (
    <div className="mx-auto max-w-xl">
      <BackLink to="/app/play" label="Play" />
      <div className="mb-4 flex flex-wrap items-center justify-between gap-2">
        <h1 className="font-display text-2xl font-black">{isGM ? 'Play the Grandmaster' : 'Play the computer'}</h1>
        <div className="flex gap-1 rounded-full bg-plaster-2 p-1">
          {LEVELS.map((l) => (
            <button key={l.id} onClick={() => setLevelId(l.id as EngineLevelId)}
              className={`rounded-full px-3 py-1 text-sm font-semibold transition ${levelId === l.id ? 'bg-ink text-white' : 'text-ink-soft'}`}>
              {l.id === 'gm' ? '♛ GM' : l.label}
            </button>
          ))}
        </div>
      </div>
      {isGM && <p className="-mt-2 mb-3 text-[13px] text-ink-faint">Full-strength Stockfish (depth {GM_DEPTH}) — a real grandmaster-level opponent, right in your browser.</p>}

      <TimeControlPicker value={tc} onChange={setTc} disabled={inProgress} className="mb-4" />

      <div className="flex items-center justify-between">
        <PlayerBar name={oppName} dot="#2B2B30" active={game.turn() !== side} thinking={thinking} />
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
