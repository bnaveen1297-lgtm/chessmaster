import { Chess } from 'chess.js';

/**
 * Browser Stockfish driver (Stockfish 10, classical eval, single-threaded WASM
 * — self-contained, no SharedArrayBuffer, no external network file). The engine
 * runs in a Web Worker and speaks UCI; this wraps it in a small async API.
 *
 * Assets are served from /engine/ (see web/public/engine). Stockfish is
 * GPL-3.0 — see /engine/LICENSE-stockfish.txt.
 */

const BASE = '/engine/';

/** A mate score is mapped to this large centipawn magnitude (side-to-move POV). */
export const MATE_CP = 100_000;

export type EngineLine = {
  /** Score in centipawns from the side-to-move's perspective (mate mapped to ±MATE_CP). */
  cp: number;
  /** First move of this line, in UCI (e.g. "e2e4", "e7e8q"). */
  firstUci: string | null;
};

export type EvalResult = {
  /** Lines ordered best-first (length ≤ requested MultiPV). */
  lines: EngineLine[];
  /** Convenience: best line's score (side-to-move POV). */
  cp: number;
  /** Convenience: best move in UCI. */
  bestUci: string | null;
};

function wasmSupported(): boolean {
  try {
    return (
      typeof WebAssembly === 'object' &&
      WebAssembly.validate(Uint8Array.of(0x0, 0x61, 0x73, 0x6d, 0x01, 0x00, 0x00, 0x00))
    );
  } catch {
    return false;
  }
}

export class StockfishEngine {
  private worker: Worker | null = null;
  private ready = false;
  private onLine: ((line: string) => void) | null = null;

  /** Boot the worker and complete the UCI handshake. Safe to call once. */
  async init(): Promise<void> {
    if (this.ready) return;
    const url = BASE + (wasmSupported() ? 'stockfish.wasm.js' : 'stockfish.js');
    this.worker = new Worker(url);
    this.worker.onmessage = (e: MessageEvent) => {
      const line = typeof e.data === 'string' ? e.data : (e.data && e.data.data) || '';
      if (line) this.onLine?.(line);
    };
    await this.command('uci', (l) => l.startsWith('uciok'));
    await this.command('isready', (l) => l.startsWith('readyok'));
    this.ready = true;
  }

  private post(cmd: string) {
    this.worker?.postMessage(cmd);
  }

  /** Send a command and resolve once `done(line)` returns true for some line. */
  private command(cmd: string, done: (line: string) => boolean, timeoutMs = 15_000): Promise<string[]> {
    return new Promise((resolve, reject) => {
      const lines: string[] = [];
      const timer = setTimeout(() => {
        this.onLine = null;
        reject(new Error(`Stockfish timed out on "${cmd}"`));
      }, timeoutMs);
      this.onLine = (line: string) => {
        lines.push(line);
        if (done(line)) {
          clearTimeout(timer);
          this.onLine = null;
          resolve(lines);
        }
      };
      this.post(cmd);
    });
  }

  /**
   * Evaluate `fen` to a fixed depth. Returns up to `multipv` lines, best first,
   * with scores from the side-to-move's perspective.
   */
  async evaluate(fen: string, opts: { depth?: number; multipv?: number } = {}): Promise<EvalResult> {
    if (!this.ready) await this.init();
    const depth = opts.depth ?? 12;
    const multipv = opts.multipv ?? 2;

    this.post(`setoption name MultiPV value ${multipv}`);
    this.post(`position fen ${fen}`);
    // Best (deepest) info line seen per MultiPV index.
    const byPv = new Map<number, EngineLine>();
    const lastDepth = new Map<number, number>();

    const lines = await this.command(`go depth ${depth}`, (l) => l.startsWith('bestmove'), 60_000);
    for (const l of lines) {
      if (!l.startsWith('info') || !l.includes(' pv ')) continue;
      const pvIdx = /multipv (\d+)/.exec(l);
      const idx = pvIdx ? Number(pvIdx[1]) : 1;
      const d = Number(/ depth (\d+)/.exec(l)?.[1] ?? 0);
      if ((lastDepth.get(idx) ?? -1) > d) continue; // keep the deepest
      const cp = parseScore(l);
      if (cp === null) continue;
      const firstUci = / pv (\S+)/.exec(l)?.[1] ?? null;
      byPv.set(idx, { cp, firstUci });
      lastDepth.set(idx, d);
    }

    const ordered = [...byPv.entries()].sort((a, b) => a[0] - b[0]).map(([, v]) => v);
    // Fallback: if no info lines carried a score (very short searches), use bestmove.
    if (ordered.length === 0) {
      const bm = /bestmove (\S+)/.exec(lines[lines.length - 1] ?? '')?.[1] ?? null;
      return { lines: [{ cp: 0, firstUci: bm }], cp: 0, bestUci: bm };
    }
    return { lines: ordered, cp: ordered[0].cp, bestUci: ordered[0].firstUci };
  }

  quit() {
    try {
      this.post('quit');
      this.worker?.terminate();
    } catch {
      /* ignore */
    }
    this.worker = null;
    this.ready = false;
  }
}

/** Parse a UCI `info` line's score into centipawns (side-to-move POV). */
function parseScore(line: string): number | null {
  const mate = /score mate (-?\d+)/.exec(line);
  if (mate) {
    const n = Number(mate[1]);
    if (n === 0) return -MATE_CP; // side to move is mated
    return n > 0 ? MATE_CP - n : -MATE_CP - n;
  }
  const cp = /score cp (-?\d+)/.exec(line);
  if (cp) return Number(cp[1]);
  return null;
}

/** Convert a UCI move (e.g. "e2e4", "e7e8q") to SAN for the given FEN. */
export function uciToSan(fen: string, uci: string | null): string {
  if (!uci) return '';
  try {
    const g = new Chess(fen);
    const mv = g.move({
      from: uci.slice(0, 2),
      to: uci.slice(2, 4),
      promotion: uci.length > 4 ? uci[4] : undefined,
    });
    return mv?.san ?? '';
  } catch {
    return '';
  }
}
