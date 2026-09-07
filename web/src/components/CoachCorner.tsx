import { useEffect, useRef, useState } from 'react';
import { COACH_EVENT, coachVoiceOn, setCoachVoice, speak, type CoachMessage } from '@/game/coach';

/**
 * A friendly coach that lives in the corner and talks. Any screen calls
 * sayCoach(); this shows a speech bubble for a few seconds and, if the viewer
 * has enabled voice (🔈), reads it aloud. Mounted once in the app shell.
 */
const FACE: Record<string, string> = { happy: '😄', sad: '😔', think: '🤔', neutral: '♟️' };

export function CoachCorner() {
  const [msg, setMsg] = useState<CoachMessage | null>(null);
  const [voice, setVoice] = useState(false);
  const hideRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => { setVoice(coachVoiceOn()); }, []);

  useEffect(() => {
    const onSay = (e: Event) => {
      const m = (e as CustomEvent<CoachMessage>).detail;
      setMsg(m);
      if (coachVoiceOn()) speak(m.text);
      if (hideRef.current) clearTimeout(hideRef.current);
      hideRef.current = setTimeout(() => setMsg(null), 7000);
    };
    window.addEventListener(COACH_EVENT, onSay);
    return () => { window.removeEventListener(COACH_EVENT, onSay); if (hideRef.current) clearTimeout(hideRef.current); };
  }, []);

  const toggleVoice = () => {
    const next = !voice; setVoice(next); setCoachVoice(next);
    if (next) speak('Voice on. I’ll talk you through it.');
    else window.speechSynthesis?.cancel();
  };

  return (
    <div className="pointer-events-none fixed bottom-4 right-4 z-40 flex max-w-[min(20rem,calc(100vw-2rem))] flex-col items-end gap-2">
      {msg && (
        <div className="pointer-events-auto rise rounded-2xl border border-line bg-surface px-4 py-3 text-[13px] font-medium text-ink shadow-lift">
          {msg.text}
          <button onClick={() => setMsg(null)} aria-label="Dismiss" className="ml-2 align-middle text-ink-faint hover:text-ink">✕</button>
        </div>
      )}
      <div className="pointer-events-auto flex items-center gap-2">
        <button onClick={toggleVoice} title={voice ? 'Coach voice on' : 'Coach voice off'}
          className={`grid h-8 w-8 place-items-center rounded-full border text-sm shadow-soft transition ${voice ? 'border-teal bg-teal text-white' : 'border-line bg-surface text-ink-soft'}`}>
          {voice ? '🔈' : '🔇'}
        </button>
        <span className="grid h-12 w-12 place-items-center rounded-full border border-line bg-ink text-2xl shadow-lift" title="Your coach">
          {FACE[msg?.mood ?? 'neutral']}
        </span>
      </div>
    </div>
  );
}
