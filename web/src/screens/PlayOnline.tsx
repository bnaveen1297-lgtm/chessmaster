import { useCallback, useEffect, useRef, useState } from 'react';
import { BackLink, PageHeader } from '@/components/ui';
import { Board } from '@/components/Board';
import { useAuth } from '@/auth/AuthProvider';
import { usePrefs } from '@/game/prefs';
import { useProgress } from '@/game/progress';
import { legalTargets, isOwnPiece, checkedKingSquare, statusText } from '@shared/game/chessHelpers';
import {
  LobbyClient, GameClient, onlineAvailable,
  type LobbyPlayer, type GameStart, type Challenge, type GameOver,
} from '@/lib/onlinePlay';

export function PlayOnline() {
  const { user } = useAuth();
  const { name } = usePrefs();

  if (!user || !onlineAvailable()) {
    return (
      <div className="mx-auto max-w-xl">
        <BackLink to="/app/play" label="Play" />
        <PageHeader eyebrow="Online" title="Play online" />
        <div className="card p-6 text-ink-soft">Online play needs an account and a connection. Sign in to challenge other players in real time.</div>
      </div>
    );
  }

  const me = { userId: user.id, name: (name || user.firstName || 'Player').trim() };
  return <OnlineInner me={me} />;
}

function OnlineInner({ me }: { me: { userId: string; name: string } }) {
  const [players, setPlayers] = useState<LobbyPlayer[]>([]);
  const [status, setStatus] = useState<'idle' | 'seeking' | 'playing'>('idle');
  const [incoming, setIncoming] = useState<Challenge | null>(null);
  const [sentTo, setSentTo] = useState<string | null>(null);
  const [gameStart, setGameStart] = useState<GameStart | null>(null);
  const lobbyRef = useRef<LobbyClient | null>(null);

  useEffect(() => {
    const lobby = new LobbyClient(me, {
      onPlayers: setPlayers,
      onChallenge: (c) => setIncoming(c),
      onDecline: () => setSentTo(null),
      onStart: (g) => { setIncoming(null); setSentTo(null); setStatus('playing'); setGameStart(g); },
    });
    lobby.connect();
    lobbyRef.current = lobby;
    return () => { lobby.disconnect(); lobbyRef.current = null; };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [me.userId]);

  const seek = () => { lobbyRef.current?.setStatus('seeking'); setStatus('seeking'); };
  const cancelSeek = () => { lobbyRef.current?.setStatus('idle'); setStatus('idle'); };
  const challenge = (p: LobbyPlayer) => { lobbyRef.current?.challenge(p.userId); setSentTo(p.userId); };
  const accept = () => { if (incoming) lobbyRef.current?.startWith(incoming.fromId, incoming.fromName); };
  const decline = () => { if (incoming) lobbyRef.current?.decline(incoming.fromId); setIncoming(null); };
  const leaveGame = () => { setGameStart(null); setStatus('idle'); lobbyRef.current?.setStatus('idle'); };

  if (gameStart) {
    return <OnlineGame me={me} start={gameStart} onLeave={leaveGame} />;
  }

  const others = players.filter((p) => p.userId !== me.userId);
  const available = others.filter((p) => p.status !== 'playing');

  return (
    <div className="mx-auto max-w-xl">
      <BackLink to="/app/play" label="Play" />
      <PageHeader eyebrow="Online" title="Play online"
        sub="See who’s here and challenge them in real time — casual, unrated games." />

      {/* quick match */}
      <div className="mb-5 rounded-2xl bg-ink p-6 text-white">
        <div className="flex items-center justify-between">
          <div>
            <div className="text-[11px] font-bold uppercase tracking-wider text-gold-soft">Quick match</div>
            <div className="mt-1 font-display text-xl font-black">{status === 'seeking' ? 'Searching for an opponent…' : 'Get paired with anyone online'}</div>
            <div className="mt-1 text-[13px] text-white/60">{others.length} player{others.length === 1 ? '' : 's'} online now</div>
          </div>
          {status === 'seeking'
            ? <button onClick={cancelSeek} className="rounded-full bg-white/15 px-4 py-2 text-sm font-bold">Cancel</button>
            : <button onClick={seek} className="rounded-full bg-white px-4 py-2 text-sm font-bold text-ink">Find opponent →</button>}
        </div>
        {status === 'seeking' && <div className="mt-3 h-1.5 overflow-hidden rounded-full bg-white/10"><div className="h-full w-1/3 animate-pulse rounded-full bg-teal" /></div>}
      </div>

      {/* who's online */}
      <div className="mb-2 flex items-center justify-between">
        <h2 className="font-display text-lg font-black">Who’s online</h2>
        <span className="flex items-center gap-1.5 text-[13px] font-semibold text-ink-soft"><span className="h-2 w-2 rounded-full bg-success" />{others.length + 1} here</span>
      </div>
      <div className="overflow-hidden rounded-2xl border border-line bg-surface">
        <PlayerRow player={{ userId: me.userId, name: `${me.name} (you)`, status }} you />
        {others.length === 0 && <div className="px-4 py-6 text-center text-[13px] text-ink-faint">No one else is online yet. Invite a friend, or use Quick match and we’ll pair you the moment someone joins.</div>}
        {others.map((p) => (
          <PlayerRow key={p.userId} player={p}
            action={p.status === 'playing'
              ? <span className="text-[12px] font-semibold text-ink-faint">In a game</span>
              : sentTo === p.userId
                ? <span className="text-[12px] font-semibold text-teal">Challenge sent…</span>
                : <button onClick={() => challenge(p)} className="rounded-full bg-ink px-3 py-1.5 text-[13px] font-semibold text-white">Challenge</button>}
          />
        ))}
      </div>
      <p className="mt-3 text-[12px] text-ink-faint">Games are peer-to-peer and unrated. Keep this tab open to stay online.</p>

      {/* incoming challenge */}
      {incoming && (
        <div className="fixed inset-0 z-50 grid place-items-center bg-black/40 p-4">
          <div className="w-full max-w-sm rounded-2xl bg-surface p-6 text-center shadow-lift">
            <div className="font-display text-xl font-black">{incoming.fromName} challenges you</div>
            <p className="mt-1 text-[14px] text-ink-soft">A casual game, right now. Ready?</p>
            <div className="mt-5 flex gap-3">
              <button onClick={decline} className="btn-ghost flex-1">Decline</button>
              <button onClick={accept} className="btn-primary flex-1">Accept →</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

function PlayerRow({ player, action, you }: { player: LobbyPlayer; action?: React.ReactNode; you?: boolean }) {
  const dot = player.status === 'playing' ? '#E0B341' : player.status === 'seeking' ? '#1E88E5' : '#2E9E6B';
  const label = player.status === 'playing' ? 'Playing' : player.status === 'seeking' ? 'Looking for a game' : 'Available';
  return (
    <div className={`flex items-center gap-3 border-b border-line px-4 py-3 last:border-b-0 ${you ? 'bg-plaster-2' : ''}`}>
      <span className="grid h-9 w-9 flex-none place-items-center rounded-full bg-ink text-sm font-black text-white">{(player.name || 'P').charAt(0).toUpperCase()}</span>
      <div className="min-w-0 flex-1">
        <div className="truncate font-bold">{player.name}</div>
        <div className="flex items-center gap-1.5 text-[12px] text-ink-faint"><span className="h-2 w-2 rounded-full" style={{ background: dot }} />{label}</div>
      </div>
      {action}
    </div>
  );
}

/* ------------------------------- live game ------------------------------- */

function OnlineGame({ me, start, onLeave }: { me: { userId: string; name: string }; start: GameStart; onLeave: () => void }) {
  const myColor: 'w' | 'b' = start.whiteId === me.userId ? 'w' : 'b';
  const oppName = myColor === 'w' ? start.blackName : start.whiteName;
  const { awardGameResult } = useProgress();

  const gcRef = useRef<GameClient | null>(null);
  const [fen, setFen] = useState('rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR w KQkq - 0 1');
  const [selected, setSelected] = useState<string | null>(null);
  const [highlights, setHighlights] = useState<string[]>([]);
  const [lastMove, setLastMove] = useState<{ from: string; to: string } | null>(null);
  const [over, setOver] = useState<GameOver | null>(null);
  const [oppOnline, setOppOnline] = useState(false);
  const [drawOffer, setDrawOffer] = useState(false);
  const awarded = useRef(false);

  useEffect(() => {
    const gc = new GameClient(start.gameId, me, myColor, {
      onState: (f, _pgn, last) => { setFen(f); setLastMove(last); setSelected(null); setHighlights([]); },
      onOver: (o) => setOver(o),
      onDrawOffer: () => setDrawOffer(true),
      onOpponentPresence: (online) => setOppOnline(online),
    });
    gc.connect();
    gcRef.current = gc;
    return () => { gc.disconnect(); gcRef.current = null; };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [start.gameId]);

  // award XP once when the game ends
  useEffect(() => {
    if (!over || awarded.current) return;
    awarded.current = true;
    const won = (over.result === '1-0' && myColor === 'w') || (over.result === '0-1' && myColor === 'b');
    awardGameResult(won);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [over]);

  const onSquare = useCallback((sq: string) => {
    const gc = gcRef.current;
    if (!gc || over) return;
    const chess = gc.game;
    if (chess.turn() !== myColor) return;
    if (selected) {
      if (legalTargets(chess, selected).includes(sq)) { gc.move(selected, sq); return; }
    }
    if (isOwnPiece(chess, sq) && chess.get(sq as any)?.color === myColor) {
      setSelected(sq); setHighlights(legalTargets(chess, sq));
    } else { setSelected(null); setHighlights([]); }
  }, [selected, myColor, over]);

  const chess = gcRef.current?.game;
  const myTurn = !over && chess?.turn() === myColor;
  const resultLabel = over
    ? over.result === '1/2-1/2' ? 'Draw'
      : (over.result === '1-0' && myColor === 'w') || (over.result === '0-1' && myColor === 'b') ? 'You won' : 'You lost'
    : '';
  const status = over ? `${resultLabel} — ${over.reason}` : chess?.isCheck() ? 'Check!' : myTurn ? 'Your move.' : `Waiting for ${oppName}…`;

  return (
    <div className="mx-auto max-w-xl">
      <button onClick={onLeave} className="mb-4 inline-flex items-center gap-1 text-sm font-semibold text-teal hover:text-teal-deep">‹ Leave game</button>

      <div className="mb-2 flex items-center justify-between">
        <PlayerBar name={oppName} dot={myColor === 'w' ? '#2B2B30' : '#F4F1E8'} active={!over && chess?.turn() !== myColor}
          sub={oppOnline ? 'online' : 'connecting…'} />
      </div>
      <Board fen={fen} onSquarePress={onSquare} selected={selected} highlights={highlights} lastMove={lastMove}
        checkSquare={chess ? checkedKingSquare(chess) : null} flipped={myColor === 'b'} />
      <div className="mt-2 flex items-center justify-between">
        <PlayerBar name={`${me.name} (you)`} dot={myColor === 'w' ? '#F4F1E8' : '#2B2B30'} active={!!myTurn} />
      </div>

      <div className={`mt-3 rounded-xl px-4 py-3 text-center font-semibold ${over ? 'bg-ink text-gold-soft' : 'text-ink-soft'}`}>{status}</div>

      {/* draw offer received */}
      {drawOffer && !over && (
        <div className="mt-3 flex items-center justify-between rounded-xl border border-line bg-plaster-2 px-4 py-3">
          <span className="text-[14px] font-semibold">{oppName} offers a draw.</span>
          <div className="flex gap-2">
            <button onClick={() => setDrawOffer(false)} className="rounded-full px-3 py-1.5 text-[13px] font-semibold text-ink-soft">Decline</button>
            <button onClick={() => { gcRef.current?.acceptDraw(); setDrawOffer(false); }} className="rounded-full bg-ink px-3 py-1.5 text-[13px] font-semibold text-white">Accept draw</button>
          </div>
        </div>
      )}

      <div className="mt-3 flex gap-3">
        {over
          ? <button onClick={onLeave} className="btn-dark flex-1">Back to lobby</button>
          : <>
              <button onClick={() => gcRef.current?.offerDraw()} className="btn-ghost flex-1">Offer draw</button>
              <button onClick={() => gcRef.current?.resign()} className="btn-dark flex-1">Resign</button>
            </>}
      </div>
      {chess && !over && <p className="mt-3 text-center text-[12px] text-ink-faint">{statusText(chess)}</p>}
    </div>
  );
}

function PlayerBar({ name, dot, active, sub }: { name: string; dot: string; active: boolean; sub?: string }) {
  return (
    <div className={`flex items-center gap-2 py-1 ${active ? '' : 'opacity-60'}`}>
      <span className="h-3.5 w-3.5 rounded-full border border-line" style={{ background: dot }} />
      <span className="font-bold">{name}</span>
      {sub && <span className="text-[12px] font-semibold text-ink-faint">· {sub}</span>}
      {active && <span className="ml-1 h-2 w-2 animate-ping rounded-full bg-teal" />}
    </div>
  );
}
