import { useEffect, useRef, useState } from 'react';
import { PageHeader } from '@/components/ui';
import { useAuth } from '@/auth/AuthProvider';
import { usePrefs } from '@/game/prefs';
import { useProgress, levelFromXp } from '@/game/progress';
import { readWeaknessProfile } from '@/lib/learningPath';
import { askCoach, aiCoachAvailable, type CoachMsg } from '@/lib/aiCoach';

const QUICK = [
  'What should I work on this week?',
  'Why do I keep losing?',
  'How do I stop blundering?',
  'Explain my biggest weakness',
  'Give me a study plan',
  'What opening should I play?',
];

export function AICoach() {
  const { user } = useAuth();
  const { prefs, name } = usePrefs();
  const { progress } = useProgress();
  const [msgs, setMsgs] = useState<CoachMsg[]>([]);
  const [input, setInput] = useState('');
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState<string | null>(null);
  const endRef = useRef<HTMLDivElement>(null);

  const profile = readWeaknessProfile(user?.id);
  const context = {
    level: prefs.level,
    profile: profile ?? undefined,
    stats: { puzzlesSolved: progress.puzzlesSolved, gamesPlayed: progress.gamesPlayed, level: levelFromXp(progress.xp) },
    name: name || undefined,
  };

  useEffect(() => { endRef.current?.scrollIntoView({ behavior: 'smooth' }); }, [msgs, busy]);

  const send = async (text: string) => {
    const q = text.trim();
    if (!q || busy) return;
    setErr(null);
    const next: CoachMsg[] = [...msgs, { role: 'user', content: q }];
    setMsgs(next); setInput(''); setBusy(true);
    try {
      const reply = await askCoach(next, context);
      setMsgs([...next, { role: 'assistant', content: reply }]);
    } catch (e: any) {
      setErr(e?.message || 'The coach had a problem.');
      setMsgs(next); // keep the question; let them retry
    } finally { setBusy(false); }
  };

  if (!aiCoachAvailable()) {
    return (
      <div className="mx-auto max-w-2xl">
        <PageHeader eyebrow="AI Coach" title="Your personal coach" />
        <div className="card p-6 text-ink-soft">Sign in to chat with your AI coach.</div>
      </div>
    );
  }

  return (
    <div className="mx-auto flex max-w-2xl flex-col" style={{ minHeight: 'calc(100vh - 8rem)' }}>
      <PageHeader eyebrow="AI Coach" title="Ask your coach anything"
        sub="A real coach that has read your games. Ask about your weaknesses, what to study, an opening, or why a game went wrong." />

      {/* conversation */}
      <div className="flex-1 space-y-3">
        {msgs.length === 0 && (
          <div className="rounded-2xl border border-line bg-surface p-5">
            <p className="font-bold">👋 Hi{name ? ` ${name}` : ''}, I’m your coach.</p>
            <p className="mt-1 text-[14px] text-ink-soft">
              {profile ? `I’ve looked at ${profile.games} of your games. Ask me anything — or start here:` : 'Import your games in the analyzer and I’ll tailor advice to your real play. Meanwhile, ask me anything:'}
            </p>
            <div className="mt-3 flex flex-wrap gap-2">
              {QUICK.map((q) => (
                <button key={q} onClick={() => send(q)} className="chip bg-plaster-2 text-ink-soft hover:bg-teal/10 hover:text-teal">{q}</button>
              ))}
            </div>
          </div>
        )}
        {msgs.map((m, i) => (
          <div key={i} className={`flex ${m.role === 'user' ? 'justify-end' : 'justify-start'}`}>
            <div className={`max-w-[85%] whitespace-pre-wrap rounded-2xl px-4 py-2.5 text-[14px] leading-relaxed ${m.role === 'user' ? 'bg-ink text-white' : 'border border-line bg-surface text-ink'}`}>
              {m.role === 'assistant' && <span className="mr-1">♟️</span>}{m.content}
            </div>
          </div>
        ))}
        {busy && (
          <div className="flex justify-start">
            <div className="rounded-2xl border border-line bg-surface px-4 py-2.5 text-[14px] text-ink-faint">Coach is thinking…</div>
          </div>
        )}
        {err && <p className="text-center text-[13px] font-semibold text-danger">{err}</p>}
        <div ref={endRef} />
      </div>

      {/* composer */}
      <div className="sticky bottom-0 mt-4 flex gap-2 bg-plaster/90 py-3 backdrop-blur">
        <input value={input} onChange={(e) => setInput(e.target.value)} onKeyDown={(e) => { if (e.key === 'Enter') send(input); }}
          placeholder="Ask your coach…" disabled={busy}
          className="flex-1 rounded-full border border-line bg-surface px-4 py-3 outline-none focus:border-teal disabled:opacity-60" />
        <button onClick={() => send(input)} disabled={busy || !input.trim()} className="btn-primary rounded-full px-5 disabled:opacity-50">Send</button>
      </div>
    </div>
  );
}
