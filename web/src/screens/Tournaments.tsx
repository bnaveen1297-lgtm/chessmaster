import { useEffect, useState } from 'react';
import { PageHeader, Group, Row } from '@/components/ui';
import { useAuth } from '@/auth/AuthProvider';
import { listTournaments, createTournament, joinTournament, tournamentsAvailable, type Tournament } from '@shared/services/tournaments';
import { listOpenMatches, createOpenMatch, joinMatch, type Match } from '@shared/services/online';

export function Tournaments() {
  const { user, signOut } = useAuth();
  const isGuest = !user || user.id === 'guest';
  const available = tournamentsAvailable();
  const [tours, setTours] = useState<Tournament[]>([]);
  const [matches, setMatches] = useState<Match[]>([]);
  const [loading, setLoading] = useState(true);
  const [err, setErr] = useState<string | null>(null);
  const [name, setName] = useState('');
  const [format, setFormat] = useState<'roundrobin' | 'knockout'>('roundrobin');
  const [busy, setBusy] = useState(false);

  const refresh = async () => {
    setLoading(true); setErr(null);
    try {
      const [t, m] = await Promise.all([listTournaments(), listOpenMatches()]);
      setTours(t); setMatches(m);
    } catch (e: any) { setErr(e?.message || 'Could not load.'); }
    finally { setLoading(false); }
  };
  useEffect(() => { if (available && !isGuest) refresh(); else setLoading(false); }, [available, isGuest]);

  if (isGuest) {
    return (
      <div>
        <PageHeader eyebrow="Compete" title="Online play & tournaments"
          sub="Real-time 1v1 games and events — round-robin or knockout." />
        <div className="rounded-2xl border border-line bg-surface p-8 text-center shadow-soft">
          <div className="mx-auto mb-4 grid h-14 w-14 place-items-center rounded-2xl bg-teal/10 text-2xl">♟</div>
          <h2 className="font-display text-xl font-black">Sign in to play the world</h2>
          <p className="mx-auto mt-2 max-w-md text-ink-soft">
            Online 1v1 games and tournaments run on the chesshub360 server, so they need an account.
            Everything else — learning, puzzles, master games and playing the computer — works in guest mode.
          </p>
          <button onClick={signOut} className="btn-primary mt-5">Create a free account</button>
        </div>
      </div>
    );
  }

  const create = async () => {
    if (!name.trim()) return;
    setBusy(true); setErr(null);
    try { await createTournament({ name: name.trim(), format, maxPlayers: 8 }); setName(''); await refresh(); }
    catch (e: any) { setErr(e?.message || 'Could not create.'); }
    finally { setBusy(false); }
  };

  return (
    <div>
      <PageHeader eyebrow="Compete" title="Online play & tournaments"
        sub="Real-time 1v1 games and events — round-robin or knockout — on the chesshub360 server." />

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
            <div className="flex flex-col gap-3 sm:flex-row">
              <input value={name} onChange={(e) => setName(e.target.value)} placeholder="Tournament name"
                className="flex-1 rounded-xl border border-line bg-plaster px-4 py-2.5 outline-none focus:border-teal" />
              <div className="flex gap-1 rounded-lg bg-plaster-2 p-1">
                {(['roundrobin', 'knockout'] as const).map((f) => (
                  <button key={f} onClick={() => setFormat(f)} className={`rounded-md px-3 py-1.5 text-sm font-semibold ${format === f ? 'bg-ink text-white' : 'text-ink-soft'}`}>
                    {f === 'roundrobin' ? 'Round-robin' : 'Knockout'}
                  </button>
                ))}
              </div>
              <button onClick={create} disabled={busy || !name.trim()} className="btn-primary">Create</button>
            </div>
          </div>

          {tours.length === 0 ? (
            <p className="text-ink-soft">No tournaments yet — create the first one.</p>
          ) : (
            <Group>
              {tours.map((t) => (
                <Row key={t.id} title={t.name} subtitle={`${t.format === 'roundrobin' ? 'Round-robin' : 'Knockout'} · ${t.status}`}
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
