import { Chess } from 'chess.js';
import type { RealtimeChannel } from '@supabase/supabase-js';
import { supabase } from '@/lib/supabase';

/**
 * Chess.com-style online play built entirely on Supabase Realtime — no extra
 * tables and no server code required.
 *
 *  - A single `lobby` channel uses **presence** for "who's online" and
 *    **broadcast** for matchmaking (quick match + direct challenges).
 *  - Each game runs on its own `game:<id>` channel: moves, resign and draw
 *    offers are broadcast peer-to-peer, and chess.js on each client enforces the
 *    rules. A `hello`/`sync` handshake lets a reconnecting player catch up.
 *
 * This is casual (not rating-protected) play: with no authoritative server a
 * determined peer could cheat, which is acceptable for friendly games. The same
 * screens can later point at the server-authoritative `matches` path.
 */

export type Status = 'idle' | 'seeking' | 'playing';
export type LobbyPlayer = { userId: string; name: string; status: Status };
export type GameStart = { gameId: string; whiteId: string; whiteName: string; blackId: string; blackName: string };
export type Challenge = { fromId: string; fromName: string };
export type GameOver = { result: string; reason: string };

export function onlineAvailable(): boolean {
  return !!supabase;
}

function rid(): string {
  return Math.random().toString(36).slice(2, 10) + Date.now().toString(36).slice(-4);
}

/* ------------------------------- lobby ------------------------------- */

export type LobbyHandlers = {
  onPlayers: (players: LobbyPlayer[]) => void;
  onChallenge: (c: Challenge) => void;
  onDecline: () => void;
  onStart: (g: GameStart) => void;
};

export class LobbyClient {
  private ch: RealtimeChannel | null = null;
  private status: Status = 'idle';

  constructor(private me: { userId: string; name: string }, private h: LobbyHandlers) {}

  connect(): void {
    if (!supabase) return;
    const ch = supabase.channel('lobby-v1', {
      config: { presence: { key: this.me.userId }, broadcast: { self: false } },
    });
    ch.on('presence', { event: 'sync' }, () => this.emitPlayers());
    ch.on('broadcast', { event: 'challenge' }, ({ payload }) => {
      if (payload?.toId === this.me.userId) this.h.onChallenge({ fromId: payload.fromId, fromName: payload.fromName || 'Player' });
    });
    ch.on('broadcast', { event: 'decline' }, ({ payload }) => {
      if (payload?.toId === this.me.userId) this.h.onDecline();
    });
    ch.on('broadcast', { event: 'start' }, ({ payload }) => {
      const g = payload as GameStart;
      if (g && (g.whiteId === this.me.userId || g.blackId === this.me.userId)) { this.enterGame(); this.h.onStart(g); }
    });
    ch.subscribe(async (s) => {
      if (s === 'SUBSCRIBED') { await ch.track({ userId: this.me.userId, name: this.me.name, status: this.status }); this.emitPlayers(); }
    });
    this.ch = ch;
  }

  private emitPlayers(): void {
    if (!this.ch) return;
    const state = this.ch.presenceState() as Record<string, any[]>;
    const map = new Map<string, LobbyPlayer>();
    for (const arr of Object.values(state)) {
      for (const m of arr) map.set(m.userId, { userId: m.userId, name: m.name || 'Player', status: m.status || 'idle' });
    }
    const players = [...map.values()];
    this.h.onPlayers(players);
    this.maybeQuickMatch(players);
  }

  async setStatus(s: Status): Promise<void> {
    this.status = s;
    if (this.ch) await this.ch.track({ userId: this.me.userId, name: this.me.name, status: s });
  }

  private enterGame(): void {
    this.status = 'playing';
    this.ch?.track({ userId: this.me.userId, name: this.me.name, status: 'playing' });
  }

  challenge(toId: string): void {
    this.ch?.send({ type: 'broadcast', event: 'challenge', payload: { fromId: this.me.userId, fromName: this.me.name, toId } });
  }
  decline(toId: string): void {
    this.ch?.send({ type: 'broadcast', event: 'decline', payload: { toId } });
  }

  /** Accept a challenge / start a game with a specific player (we host it). */
  startWith(oppId: string, oppName: string): GameStart {
    const g = this.makeStart(oppId, oppName);
    this.announce(g);
    return g;
  }

  private makeStart(oppId: string, oppName: string): GameStart {
    const gameId = rid();
    const meWhite = Math.random() < 0.5;
    return meWhite
      ? { gameId, whiteId: this.me.userId, whiteName: this.me.name, blackId: oppId, blackName: oppName }
      : { gameId, whiteId: oppId, whiteName: oppName, blackId: this.me.userId, blackName: this.me.name };
  }

  private announce(g: GameStart): void {
    this.enterGame();
    this.ch?.send({ type: 'broadcast', event: 'start', payload: g });
    this.h.onStart(g);
  }

  /** When seeking, the lowest-id seeker deterministically pairs with the next. */
  private maybeQuickMatch(players: LobbyPlayer[]): void {
    if (this.status !== 'seeking') return;
    const seekers = players.filter((p) => p.status === 'seeking').sort((a, b) => (a.userId < b.userId ? -1 : 1));
    if (seekers.length < 2 || seekers[0].userId !== this.me.userId) return;
    const partner = seekers[1];
    this.announce(this.makeStart(partner.userId, partner.name));
  }

  disconnect(): void {
    if (this.ch && supabase) supabase.removeChannel(this.ch);
    this.ch = null;
  }
}

/* ------------------------------- game ------------------------------- */

export type GameHandlers = {
  onState: (fen: string, pgn: string, lastMove: { from: string; to: string } | null) => void;
  onOver: (o: GameOver) => void;
  onDrawOffer: () => void;
  onOpponentPresence: (online: boolean) => void;
};

export class GameClient {
  private ch: RealtimeChannel | null = null;
  game = new Chess();

  constructor(
    private gameId: string,
    private me: { userId: string; name: string },
    public myColor: 'w' | 'b',
    private h: GameHandlers,
  ) {}

  connect(): void {
    if (!supabase) return;
    const ch = supabase.channel(`game:${this.gameId}`, {
      config: { presence: { key: this.me.userId }, broadcast: { self: false } },
    });
    ch.on('broadcast', { event: 'move' }, ({ payload }) => this.applyRemote(payload));
    ch.on('broadcast', { event: 'sync' }, ({ payload }) => this.applySync(payload));
    ch.on('broadcast', { event: 'hello' }, () => this.sendSync());
    ch.on('broadcast', { event: 'resign' }, ({ payload }) => {
      const result = payload?.by === 'w' ? '0-1' : '1-0';
      this.h.onOver({ result, reason: 'opponent resigned' });
    });
    ch.on('broadcast', { event: 'draw-offer' }, () => this.h.onDrawOffer());
    ch.on('broadcast', { event: 'draw-accept' }, () => this.h.onOver({ result: '1/2-1/2', reason: 'draw agreed' }));
    ch.on('presence', { event: 'sync' }, () => {
      const state = ch.presenceState() as Record<string, any[]>;
      const ids = Object.values(state).flat().map((m: any) => m.userId);
      this.h.onOpponentPresence(ids.some((id: string) => id && id !== this.me.userId));
    });
    ch.subscribe(async (s) => {
      if (s === 'SUBSCRIBED') {
        await ch.track({ userId: this.me.userId, name: this.me.name });
        ch.send({ type: 'broadcast', event: 'hello', payload: { by: this.me.userId } });
      }
    });
    this.ch = ch;
  }

  /** The local player attempts a move. Returns the move object or null. */
  move(from: string, to: string, promotion?: string): { from: string; to: string } | null {
    if (this.game.turn() !== this.myColor) return null;
    let mv: any;
    try { mv = this.game.move({ from, to, promotion: promotion || 'q' }); } catch { return null; }
    if (!mv) return null;
    this.emit({ from: mv.from, to: mv.to });
    this.ch?.send({ type: 'broadcast', event: 'move', payload: { from: mv.from, to: mv.to, promotion: mv.promotion, fen: this.game.fen(), pgn: this.game.pgn() } });
    this.checkOver();
    return { from: mv.from, to: mv.to };
  }

  private applyRemote(p: any): void {
    if (!p) return;
    let mv: any;
    try { mv = this.game.move({ from: p.from, to: p.to, promotion: p.promotion || 'q' }); } catch { mv = null; }
    if (!mv) { this.applySync(p); return; } // out of sync — fall back to full state
    this.emit({ from: mv.from, to: mv.to });
    this.checkOver();
  }

  private applySync(p: any): void {
    if (!p?.pgn) return;
    try {
      const g = new Chess();
      g.loadPgn(p.pgn);
      // only accept a sync that is at least as advanced as what we have
      if (g.history().length < this.game.history().length) return;
      this.game = g;
      const hist = g.history({ verbose: true });
      const last = hist.length ? hist[hist.length - 1] : null;
      this.emit(last ? { from: last.from, to: last.to } : null);
      this.checkOver();
    } catch { /* ignore malformed sync */ }
  }

  private sendSync(): void {
    if (this.game.history().length === 0) return;
    this.ch?.send({ type: 'broadcast', event: 'sync', payload: { fen: this.game.fen(), pgn: this.game.pgn() } });
  }

  private emit(last: { from: string; to: string } | null): void {
    this.h.onState(this.game.fen(), this.game.pgn(), last);
  }

  private checkOver(): void {
    const g = this.game;
    if (!g.isGameOver()) return;
    if (g.isCheckmate()) { this.h.onOver({ result: g.turn() === 'w' ? '0-1' : '1-0', reason: 'checkmate' }); return; }
    const reason = g.isStalemate() ? 'stalemate'
      : g.isInsufficientMaterial() ? 'insufficient material'
      : g.isThreefoldRepetition() ? 'threefold repetition'
      : 'fifty-move rule';
    this.h.onOver({ result: '1/2-1/2', reason });
  }

  resign(): void {
    const result = this.myColor === 'w' ? '0-1' : '1-0';
    this.ch?.send({ type: 'broadcast', event: 'resign', payload: { by: this.myColor } });
    this.h.onOver({ result, reason: 'you resigned' });
  }
  offerDraw(): void {
    this.ch?.send({ type: 'broadcast', event: 'draw-offer', payload: { by: this.myColor } });
  }
  acceptDraw(): void {
    this.ch?.send({ type: 'broadcast', event: 'draw-accept', payload: {} });
    this.h.onOver({ result: '1/2-1/2', reason: 'draw agreed' });
  }

  disconnect(): void {
    if (this.ch && supabase) supabase.removeChannel(this.ch);
    this.ch = null;
  }
}
