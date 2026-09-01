import { useCallback, useEffect, useRef, useState } from 'react';
import { BackLink, PageHeader } from '@/components/ui';
import { Board } from '@/components/Board';
import { ClockFace } from '@/components/Clock';
import { useAuth } from '@/auth/AuthProvider';
import { usePrefs } from '@/game/prefs';
import { useProgress } from '@/game/progress';
import { fetchRating, upsertProfile, DEFAULT_RATING } from '@/lib/profile';
import { newRating, scoreFor } from '@/lib/elo';
import { timeControlById, isTimed, useChessClock, type TimeControl } from '@/game/clock';
import { legalTargets, isOwnPiece, checkedKingSquare, statusText } from '@shared/game/chessHelpers';
import {
  LobbyClient, GameClient, onlineAvailable,
  type LobbyPlayer, type GameStart, type Challenge, type GameOver,
} from '@/lib/onlinePlay';

type Me = { userId: string; name: string; rating: number; ratedGames: number };

// The time controls offered in the lobby (one per speed) + casual.
const LOBBY_TCS: { id: string; label: string; cat: string }[] = [
  { id: '1+0', label: '1 min', cat: 'Bullet' },
  { id: '3+2', label: '3 | 2', cat: 'Blitz' },
  { id: '10+0', label: '10 min', cat: 'Rapid' },
  { id: 'unlimited', label: 'Casual', cat: 'Unrated' },
];

export function PlayOnline() {
  const { user } = useAuth();
  const { name } = usePrefs();
  const [me, setMe] = useState<Me | null>(null);

  useEffect(() => {
    if (!user?.id) return;
    fetchRating(user.id).then((r) => setMe({
      userId: user.id, name: (name || user.firstName || 'Player').trim(),
      rating: r.rating, ratedGames: r.ratedGames,
    }));
  }, [user?.id, name, user?.firstName]);

  if (!user || !onlineAvailable()) {
    return (
      <div className="mx-auto max-w-xl">
        <BackLink to="/app/play" label="Play" />
        <PageHeader eyebrow="Online" title="Play online" />
        <div className="card p-6 text-ink-soft">Online play needs an account and a connection. Sign in to challenge other players in real time.</div>
      </div>
    );
  }
  if (!me) {
    return <div className="mx-auto max-w-xl"><BackLink to="/app/play" label="Play" /><div className="card p-6 text-ink-soft">Connecting…</div></div>;
  }
  return <OnlineInner me={me} onRating={(rating, ratedGames) => setMe({ ...me, rating, ratedGames })} />;
}

function OnlineInner({ me, onRating }: { me: Me; onRating: (r: number, g: number) => void }) {
  const [players, setPlayers] = useState<LobbyPlayer[]>([]);
  const [status, setStatus] = useState<'idle' | 'seeking' | 'playing'>('idle');
  const [incoming, setIncoming] = useState<Challenge | null>(null);
  const [sentTo, setSentTo] = useState<string | null>(null);
  const [gameStart, setGameStart] = useState<GameStart | null>(null);
  const [tcId, setTcId] = useState('3+2');
  const lobbyRef = useRef<LobbyClient | null>(null);

  useEffect(() => {
    const lobby = new LobbyClient({ userId: me.userId, name: me.name, rating: me.rating }, {
      onPlayers: setPlayers,
      onChallenge: (c) => setIncoming(c),
      onDecline: () => setSentTo(null),
      onStart: (g) => { setIncoming(null); setSentTo(null); setStatus('playing'); setGameStart(g); },
    });
    lobby.setPref(tcId, tcId !== 'unlimited');
    lobby.connect();
    lobbyRef.current = lobby;
    return () => { lobby.disconnect(); lobbyRef.current = null; };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [me.userId]);

  const pickTc = (id: string) => { setTcId(id); lobbyRef.current?.setPref(id, id !== 'unlimited'); };
  const seek = () => { lobbyRef.current?.setPref(tcId, tcId !== 'unlimited'); lobbyRef.current?.setStatus('seeking'); setStatus('seeking'); };
  const cancelSeek = () => { lobbyRef.current?.setStatus('idle'); setStatus('idle'); };
  const challenge = (p: LobbyPlayer) => { lobbyRef.current?.setPref(tcId, tcId !== 'unlimited'); lobbyRef.current?.challenge(p.userId); setSentTo(p.userId); };
  const accept = () => { if (incoming) lobbyRef.current?.startWith(incoming.fromId, incoming.fromName, incoming.rating, incoming.tc, incoming.rated); };
  const decline = () => { if (incoming) lobbyRef.current?.decline(incoming.fromId); setIncoming(null); };
  const leaveGame = () => { setGameStart(null); setStatus('idle'); lobbyRef.current?.setStatus('idle'); };

  if (gameStart) {
    return <OnlineGame me={me} start={gameStart} onLeave={leaveGame} onRating={onRating} />;
  }

  const others = players.filter((p) => p.userId !== me.userId);
  const selTc = LOBBY_TCS.find((t) => t.id === tcId)!;

  return (
    <div className="mx-auto max-w-xl">
      <BackLink to="/app/play" label="Play" />
      <PageHeader eyebrow="Online" title="Play online"
        sub="Pick a time control, get matched, and play rated live games — or challenge anyone in the list." />

      {/* time control picker */}
      <div className="mb-4">
        <div className="mb-2 flex items-center justify-between">
          <p className="eyebrow">Time control</p>
          <span className="text-[12px] font-semibold" style={{ color: tcId === 'unlimited' ? 'var(--tw-prose)' : '#0E7C74' }}>{tcId === 'unlimited' ? 'Unrated' : 'Rated'}</span>
        </div>
        <div className="grid grid-cols-4 gap-2">
          {LOBBY_TCS.map((t) => (
            <button key={t.id} onClick={() => pickTc(t.id)}
              className={`rounded-xl border-2 p-2.5 text-center transition ${tcId === t.id ? 'border-teal bg-teal/5' : 'border-line hover:border-ink-faint'}`}>
              <div className="text-[10px] font-bold uppercase tracking-wide text-ink-faint">{t.cat}</div>
              <div className="font-display text-sm font-black">{t.label}</div>
            </button>
          ))}
        </div>
      </div>

      {/* quick match */}
      <div className="mb-5 rounded-2xl bg-ink p-6 text-white">
        <div className="flex items-center justify-between gap-3">
          <div className="min-w-0">
            <div className="text-[11px] font-bold uppercase tracking-wider text-gold-soft">Quick match · {selTc.cat}</div>
            <div className="mt-1 font-display text-xl font-black">{status === 'seeking' ? 'Searching for an opponent…' : `Play a ${selTc.cat.toLowerCase()} game now`}</div>
            <div className="mt-1 text-[13px] text-white/60">You’re {me.rating}{me.ratedGames < 30 ? '?' : ''} · {others.length} online</div>
          </div>
          {status === 'seeking'
            ? <button onClick={cancelSeek} className="flex-none rounded-full bg-white/15 px-4 py-2 text-sm font-bold">Cancel</button>
            : <button onClick={seek} className="flex-none rounded-full bg-white px-4 py-2 text-sm font-bold text-ink">Find opponent →</button>}
        </div>
        {status === 'seeking' && <div className="mt-3 h-1.5 overflow-hidden rounded-full bg-white/10"><div className="h-full w-1/3 animate-pulse rounded-full bg-teal" /></div>}
      </div>

      {/* who's online */}
      <div className="mb-2 flex items-center justify-between">
        <h2 className="font-display text-lg font-black">Who’s online</h2>
        <span className="flex items-center gap-1.5 text-[13px] font-semibold text-ink-soft"><span className="h-2 w-2 rounded-full bg-success" />{others.length + 1} here</span>
      </div>
      <div className="overflow-hidden rounded-2xl border border-line bg-surface">
        <PlayerRow player={{ userId: me.userId, name: `${me.name} (you)`, status, rating: me.rating }} you />
        {others.length === 0 && <div className="px-4 py-6 text-center text-[13px] text-ink-faint">No one else is online yet. Use Quick match and we’ll pair you the moment someone joins.</div>}
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
      <p className="mt-3 text-[12px] text-ink-faint">Rated games affect your rating. Keep this tab open to stay online.</p>

      {incoming && (
        <div className="fixed inset-0 z-50 grid place-items-center bg-black/40 p-4">
          <div className="w-full max-w-sm rounded-2xl bg-surface p-6 text-center shadow-lift">
            <div className="font-display text-xl font-black">{incoming.fromName} <span className="text-ink-faint">({incoming.rating})</span></div>
            <p className="mt-1 text-[14px] text-ink-soft">challenges you to a {incoming.rated ? 'rated' : 'casual'} {timeControlById(incoming.tc).category.toLowerCase()} game.</p>
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
        <div className="truncate font-bold">{player.name} <span className="font-mono text-[12px] font-semibold text-ink-faint">{player.rating}</span></div>
        <div className="flex items-center gap-1.5 text-[12px] text-ink-faint"><span className="h-2 w-2 rounded-full" style={{ background: dot }} />{label}</div>
      </div>
      {action}
    </div>
  );
}

/* ------------------------------- live game ------------------------------- */

function OnlineGame({ me, start, onLeave, onRating }: { me: Me; start: GameStart; onLeave: () => void; onRating: (r: number, g: number) => void }) {
  const myColor: 'w' | 'b' = start.whiteId === me.userId ? 'w' : 'b';
  const oppName = myColor === 'w' ? start.blackName : start.whiteName;
  const myRating = myColor === 'w' ? start.whiteRating : start.blackRating;
  const oppRating = myColor === 'w' ? start.blackRating : start.whiteRating;
  const tc: TimeControl = timeControlById(start.tc);
  const timed = isTimed(tc);
  const { awardGameResult } = useProgress();

  const gcRef = useRef<GameClient | null>(null);
  const [fen, setFen] = useState('rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR w KQkq - 0 1');
  const [selected, setSelected] = useState<string | null>(null);
  const [highlights, setHighlights] = useState<string[]>([]);
  const [lastMove, setLastMove] = useState<{ from: string; to: string } | null>(null);
  const [over, setOver] = useState<GameOver | null>(null);
  const [oppOnline, setOppOnline] = useState(false);
  const [drawOffer, setDrawOffer] = useState(false);
  const [ratingResult, setRatingResult] = useState<{ delta: number; rating: number } | null>(null);
  const awarded = useRef(false);

  const boardTurn = () => (gcRef.current?.game.turn() ?? 'w');
  const clock = useChessClock(tc, boardTurn(), !!over);

  useEffect(() => {
    const gc = new GameClient(start.gameId, { userId: me.userId, name: me.name }, myColor, {
      onState: (f, _pgn, last) => {
        setFen(f); setLastMove(last); setSelected(null); setHighlights([]);
        if (last) { const mover = gcRef.current!.game.turn() === 'w' ? 'b' : 'w'; clock.press(mover); }
      },
      onOver: (o) => setOver(o),
      onDrawOffer: () => setDrawOffer(true),
      onOpponentPresence: (online) => setOppOnline(online),
    });
    gc.connect();
    gcRef.current = gc;
    return () => { gc.disconnect(); gcRef.current = null; };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [start.gameId]);

  // flag (timeout)
  useEffect(() => {
    if (!clock.flagged || over) return;
    if (clock.flagged === myColor) gcRef.current?.flag();
    else setOver({ result: myColor === 'w' ? '1-0' : '0-1', reason: 'opponent ran out of time' });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [clock.flagged]);

  // settle result once: XP + rating
  useEffect(() => {
    if (!over || awarded.current) return;
    awarded.current = true;
    const won = (over.result === '1-0' && myColor === 'w') || (over.result === '0-1' && myColor === 'b');
    awardGameResult(won);
    if (start.rated) {
      const score = scoreFor(over.result, myColor);
      const { rating, delta } = newRating(myRating, oppRating, score, me.ratedGames);
      setRatingResult({ rating, delta });
      upsertProfile(me.userId, { rating, rated_games: me.ratedGames + 1 }).catch(() => {});
      onRating(rating, me.ratedGames + 1);
    }
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
  const oppMs = myColor === 'w' ? clock.blackMs : clock.whiteMs;
  const myMs = myColor === 'w' ? clock.whiteMs : clock.blackMs;
  const oppRunning = clock.running === (myColor === 'w' ? 'b' : 'w');

  return (
    <div className="mx-auto max-w-xl">
      <button onClick={onLeave} className="mb-4 inline-flex items-center gap-1 text-sm font-semibold text-teal hover:text-teal-deep">‹ Leave game</button>

      {start.rated && <div className="mb-2 inline-block rounded-full bg-teal/10 px-2.5 py-1 text-[11px] font-bold uppercase tracking-wide text-teal">Rated · {tc.category}</div>}

      <div className="mb-2 flex items-center justify-between">
        <PlayerBar name={oppName} rating={oppRating} dot={myColor === 'w' ? '#2B2B30' : '#F4F1E8'} active={!over && chess?.turn() !== myColor} sub={oppOnline ? 'online' : 'connecting…'} />
        {timed && <ClockFace ms={oppMs} active={oppRunning} />}
      </div>
      <Board fen={fen} onSquarePress={onSquare} selected={selected} highlights={highlights} lastMove={lastMove}
        checkSquare={chess ? checkedKingSquare(chess) : null} flipped={myColor === 'b'} />
      <div className="mt-2 flex items-center justify-between">
        <PlayerBar name={`${me.name} (you)`} rating={ratingResult ? ratingResult.rating : myRating} dot={myColor === 'w' ? '#F4F1E8' : '#2B2B30'} active={!!myTurn} />
        {timed && <ClockFace ms={myMs} active={clock.running === myColor} />}
      </div>

      <div className={`mt-3 rounded-xl px-4 py-3 text-center font-semibold ${over ? 'bg-ink text-gold-soft' : 'text-ink-soft'}`}>
        {status}
        {ratingResult && <span className="ml-2 font-mono">{ratingResult.delta >= 0 ? '+' : ''}{ratingResult.delta} → {ratingResult.rating}</span>}
      </div>

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

function PlayerBar({ name, rating, dot, active, sub }: { name: string; rating: number; dot: string; active: boolean; sub?: string }) {
  return (
    <div className={`flex items-center gap-2 py-1 ${active ? '' : 'opacity-60'}`}>
      <span className="h-3.5 w-3.5 rounded-full border border-line" style={{ background: dot }} />
      <span className="font-bold">{name}</span>
      <span className="font-mono text-[12px] font-semibold text-ink-faint">{rating}</span>
      {sub && <span className="text-[12px] font-semibold text-ink-faint">· {sub}</span>}
      {active && <span className="ml-1 h-2 w-2 animate-ping rounded-full bg-teal" />}
    </div>
  );
}
