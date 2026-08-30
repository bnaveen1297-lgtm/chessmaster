import { useEffect, useRef, useState } from 'react';
import { Chess } from 'chess.js';
import { PageHeader, Group, Row } from '@/components/ui';
import { Board } from '@/components/Board';
import { useAuth } from '@/auth/AuthProvider';
import { analyzeGame, SAMPLE_PGN, winPct, type GameReport, type SideReport } from '@shared/engine/analyze';
import { analyzeGameEngine } from '@/engine/engineAnalyze';
import { StockfishEngine, uciToSan, pvToSan, MATE_CP } from '@/engine/stockfish';
import { buildReportCard, type ReportCard, type GameLine } from '@/engine/reportCard';
import { fetchGames, type ImportSource, type ImportedGame } from '@shared/services/importGames';
import { saveImportedGame, listMyGames, type StoredGame } from '@/lib/games';

const ENGINE_DEPTH = 12;
const POS_DEPTH = 16;

type PosResult = { fen: string; whiteCp: number; mateIn: number | null; bestSan: string; line: string[]; verdict: string };

function verdictFor(whiteCp: number, mateIn: number | null): string {
  if (mateIn != null && mateIn !== 0) return mateIn > 0 ? `Forced mate in ${Math.abs(mateIn)} for the side to move` : `Facing mate in ${Math.abs(mateIn)}`;
  const a = Math.abs(whiteCp);
  const who = whiteCp >= 0 ? 'White' : 'Black';
  if (a < 40) return 'The position is roughly equal';
  if (a < 120) return `${who} is slightly better`;
  if (a < 300) return `${who} is clearly better`;
  if (a < 700) return `${who} is winning`;
  return `${who} is completely winning`;
}

export function Analyze() {
  const { user } = useAuth();
  const [pgn, setPgn] = useState('');
  const [report, setReport] = useState<GameReport | null>(null);
  const [err, setErr] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const [useEngine, setUseEngine] = useState(true);
  const [progress, setProgress] = useState<number | null>(null);
  const [engineNote, setEngineNote] = useState<string | null>(null);
  const engineRef = useRef<StockfishEngine | null>(null);

  // position (FEN) analysis
  const [fenInput, setFenInput] = useState('');
  const [posBusy, setPosBusy] = useState(false);
  const [posErr, setPosErr] = useState<string | null>(null);
  const [posResult, setPosResult] = useState<PosResult | null>(null);

  const analyzePosition = async (fenRaw: string) => {
    const fen = fenRaw.trim();
    setPosErr(null); setPosResult(null);
    let sideToMove: 'w' | 'b';
    try { sideToMove = new Chess(fen).turn(); } catch { setPosErr('That doesn’t look like a valid FEN.'); return; }
    setPosBusy(true);
    try {
      if (!engineRef.current) engineRef.current = new StockfishEngine();
      const r = await engineRef.current.evaluate(fen, { depth: POS_DEPTH, multipv: 1 });
      const stmCp = r.cp;                                   // side-to-move perspective
      const whiteCp = sideToMove === 'w' ? stmCp : -stmCp;  // White perspective for display
      const mate = r.lines[0]?.mateIn ?? null;
      const whiteMate = mate == null ? null : (sideToMove === 'w' ? mate : -mate);
      setPosResult({
        fen,
        whiteCp: Math.max(-MATE_CP, Math.min(MATE_CP, whiteCp)),
        mateIn: whiteMate,
        bestSan: uciToSan(fen, r.bestUci),
        line: pvToSan(fen, r.lines[0]?.pv ?? [], 8),
        verdict: verdictFor(whiteCp, mate),
      });
    } catch {
      setPosErr('Stockfish couldn’t run here. Try again, or use a different browser.');
    } finally { setPosBusy(false); }
  };

  // import
  const [source, setSource] = useState<ImportSource>('chesscom');
  const [username, setUsername] = useState('');
  const [imported, setImported] = useState<ImportedGame[]>([]);
  const [importing, setImporting] = useState(false);
  const [importErr, setImportErr] = useState<string | null>(null);
  const [stored, setStored] = useState<StoredGame[]>([]);
  const [card, setCard] = useState<ReportCard | null>(null);
  const [cardBusy, setCardBusy] = useState(false);
  const [cardProgress, setCardProgress] = useState(0);

  useEffect(() => { if (user?.id) listMyGames(user.id).then(setStored); }, [user?.id]);
  useEffect(() => () => engineRef.current?.quit(), []);

  const run = async (text: string) => {
    setErr(null); setEngineNote(null); setBusy(true); setProgress(null);
    try {
      if (useEngine) {
        try {
          if (!engineRef.current) engineRef.current = new StockfishEngine();
          setProgress(0);
          const r = await analyzeGameEngine(text, engineRef.current, {
            depth: ENGINE_DEPTH,
            onProgress: (f) => setProgress(f),
          });
          if (!r.moves.length) { setErr('No moves found — paste a valid PGN.'); setReport(null); }
          else { setReport(r); setEngineNote(`Analyzed with Stockfish (depth ${ENGINE_DEPTH}).`); window.scrollTo({ top: 9999, behavior: 'smooth' }); }
          return;
        } catch (engineErr: any) {
          // Engine unavailable (e.g. worker blocked) — fall back to the quick model.
          const r = analyzeGame(text, 2);
          if (!r.moves.length) { setErr('No moves found — paste a valid PGN.'); setReport(null); }
          else { setReport(r); setEngineNote('Stockfish unavailable here — used the quick analyzer instead.'); window.scrollTo({ top: 9999, behavior: 'smooth' }); }
          return;
        }
      }
      const r = analyzeGame(text, 2);
      if (!r.moves.length) { setErr('No moves found — paste a valid PGN.'); setReport(null); }
      else { setReport(r); window.scrollTo({ top: 9999, behavior: 'smooth' }); }
    } catch (e: any) { setErr(e?.message || 'Could not analyze.'); setReport(null); }
    finally { setBusy(false); setProgress(null); }
  };

  const doImport = async () => {
    if (!username.trim()) return;
    setImporting(true); setImportErr(null); setImported([]); setCard(null);
    try {
      const games = await fetchGames(source, username.trim(), 20);
      setImported(games);
      if (games.length === 0) { setImportErr('No recent games found for that username.'); return; }
      // persist for signed-in users (best-effort)
      if (user?.id) {
        Promise.all(games.slice(0, 10).map((g) => saveImportedGame(user.id, g).catch(() => {}))).then(() => {
          listMyGames(user.id).then(setStored);
        });
      }
      // Aggregate report card across all fetched games (quick model).
      setCardBusy(true); setCardProgress(0);
      const rc = await buildReportCard(games, username.trim(), setCardProgress);
      setCard(rc);
    } catch (e: any) {
      setImportErr(e?.message || 'Could not reach that site. Check the username.');
    } finally { setImporting(false); setCardBusy(false); }
  };

  const analyzeImported = (g: ImportedGame | StoredGame) => { setPgn(g.pgn || ''); run(g.pgn || ''); };

  return (
    <div className="mx-auto max-w-2xl">
      <PageHeader eyebrow="Analyze" title="Game analyzer"
        sub="Import your Chess.com or Lichess games for a report card across all of them — accuracy, win rate, recurring mistakes and openings — then deep-review any game with Stockfish." />

      {/* engine mode */}
      <div className="mb-4 flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-line bg-plaster-2 px-4 py-3">
        <div>
          <div className="text-sm font-bold">Analysis engine</div>
          <div className="text-[13px] text-ink-soft">{useEngine ? 'Stockfish — full-strength, runs in your browser.' : 'Quick — instant, approximate.'}</div>
        </div>
        <div className="flex gap-1 rounded-full bg-surface p-1">
          {[{ v: true, l: 'Stockfish' }, { v: false, l: 'Quick' }].map((o) => (
            <button key={o.l} onClick={() => setUseEngine(o.v)} disabled={busy}
              className={`rounded-full px-3 py-1 text-sm font-semibold transition disabled:opacity-50 ${useEngine === o.v ? 'bg-ink text-white' : 'text-ink-soft'}`}>{o.l}</button>
          ))}
        </div>
      </div>

      {progress !== null && (
        <div className="mb-4">
          <div className="mb-1 flex justify-between text-[13px] font-semibold text-ink-soft">
            <span>Analyzing with Stockfish…</span><span>{Math.round(progress * 100)}%</span>
          </div>
          <div className="h-2 overflow-hidden rounded-full bg-plaster-2">
            <div className="h-full rounded-full bg-teal transition-[width] duration-200" style={{ width: `${Math.round(progress * 100)}%` }} />
          </div>
        </div>
      )}
      {engineNote && <p className="mb-4 text-[13px] font-semibold text-ink-faint">{engineNote}</p>}

      {/* analyze a position */}
      <div className="card mb-5 p-5">
        <p className="eyebrow mb-1">Analyze a position</p>
        <p className="mb-3 text-[13px] text-ink-soft">Paste a FEN and Stockfish tells you who’s better, the best move, and the line.</p>
        <textarea value={fenInput} onChange={(e) => setFenInput(e.target.value)} rows={2}
          placeholder="rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR w KQkq - 0 1"
          className="w-full rounded-xl border border-line bg-surface p-3 font-mono text-[13px] outline-none focus:border-teal" />
        <div className="mt-3 flex flex-wrap gap-3">
          <button onClick={() => analyzePosition(fenInput)} disabled={posBusy || !fenInput.trim()} className="btn-primary">{posBusy ? 'Thinking…' : 'Analyze position'}</button>
          <button onClick={() => { const f = 'r1bqkbnr/pppp1ppp/2n5/1B2p3/4P3/5N2/PPPP1PPP/RNBQK2R b KQkq - 3 3'; setFenInput(f); analyzePosition(f); }} disabled={posBusy} className="btn-ghost">Try a sample</button>
        </div>
        {posErr && <p className="mt-3 text-sm font-semibold text-danger">{posErr}</p>}
        {posResult && (
          <div className="mt-4 grid gap-4 sm:grid-cols-[minmax(0,240px)_1fr]">
            <Board fen={posResult.fen} interactive={false} />
            <div>
              <div className="flex items-baseline gap-2">
                <span className="font-display text-2xl font-black">
                  {posResult.mateIn != null ? `#${Math.abs(posResult.mateIn)}` : `${posResult.whiteCp >= 0 ? '+' : ''}${(posResult.whiteCp / 100).toFixed(2)}`}
                </span>
                <span className="text-[13px] font-semibold text-ink-soft">{posResult.verdict}</span>
              </div>
              <div className="mt-2 h-2 overflow-hidden rounded-full bg-ink/80">
                <div className="h-full bg-white" style={{ width: `${Math.round(winPct(posResult.whiteCp))}%` }} />
              </div>
              <div className="mt-1 text-[11px] text-ink-faint">White win chance ≈ {Math.round(winPct(posResult.whiteCp))}%</div>
              {posResult.bestSan && <div className="mt-3 text-[14px]"><span className="font-bold">Best move:</span> <span className="font-mono text-teal">{posResult.bestSan}</span></div>}
              {posResult.line.length > 0 && <div className="mt-1 text-[13px] text-ink-soft"><span className="font-semibold">Line:</span> <span className="font-mono">{posResult.line.join(' ')}</span></div>}
            </div>
          </div>
        )}
      </div>

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
        {cardBusy && (
          <div className="mt-4">
            <div className="mb-1 flex justify-between text-[13px] font-semibold text-ink-soft"><span>Building your report card…</span><span>{Math.round(cardProgress * 100)}%</span></div>
            <div className="h-2 overflow-hidden rounded-full bg-plaster-2"><div className="h-full rounded-full bg-teal transition-[width]" style={{ width: `${Math.round(cardProgress * 100)}%` }} /></div>
          </div>
        )}
        {imported.length > 0 && !card && !cardBusy && (
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

      {card && !cardBusy && <ReportCardView card={card} onReview={(p) => { setPgn(p); run(p); }} />}

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
          <button onClick={() => run(pgn)} disabled={busy || !pgn.trim()} className="btn-dark">{busy ? 'Analyzing…' : 'Analyze PGN'}</button>
          <button onClick={() => { setPgn(SAMPLE_PGN); run(SAMPLE_PGN); }} disabled={busy} className="btn-ghost">Try a sample</button>
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

/* ---------------- report card across all imported games ---------------- */
export function ReportCardView({ card, onReview }: { card: ReportCard; onReview: (pgn: string) => void }) {
  const tiles: [string, string][] = [
    ['Games', String(card.games)],
    ['Record', `${card.wins}-${card.draws}-${card.losses}`],
    ['Win rate', `${card.winPct}%`],
    ['Avg accuracy', `${card.avgAccuracy}%`],
    ['Blunders / game', String(card.blundersPerGame)],
  ];
  return (
    <div className="mt-6">
      <div className="rounded-2xl bg-ink p-6 text-white">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-[11px] font-bold uppercase tracking-wider text-gold-soft">Report card</p>
            <h2 className="mt-1 font-display text-2xl font-black">{card.username}</h2>
          </div>
          <span className="rounded-full bg-white/10 px-3 py-1.5 text-sm font-black">{card.grade}</span>
        </div>
        <div className="mt-4 grid grid-cols-2 gap-3 sm:grid-cols-5">
          {tiles.map(([l, v]) => (
            <div key={l} className="rounded-xl bg-white/5 p-3">
              <div className="font-display text-xl font-black">{v}</div>
              <div className="text-[10px] font-bold uppercase tracking-wide text-white/60">{l}</div>
            </div>
          ))}
        </div>
      </div>

      {/* insights */}
      <div className="mt-4 rounded-2xl border border-line bg-surface p-5">
        <p className="eyebrow mb-2">What the games say</p>
        <ul className="space-y-2">
          {card.insights.map((t, i) => (
            <li key={i} className="flex gap-2 text-[14px]"><span className="mt-0.5 flex-none font-bold text-teal">→</span><span>{t}</span></li>
          ))}
        </ul>
      </div>

      {/* move quality distribution */}
      {card.userMoves > 0 && (
        <div className="mt-4">
          <h3 className="mb-2 font-display text-lg font-black">Move quality <span className="text-[13px] font-semibold text-ink-faint">· {card.userMoves} of your moves</span></h3>
          <MoveQualityBar mq={card.moveQuality} total={card.userMoves} />
        </div>
      )}

      {/* by colour + by phase */}
      <div className="mt-4 grid gap-4 sm:grid-cols-2">
        <div className="card p-5">
          <p className="eyebrow mb-3">By colour</p>
          {(['white', 'black'] as const).map((c) => {
            const a = card.byColor[c];
            return (
              <div key={c} className="mb-3 last:mb-0">
                <div className="flex items-center gap-2 font-bold"><span className={`h-3.5 w-3.5 rounded-full border border-line ${c === 'white' ? 'bg-[#F4F1E8]' : 'bg-[#2B2B30]'}`} />{c === 'white' ? 'White' : 'Black'} <span className="text-[12px] font-normal text-ink-faint">· {a.games} games</span></div>
                <div className="mt-0.5 text-[13px] text-ink-soft"><b className="text-ink">{a.accuracy}%</b> accuracy · <b className="text-ink">{a.winPct}%</b> win rate</div>
              </div>
            );
          })}
        </div>
        <div className="card p-5">
          <p className="eyebrow mb-3">By phase</p>
          {(['opening', 'middlegame', 'endgame'] as const).map((p) => {
            const a = card.byPhase[p];
            return (
              <div key={p} className="mb-2 flex items-center justify-between">
                <span className="font-bold capitalize">{p}</span>
                <span className="text-[13px] text-ink-soft"><b className="text-ink">{a.acpl}</b> avg cp loss · <b className="text-ink">{a.blunders}</b> blunders</span>
              </div>
            );
          })}
        </div>
      </div>

      {/* biggest mistake */}
      {card.biggest && (
        <div className="mt-4 rounded-2xl border border-danger/30 bg-danger/5 p-5">
          <p className="eyebrow mb-1 text-danger">Biggest mistake</p>
          <p className="text-[14px]"><b className="font-mono">{card.biggest.san}</b> vs {card.biggest.opponent} — move {card.biggest.moveNo} ({card.biggest.phase}), giving up ~{Math.round(card.biggest.cpLoss / 100 * 10) / 10} pawns.
            {' '}<button onClick={() => { const g = card.lines.find((l) => l.id === card.biggest!.gameId); if (g) onReview(g.pgn); }} className="font-semibold text-teal">Review this game →</button></p>
        </div>
      )}

      {/* openings */}
      {card.openings.length > 0 && (
        <div className="mt-4">
          <h3 className="mb-2 font-display text-lg font-black">Your openings</h3>
          <div className="grid gap-3 sm:grid-cols-2">
            {card.openings.map((o) => (
              <div key={o.name} className="card flex items-center justify-between p-4">
                <div><div className="font-bold">{o.name}</div><div className="text-[12px] text-ink-faint">{o.games} game{o.games === 1 ? '' : 's'} · {o.asWhite} as White</div></div>
                <span className="font-mono text-sm font-bold text-teal">{o.wins}/{o.games}</span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* per-game list */}
      <h3 className="mb-2 mt-5 font-display text-lg font-black">Every game ({card.lines.length})</h3>
      <Group>
        {card.lines.map((l: GameLine) => (
          <Row key={l.id}
            title={`vs ${l.opponent}`}
            subtitle={`${l.color === 'w' ? 'White' : 'Black'} · ${l.opening}${l.date ? ` · ${l.date}` : ''}`}
            left={<span className={`grid h-9 w-9 flex-none place-items-center rounded-lg text-xs font-black ${l.result === 'win' ? 'bg-success/15 text-success' : l.result === 'loss' ? 'bg-danger/10 text-danger' : 'bg-plaster-2 text-ink-soft'}`}>{l.result === 'win' ? 'W' : l.result === 'loss' ? 'L' : l.result === 'draw' ? '½' : '·'}</span>}
            right={<span className="flex items-center gap-3 text-sm"><span className="font-bold tabular-nums">{l.accuracy}%</span><span className="font-semibold text-teal">Review</span></span>}
            onClick={() => onReview(l.pgn)} chevron={false} />
        ))}
      </Group>
      <p className="mt-2 text-[12px] text-ink-faint">Accuracy uses the quick model for speed across all games. Tap “Review” for a full Stockfish breakdown of any game.</p>
    </div>
  );
}

/* ---------------- move-quality distribution ---------------- */
function MoveQualityBar({ mq, total }: { mq: import('@/engine/reportCard').MoveQuality; total: number }) {
  const items: { key: keyof typeof mq; label: string; color: string }[] = [
    { key: 'brilliant', label: 'Brilliant', color: '#26C6DA' },
    { key: 'great', label: 'Great', color: '#42A5F5' },
    { key: 'best', label: 'Best', color: '#2E9E6B' },
    { key: 'good', label: 'Good', color: '#8BC34A' },
    { key: 'book', label: 'Book', color: '#9096A0' },
    { key: 'inaccuracy', label: 'Inaccuracy', color: '#E0B341' },
    { key: 'miss', label: 'Miss', color: '#EE8A3B' },
    { key: 'mistake', label: 'Mistake', color: '#E5643C' },
    { key: 'blunder', label: 'Blunder', color: '#E23B3B' },
  ];
  const shown = items.filter((it) => mq[it.key] > 0);
  return (
    <div className="card p-5">
      <div className="mb-3 flex h-3 w-full overflow-hidden rounded-full bg-plaster-2">
        {shown.map((it) => (
          <span key={it.key} title={`${it.label}: ${mq[it.key]}`} style={{ width: `${(mq[it.key] / total) * 100}%`, background: it.color }} />
        ))}
      </div>
      <div className="grid grid-cols-2 gap-x-6 gap-y-1.5 sm:grid-cols-3">
        {shown.map((it) => (
          <div key={it.key} className="flex items-center justify-between text-[13px]">
            <span className="flex items-center gap-2"><span className="h-2.5 w-2.5 rounded-full" style={{ background: it.color }} />{it.label}</span>
            <span className="font-bold tabular-nums">{mq[it.key]}</span>
          </div>
        ))}
      </div>
    </div>
  );
}
