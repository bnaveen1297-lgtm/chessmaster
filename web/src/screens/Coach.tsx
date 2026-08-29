import { useNavigate } from 'react-router-dom';
import { PageHeader } from '@/components/ui';
import { useProgress, levelFromXp } from '@/game/progress';
import { usePrefs } from '@/game/prefs';
import { buildCoachPlan } from '@/data/coachPlan';

export function Coach() {
  const nav = useNavigate();
  const { progress } = useProgress();
  const { prefs } = usePrefs();
  const plan = buildCoachPlan(prefs.level, progress);
  const level = levelFromXp(progress.xp);

  return (
    <div className="mx-auto max-w-2xl">
      <PageHeader eyebrow="Prep coach" title="Your training plan"
        sub="More than an engine — a coach that turns your progress into a plan for the week." />

      {/* hero */}
      <div className="mb-6 rounded-2xl bg-ink p-6 text-white">
        <div className="text-[11px] font-bold uppercase tracking-wider text-gold-soft">Level {level} · {prefs.level} track</div>
        <div className="mt-1 font-display text-2xl font-black">{plan.headline}</div>
        <div className="mt-1 text-[14px] text-white/70">{plan.subline}</div>
        <button onClick={() => nav('/app/analyze')} className="mt-4 rounded-full bg-white px-4 py-2 text-sm font-bold text-ink">Analyze your game or position →</button>
      </div>

      {/* focus areas */}
      <h2 className="mb-2 font-display text-lg font-black">Your focus areas</h2>
      <div className="mb-6 space-y-2">
        {plan.focusAreas.map((f) => (
          <button key={f.title} onClick={() => nav(f.to)}
            className="flex w-full items-center gap-3 rounded-2xl border border-line bg-surface p-4 text-left transition hover:-translate-y-0.5">
            <span className={`grid h-9 w-9 flex-none place-items-center rounded-lg text-sm font-bold ${f.done ? 'bg-success text-white' : 'bg-plaster-2 text-ink-soft'}`}>{f.done ? '✓' : '→'}</span>
            <span className="flex-1">
              <span className="block font-bold">{f.title}</span>
              <span className="block text-[13px] text-ink-soft">{f.detail}</span>
            </span>
          </button>
        ))}
      </div>

      {/* week plan */}
      <h2 className="mb-2 font-display text-lg font-black">This week’s plan</h2>
      <div className="mb-6 overflow-hidden rounded-2xl border border-line">
        {plan.days.map((d, i) => (
          <div key={d.day} className={`flex items-center gap-3 p-4 ${i > 0 ? 'border-t border-line' : ''}`}>
            <span className="grid h-10 w-10 flex-none place-items-center rounded-lg bg-plaster-2 text-[13px] font-black text-teal">{d.day}</span>
            <span className="flex-1 text-[14px] font-semibold">{d.focus}</span>
            <button onClick={() => nav(d.action.to)} className="flex-none rounded-full bg-ink px-3 py-1.5 text-[13px] font-semibold text-white">{d.action.label}</button>
          </div>
        ))}
      </div>

      {/* repertoire */}
      <h2 className="mb-1 font-display text-lg font-black">Your starter repertoire</h2>
      <p className="mb-3 text-[13px] text-ink-soft">Openings that fit your level. Learn the idea, then drill the moves in play.</p>
      <div className="grid gap-4 sm:grid-cols-3">
        {plan.repertoire.map((r) => (
          <div key={r.role} className="card p-4">
            <div className="text-[11px] font-bold uppercase tracking-wider text-ink-faint">{r.role}</div>
            <div className="mt-1 font-display text-base font-black">{r.opening.name}</div>
            <div className="mt-1 font-mono text-[12px] text-teal">{r.opening.moves.join(' ')}</div>
            <div className="mt-2 text-[13px] text-ink-soft">{r.opening.idea}</div>
          </div>
        ))}
      </div>
    </div>
  );
}
