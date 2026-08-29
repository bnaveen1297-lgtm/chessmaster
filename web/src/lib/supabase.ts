import { createClient, type SupabaseClient } from '@supabase/supabase-js';

/**
 * Browser Supabase client. This module is substituted (via a Vite resolver) for
 * the React-Native `src/services/supabase.ts` that the shared service layer
 * imports, so all the reused services (online, tournaments, puzzleDb, masterDb)
 * talk to the same chesshub360 project using web storage + OAuth redirect.
 */

const DEFAULT_URL = 'https://evmjrxxrfumrggzmtpam.supabase.co';
const DEFAULT_ANON_KEY =
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImV2bWpyeHhyZnVtcmdnem10cGFtIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODc1NTg2MDMsImV4cCI6MjEwMzEzNDYwM30.BWp2XchsIXNwPtflMsE-qXTZFvvUMpN_isgcIoT7izs';

const url = (import.meta.env.VITE_SUPABASE_URL as string) || DEFAULT_URL;
const anonKey = (import.meta.env.VITE_SUPABASE_ANON_KEY as string) || DEFAULT_ANON_KEY;

export const isSupabaseConfigured = url.length > 0 && anonKey.length > 0;

export const supabase: SupabaseClient | null = isSupabaseConfigured
  ? createClient(url, anonKey, {
      auth: {
        autoRefreshToken: true,
        persistSession: true,
        detectSessionInUrl: true,
        flowType: 'implicit',
      },
    })
  : null;
