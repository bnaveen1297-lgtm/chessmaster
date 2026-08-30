import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/auth/AuthProvider';
import { Board } from '@/components/Board';
import { Wordmark } from '@/components/Wordmark';

// Everything the app offers, grouped — the "list down everything" showcase.
const GROUPS = [
  { icon: '♞', title: 'Learn', c: '#1E88E5', items: ['40-lesson course across 8 units', 'Interactive board exercises', 'Beginner → Advanced tracks', 'Progress synced to your account'] },
  { icon: '✦', title: 'Puzzles & training', c: '#111418', items: ['4,000+ themed puzzles', '7 tactic courses (forks, pins, mates…)', 'Timed practice by difficulty', 'A fresh Daily Puzzle', 'Create a puzzle from any position'] },
  { icon: '🎖️', title: 'Certification', c: '#1E88E5', items: ['A graded, timed tactics exam', 'Earn a shareable certificate'] },
  { icon: '♜', title: 'Play & compete', c: '#111418', items: ['Play the computer — 3 levels', 'Pass-and-play on one board', 'Online 1v1 in real time', 'Bullet · Blitz · Rapid clock', 'Tournaments — round-robin & knockout'] },
  { icon: '◆', title: 'Grandmaster games', c: '#1E88E5', items: ["Play a grandmaster's real moves", 'Watch replays & guess-the-move', 'Unlock tougher legends as you grow'] },
  { icon: '▲', title: 'Analyze & improve', c: '#111418', items: ['Full Stockfish game review', 'Accuracy, blunders & eval graph', 'Import from Chess.com / Lichess', 'Analyze any position (FEN)'] },
  { icon: '♛', title: 'Prep coach', c: '#1E88E5', items: ['A personalised weekly plan', 'Focus areas from your stats', 'A starter opening repertoire'] },
  { icon: '📖', title: 'Study books', c: '#111418', items: ['Annotated classic games', 'Read the ideas, play every move'] },
  { icon: '★', title: 'Progress & profile', c: '#1E88E5', items: ['XP, levels, streaks & achievements', 'Global leaderboard', 'Board themes & piece styles'] },
];

// A flat, scannable "everything included" checklist.
const CHECKLIST = [
  '40-lesson structured course', 'Interactive lessons & exercises', '4,000+ tactics puzzles', '7 themed tactic courses',
  'Timed puzzle practice', 'Daily puzzle', 'Create puzzles from a FEN', 'Save your own puzzles',
  'Graded tactics exam', 'Shareable certificate', 'Play vs computer (3 levels)', 'Pass-and-play',
  'Online 1v1 real-time', 'Bullet / Blitz / Rapid clock', 'Round-robin tournaments', 'Knockout tournaments',
  "Play grandmasters' real games", 'Watch & guess-the-move', 'Stockfish game review', 'Accuracy & blunder detection',
  'Evaluation graph', 'Import Chess.com / Lichess', 'Single-position analysis', 'Personalised prep coach',
  'Opening repertoire', 'Annotated study books', 'XP, streaks & achievements', 'Global leaderboard',
  'Board themes & piece styles', 'Cross-device account sync',
];

// Who it's for — the "built for" row.
const AUDIENCE = [
  { icon: '♙', title: 'Beginners', body: 'Start from “how the pieces move” and build real understanding, step by step.' },
  { icon: '♘', title: 'Improvers', body: 'Break your plateau with targeted tactics, game review and a weekly plan.' },
  { icon: '♖', title: 'Competitors', body: 'Prep like a pro — repertoire, GM study and a coach that builds your schedule.' },
  { icon: '♚', title: 'Fans', body: 'Watch, replay and play through the greatest games ever played.' },
];

function GoogleMark() {
  return (
    <svg className="h-5 w-5" viewBox="0 0 48 48"><path fill="#EA4335" d="M24 9.5c3.54 0 6.71 1.22 9.21 3.6l6.85-6.85C35.9 2.38 30.47 0 24 0 14.62 0 6.51 5.38 2.56 13.22l7.98 6.19C12.43 13.72 17.74 9.5 24 9.5z"/><path fill="#4285F4" d="M46.98 24.55c0-1.57-.15-3.09-.38-4.55H24v9.02h12.94c-.58 2.96-2.26 5.48-4.78 7.18l7.73 6c4.51-4.18 7.09-10.36 7.09-17.65z"/><path fill="#FBBC05" d="M10.53 28.59c-.48-1.45-.76-2.99-.76-4.59s.27-3.14.76-4.59l-7.98-6.19C.92 16.46 0 20.12 0 24c0 3.88.92 7.54 2.56 10.78l7.97-6.19z"/><path fill="#34A853" d="M24 48c6.48 0 11.93-2.13 15.89-5.81l-7.73-6c-2.15 1.45-4.92 2.3-8.16 2.3-6.26 0-11.57-4.22-13.47-9.91l-7.98 6.19C6.51 42.62 14.62 48 24 48z"/></svg>
  );
}

const COUNTRY_CODES = [
  { c: '+91', f: '🇮🇳', n: 'India' },
  { c: '+1', f: '🇺🇸', n: 'USA' },
  { c: '+44', f: '🇬🇧', n: 'UK' },
  { c: '+61', f: '🇦🇺', n: 'Australia' },
  { c: '+971', f: '🇦🇪', n: 'UAE' },
  { c: '+65', f: '🇸🇬', n: 'Singapore' },
  { c: '+49', f: '🇩🇪', n: 'Germany' },
  { c: '+33', f: '🇫🇷', n: 'France' },
  { c: '+81', f: '🇯🇵', n: 'Japan' },
  { c: '+55', f: '🇧🇷', n: 'Brazil' },
];

function AuthCard({ dark = false }: { dark?: boolean }) {
  const { signInWithGoogle, signInWithEmail, signUpWithEmail, authError, clearError } = useAuth();
  const [mode, setMode] = useState<'in' | 'up'>('in');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [firstName, setFirstName] = useState('');
  const [dialCode, setDialCode] = useState('+91');
  const [phone, setPhone] = useState('');
  const [busy, setBusy] = useState(false);
  const [notice, setNotice] = useState<string | null>(null);
  const [localErr, setLocalErr] = useState<string | null>(null);

  const submit = async () => {
    setLocalErr(null);
    if (mode === 'up') {
      if (!firstName.trim()) { setLocalErr('Please enter your name.'); return; }
      if (!/^\d{6,14}$/.test(phone.trim())) { setLocalErr('Please enter a valid phone number.'); return; }
    }
    setBusy(true); setNotice(null); clearError();
    try {
      if (mode === 'up') {
        const { needsConfirm } = await signUpWithEmail({ email, password, firstName, phone: `${dialCode} ${phone.trim()}` });
        if (needsConfirm) setNotice('Check your email to confirm your account, then sign in.');
      } else {
        await signInWithEmail(email, password);
      }
    } finally { setBusy(false); }
  };

  const inputBase = 'rounded-xl border px-4 py-2.5 outline-none focus:border-teal ' +
    (dark ? 'border-white/15 bg-white/10 text-white placeholder-white/50' : 'border-line bg-plaster text-ink');
  const inputCls = 'w-full ' + inputBase;

  return (
    <div className={`w-full max-w-sm rounded-2xl p-5 ${dark ? 'bg-white/5 ring-1 ring-white/10' : 'card'}`}>
      <button onClick={signInWithGoogle} className="mb-3 flex w-full items-center justify-center gap-3 rounded-xl bg-white px-5 py-3 font-bold text-[#1f2937] shadow-soft transition hover:-translate-y-0.5">
        <GoogleMark /> Continue with Google
      </button>
      <div className={`my-3 flex items-center gap-3 text-xs ${dark ? 'text-white/50' : 'text-ink-faint'}`}>
        <span className={`h-px flex-1 ${dark ? 'bg-white/15' : 'bg-line'}`} /> or {mode === 'in' ? 'sign in' : 'sign up'} with email <span className={`h-px flex-1 ${dark ? 'bg-white/15' : 'bg-line'}`} />
      </div>
      <div className="flex flex-col gap-2.5">
        {mode === 'up' && <input value={firstName} onChange={(e) => setFirstName(e.target.value)} placeholder="First name" className={inputCls} />}
        {mode === 'up' && (
          <div className="flex gap-2">
            <select value={dialCode} onChange={(e) => setDialCode(e.target.value)} className={inputBase + ' w-[118px] flex-none px-2.5'}>
              {COUNTRY_CODES.map((c) => <option key={c.c + c.n} value={c.c}>{c.f} {c.c}</option>)}
            </select>
            <input value={phone} onChange={(e) => setPhone(e.target.value.replace(/[^\d]/g, ''))} inputMode="numeric" placeholder="Phone number" className={inputBase + ' min-w-0 flex-1'} />
          </div>
        )}
        <input value={email} onChange={(e) => setEmail(e.target.value)} type="email" autoComplete="email" placeholder="Email" className={inputCls} />
        <input value={password} onChange={(e) => setPassword(e.target.value)} type="password" autoComplete={mode === 'in' ? 'current-password' : 'new-password'} placeholder="Password" className={inputCls}
          onKeyDown={(e) => { if (e.key === 'Enter') submit(); }} />
        <button onClick={submit} disabled={busy || !email || !password} className="btn-primary mt-1 w-full">
          {busy ? 'Please wait…' : mode === 'in' ? 'Sign in' : 'Create account'}
        </button>
      </div>
      {notice && <p className="mt-3 text-sm font-semibold text-success">{notice}</p>}
      {(localErr || authError) && <p className="mt-3 text-sm font-semibold text-danger">{localErr || authError}</p>}
      <p className={`mt-3 text-center text-sm ${dark ? 'text-white/70' : 'text-ink-soft'}`}>
        {mode === 'in' ? 'New here?' : 'Already have an account?'}{' '}
        <button onClick={() => { setMode(mode === 'in' ? 'up' : 'in'); setNotice(null); clearError(); }} className="font-bold text-teal-br underline-offset-2 hover:underline">
          {mode === 'in' ? 'Create an account' : 'Sign in'}
        </button>
      </p>
    </div>
  );
}

export function Landing() {
  const { user, loading } = useAuth();
  const nav = useNavigate();
  useEffect(() => {
    if (!loading && user) nav('/app', { replace: true });
  }, [user, loading, nav]);

  const ITALIAN = 'r1bqkbnr/pppp1ppp/2n5/4p3/2B1P3/5N2/PPPP1PPP/RNBQK2R b KQkq - 3 3';

  return (
    <div className="min-h-screen bg-plaster text-ink">
      {/* nav */}
      <header className="mx-auto flex max-w-6xl items-center justify-between px-5 py-4">
        <Wordmark />
        <a href="#start" className="btn-primary text-sm">Sign in</a>
      </header>

      {/* hero */}
      <section className="relative overflow-hidden">
        <div className="pointer-events-none absolute inset-0 -z-10 bg-gradient-to-br from-teal-deep via-teal-deep2 to-[#0a343f] opacity-[0.04]" />
        <div className="mx-auto grid max-w-6xl items-center gap-12 px-5 pb-16 pt-8 lg:grid-cols-2 lg:pb-24 lg:pt-14">
          <div>
            <p className="eyebrow">Free · Web &amp; mobile · Samarkand 2026</p>
            <h1 className="mt-4 font-display text-5xl font-black leading-[1.02] sm:text-6xl">
              Your way to become a <span className="bg-gradient-to-r from-teal-br to-teal bg-clip-text text-transparent">grandmaster.</span>
            </h1>
            <p className="mt-5 max-w-lg text-lg text-ink-soft">
              Learn chess from zero to sharp, train on thousands of tactics puzzles, and play the world — online 1v1, live
              tournaments, and real grandmaster games you can play move for move. Everything included, free.
            </p>
            <div id="start" className="mt-8"><AuthCard /></div>
            <div className="mt-7 flex flex-wrap gap-x-6 gap-y-2 font-mono text-xs text-ink-faint">
              <span>◆ 40-lesson course</span><span>◆ 4,000+ puzzles</span><span>◆ Real GM games</span>
            </div>
          </div>
          <div className="mx-auto w-full max-w-sm rounded-3xl bg-gradient-to-b from-ink to-[#20242b] p-4 shadow-lift">
            <div className="mb-3 flex items-center justify-between px-1 text-sm text-white/75"><span className="font-bold text-white">♟ Karpov</span><span className="rounded-md bg-white/10 px-2 py-0.5 font-mono text-xs">12:04</span></div>
            <Board fen={ITALIAN} interactive={false} coords />
            <div className="mt-3 flex items-center justify-between px-1 text-sm text-white/75"><span className="font-bold text-white">♙ You</span><span className="rounded-full bg-teal px-2.5 py-0.5 text-[11px] font-semibold text-white">Live board</span></div>
          </div>
        </div>
      </section>

      {/* stats */}
      <section className="bg-ink text-white">
        <div className="mx-auto grid max-w-6xl grid-cols-2 gap-6 px-5 py-8 text-center sm:grid-cols-4">
          {[['40', 'Lessons · 8 units'], ['4,000+', 'Tactics puzzles'], ['9', 'Feature areas'], ['100%', 'Free · no paywall']].map(([n, l]) => (
            <div key={l}><div className="font-display text-3xl font-black text-teal-br sm:text-4xl">{n}</div><div className="mt-1 font-mono text-[11px] uppercase tracking-wider text-[#8fb0b3]">{l}</div></div>
          ))}
        </div>
      </section>

      {/* free band */}
      <section className="mx-auto max-w-6xl px-5 pt-14">
        <div className="rounded-3xl border border-line bg-white p-8 text-center shadow-soft sm:p-10">
          <p className="eyebrow">Completely free</p>
          <h2 className="mt-3 font-display text-3xl font-black sm:text-4xl">Everything unlocked. <span className="text-teal">₹0 / $0.</span></h2>
          <p className="mx-auto mt-3 max-w-xl text-[15px] text-ink-soft">No tiers. No trial. No credit card. Every feature below is included for everyone — learn, train, play, analyze and grow, all in one app.</p>
          <div className="mt-5 flex flex-wrap justify-center gap-x-6 gap-y-2 font-mono text-xs text-ink-faint">
            <span>✓ No paywall</span><span>✓ No “premium” lock</span><span>✓ Web &amp; mobile</span><span>✓ Free forever</span>
          </div>
        </div>
      </section>

      {/* everything you get — grouped */}
      <section className="mx-auto max-w-6xl px-5 py-16">
        <div className="mx-auto mb-10 max-w-2xl text-center">
          <p className="eyebrow">Everything you get</p>
          <h2 className="mt-3 font-display text-3xl font-black sm:text-4xl">One app. The whole journey.</h2>
          <p className="mt-3 text-[15px] text-ink-soft">From your first lesson to grandmaster prep — here’s all of it, free.</p>
        </div>
        <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
          {GROUPS.map((g) => (
            <div key={g.title} className="card p-6 transition hover:-translate-y-1">
              <div className="flex items-center gap-3">
                <span className="grid h-11 w-11 flex-none place-items-center rounded-xl text-2xl" style={{ background: g.c + '18', color: g.c }}>{g.icon}</span>
                <h3 className="font-display text-lg font-black">{g.title}</h3>
              </div>
              <ul className="mt-4 space-y-2">
                {g.items.map((it) => (
                  <li key={it} className="flex gap-2 text-[14px] text-ink-soft"><span className="mt-0.5 flex-none font-bold text-teal">✓</span><span>{it}</span></li>
                ))}
              </ul>
            </div>
          ))}
        </div>
      </section>

      {/* full checklist */}
      <section className="bg-plaster-2">
        <div className="mx-auto max-w-6xl px-5 py-16">
          <div className="mx-auto mb-8 max-w-2xl text-center">
            <p className="eyebrow">The full list</p>
            <h2 className="mt-3 font-display text-3xl font-black sm:text-4xl">Everything included — free</h2>
            <p className="mt-3 text-[15px] text-ink-soft">Every capability in chesshub360, at a glance. All of it, for everyone.</p>
          </div>
          <div className="grid gap-x-6 gap-y-2.5 rounded-2xl border border-line bg-white p-6 sm:grid-cols-2 lg:grid-cols-3">
            {CHECKLIST.map((f) => (
              <div key={f} className="flex items-center gap-2.5 text-[14px]">
                <span className="grid h-5 w-5 flex-none place-items-center rounded-full bg-success/15 text-[11px] font-bold text-success">✓</span>
                <span>{f}</span>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* who it's for */}
      <section className="mx-auto max-w-6xl px-5 py-16">
        <div className="mx-auto mb-8 max-w-2xl text-center">
          <p className="eyebrow">Built for every player</p>
          <h2 className="mt-3 font-display text-3xl font-black sm:text-4xl">Wherever you are, it fits</h2>
        </div>
        <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
          {AUDIENCE.map((a) => (
            <div key={a.title}>
              <span className="grid h-11 w-11 place-items-center rounded-xl bg-ink text-2xl text-white">{a.icon}</span>
              <h3 className="mt-3 font-display text-lg font-black">{a.title}</h3>
              <p className="mt-1 text-[14px] text-ink-soft">{a.body}</p>
            </div>
          ))}
        </div>
      </section>

      {/* cta */}
      <section className="relative overflow-hidden bg-gradient-to-br from-teal-deep to-teal-deep2 text-white">
        <div className="mx-auto max-w-2xl px-5 py-20 text-center">
          <p className="eyebrow">Free forever</p>
          <h2 className="mt-3 font-display text-4xl font-black sm:text-5xl">Ready to become a grandmaster?</h2>
          <p className="mt-4 text-lg text-white/75">Create your free account and everything above is yours.</p>
          <div className="mt-8 flex justify-center"><AuthCard dark /></div>
        </div>
      </section>

      <footer className="bg-teal-deep py-8 text-center text-sm text-[#9FBEC0]">
        © 2026 chesshub360 · Samarkand · Uzbekistan · 15–27 Sep 2026
      </footer>
    </div>
  );
}
