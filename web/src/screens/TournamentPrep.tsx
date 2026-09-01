import { useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { PageHeader } from '@/components/ui';
import { useAuth } from '@/auth/AuthProvider';
import { useProgress } from '@/game/progress';
import { usePrefs } from '@/game/prefs';
import { buildTournamentPlan, daysUntil, type PrepPhase } from '@/data/tournamentPrep';

const PHASE_COLOR: Record<PrepPhase, string> = {
  Foundation: '#1E88E5', Sharpen: '#2E9E6B', Taper: '#E0B341', 'Game day': '#111418',
};

type Saved = { targetDate: string; checked: string[] };

function storageKey(userId?: string): string {
  return `chess.prep.${userId ?? 'guest'}`;
}
function loadSaved(userId?: string): Saved {
  try {
    const raw = localStorage.getItem(storageKey(userId));
    if (raw) { const s = JSON.parse(raw); return { targetDate: s.targetDate ?? '', checked: Array.isArray(s.checked) ? s.checked : [] }; }
  } catch { /* ignore */ }
  return { targetDate: '', checked: [] };
}
function persist(userId: string | undefined, s: Saved) {
  try { localStorage.setItem(storageKey(userId), JSON.stringify(s)); } catch { /* ignore */ }
}

export function TournamentPrep() {
  const nav = useNavigate();
  const { user } = useAuth();
  const { progress } = useProgress();
  const { prefs } = usePrefs();

  const [targetDate, setTargetDate] = useState('');
  const [checked, setChecked] = useState<Set<string>>(new Set());

  // hydrate from localStorage once the user is known
  useEffect(() => {
    const s = loadSaved(user?.id);
    setTargetDate(s.targetDate);
    setChecked(new Set(s.checked));
  }, [user?.id]);

  const persistNow = (date: string, set: Set<string>) => persist(user?.id, { targetDate: date, checked: [...set] });

  const days = daysUntil(targetDate);
  const plan = useMemo(() => buildTournamentPlan(days ?? 14, prefs.level, progress), [days, prefs.level, progress]);

  const toggle = (id: string) => {
    setChecked((prev) => {
      const next = new Set(prev);
      next.has(id) ? next.delete(id) : next.add(id);
      persistNow(targetDate, next);
      return next;
    });
  };
  const isDone = (id: string, auto: boolean) => checked.has(id) || auto;

  const readyCount = plan.readiness.filter((r) => isDone(r.id, r.auto)).length;
  const readyPct = Math.round((readyCount / plan.readiness.length) * 100);

  const setDate = (v: string) => { setTargetDate(v); persistNow(v, checked); };
  const quickSet = (d: number) => {
    const t = new Date(); t.setDate(t.getDate() + d);
    setDate(`${t.getFullYear()}-${String(t.getMonth() + 1).padStart(2, '0')}-${String(t.getDate()).padStart(2, '0')}`);
  };

  return (
    <div className="mx-auto max-w-2xl">
      <PageHeader eyebrow="Tournament prep" title="Peak for your event"
        sub="Set your tournament date and get a periodised plan — build, sharpen, then taper — so you arrive at round one fresh and at your strongest." />

      {/* date + countdown hero */}
      <div className="mb-6 rounded-2xl bg-ink p-6 text-white">
        <div className="flex flex-wrap items-end justify-between gap-4">
          <div>
            <label className="text-[11px] font-bold uppercase tracking-wider text-gold-soft">Your tournament date</label>
            <input type="date" value={targetDate} onChange={(e) => setDate(e.target.value)}
              className="mt-1 block rounded-xl border border-white/15 bg-white/10 px-4 py-2.5 text-white outline-none focus:border-white/40 [color-scheme:dark]" />
          </div>
          {days !== null && (
            <div className="text-right">
              <div className="font-display text-4xl font-black leading-none">{days === 0 ? 'Today' : days}</div>
              <div className="text-[12px] text-white/60">{days === 0 ? 'it’s game day' : days === 1 ? 'day to go' : 'days to go'}</div>
            </div>
          )}
        </div>
        {days === null ? (
          <div className="mt-4 flex flex-wrap gap-2">
            {[[7, 'In 1 week'], [14, 'In 2 weeks'], [30, 'In a month']].map(([d, l]) => (
              <button key={d} onClick={() => quickSet(d as number)} className="rounded-full bg-white/10 px-3 py-1.5 text-sm font-semibold hover:bg-white/20">{l}</button>
            ))}
          </div>
        ) : (
          <p className="mt-3 text-[14px] text-white/75">{plan.intensity}</p>
        )}
      </div>

      {/* readiness */}
      <div className="mb-6">
        <div className="mb-2 flex items-baseline justify-between">
          <h2 className="font-display text-lg font-black">Readiness</h2>
          <span className="text-sm font-bold text-teal">{readyCount}/{plan.readiness.length} ready</span>
        </div>
        <div className="mb-3 h-2 overflow-hidden rounded-full bg-plaster-2">
          <div className="h-full rounded-full bg-success transition-[width]" style={{ width: `${readyPct}%` }} />
        </div>
        <div className="space-y-2">
          {plan.readiness.map((r) => {
            const done = isDone(r.id, r.auto);
            return (
              <div key={r.id} className="flex items-center gap-3 rounded-2xl border border-line bg-surface p-3.5">
                <button onClick={() => toggle(r.id)} aria-label={done ? 'Mark not done' : 'Mark done'}
                  className={`grid h-7 w-7 flex-none place-items-center rounded-lg text-sm font-bold transition ${done ? 'bg-success text-white' : 'border border-line bg-plaster-2 text-ink-faint'}`}>
                  {done ? '✓' : ''}
                </button>
                <div className="min-w-0 flex-1">
                  <div className={`font-bold ${done ? 'text-ink-soft line-through' : ''}`}>{r.label}{r.auto && !checked.has(r.id) ? <span className="ml-2 align-middle text-[10px] font-bold uppercase tracking-wide text-success">auto</span> : null}</div>
                  <div className="text-[13px] text-ink-faint">{r.hint}</div>
                </div>
                <button onClick={() => nav(r.to)} className="flex-none rounded-full bg-ink px-3 py-1.5 text-[13px] font-semibold text-white">Open</button>
              </div>
            );
          })}
        </div>
      </div>

      {/* phased plan */}
      <h2 className="mb-2 font-display text-lg font-black">Your countdown plan</h2>
      <div className="mb-6 space-y-3">
        {plan.phases.map((b) => (
          <div key={b.phase} className="overflow-hidden rounded-2xl border border-line bg-surface">
            <div className="flex items-center gap-3 border-b border-line px-5 py-3">
              <span className="h-3 w-3 flex-none rounded-full" style={{ background: PHASE_COLOR[b.phase] }} />
              <div className="min-w-0 flex-1">
                <div className="font-display text-base font-black">{b.phase} <span className="ml-1 text-[12px] font-semibold text-ink-faint">· {b.window}</span></div>
                <div className="text-[13px] text-ink-soft">{b.headline}</div>
              </div>
            </div>
            <div className="p-5">
              <ul className="space-y-2">
                {b.tasks.map((t) => (
                  <li key={t.label}>
                    <button onClick={() => nav(t.to)} className="flex w-full items-center gap-2 text-left text-[14px] hover:text-teal">
                      <span className="mt-0.5 flex-none font-bold text-teal">→</span><span className="flex-1">{t.label}</span>
                    </button>
                  </li>
                ))}
              </ul>
              <p className="mt-3 rounded-xl bg-plaster-2 p-3 text-[13px] text-ink-soft">{b.note}</p>
            </div>
          </div>
        ))}
      </div>

      {/* daily habits */}
      <h2 className="mb-2 font-display text-lg font-black">Daily habits</h2>
      <div className="mb-6 card p-5">
        <ul className="space-y-2">
          {plan.habits.map((h) => (
            <li key={h} className="flex gap-2 text-[14px]"><span className="mt-0.5 flex-none font-bold text-teal">✦</span><span>{h}</span></li>
          ))}
        </ul>
      </div>

      {/* game day + in-game discipline */}
      <div className="grid gap-4 sm:grid-cols-2">
        <div className="card p-5">
          <p className="eyebrow mb-2">Game-day routine</p>
          <ul className="space-y-2">
            {plan.gameDay.map((t) => (
              <li key={t} className="flex gap-2 text-[13px]"><span className="mt-0.5 flex-none font-bold text-gold">•</span><span>{t}</span></li>
            ))}
          </ul>
        </div>
        <div className="card p-5">
          <p className="eyebrow mb-2">At the board</p>
          <ul className="space-y-2">
            {plan.inGame.map((t) => (
              <li key={t} className="flex gap-2 text-[13px]"><span className="mt-0.5 flex-none font-bold text-teal">♟</span><span>{t}</span></li>
            ))}
          </ul>
        </div>
      </div>
    </div>
  );
}
