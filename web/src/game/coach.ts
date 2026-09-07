/**
 * The talking coach — a tiny pub/sub so any screen can make the on-screen coach
 * speak. `sayCoach()` fires a window event that <CoachCorner/> renders as a
 * speech bubble and (when the viewer turns voice on) reads aloud with the
 * browser's built-in speech synthesis — no dependencies, works offline.
 */
export type CoachMood = 'happy' | 'sad' | 'think' | 'neutral';
export type CoachMessage = { text: string; mood: CoachMood; id: number };

export const COACH_EVENT = 'coach:say';

export function sayCoach(text: string, mood: CoachMood = 'neutral'): void {
  if (typeof window === 'undefined') return;
  window.dispatchEvent(new CustomEvent<CoachMessage>(COACH_EVENT, { detail: { text, mood, id: Date.now() } }));
}

const VOICE_KEY = 'chesshub360.coach.voice';
export function coachVoiceOn(): boolean {
  try { return localStorage.getItem(VOICE_KEY) === '1'; } catch { return false; }
}
export function setCoachVoice(on: boolean): void {
  try { localStorage.setItem(VOICE_KEY, on ? '1' : '0'); } catch { /* ignore */ }
}

/** Speak a line with the browser's speech synthesis, if available. */
export function speak(text: string): void {
  try {
    const synth = window.speechSynthesis;
    if (!synth) return;
    synth.cancel();
    const u = new SpeechSynthesisUtterance(text);
    u.rate = 1; u.pitch = 1; u.lang = 'en-US';
    synth.speak(u);
  } catch { /* ignore */ }
}
