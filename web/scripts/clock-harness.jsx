import React from 'react';
import { createRoot } from 'react-dom/client';
import { useChessClock, formatClock } from '../src/game/clock.ts';

// A fast 2s + 0.5s-increment control so flag fall is observable in a test.
const FAST = { id: 'fast', label: 'fast', category: 'Bullet', initialSec: 2, incrementSec: 0 };

function Harness() {
  const [turn, setTurn] = React.useState('w');
  const [over, setOver] = React.useState(false);
  const clock = useChessClock(FAST, turn, over, (loser) => setOver(true));
  const move = () => {
    clock.press(turn);
    setTurn((t) => (t === 'w' ? 'b' : 'w'));
  };
  return (
    <div style={{ fontFamily: 'monospace', padding: 20 }}>
      <div id="white" data-ms={clock.whiteMs}>white {formatClock(clock.whiteMs)}</div>
      <div id="black" data-ms={clock.blackMs}>black {formatClock(clock.blackMs)}</div>
      <div id="running">running {String(clock.running)}</div>
      <div id="flagged">flagged {String(clock.flagged)}</div>
      <div id="started">started {String(clock.started)}</div>
      <button id="move" onClick={move}>move</button>
    </div>
  );
}

createRoot(document.getElementById('root')).render(<Harness />);
