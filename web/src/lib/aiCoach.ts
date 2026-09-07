import { supabase } from '@/lib/supabase';

/**
 * Client for the AI Coach edge function. The Anthropic key never touches the
 * browser — this just relays the chat + context to the `coach` function.
 */
export type CoachMsg = { role: 'user' | 'assistant'; content: string };

export function aiCoachAvailable(): boolean {
  return !!supabase;
}

export async function askCoach(messages: CoachMsg[], context: Record<string, unknown>): Promise<string> {
  if (!supabase) throw new Error('Sign in to talk to the coach.');
  const { data, error } = await supabase.functions.invoke('coach', { body: { messages, context } });
  if (error) {
    let msg = error.message || 'The coach had a problem.';
    try {
      const ctx = (error as any).context;
      const parsed = ctx && typeof ctx.json === 'function' ? await ctx.json() : null;
      if (parsed?.error) msg = parsed.error;
    } catch { /* keep default */ }
    throw new Error(msg);
  }
  if ((data as any)?.error) throw new Error((data as any).error);
  return (data as any)?.text || '';
}
