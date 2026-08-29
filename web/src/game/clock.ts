import { useEffect, useMemo, useRef, useState } from 'react';

/**
 * Chess time controls + a real, drift-free countdown clock.
 *
 * A time control is an initial budget plus a per-move increment (Fischer). The
 * app groups them the way players expect — Bullet / Blitz / Rapid — plus an
 * "Unlimited" mode that keeps the pre-clock behaviour (no timer, no flag).
 */
export type TimeCategory = 'Unlimited' | 'Bullet' | 'Blitz' | 'Rapid';

export type TimeControl = {
  id: string;
  label: string;
  category: TimeCategory;
  /** Starting time per side, in seconds. 0 ⇒ untimed. */
  initialSec: number;
  /** Fischer increment added after each completed move, in seconds. */
  incrementSec: number;
};

export const TIME_CONTROLS: TimeControl[] = [
  { id: 'unlimited', label: 'Unlimited', category: 'Unlimited', initialSec: 0, incrementSec: 0 },
  { id: '1+0', label: '1 + 0', category: 'Bullet', initialSec: 60, incrementSec: 0 },
  { id: '2+1', label: '2 + 1', category: 'Bullet', initialSec: 120, incrementSec: 1 },
  { id: '3+0', label: '3 + 0', category: 'Blitz', initialSec: 180, incrementSec: 0 },
  { id: '3+2', label: '3 + 2', category: 'Blitz', initialSec: 180, incrementSec: 2 },
  { id: '5+0', label: '5 + 0', category: 'Blitz', initialSec: 300, incrementSec: 0 },
  { id: '10+0', label: '10 + 0', category: 'Rapid', initialSec: 600, incrementSec: 0 },
  { id: '15+10', label: '15 + 10', category: 'Rapid', initialSec: 900, incrementSec: 10 },
];

export const DEFAULT_TIME_CONTROL = TIME_CONTROLS[0];

export function timeControlById(id: string): TimeControl {
  return TIME_CONTROLS.find((t) => t.id === id) ?? DEFAULT_TIME_CONTROL;
}

export function isTimed(tc: TimeControl): boolean {
  return tc.initialSec > 0;
}

/** Format remaining milliseconds as a clock reads: m:ss, or ss.d under 20s. */
export function formatClock(ms: number): string {
  const clamped = Math.max(0, ms);
  if (clamped < 20_000) {
    const s = Math.floor(clamped / 1000);
    const d = Math.floor((clamped % 1000) / 100);
    return `${s}.${d}`;
  }
  const total = Math.ceil(clamped / 1000);
  const m = Math.floor(total / 60);
  const s = total % 60;
  return `${m}:${String(s).padStart(2, '0')}`;
}

export type Color = 'w' | 'b';

// ---------------------------------------------------------------------------
// Pure clock model — the arithmetic, isolated from React so it can be tested
// and reasoned about on its own. The hook below is a thin wrapper over these.
// ---------------------------------------------------------------------------

export type ClockState = {
  whiteMs: number;
  blackMs: number;
  flagged: Color | null;
  /** True once the first move has been made (White's clock is "free" until then). */
  started: boolean;
};

export function initClock(tc: TimeControl): ClockState {
  return { whiteMs: tc.initialSec * 1000, blackMs: tc.initialSec * 1000, flagged: null, started: false };
}

/** Whose clock counts down right now, given the side to move and game status. */
export function runningSide(
  s: ClockState,
  tc: TimeControl,
  toMove: Color,
  gameOver: boolean,
): Color | null {
  if (!isTimed(tc) || s.flagged || gameOver || !s.started) return null;
  return toMove;
}

/** Advance `dtMs` of real time against the running side; may set a flag. */
export function tickClock(s: ClockState, running: Color | null, dtMs: number): ClockState {
  if (!running || s.flagged || dtMs <= 0) return s;
  if (running === 'w') {
    const next = Math.max(0, s.whiteMs - dtMs);
    return { ...s, whiteMs: next, flagged: next <= 0 ? 'w' : s.flagged };
  }
  const next = Math.max(0, s.blackMs - dtMs);
  return { ...s, blackMs: next, flagged: next <= 0 ? 'b' : s.flagged };
}

/** Record a completed move by `mover`: start the clock and add the increment. */
export function pressClock(s: ClockState, mover: Color, tc: TimeControl): ClockState {
  if (!isTimed(tc) || s.flagged) return s;
  const inc = tc.incrementSec * 1000;
  const started = true;
  if (inc <= 0) return { ...s, started };
  return mover === 'w'
    ? { ...s, started, whiteMs: s.whiteMs + inc }
    : { ...s, started, blackMs: s.blackMs + inc };
}

// ---------------------------------------------------------------------------
// React hook
// ---------------------------------------------------------------------------

export type ChessClock = {
  whiteMs: number;
  blackMs: number;
  /** Which side's clock is currently counting down, or null when idle. */
  running: Color | null;
  /** The side that ran out of time, or null. */
  flagged: Color | null;
  /** True once at least one move has been made. */
  started: boolean;
  /** Record that `mover` has just completed a move (increment + hand over). */
  press: (mover: Color) => void;
  /** Reset to a fresh game for the given (or current) time control. */
  reset: (tc?: TimeControl) => void;
};

/**
 * A countdown clock driven by wall-clock time (so it never drifts even if the
 * tab is throttled). The hosting screen owns the chess rules; it only needs to
 * call `press(color)` after each completed move and read the remaining time.
 *
 * White's clock does not start until the first move is played — the player on
 * move isn't punished for reading the board before the game truly begins.
 *
 * @param tc        the active time control
 * @param toMove    the side to move right now (drives which clock ticks)
 * @param gameOver  true when the game has ended by board rules (checkmate, …)
 * @param onFlag    called once, with the side whose time expired
 */
export function useChessClock(
  tc: TimeControl,
  toMove: Color,
  gameOver: boolean,
  onFlag?: (loser: Color) => void,
): ChessClock {
  const timed = isTimed(tc);
  const [state, setState] = useState<ClockState>(() => initClock(tc));

  const running = runningSide(state, tc, toMove, gameOver);

  // Refs so the animation loop reads fresh values without re-subscribing.
  const stateRef = useRef(state);
  const runningRef = useRef(running);
  const onFlagRef = useRef(onFlag);
  stateRef.current = state;
  runningRef.current = running;
  onFlagRef.current = onFlag;

  // Re-arm the budget whenever the time control changes.
  useEffect(() => {
    setState(initClock(tc));
  }, [tc.id, tc.initialSec]);

  const press = useMemo(
    () => (mover: Color) => setState((s) => pressClock(s, mover, tc)),
    [tc],
  );
  const reset = useMemo(
    () => (next?: TimeControl) => setState(initClock(next ?? tc)),
    [tc],
  );

  // Wall-clock-driven tick loop.
  useEffect(() => {
    if (!timed) return;
    let raf = 0;
    let last = performance.now();
    const loop = () => {
      const now = performance.now();
      const dt = now - last;
      last = now;
      const before = stateRef.current;
      const after = tickClock(before, runningRef.current, dt);
      if (after !== before) {
        setState(after);
        if (after.flagged && !before.flagged) onFlagRef.current?.(after.flagged);
      }
      raf = requestAnimationFrame(loop);
    };
    raf = requestAnimationFrame(loop);
    return () => cancelAnimationFrame(raf);
  }, [timed]);

  return {
    whiteMs: state.whiteMs,
    blackMs: state.blackMs,
    running,
    flagged: state.flagged,
    started: state.started,
    press,
    reset,
  };
}
