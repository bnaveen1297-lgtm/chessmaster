// Unit tests for the pure chess-clock model (the real code the hook delegates
// to). Run: node scripts/test-clock.mjs  (bundles the TS via esbuild first).
import { build } from 'esbuild';
import { fileURLToPath } from 'node:url';
import path from 'node:path';
import assert from 'node:assert/strict';

const here = path.dirname(fileURLToPath(import.meta.url));
const entry = path.join(here, '..', 'src', 'game', 'clock.ts');

// Bundle only the pure model. The hook isn't exercised here, so resolve 'react'
// to a stub of no-op hooks (keeps the bundle self-contained for a data: import).
const reactStub = {
  name: 'react-stub',
  setup(b) {
    b.onResolve({ filter: /^react$/ }, () => ({ path: 'react', namespace: 'stub' }));
    b.onLoad({ filter: /.*/, namespace: 'stub' }, () => ({
      contents: 'export const useEffect=()=>{};export const useMemo=(f)=>f();export const useRef=(v)=>({current:v});export const useState=(v)=>[typeof v==="function"?v():v,()=>{}];',
      loader: 'js',
    }));
  },
};
const out = await build({
  entryPoints: [entry],
  bundle: true,
  format: 'esm',
  write: false,
  plugins: [reactStub],
  logLevel: 'silent',
});
const code = out.outputFiles[0].text;
const mod = await import('data:text/javascript;base64,' + Buffer.from(code).toString('base64'));

const {
  TIME_CONTROLS, timeControlById, isTimed, formatClock,
  initClock, runningSide, tickClock, pressClock,
} = mod;

let passed = 0;
const ok = (name, fn) => { fn(); passed++; console.log('  ✓', name); };

console.log('formatClock');
ok('minutes:seconds above 20s', () => {
  assert.equal(formatClock(600_000), '10:00');
  assert.equal(formatClock(65_000), '1:05');
  assert.equal(formatClock(20_000), '0:20');
});
ok('tenths under 20s', () => {
  assert.equal(formatClock(19_900), '19.9');
  assert.equal(formatClock(5_400), '5.4');
  assert.equal(formatClock(0), '0.0');
  assert.equal(formatClock(-50), '0.0'); // never negative
});

console.log('presets');
ok('all categories present & well-formed', () => {
  assert.equal(timeControlById('unlimited').initialSec, 0);
  assert.equal(isTimed(timeControlById('unlimited')), false);
  assert.equal(isTimed(timeControlById('5+0')), true);
  assert.equal(timeControlById('3+2').initialSec, 180);
  assert.equal(timeControlById('3+2').incrementSec, 2);
  assert.equal(timeControlById('15+10').incrementSec, 10);
  for (const c of ['Bullet', 'Blitz', 'Rapid'])
    assert.ok(TIME_CONTROLS.some((t) => t.category === c), `has ${c}`);
});

console.log('clock lifecycle (Blitz 3+2)');
const tc = timeControlById('3+2');
ok('starts idle, both sides full, white "free" before first move', () => {
  const s = initClock(tc);
  assert.equal(s.whiteMs, 180_000);
  assert.equal(s.blackMs, 180_000);
  assert.equal(s.started, false);
  // Not started ⇒ nobody ticks even though it's White to move.
  assert.equal(runningSide(s, tc, 'w', false), null);
});
ok('white clock runs only after first move; increment applied to mover', () => {
  let s = initClock(tc);
  s = pressClock(s, 'w', tc);              // White completes move 1 (+2s)
  assert.equal(s.started, true);
  assert.equal(s.whiteMs, 182_000);        // increment added
  assert.equal(runningSide(s, tc, 'b', false), 'b'); // now Black ticks
  s = tickClock(s, 'b', 3_000);            // Black spends 3s
  assert.equal(s.blackMs, 177_000);
  s = pressClock(s, 'b', tc);              // Black moves (+2s)
  assert.equal(s.blackMs, 179_000);
});
ok('flag fall sets loser and clamps to zero', () => {
  let s = { ...initClock(tc), started: true };
  s = tickClock(s, 'w', 179_000);
  assert.equal(s.flagged, null);
  s = tickClock(s, 'w', 2_000);            // overshoot past 0
  assert.equal(s.whiteMs, 0);
  assert.equal(s.flagged, 'w');
  // Once flagged, further ticks and presses are no-ops.
  const frozen = tickClock(s, 'w', 5_000);
  assert.equal(frozen, s);
  assert.equal(pressClock(s, 'b', tc).blackMs, 180_000);
});

console.log('unlimited mode');
ok('never ticks, never flags', () => {
  const u = timeControlById('unlimited');
  let s = initClock(u);
  s = pressClock(s, 'w', u);
  // Untimed ⇒ no side ever runs, so tick is a no-op and no flag can fall.
  assert.equal(runningSide(s, u, 'b', false), null);
  const after = tickClock(s, runningSide(s, u, 'b', false), 999_999);
  assert.equal(after, s);
  assert.equal(after.flagged, null);
});

console.log(`\n${passed} clock assertions passed ✓`);
