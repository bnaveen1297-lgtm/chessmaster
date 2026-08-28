import { useState } from 'react';
import { PageHeader } from '@/components/ui';
import { analyzeGame, SAMPLE_PGN, type GameReport, type SideReport } from '@shared/engine/analyze';

export function Analyze() {
  const [pgn, setPgn] = useState('');
  const [report, setReport] = useState<GameReport | null>(null);
  const [err, setErr] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  const run = (text: string) => {
    setErr(null); setBusy(true);
    try {
      const r = analyzeGame(text, 2);
      if (!r.moves.length) { setErr('No moves found — paste a valid PGN.'); setReport(null); }
      else setReport(r);
    } catch (e: any) { setErr(e?.message || 'Could not analyze.'); setReport(null); }
    finally { setBusy(false); }
  };

  return (
    <div className="mx-auto max-w-2xl">
      <PageHeader eyebrow="Analyze" title="Review any game"
        sub="Paste a PGN for a Chess.com-style report — accuracy, blunders, and an evaluation graph." />
      <textarea value={pgn} onChange={(e) => setPgn(e.target.value)} rows={5} placeholder="Paste PGN here…"
        className="w-full rounded-2xl border border-line bg-surface p-4 font-mono text-sm outline-none focus:border-teal" />
      <div className="mt-3 flex flex-wrap gap-3">
        <button onClick={() => run(pgn)} disabled={busy || !pgn.trim()} className="btn-dark">Analyze</button>
        <button onClick={() => { setPgn(SAMPLE_PGN); run(SAMPLE_PGN); }} className="btn-ghost">Try a sample game</button>
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
      <div className="mt-1 font-mono text-[11px] uppercase tracking-wider text-ink-faint">Accuracy · {s.acpl} acpl</div>
      <div className="mt-3 space-y-1.5">
        {rows.map(([l, n]) => (
          <div key={l} className="flex items-center justify-between text-sm"><span className="text-ink-soft">{l}</span><span className="font-mono font-semibold">{n}</span></div>
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
        <rect x="0" y="0" width={w} height={h / 2} fill="#ffffff10" />
        <line x1="0" y1={h / 2} x2={w} y2={h / 2} stroke="#ffffff30" strokeWidth="1" />
        <polygon points={area} fill="#1FB6C433" />
        <polyline points={pts} fill="none" stroke="#1FB6C4" strokeWidth="2" />
      </svg>
    </div>
  );
}
