import { useEffect, useState } from 'react';
import { useAuth } from '@/auth/AuthProvider';
import { useProgress, levelFromXp, ACHIEVEMENTS } from '@/game/progress';
import { usePrefs, BOARD_THEMES, type BoardThemeId, type Level, type PieceStyle } from '@/game/prefs';
import { PageHeader } from '@/components/ui';
import { Board } from '@/components/Board';
import { orderedLessonIds } from '@shared/data/content';

export function Profile() {
  const { user, signOut } = useAuth();
  const { progress } = useProgress();
  const { prefs, update, name, setName } = usePrefs();
  const [nameInput, setNameInput] = useState(name);
  const [nameSaved, setNameSaved] = useState(false);
  useEffect(() => { setNameInput((v) => v || name); }, [name]);
  const saveName = () => { if (nameInput.trim()) { setName(nameInput); setNameSaved(true); setTimeout(() => setNameSaved(false), 1500); } };
  const earned = new Set(progress.achievements);
  const stats: [string, string | number][] = [
    ['Level', levelFromXp(progress.xp)],
    ['XP', progress.xp],
    ['Day streak', progress.streakDays],
    ['Puzzles solved', progress.puzzlesSolved],
    ['Games played', progress.gamesPlayed],
    ['Games won', progress.gamesWon],
    ['Lessons', `${progress.lessonsCompleted.length}/${orderedLessonIds.length}`],
  ];

  return (
    <div>
      <PageHeader eyebrow="Profile" title={name || user?.firstName || 'Player'} sub={user?.email} />

      <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
        {stats.map(([l, v]) => (
          <div key={l} className="card px-4 py-3">
            <div className="font-mono text-[11px] uppercase tracking-wider text-ink-faint">{l}</div>
            <div className="mt-0.5 font-display text-2xl font-black">{v}</div>
          </div>
        ))}
      </div>

      <h2 className="mb-3 mt-8 font-display text-xl font-black">Achievements</h2>
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-5">
        {ACHIEVEMENTS.map((a) => {
          const got = earned.has(a.id);
          return (
            <div key={a.id} className={`card flex flex-col items-center gap-1 p-4 text-center ${got ? '' : 'opacity-40'}`}>
              <span className={`grid h-11 w-11 place-items-center rounded-full text-xl ${got ? 'bg-gold text-white' : 'bg-plaster-2 text-ink-faint'}`}>{a.icon}</span>
              <span className="text-xs font-semibold">{a.title}</span>
            </div>
          );
        })}
      </div>

      {/* preferences */}
      <h2 className="mb-3 mt-8 font-display text-xl font-black">Preferences</h2>
      <div className="grid gap-4 md:grid-cols-2">
        <div className="card p-5">
          <p className="mb-2 text-[11px] font-bold uppercase tracking-wider text-ink-faint">Display name</p>
          <div className="mb-5 flex gap-2">
            <input value={nameInput} onChange={(e) => setNameInput(e.target.value)} maxLength={40} placeholder="Your name"
              className="min-w-0 flex-1 rounded-lg border border-line bg-plaster px-3 py-2 outline-none focus:border-teal" />
            <button onClick={saveName} className="flex-none rounded-lg bg-ink px-3 py-2 text-sm font-semibold text-white">{nameSaved ? 'Saved ✓' : 'Save'}</button>
          </div>
          <p className="mb-2 text-[11px] font-bold uppercase tracking-wider text-ink-faint">Your level</p>
          <div className="flex flex-wrap gap-2">
            {(['Beginner', 'Intermediate', 'Advanced'] as Level[]).map((l) => (
              <button key={l} onClick={() => update({ level: l })} className={`chip ${prefs.level === l ? 'bg-ink text-white' : 'bg-plaster-2 text-ink-soft'}`}>{l}</button>
            ))}
          </div>
          <p className="mb-2 mt-5 text-[11px] font-bold uppercase tracking-wider text-ink-faint">Coaching</p>
          <button onClick={() => update({ wantsCoach: !prefs.wantsCoach })} className={`chip ${prefs.wantsCoach ? 'bg-teal text-white' : 'bg-plaster-2 text-ink-soft'}`}>
            {prefs.wantsCoach ? 'Coaching tips: on' : 'Coaching tips: off'}
          </button>
          <p className="mb-2 mt-5 text-[11px] font-bold uppercase tracking-wider text-ink-faint">Piece style</p>
          <div className="flex gap-2">
            {(['classic', 'symbol'] as PieceStyle[]).map((p) => (
              <button key={p} onClick={() => update({ pieceStyle: p })} className={`chip capitalize ${prefs.pieceStyle === p ? 'bg-ink text-white' : 'bg-plaster-2 text-ink-soft'}`}>{p === 'classic' ? '♞ Classic' : '♟ Symbols'}</button>
            ))}
          </div>
        </div>
        <div className="card p-5">
          <p className="mb-2 text-[11px] font-bold uppercase tracking-wider text-ink-faint">Board colour</p>
          <div className="mb-4 grid grid-cols-3 gap-2">
            {(Object.keys(BOARD_THEMES) as BoardThemeId[]).map((id) => {
              const t = BOARD_THEMES[id];
              return (
                <button key={id} onClick={() => update({ boardTheme: id })} className={`rounded-xl border-2 p-2 text-center transition ${prefs.boardTheme === id ? 'border-teal' : 'border-transparent hover:border-line'}`}>
                  <div className="mx-auto mb-1 grid h-8 w-8 grid-cols-2 grid-rows-2 overflow-hidden rounded"><span style={{ background: t.light }} /><span style={{ background: t.dark }} /><span style={{ background: t.dark }} /><span style={{ background: t.light }} /></div>
                  <span className="text-[11px] font-semibold">{t.name}</span>
                </button>
              );
            })}
          </div>
          <div className="mx-auto max-w-[180px]"><Board fen="8/8/8/3nk3/4P3/3NK3/8/8 w - - 0 1" interactive={false} coords={false} /></div>
        </div>
      </div>

      <button onClick={signOut} className="btn-ghost mt-8">Sign out</button>
    </div>
  );
}
