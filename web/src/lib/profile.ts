import { supabase, isSupabaseConfigured } from './supabase';

/**
 * Write to the user's profile row (name + prefs). Supabase-js returns errors in
 * the result object rather than throwing, so we check `error` explicitly and
 * retry once — the old code awaited the call inside a try/catch and silently
 * dropped any error, which is why names and onboarding state never persisted.
 */
export async function upsertProfile(
  id: string | null | undefined,
  patch: { first_name?: string; prefs?: Record<string, unknown> },
): Promise<{ ok: boolean; error?: string }> {
  if (!(isSupabaseConfigured && supabase) || !id) return { ok: false, error: 'no-backend' };
  const row = { id, ...patch };
  for (let attempt = 0; attempt < 2; attempt++) {
    const { error } = await supabase.from('profiles').upsert(row, { onConflict: 'id' });
    if (!error) return { ok: true };
    if (attempt === 0) { await new Promise((r) => setTimeout(r, 400)); continue; }
    if (import.meta.env?.DEV) console.warn('[profile] upsert failed:', error.message);
    return { ok: false, error: error.message };
  }
  return { ok: false };
}

/** Read the profile's stored name + prefs (null if unavailable). */
export async function fetchProfile(id: string): Promise<{ first_name: string | null; prefs: Record<string, unknown> | null } | null> {
  if (!(isSupabaseConfigured && supabase)) return null;
  const { data, error } = await supabase.from('profiles').select('first_name, prefs').eq('id', id).maybeSingle();
  if (error || !data) return null;
  return { first_name: (data as any).first_name ?? null, prefs: (data as any).prefs ?? null };
}
