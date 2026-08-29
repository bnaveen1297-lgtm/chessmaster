import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Board } from '@/components/Board';
import { usePrefs, BOARD_THEMES, type BoardThemeId, type Level, type PieceStyle, type Role } from '@/game/prefs';

const ROLES: { id: Role; label: string; desc: string; icon: string }[] = [
  { id: 'student', label: "I'm a student", desc: 'Learning chess in class or with a coach', icon: '🎓' },
  { id: 'improver', label: 'I want to improve', desc: 'Get better with lessons and practice', icon: '📈' },
  { id: 'competitor', label: 'I compete', desc: 'Tournaments and rated online games', icon: '🏆' },
  { id: 'casual', label: 'Just for fun', desc: 'Play casually and solve puzzles', icon: '♟️' },
];
const LEVELS: { id: Level; desc: string }[] = [
  { id: 'Beginner', desc: 'New to chess or still learning the rules and basic tactics' },
  { id: 'Intermediate', desc: 'Comfortable with tactics; learning openings and structure' },
  { id: 'Advanced', desc: 'Confident player working on deeper strategy and endgames' },
];

export function Onboarding() {
  const { prefs, update } = usePrefs();
  const nav = useNavigate();
  const [step, setStep] = useState(0);
  const [role, setRole] = useState<Role | ''>(prefs.role);
  const [wantsCoach, setWantsCoach] = useState(prefs.wantsCoach);
  const [level, setLevel] = useState<Level>(prefs.level);
  const [boardTheme, setBoardTheme] = useState<BoardThemeId>(prefs.boardTheme);
  const [pieceStyle, setPieceStyle] = useState<PieceStyle>(prefs.pieceStyle);

  const steps = 4;
  const next = () => setStep((s) => Math.min(s + 1, steps - 1));
  const back = () => setStep((s) => Math.max(s - 1, 0));
  const finish = () => {
    update({ role, wantsCoach, level, boardTheme, pieceStyle, onboarded: true });
    nav('/app', { replace: true });
  };

  const PREVIEW = 'r1bqkbnr/pppp1ppp/2n5/4p3/2B1P3/5N2/PPPP1PPP/RNBQK2R b KQkq - 3 3';

  return (
    <div className="min-h-screen bg-plaster">
      <div className="mx-auto flex max-w-lg flex-col px-5 py-8">
        <img src="/logo.png" alt="chesshub360" className="mx-auto mb-6 h-9" />
        {/* progress */}
        <div className="mb-7 flex gap-1.5">
          {Array.from({ length: steps }).map((_, i) => (
            <div key={i} className={`h-1.5 flex-1 rounded-full ${i <= step ? 'bg-teal' : 'bg-plaster-2'}`} />
          ))}
        </div>

        {step === 0 && (
          <Step title="What brings you to chesshub360?" sub="We'll tailor your home, lessons and puzzles to you.">
            <div className="grid gap-3">
              {ROLES.map((r) => (
                <Choice key={r.id} active={role === r.id} onClick={() => setRole(r.id)} title={`${r.icon}  ${r.label}`} desc={r.desc} />
              ))}
            </div>
          </Step>
        )}

        {step === 1 && (
          <Step title="Want a coach's guidance?" sub="Turn on coaching tips — hints, move explanations and a study plan as you play.">
            <div className="grid gap-3">
              <Choice active={wantsCoach} onClick={() => setWantsCoach(true)} title="✅  Yes, coach me" desc="Show tips, explanations and recommended next steps" />
              <Choice active={!wantsCoach} onClick={() => setWantsCoach(false)} title="🙅  I'll explore on my own" desc="No coaching prompts — just the app" />
            </div>
          </Step>
        )}

        {step === 2 && (
          <Step title="What's your level?" sub="We'll show lessons and puzzles that fit — you can change this anytime.">
            <div className="grid gap-3">
              {LEVELS.map((l) => (
                <Choice key={l.id} active={level === l.id} onClick={() => setLevel(l.id)} title={l.id} desc={l.desc} />
              ))}
            </div>
          </Step>
        )}

        {step === 3 && (
          <Step title="Make it yours" sub="Pick a board colour and piece style. Change them whenever you like in your profile.">
            <div className="mx-auto mb-5 max-w-[280px]">
              <Board fen={PREVIEW} interactive={false} coords boardTheme={boardTheme} pieceStyle={pieceStyle} />
            </div>
            <p className="mb-2 text-[11px] font-bold uppercase tracking-wider text-ink-faint">Board colour</p>
            <div className="mb-5 grid grid-cols-3 gap-3">
              {(Object.keys(BOARD_THEMES) as BoardThemeId[]).map((id) => {
                const t = BOARD_THEMES[id];
                return (
                  <button key={id} onClick={() => setBoardTheme(id)}
                    className={`rounded-xl border-2 p-2 text-center transition ${boardTheme === id ? 'border-teal' : 'border-transparent hover:border-line'}`}>
                    <div className="mx-auto mb-1.5 grid h-10 w-10 grid-cols-2 grid-rows-2 overflow-hidden rounded-md">
                      <span style={{ background: t.light }} /><span style={{ background: t.dark }} />
                      <span style={{ background: t.dark }} /><span style={{ background: t.light }} />
                    </div>
                    <span className="text-xs font-semibold">{t.name}</span>
                  </button>
                );
              })}
            </div>
            <p className="mb-2 text-[11px] font-bold uppercase tracking-wider text-ink-faint">Piece style</p>
            <div className="flex gap-3">
              {(['classic', 'symbol'] as PieceStyle[]).map((p) => (
                <button key={p} onClick={() => setPieceStyle(p)}
                  className={`flex-1 rounded-xl border-2 py-3 font-semibold capitalize transition ${pieceStyle === p ? 'border-teal' : 'border-line'}`}>
                  {p === 'classic' ? '♞ Classic' : '♟ Symbols'}
                </button>
              ))}
            </div>
          </Step>
        )}

        {/* actions */}
        <div className="mt-8 flex gap-3">
          {step > 0 && <button onClick={back} className="btn-ghost">Back</button>}
          {step < steps - 1 ? (
            <button onClick={next} disabled={step === 0 && !role} className="btn-primary flex-1">Continue</button>
          ) : (
            <button onClick={finish} className="btn-primary flex-1">Start playing →</button>
          )}
        </div>
        <button onClick={finish} className="mt-3 text-center text-sm font-semibold text-ink-faint hover:text-ink">Skip for now</button>
      </div>
    </div>
  );
}

function Step({ title, sub, children }: { title: string; sub: string; children: React.ReactNode }) {
  return (
    <div className="rise">
      <h1 className="font-display text-2xl font-black">{title}</h1>
      <p className="mb-6 mt-2 text-ink-soft">{sub}</p>
      {children}
    </div>
  );
}

function Choice({ active, onClick, title, desc }: { active: boolean; onClick: () => void; title: string; desc: string }) {
  return (
    <button onClick={onClick}
      className={`rounded-2xl border-2 bg-surface p-4 text-left transition ${active ? 'border-teal shadow-soft' : 'border-line hover:border-ink-faint'}`}>
      <div className="font-bold">{title}</div>
      <div className="mt-0.5 text-sm text-ink-soft">{desc}</div>
    </button>
  );
}
