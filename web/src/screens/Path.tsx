import { useNavigate } from 'react-router-dom';
import { PageHeader } from '@/components/ui';
import { useAuth } from '@/auth/AuthProvider';
import { usePrefs } from '@/game/prefs';
import { useProgress } from '@/game/progress';
import { buildLearningPath, readWeaknessProfile, type Skill } from '@/lib/learningPath';

export function Path() {
  const nav = useNavigate();
  const { user } = useAuth();
  const { prefs } = usePrefs();
  const { progress } = useProgress();
  const profile = readWeaknessProfile(user?.id);
  const plan = buildLearningPath(prefs.level, progress, profile);

  return (
    <div className="mx-auto max-w-2xl">
      <PageHeader eyebrow="Your path" title="Learn from your own games"
        sub="Most apps make you guess what to study. chesshub360 reads your real games, finds what’s holding you back, and gives you the exact next step — free." />

      {/* hero */}
      <div className="mb-6 rounded-2xl bg-ink p-6 text-white">
        <div className="flex items-center justify-between gap-4">
          <div className="min-w-0">
            <div className="text-[11px] font-bold uppercase tracking-wider text-gold-soft">This week’s focus</div>
            <div className="mt-1 font-display text-2xl font-black">{plan.headline}</div>
            <div className="mt-1 text-[13px] text-white/70">{plan.sub}</div>
          </div>
          <div className="flex-none text-center">
            <div className="grid h-16 w-16 place-items-center rounded-full border-4 border-teal/40">
              <span className="font-display text-xl font-black">{plan.overall}</span>
            </div>
            <div className="mt-1 text-[10px] font-bold uppercase tracking-wide text-white/50">Readiness</div>
          </div>
        </div>
        {!plan.hasGameData && (
          <button onClick={() => nav('/app/analyze')} className="mt-4 rounded-full bg-white px-4 py-2 text-sm font-bold text-ink">Import your games to personalize →</button>
        )}
      </div>

      {/* today */}
      <h2 className="mb-2 font-display text-lg font-black">Today</h2>
      <div className="mb-6 overflow-hidden rounded-2xl border border-line bg-surface">
        {plan.today.map((t, i) => (
          <button key={i} onClick={() => nav(t.to)}
            className="flex w-full items-center gap-3 border-b border-line px-4 py-3.5 text-left last:border-b-0 hover:bg-plaster-2">
            <span className="grid h-8 w-8 flex-none place-items-center rounded-lg bg-teal/10 text-[13px] font-black text-teal">{i + 1}</span>
            <span className="min-w-0 flex-1">
              <span className="block font-bold">{t.title} <span className="ml-1 align-middle text-[10px] font-bold uppercase tracking-wide text-ink-faint">{t.tag}</span></span>
              <span className="block truncate text-[13px] text-ink-soft">{t.detail}</span>
            </span>
            <span className="flex-none text-sm font-semibold text-teal">Go →</span>
          </button>
        ))}
      </div>

      {/* skill map */}
      <h2 className="mb-1 font-display text-lg font-black">Your skill map</h2>
      <p className="mb-3 text-[13px] text-ink-soft">Ranked by what will help you most right now. {plan.hasGameData ? 'Tuned to your games.' : 'Play or import games to sharpen these.'}</p>
      <div className="space-y-2.5">
        {plan.skills.map((s, i) => <SkillRow key={s.id} s={s} rank={i} onClick={() => nav(s.action.to)} />)}
      </div>

      {/* how it works */}
      <div className="mt-6 rounded-2xl border border-line bg-plaster-2 p-5">
        <p className="eyebrow mb-2">How your path works</p>
        <div className="grid gap-3 sm:grid-cols-4">
          {[
            ['1', 'Play or import', 'Your Chess.com / Lichess games come in.'],
            ['2', 'We find the leaks', 'The analyzer spots your recurring mistakes.'],
            ['3', 'Targeted practice', 'Drills and lessons aimed at those exact gaps.'],
            ['4', 'Re-measure', 'Your path updates as you improve.'],
          ].map(([n, t, d]) => (
            <div key={n}>
              <div className="grid h-7 w-7 place-items-center rounded-full bg-ink text-[12px] font-black text-white">{n}</div>
              <div className="mt-2 text-[13px] font-bold">{t}</div>
              <div className="text-[12px] text-ink-faint">{d}</div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

function SkillRow({ s, rank, onClick }: { s: Skill; rank: number; onClick: () => void }) {
  const color = s.mastery >= 75 ? '#2E9E6B' : s.mastery >= 50 ? '#1E88E5' : s.mastery >= 30 ? '#E0B341' : '#E23B3B';
  return (
    <button onClick={onClick} className="flex w-full items-center gap-4 rounded-2xl border border-line bg-surface p-4 text-left transition hover:-translate-y-0.5">
      <span className="grid h-11 w-11 flex-none place-items-center rounded-xl bg-plaster-2 text-xl">{s.icon}</span>
      <span className="min-w-0 flex-1">
        <span className="flex items-center justify-between gap-2">
          <span className="font-bold">{s.name}{rank === 0 && <span className="ml-2 rounded-full bg-teal/10 px-2 py-0.5 text-[10px] font-black uppercase tracking-wide text-teal">Focus</span>}</span>
          <span className="font-mono text-[13px] font-bold tabular-nums" style={{ color }}>{s.mastery}%</span>
        </span>
        <span className="mt-1.5 block h-2 overflow-hidden rounded-full bg-plaster-2">
          <span className="block h-full rounded-full" style={{ width: `${s.mastery}%`, background: color }} />
        </span>
        <span className="mt-1.5 block text-[12px] text-ink-soft">{s.why}</span>
      </span>
      <span className="flex-none text-sm font-semibold text-teal">{s.action.label} →</span>
    </button>
  );
}
