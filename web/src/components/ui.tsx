import type { ReactNode } from 'react';
import { useNavigate } from 'react-router-dom';
import { IconChevron } from './icons';

export function PageHeader({ eyebrow, title, sub }: { eyebrow?: string; title: string; sub?: string }) {
  return (
    <div className="mb-6">
      {eyebrow && <p className="eyebrow mb-2">{eyebrow}</p>}
      <h1 className="font-display text-3xl font-black tracking-tight sm:text-4xl">{title}</h1>
      {sub && <p className="mt-2 max-w-2xl text-ink-soft">{sub}</p>}
    </div>
  );
}

export function BackLink({ to, label }: { to: string; label: string }) {
  const nav = useNavigate();
  return (
    <button onClick={() => nav(to)} className="mb-4 inline-flex items-center gap-1 text-sm font-semibold text-teal hover:text-teal-deep">
      ‹ {label}
    </button>
  );
}

export function Group({ children }: { children: ReactNode }) {
  return <div className="overflow-hidden rounded-2xl border border-line bg-surface shadow-soft">{children}</div>;
}

export function Row({
  title, subtitle, left, right, onClick, chevron = true,
}: {
  title: ReactNode; subtitle?: ReactNode; left?: ReactNode; right?: ReactNode; onClick?: () => void; chevron?: boolean;
}) {
  const Cmp: any = onClick ? 'button' : 'div';
  return (
    <Cmp
      onClick={onClick}
      className={`flex w-full items-center gap-3 border-b border-line px-4 py-3 text-left last:border-b-0 ${onClick ? 'hover:bg-plaster-2' : ''}`}
    >
      {left}
      <div className="min-w-0 flex-1">
        <div className="truncate font-semibold">{title}</div>
        {subtitle && <div className="truncate text-[13px] text-ink-faint">{subtitle}</div>}
      </div>
      {right}
      {onClick && chevron && <IconChevron width={18} height={18} className="text-ink-faint" />}
    </Cmp>
  );
}

export function Tile({ color, children }: { color: string; children: ReactNode }) {
  return (
    <span className="grid h-9 w-9 flex-none place-items-center rounded-[10px] text-white" style={{ background: color }}>
      {children}
    </span>
  );
}
