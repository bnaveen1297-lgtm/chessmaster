import { useNavigate } from 'react-router-dom';
import { PageHeader } from '@/components/ui';
import { IconPlay, IconGlobe, IconTrophy } from '@/components/icons';

const MODES = [
  { to: '/app/play/computer', label: 'Play the computer', desc: 'Three engine levels — warm up or grind.', icon: '♟', c: '#5B4BE0' },
  { to: '/app/play/local', label: 'Pass and play', desc: 'Two players, one board, same device.', icon: '♞', c: '#0E9AA7' },
  { to: '/app/tournaments', label: 'Online & tournaments', desc: 'Real-time 1v1 and live events.', icon: '♛', c: '#C8524B' },
];

export function PlayHub() {
  const nav = useNavigate();
  return (
    <div>
      <PageHeader eyebrow="Play" title="Choose your game" sub="Practice offline against the engine, or take on the world." />
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {MODES.map((m) => (
          <button key={m.to} onClick={() => nav(m.to)} className="card p-6 text-left transition hover:-translate-y-1">
            <span className="mb-4 grid h-12 w-12 place-items-center rounded-xl text-2xl text-white" style={{ background: m.c }}>{m.icon}</span>
            <div className="font-display text-lg font-black">{m.label}</div>
            <div className="mt-1 text-[14px] text-ink-soft">{m.desc}</div>
          </button>
        ))}
      </div>
      <div className="mt-6 flex items-center gap-3 rounded-2xl border border-line bg-plaster-2 p-4 text-sm text-ink-soft">
        <IconTrophy className="text-gold" /> Online play & tournaments run on the chesshub360 server — sign-in required, and it's all included free.
      </div>
    </div>
  );
}
