import { useEffect, useState } from 'react';
import { PageHeader, Group, Row } from '@/components/ui';
import { useAuth } from '@/auth/AuthProvider';
import { analyzeGame, SAMPLE_PGN, type GameReport, type SideReport } from '@shared/engine/analyze';
import { fetchGames, type ImportSource, type ImportedGame } from '@shared/services/importGames';
import { saveImportedGame, listMyGames, type StoredGame } from '@/lib/games';

export function Analyze() {
  const { user } = useAuth();
  const [pgn, setPgn] = useState('');
  const [report, setReport] = useState<GameReport | null>(null);
  const [err, setErr] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  // import
  const [source, setSource] = useState<ImportSource>('chesscom');
  const [username, setUsername] = useState('');
  const [imported, setImported] = useState<ImportedGame[]>([]);
  const [importing, setImporting] = useState(false);
  const [importErr, setImportErr] = useState<string | null>(null);
  const [stored, setStored] = useState<StoredGame[]>([]);

  useEffect(() => { if (user?.id) listMyGames(user.id).then(setStored); }, [user?.id]);

  const run = (text: string) => {
    setErr(null); setBusy(true);
    try {
      const r = analyzeGame(text, 2);
      if (!r.moves.length) { setErr('No moves found — paste a valid PGN.'); setReport(null); }
      else { setReport(r); window.scrollTo({ top: 9999, behavior: 'smooth' }); }
    } catch (e: any) { setErr(e?.message || 'Could not analyze.'); setReport(null); }
    finally { setBusy(false); }
  };

  const doImport = async () => {
    if (!username.trim()) return;
    setImporting(true); setImportErr(null); setImported([]);
    try {
      const games = await fetchGames(source, username.trim(), 15);
      setImported(games);
      if (games.length === 0) setImportErr('No recent games found for that username.');
      // persist for signed-in users (best-effort)
      if (user?.id) {
        Promise.all(games.slice(0, 10).map((g) => saveImportedGame(user.id, g).catch(() => {}))).then(() => {
          listMyGames(user.id).then(setStored);
        });
      }
    } catch (e: any) {
      setImportErr(e?.message || 'Could not reach that site. Check the username.');
    } finally { setImporting(false); }
  };

  const analyzeImported = (g: ImportedGame | StoredGame) => { setPgn(g.pgn || ''); run(g.pgn || ''); };

  return (
    <div className="mx-auto max-w-2xl">
      <PageHeader eyebrow="Analyze" title="Game analyzer"
        sub="Import your Chess.com or Lichess games, or paste a PGN — get a Chess.com-style report with accuracy, mistakes and an eval graph." />

      {/* import */}
      <div className="card p-5">
        <p className="eyebrow mb-3">Import your games</p>
        <div className="flex flex-col gap-3 sm:flex-row">
          <div className="flex rounded-lg bg-plaster-2 p-1">
            {(['chesscom', 'lichess'] as ImportSource[]).map((s) => (
              <button key={s} onClick={() => setSource(s)} className={`rounded-md px-3 py-1.5 text-sm font-semibold ${source === s ? 'bg-ink text-white' : 'text-ink-soft'}`}>
                {s === 'chesscom' ? 'Chess.com' : 'Lichess'}
              </button>
            ))}
          </div>
          <input value={username} onChange={(e) => setUsername(e.target.value)} placeholder={`${source === 'chesscom' ? 'Chess.com' : 'Lichess'} username`}
            onKeyDown={(e) => { if (e.key === 'Enter') doImport(); }}
            className="flex-1 rounded-lg border border-line bg-plaster px-4 py-2.5 outline-none focus:border-teal" />
          <button onClick={doImport} disabled={importing || !username.trim()} className="btn-primary">{importing ? 'Fetching…' : 'Fetch games'}</button>
        </div>
        {importErr && <p className="mt-3 text-sm font-semibold text-danger">{importErr}</p>}
        {imported.length > 0 && (
          <div className="mt-4">
            <Group>
              {imported.map((g) => (
                <Row key={g.id} title={`${g.white} vs ${g.black}`} subtitle={`${g.result}${g.date ? ` · ${g.date}` : ''}`}
                  onClick={() => analyzeImported(g)} right={<span className="text-sm font-semibold text-teal">Analyze</span>} chevron={false} />
              ))}
            </Group>
          </div>
        )}
      </div>

      {/* stored games (signed-in) */}
      {stored.length > 0 && (
        <div className="mt-5">
          <h2 className="mb-2 font-display text-lg font-black">Your saved games</h2>
          <Group>
            {stored.map((g) => (
              <Row key={g.id} title={`Imported game`} subtitle={`${g.result ?? '*'} · ${new Date(g.created_at).toLocaleDateString()}`}
                onClick={() => analyzeImported(g)} right={<span className="text-sm font-semibold text-teal">Analyze</span>} chevron={false} />
            ))}
          </Group>
        </div>
      )}

      {/* paste */}
      <div className="mt-5">
        <p className="eyebrow mb-2">…or paste a PGN</p>
        <textarea value={pgn} onChange={(e) => setPgn(e.target.value)} rows={4} placeholder="Paste PGN here…"
          className="w-full rounded-2xl border border-line bg-surface p-4 font-mono text-sm outline-none focus:border-teal" />
        <div className="mt-3 flex flex-wrap gap-3">
          <button onClick={() => run(pgn)} disabled={busy || !pgn.trim()} className="btn-dark">Analyze PGN</button>
          <button onClick={() => { setPgn(SAMPLE_PGN); run(SAMPLE_PGN); }} className="btn-ghost">Try a sample</button>
        </div>
      </div>
      {err && <p className="mt-3 text-sm font-semibold text-danger">{err}</p>}

      {report && (
        <div className="mt-6">
          <p className="mb-1 text-sm font-semibold text-ink-soft">{report.openingName} · {report.result}</p>
          <EvalGraph series={report.evalSeries} />
          <div className="mt-4 grid grid-cols-2 gap-4">
            <SideCard title="White" s={report.white} />
            <SideCard title="Black" s={report.black} />
          </div>
        </div>
      )}
    </div>
  );
}

function SideCard({ title, s }: { title: string; s: SideReport }) {
  const rows: [string, number][] = [
    ['Brilliant', s.brilliant], ['Great', s.great], ['Best', s.best], ['Good', s.good],
    ['Inaccuracy', s.inaccuracy], ['Mistake', s.mistake], ['Miss', s.miss], ['Blunder', s.blunder],
  ];
  return (
    <div className="card p-5">
      <div className="flex items-baseline justify-between">
        <h3 className="font-display text-lg font-black">{title}</h3>
        <span className="font-display text-2xl font-black text-teal">{s.accuracy.toFixed(1)}%</span>
      </div>
      <div className="mt-1 text-[11px] font-semibold uppercase tracking-wider text-ink-faint">Accuracy · {s.acpl} acpl</div>
      <div className="mt-3 space-y-1.5">
        {rows.map(([l, n]) => (
          <div key={l} className="flex items-center justify-between text-sm"><span className="text-ink-soft">{l}</span><span className="font-semibold tabular-nums">{n}</span></div>
        ))}
      </div>
    </div>
  );
}

function EvalGraph({ series }: { series: number[] }) {
  if (series.length < 2) return null;
  const w = 600, h = 120;
  const pts = series.map((v, i) => `${(i / (series.length - 1)) * w},${h - (v / 100) * h}`).join(' ');
  const area = `0,${h / 2} ${pts} ${w},${h / 2}`;
  return (
    <div className="overflow-hidden rounded-2xl border border-line bg-ink">
      <svg viewBox={`0 0 ${w} ${h}`} className="h-28 w-full" preserveAspectRatio="none">
        <rect x="0" y="0" width={w} height={h / 2} fill="#ffffff12" />
        <line x1="0" y1={h / 2} x2={w} y2={h / 2} stroke="#ffffff30" strokeWidth="1" />
        <polygon points={area} fill="#1E88E533" />
        <polyline points={pts} fill="none" stroke="#42A5F5" strokeWidth="2" />
      </svg>
    </div>
  );
}
