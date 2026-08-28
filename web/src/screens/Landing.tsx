import { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/auth/AuthProvider';
import { Board } from '@/components/Board';

const FEATURES = [
  { icon: '♞', title: 'Learn', body: 'A 40-lesson course across 8 units with interactive board exercises.', c: '#0E9AA7' },
  { icon: '✦', title: 'Puzzles', body: 'Millions of tactics by rating band, plus a fresh Daily Puzzle.', c: '#B8912F' },
  { icon: '♜', title: 'Play', body: 'Face the engine, a friend, or the world online in real time.', c: '#5B4BE0' },
  { icon: '♛', title: 'Tournaments', body: 'Round-robin & knockout events with automatic pairings.', c: '#C8524B' },
  { icon: '◆', title: 'Master Base', body: "Play against a grandmaster's real moves, move for move.", c: '#2E9E6B' },
  { icon: '▲', title: 'Analyze', body: 'Chess.com-style accuracy, blunder detection and an eval graph.', c: '#0E9AA7' },
];

function GoogleButton({ label = 'Continue with Google' }: { label?: string }) {
  const { signInWithGoogle } = useAuth();
  return (
    <button onClick={signInWithGoogle} className="inline-flex items-center gap-3 rounded-2xl bg-white px-6 py-3.5 font-bold text-[#1f2937] shadow-lift transition hover:-translate-y-0.5">
      <svg className="h-5 w-5" viewBox="0 0 48 48"><path fill="#EA4335" d="M24 9.5c3.54 0 6.71 1.22 9.21 3.6l6.85-6.85C35.9 2.38 30.47 0 24 0 14.62 0 6.51 5.38 2.56 13.22l7.98 6.19C12.43 13.72 17.74 9.5 24 9.5z"/><path fill="#4285F4" d="M46.98 24.55c0-1.57-.15-3.09-.38-4.55H24v9.02h12.94c-.58 2.96-2.26 5.48-4.78 7.18l7.73 6c4.51-4.18 7.09-10.36 7.09-17.65z"/><path fill="#FBBC05" d="M10.53 28.59c-.48-1.45-.76-2.99-.76-4.59s.27-3.14.76-4.59l-7.98-6.19C.92 16.46 0 20.12 0 24c0 3.88.92 7.54 2.56 10.78l7.97-6.19z"/><path fill="#34A853" d="M24 48c6.48 0 11.93-2.13 15.89-5.81l-7.73-6c-2.15 1.45-4.92 2.3-8.16 2.3-6.26 0-11.57-4.22-13.47-9.91l-7.98 6.19C6.51 42.62 14.62 48 24 48z"/></svg>
      {label}
    </button>
  );
}

export function Landing() {
  const { user, loading, authError, signInWithGoogle } = useAuth();
  const nav = useNavigate();
  useEffect(() => {
    if (!loading && user) nav('/app', { replace: true });
  }, [user, loading, nav]);

  const ITALIAN = 'r1bqkbnr/pppp1ppp/2n5/4p3/2B1P3/5N2/PPPP1PPP/RNBQK2R b KQkq - 3 3';

  return (
    <div className="min-h-screen bg-plaster text-ink">
      {/* nav */}
      <header className="mx-auto flex max-w-6xl items-center justify-between px-5 py-4">
        <div className="flex items-center gap-2.5">
          <span className="grid h-9 w-9 place-items-center rounded-[11px] bg-gradient-to-br from-teal-deep to-teal text-[19px] text-white">♚</span>
          <span className="font-display text-xl font-black tracking-wide">ChessMaster</span>
        </div>
        <button onClick={signInWithGoogle} className="btn-primary text-sm">Sign in</button>
      </header>

      {/* hero */}
      <section className="relative overflow-hidden">
        <div className="pointer-events-none absolute inset-0 -z-10 bg-gradient-to-br from-teal-deep via-teal-deep2 to-[#0a343f] opacity-[0.04]" />
        <div className="mx-auto grid max-w-6xl items-center gap-12 px-5 pb-16 pt-8 lg:grid-cols-2 lg:pb-24 lg:pt-14">
          <div>
            <p className="eyebrow text-gold">Free · Web &amp; mobile · Samarkand 2026</p>
            <h1 className="mt-4 font-display text-5xl font-black leading-[1.02] sm:text-6xl">
              Your way to become a <span className="bg-gradient-to-r from-gold to-teal bg-clip-text text-transparent">King.</span>
            </h1>
            <p className="mt-5 max-w-lg text-lg text-ink-soft">
              Learn chess from zero to sharp, solve millions of puzzles, and play the world — online 1v1, live
              tournaments, and real grandmaster games you can play move for move.
            </p>
            <div className="mt-8"><GoogleButton /></div>
            {authError && <p className="mt-3 text-sm font-semibold text-danger">{authError}</p>}
            <div className="mt-7 flex flex-wrap gap-x-6 gap-y-2 font-mono text-xs text-ink-faint">
              <span>◆ 40-lesson course</span><span>◆ Millions of puzzles</span><span>◆ Real GM games</span>
            </div>
          </div>
          <div className="mx-auto w-full max-w-sm rounded-3xl bg-gradient-to-b from-[#10424d] to-[#0b333d] p-4 shadow-lift">
            <div className="mb-3 flex items-center justify-between px-1 text-sm text-[#cfe3e4]"><span className="font-bold text-white">♟ Karpov</span><span className="rounded-md bg-white/10 px-2 py-0.5 font-mono text-xs">12:04</span></div>
            <Board fen={ITALIAN} interactive={false} coords />
            <div className="mt-3 flex items-center justify-between px-1 text-sm text-[#cfe3e4]"><span className="font-bold text-white">♙ You</span><span className="rounded-full bg-gold-soft px-2.5 py-0.5 text-[11px] font-semibold text-teal-deep">Live board</span></div>
          </div>
        </div>
      </section>

      {/* stats */}
      <section className="bg-ink text-white">
        <div className="mx-auto grid max-w-6xl grid-cols-2 gap-6 px-5 py-8 text-center sm:grid-cols-4">
          {[['40', 'Lessons · 8 units'], ['Millions', 'Puzzles + daily'], ['2', 'Tournament formats'], ['100%', 'Free to play']].map(([n, l]) => (
            <div key={l}><div className="font-display text-3xl font-black text-gold-br sm:text-4xl">{n}</div><div className="mt-1 font-mono text-[11px] uppercase tracking-wider text-[#8fb0b3]">{l}</div></div>
          ))}
        </div>
      </section>

      {/* features */}
      <section className="mx-auto max-w-6xl px-5 py-16">
        <div className="mx-auto mb-10 max-w-2xl text-center">
          <p className="eyebrow">Everything in one app</p>
          <h2 className="mt-3 font-display text-3xl font-black sm:text-4xl">A complete chess academy &amp; arena</h2>
        </div>
        <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
          {FEATURES.map((f) => (
            <div key={f.title} className="card p-7 transition hover:-translate-y-1">
              <span className="mb-4 grid h-11 w-11 place-items-center rounded-xl text-2xl" style={{ background: f.c + '22', color: f.c }}>{f.icon}</span>
              <h3 className="font-display text-xl font-black">{f.title}</h3>
              <p className="mt-2 text-[15px] text-ink-soft">{f.body}</p>
            </div>
          ))}
        </div>
      </section>

      {/* cta */}
      <section className="relative overflow-hidden bg-gradient-to-br from-teal-deep to-teal-deep2 text-white">
        <div className="mx-auto max-w-2xl px-5 py-20 text-center">
          <p className="eyebrow text-gold">Free forever</p>
          <h2 className="mt-3 font-display text-4xl font-black sm:text-5xl">Ready to become a King?</h2>
          <p className="mt-4 text-lg text-[#cfe3e4]">Sign in with Google and everything above is yours.</p>
          <div className="mt-8"><GoogleButton /></div>
        </div>
      </section>

      <footer className="bg-teal-deep py-8 text-center text-sm text-[#9FBEC0]">
        © 2026 ChessMaster · Samarkand · Uzbekistan · 15–27 Sep 2026
      </footer>
    </div>
  );
}
