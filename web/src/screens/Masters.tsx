import { useCallback, useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { PageHeader, Group, Row } from '@/components/ui';
import { masterGames, masterThemes, type MasterTheme, type MasterGame } from '@shared/data/masters';
import { masterDbAvailable, fetchRandomMasterGames } from '@shared/services/masterDb';

export function Masters() {
  const nav = useNavigate();
  const [filter, setFilter] = useState<MasterTheme | 'All'>('All');
  const games = useMemo(() => (filter === 'All' ? masterGames : masterGames.filter((g) => g.themes.includes(filter))), [filter]);
  const short = (n: string) => n.split(' ').pop();

  const hasDb = masterDbAvailable();
  const [dbGames, setDbGames] = useState<MasterGame[]>([]);
  const [dbLoading, setDbLoading] = useState(false);
  const [dbErr, setDbErr] = useState(false);

  const shuffle = useCallback(async () => {
    setDbLoading(true); setDbErr(false);
    try { setDbGames(await fetchRandomMasterGames(12, 2400)); }
    catch { setDbErr(true); setDbGames([]); }
    finally { setDbLoading(false); }
  }, []);
  useEffect(() => { if (hasDb) shuffle(); }, [hasDb, shuffle]);

  const openDb = (g: MasterGame) => nav(`/app/masters/${g.id}`, { state: { game: g } });

  return (
    <div>
      <PageHeader eyebrow="Master Base" title="Play the legends"
        sub="Watch famous grandmaster games, run an engine review, or play against the master's real moves." />

      {hasDb && (
        <div className="mb-6">
          <div className="mb-2 flex items-center justify-between">
            <h2 className="font-display text-lg font-black">Millions of games</h2>
            <button onClick={shuffle} className="text-sm font-semibold text-teal">↻ Shuffle</button>
          </div>
          {dbLoading ? (
            <p className="text-sm text-ink-soft">Loading…</p>
          ) : dbGames.length === 0 ? (
            <div className="rounded-2xl border border-line bg-plaster-2 p-4 text-sm text-ink-soft">
              {dbErr ? 'Could not reach the games database.' : 'No games loaded yet — import a master-games collection into Supabase (docs/PUZZLES.md), then Shuffle.'}
            </div>
          ) : (
            <Group>
              {dbGames.map((g) => (
                <Row key={g.id} onClick={() => openDb(g)}
                  title={`${short(g.white)} vs ${short(g.black)}`}
                  subtitle={`${g.opening}${g.year ? ` · ${g.year}` : ''}`}
                  left={<span className="grid h-9 w-11 flex-none place-items-center rounded-lg bg-plaster-2 text-xs font-black text-ink">{g.result === '1/2-1/2' ? '½' : g.result === '1-0' ? '1–0' : '0–1'}</span>} />
              ))}
            </Group>
          )}
        </div>
      )}

      <h2 className="mb-2 font-display text-lg font-black">{hasDb ? 'Featured classics' : 'Classic games'}</h2>
      <div className="mb-4 flex flex-wrap gap-2">
        {(['All', ...masterThemes] as (MasterTheme | 'All')[]).map((c) => (
          <button key={c} onClick={() => setFilter(c)} className={`chip ${filter === c ? 'bg-ink text-white' : 'bg-plaster-2 text-ink-soft'}`}>{c}</button>
        ))}
      </div>
      <Group>
        {games.map((g) => (
          <Row key={g.id} onClick={() => nav(`/app/masters/${g.id}`)}
            title={g.nickname || `${short(g.white)} vs ${short(g.black)}`}
            subtitle={`${short(g.white)} – ${short(g.black)} · ${g.event}, ${g.year}`}
            left={<span className="grid h-9 w-11 flex-none place-items-center rounded-lg bg-plaster-2 text-xs font-black text-ink">{g.result === '1/2-1/2' ? '½' : g.result === '1-0' ? '1–0' : '0–1'}</span>} />
        ))}
        {games.length === 0 && <Row title="No games in this category yet" chevron={false} />}
      </Group>
    </div>
  );
}
