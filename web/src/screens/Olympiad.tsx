import { useNavigate } from 'react-router-dom';
import { PageHeader, Group, Row } from '@/components/ui';
import { masterGames } from '@shared/data/masters';

export function Olympiad() {
  const nav = useNavigate();
  const featured = masterGames.slice(0, 5);
  return (
    <div>
      <div className="mb-6 overflow-hidden rounded-3xl bg-gradient-to-br from-teal-deep to-teal-deep2 p-7 text-white">
        <p className="eyebrow text-white/70">Samarkand · Uzbekistan · 15–27 Sep 2026</p>
        <h1 className="mt-2 font-display text-3xl font-black sm:text-4xl">46th FIDE Chess Olympiad</h1>
        <p className="mt-3 max-w-xl text-white/80">
          The colours of the Silk Road and the blue-tiled domes of the Registan run through chesshub360.
          During the event, follow the live boards relayed straight from the hall.
        </p>
        <span className="mt-4 inline-flex items-center gap-2 rounded-full bg-white/10 px-3 py-1.5 font-mono text-xs text-white/70">◆ Live boards appear here during the Olympiad</span>
      </div>

      <PageHeader title="Featured games" sub="Classic games to watch, analyse, or play — more arrive live during the event." />
      <Group>
        {featured.map((g) => (
          <Row key={g.id} onClick={() => nav(`/app/masters/${g.id}`)}
            title={g.nickname || `${g.white} vs ${g.black}`}
            subtitle={`${g.event}, ${g.year}`}
            left={<span className="grid h-9 w-11 flex-none place-items-center rounded-lg bg-plaster-2 text-xs font-black text-ink">{g.result === '1/2-1/2' ? '½' : g.result === '1-0' ? '1–0' : '0–1'}</span>} />
        ))}
      </Group>
    </div>
  );
}
