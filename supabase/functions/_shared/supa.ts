// Supabase clients for edge functions.
//
// - adminClient() uses the SERVICE ROLE key and bypasses RLS. Only the server
//   writes game state, which is what makes the game authoritative.
// - getUser() verifies the caller's JWT (from the Authorization header) so the
//   server knows *who* is acting, without trusting the request body.
import { createClient, type SupabaseClient } from 'https://esm.sh/@supabase/supabase-js@2';

export function adminClient(): SupabaseClient {
  return createClient(
    Deno.env.get('SUPABASE_URL')!,
    Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!,
    { auth: { persistSession: false, autoRefreshToken: false } },
  );
}

export async function getUser(req: Request): Promise<{ id: string } | null> {
  const authorization = req.headers.get('Authorization');
  if (!authorization) return null;
  const client = createClient(
    Deno.env.get('SUPABASE_URL')!,
    Deno.env.get('SUPABASE_ANON_KEY')!,
    { global: { headers: { Authorization: authorization } }, auth: { persistSession: false } },
  );
  const { data, error } = await client.auth.getUser();
  if (error || !data.user) return null;
  return { id: data.user.id };
}
