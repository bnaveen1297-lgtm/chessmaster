import { useState, type ReactNode } from 'react';
import { NavLink, useLocation } from 'react-router-dom';
import { useAuth } from '@/auth/AuthProvider';
import { useProgress, levelFromXp, xpIntoLevel } from '@/game/progress';
import { IconHome, IconLearn, IconPuzzle, IconPlay, IconCrown, IconGlobe, IconTrophy, IconChart } from './icons';

const NAV = [
  { to: '/app', label: 'Home', Icon: IconHome, end: true },
  { to: '/app/learn', label: 'Learn', Icon: IconLearn },
  { to: '/app/puzzles', label: 'Puzzles', Icon: IconPuzzle },
  { to: '/app/play', label: 'Play', Icon: IconPlay },
  { to: '/app/masters', label: 'Masters', Icon: IconCrown },
];
const MORE = [
  { to: '/app/leaderboard', label: 'Leaderboard', Icon: IconTrophy },
  { to: '/app/tournaments', label: 'Tournaments', Icon: IconTrophy },
  { to: '/app/olympiad', label: 'Olympiad', Icon: IconGlobe },
  { to: '/app/analyze', label: 'Analyze', Icon: IconChart },
];

function Brand() {
  return (
    <NavLink to="/app" className="flex items-center gap-2.5">
      <span className="grid h-9 w-9 place-items-center rounded-[11px] bg-gradient-to-br from-teal-deep to-teal text-[19px] text-white shadow-inner">♚</span>
      <span className="font-display text-[20px] font-black tracking-wide">ChessMaster</span>
    </NavLink>
  );
}

function UserChip() {
  const { user, signOut } = useAuth();
  const { progress } = useProgress();
  const lvl = levelFromXp(progress.xp);
  const pct = xpIntoLevel(progress.xp);
  if (!user) return null;
  return (
    <div className="rounded-2xl border border-line bg-plaster-2 p-3">
      <div className="flex items-center gap-3">
        {user.avatarUrl ? (
          <img src={user.avatarUrl} alt="" className="h-9 w-9 rounded-full" />
        ) : (
          <span className="grid h-9 w-9 place-items-center rounded-full bg-teal text-white">{(user.firstName || user.email || '?')[0]?.toUpperCase()}</span>
        )}
        <div className="min-w-0 flex-1">
          <div className="truncate text-sm font-bold">{user.firstName || 'Player'}</div>
          <div className="font-mono text-[11px] text-ink-faint">Level {lvl}</div>
        </div>
        <button onClick={signOut} className="text-xs font-semibold text-ink-faint hover:text-danger">Sign out</button>
      </div>
      <div className="mt-2 h-1.5 overflow-hidden rounded-full bg-line">
        <div className="h-full rounded-full bg-gold" style={{ width: `${pct}%` }} />
      </div>
    </div>
  );
}

export function AppShell({ children }: { children: ReactNode }) {
  const [moreOpen, setMoreOpen] = useState(false);
  const loc = useLocation();
  const items = [...NAV, ...MORE];

  return (
    <div className="min-h-full bg-plaster">
      {/* desktop sidebar */}
      <aside className="fixed inset-y-0 left-0 z-30 hidden w-64 flex-col border-r border-line bg-surface/70 px-4 py-5 backdrop-blur lg:flex">
        <div className="px-2"><Brand /></div>
        <nav className="mt-7 flex flex-1 flex-col gap-1">
          {items.map(({ to, label, Icon, end }) => (
            <NavLink key={to} to={to} end={end as boolean | undefined}
              className={({ isActive }) =>
                `flex items-center gap-3 rounded-xl px-3 py-2.5 text-[15px] font-semibold transition ${
                  isActive ? 'bg-ink text-white' : 'text-ink-soft hover:bg-plaster-2'
                }`
              }>
              <Icon /> {label}
            </NavLink>
          ))}
        </nav>
        <UserChip />
      </aside>

      {/* mobile top bar */}
      <header className="sticky top-0 z-30 flex h-14 items-center justify-between border-b border-line bg-plaster/85 px-4 backdrop-blur lg:hidden">
        <Brand />
        <NavLink to="/app/profile" className="grid h-9 w-9 place-items-center rounded-full bg-plaster-2 text-ink-soft">
          <IconChartAvatar />
        </NavLink>
      </header>

      {/* content */}
      <main className="lg:pl-64">
        <div className="mx-auto w-full max-w-5xl px-4 pb-28 pt-5 sm:px-6 lg:pb-12 lg:pt-8" key={loc.pathname}>
          <div className="rise">{children}</div>
        </div>
      </main>

      {/* mobile bottom nav */}
      <nav className="fixed inset-x-0 bottom-0 z-30 flex items-stretch justify-around border-t border-line bg-surface/95 pb-[env(safe-area-inset-bottom)] backdrop-blur lg:hidden">
        {NAV.map(({ to, label, Icon, end }) => (
          <NavLink key={to} to={to} end={end as boolean | undefined}
            className={({ isActive }) =>
              `flex flex-1 flex-col items-center gap-0.5 py-2 text-[11px] font-semibold ${isActive ? 'text-ink' : 'text-ink-faint'}`
            }>
            <Icon width={22} height={22} /> {label}
          </NavLink>
        ))}
        <button onClick={() => setMoreOpen(true)} className="flex flex-1 flex-col items-center gap-0.5 py-2 text-[11px] font-semibold text-ink-faint">
          <IconTrophy width={22} height={22} /> More
        </button>
      </nav>

      {/* mobile "more" sheet */}
      {moreOpen && (
        <div className="fixed inset-0 z-40 lg:hidden" onClick={() => setMoreOpen(false)}>
          <div className="absolute inset-0 bg-ink/40" />
          <div className="absolute inset-x-0 bottom-0 rounded-t-3xl border-t border-line bg-surface p-4 pb-8" onClick={(e) => e.stopPropagation()}>
            <div className="mx-auto mb-3 h-1.5 w-10 rounded-full bg-line" />
            {MORE.map(({ to, label, Icon }) => (
              <NavLink key={to} to={to} onClick={() => setMoreOpen(false)}
                className="flex items-center gap-3 rounded-xl px-3 py-3 text-[15px] font-semibold text-ink-soft hover:bg-plaster-2">
                <Icon /> {label}
              </NavLink>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

function IconChartAvatar() {
  const { user } = useAuth();
  if (user?.avatarUrl) return <img src={user.avatarUrl} alt="" className="h-9 w-9 rounded-full" />;
  return <span className="text-sm font-bold">{(user?.firstName || user?.email || '?')[0]?.toUpperCase()}</span>;
}
