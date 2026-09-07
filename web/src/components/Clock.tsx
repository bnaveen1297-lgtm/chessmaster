import { formatClock, TIME_CONTROLS, type TimeCategory, type TimeControl } from '@/game/clock';

/** A single side's clock readout. Dims when idle, glows red under 10s. */
export function ClockFace({ ms, active }: { ms: number; active: boolean }) {
  const low = ms <= 10_000;
  return (
    <span
      className={[
        'inline-flex min-w-[4.5rem] items-center justify-center rounded-lg px-3 py-1 font-mono text-lg font-black tabular-nums transition',
        active ? 'bg-ink text-white shadow-soft' : 'bg-plaster-2 text-ink-soft',
        low ? (active ? '!bg-danger text-white' : 'text-danger') : '',
        ms <= 0 ? 'opacity-70' : '',
      ].join(' ')}
      aria-label={`${active ? 'Active clock' : 'Clock'}: ${formatClock(ms)}`}
    >
      {formatClock(ms)}
    </span>
  );
}

/**
 * Time-control chooser, grouped Bullet / Blitz / Rapid the way players expect.
 * Disabled mid-game (changing the budget only takes effect on a new game).
 */
export function TimeControlPicker({
  value,
  onChange,
  disabled,
  className = '',
}: {
  value: TimeControl;
  onChange: (tc: TimeControl) => void;
  disabled?: boolean;
  className?: string;
}) {
  const categories: TimeCategory[] = ['Unlimited', 'Bullet', 'Blitz', 'Rapid'];
  return (
    <div className={`flex flex-wrap items-center gap-x-4 gap-y-2 ${className}`}>
      {categories.map((cat) => (
        <div key={cat} className="flex items-center gap-1.5">
          <span className="text-[11px] font-bold uppercase tracking-wider text-ink-faint">{cat}</span>
          <div className="flex gap-1 rounded-full bg-plaster-2 p-1">
            {TIME_CONTROLS.filter((t) => t.category === cat).map((t) => (
              <button
                key={t.id}
                type="button"
                disabled={disabled}
                onClick={() => onChange(t)}
                className={`rounded-full px-2.5 py-1 text-xs font-semibold transition disabled:cursor-not-allowed disabled:opacity-50 ${
                  value.id === t.id ? 'bg-ink text-white' : 'text-ink-soft hover:text-ink'
                }`}
              >
                {t.category === 'Unlimited' ? '∞' : t.label}
              </button>
            ))}
          </div>
        </div>
      ))}
    </div>
  );
}
