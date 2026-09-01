import 'react-native-url-polyfill/auto';
import { Platform } from 'react-native';
import { createClient, type SupabaseClient } from '@supabase/supabase-js';
import AsyncStorage from '@react-native-async-storage/async-storage';

/**
 * Supabase backend client.
 *
 * Configured via env (EXPO_PUBLIC_SUPABASE_URL / EXPO_PUBLIC_SUPABASE_ANON_KEY —
 * see .env.example and docs/SUPABASE.md). When those are absent the app runs in
 * fully-local mode (device-only accounts and progress); when present, auth and
 * progress become real and cloud-synced. Nothing else in the app needs to know
 * which mode is active — it all flows through AuthContext / ProgressContext.
 */

// Defaults point at the ChessMaster project. The anon key is a *public* client
// key (safe to ship — data is protected by Row-Level Security). Override via env
// (EXPO_PUBLIC_SUPABASE_URL / EXPO_PUBLIC_SUPABASE_ANON_KEY) to point elsewhere.
const DEFAULT_URL = 'https://evmjrxxrfumrggzmtpam.supabase.co';
const DEFAULT_ANON_KEY =
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImV2bWpyeHhyZnVtcmdnem10cGFtIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODc1NTg2MDMsImV4cCI6MjEwMzEzNDYwM30.BWp2XchsIXNwPtflMsE-qXTZFvvUMpN_isgcIoT7izs';

const url = process.env.EXPO_PUBLIC_SUPABASE_URL || DEFAULT_URL;
const anonKey = process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY || DEFAULT_ANON_KEY;

export const isSupabaseConfigured = url.length > 0 && anonKey.length > 0;

export const supabase: SupabaseClient | null = isSupabaseConfigured
  ? createClient(url, anonKey, {
      auth: {
        // On web the OAuth (Google) redirect returns the session in the URL, so
        // supabase-js must parse it on load. Native uses AsyncStorage only.
        storage: Platform.OS === 'web' ? undefined : (AsyncStorage as unknown as any),
        autoRefreshToken: true,
        persistSession: true,
        detectSessionInUrl: Platform.OS === 'web',
      },
    })
  : null;
