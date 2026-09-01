import { useEffect, useState } from 'react';
import { PageHeader, Group, Row } from '@/components/ui';
import { listTournaments, createTournament, joinTournament, tournamentsAvailable, type Tournament } from '@shared/services/tournaments';
import { listOpenMatches, createOpenMatch, joinMatch, type Match } from '@shared/services/online';

export function Tournaments() {
  const available = tournamentsAvailable();
  const [tours, setTours] = useState<Tournament[]>([]);
  const [matches, setMatches] = useState<Match[]>([]);
  const [loading, setLoading] = useState(true);
  const [err, setErr] = useState<string | null>(null);
  const [name, setName] = useState('');
  const [format, setFormat] = useState<'roundrobin' | 'knockout' | 'swiss'>('swiss');
  const [tc, setTc] = useState('10+0');
  const [busy, setBusy] = useState(false);

  const FORMATS: { id: 'roundrobin' | 'knockout' | 'swiss'; label: string }[] = [
    { id: 'swiss', label: 'Swiss' }, { id: 'roundrobin', label: 'Round-robin' }, { id: 'knockout', label: 'Knockout' },
  ];
  const TCS: { id: string; label: string }[] = [
    { id: '3+2', label: 'Blitz 3+2' }, { id: '5+0', label: 'Blitz 5' }, { id: '10+0', label: 'Rapid 10' }, { id: '15+10', label: 'Rapid 15+10' }, { id: 'unlimited', label: 'Untimed' },
  ];
  const fmtLabel = (f: string) => FORMATS.find((x) => x.id === f)?.label ?? f;
  const tcLabel = (id: string) => TCS.find((x) => x.id === id)?.label ?? id;

  const refresh = async () => {
    setLoading(true); setErr(null);
    try {
      const [t, m] = await Promise.all([listTournaments(), listOpenMatches()]);
      setTours(t); setMatches(m);
    } catch (e: any) { setErr(e?.message || 'Could not load.'); }
    finally { setLoading(false); }
  };
  useEffect(() => { if (available) refresh(); else setLoading(false); }, [available]);

  const create = async () => {
    if (!name.trim()) return;
    setBusy(true); setErr(null);
    try { await createTournament({ name: name.trim(), format, maxPlayers: 8, timeControl: tc }); setName(''); await refresh(); }
    catch (e: any) { setErr(e?.message || 'Could not create.'); }
    finally { setBusy(false); }
  };

  return (
    <div>
      <PageHeader eyebrow="Compete" title="Online play & tournaments"
        sub="Real-time events — Swiss, round-robin or knockout, at the time control you choose — on the chesshub360 server." />

      {/* quick online match */}
      <div className="mb-6 flex flex-col gap-3 rounded-2xl border border-line bg-plaster-2 p-5 sm:flex-row sm:items-center sm:justify-between">
        <div><div className="font-display text-lg font-black">Play someone now</div><div className="text-sm text-ink-soft">Create an open challenge or join a waiting game.</div></div>
        <button onClick={async () => { setBusy(true); try { await createOpenMatch(); await refresh(); } catch (e: any) { setErr(e?.message); } finally { setBusy(false); } }}
          disabled={busy} className="btn-primary">Create a game</button>
      </div>

      {err && <p className="mb-4 rounded-xl bg-danger/10 px-4 py-3 text-sm font-semibold text-danger">{err}</p>}

      {loading ? (
        <p className="text-ink-soft">Loading…</p>
      ) : (
        <>
          {matches.length > 0 && (
            <>
              <h2 className="mb-2 font-display text-lg font-black">Open games</h2>
              <Group>
                {matches.map((m) => (
                  <Row key={m.id} title={`Game · ${m.time_control}`} subtitle="Waiting for an opponent"
                    onClick={async () => { try { await joinMatch(m.id); await refresh(); } catch (e: any) { setErr(e?.message); } }}
                    right={<span className="text-sm font-semibold text-teal">Join</span>} chevron={false} />
                ))}
              </Group>
            </>
          )}

          <h2 className="mb-2 mt-6 font-display text-lg font-black">Tournaments</h2>
          <div className="mb-4 rounded-2xl border border-line bg-surface p-4 shadow-soft">
            <input value={name} onChange={(e) => setName(e.target.value)} placeholder="Tournament name"
              className="mb-3 w-full rounded-xl border border-line bg-plaster px-4 py-2.5 outline-none focus:border-teal" />
            <div className="mb-1 text-[11px] font-bold uppercase tracking-wide text-ink-faint">Format</div>
            <div className="mb-3 flex flex-wrap gap-1 rounded-lg bg-plaster-2 p-1">
              {FORMATS.map((f) => (
                <button key={f.id} onClick={() => setFormat(f.id)} className={`rounded-md px-3 py-1.5 text-sm font-semibold ${format === f.id ? 'bg-ink text-white' : 'text-ink-soft'}`}>{f.label}</button>
              ))}
            </div>
            <div className="mb-1 text-[11px] font-bold uppercase tracking-wide text-ink-faint">Time control</div>
            <div className="mb-3 flex flex-wrap gap-1 rounded-lg bg-plaster-2 p-1">
              {TCS.map((t) => (
                <button key={t.id} onClick={() => setTc(t.id)} className={`rounded-md px-3 py-1.5 text-sm font-semibold ${tc === t.id ? 'bg-ink text-white' : 'text-ink-soft'}`}>{t.label}</button>
              ))}
            </div>
            <button onClick={create} disabled={busy || !name.trim()} className="btn-primary w-full sm:w-auto">Create tournament</button>
          </div>

          {tours.length === 0 ? (
            <p className="text-ink-soft">No tournaments yet — create the first one.</p>
          ) : (
            <Group>
              {tours.map((t) => (
                <Row key={t.id} title={t.name} subtitle={`${fmtLabel(t.format)} · ${tcLabel(t.time_control || 'unlimited')} · ${t.status}`}
                  onClick={async () => { try { await joinTournament(t.id); await refresh(); } catch (e: any) { setErr(e?.message); } }}
                  right={<span className="text-sm font-semibold text-teal">Join</span>} chevron={false} />
              ))}
            </Group>
          )}
        </>
      )}
    </div>
  );
}
