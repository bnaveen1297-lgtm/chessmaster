import React, { createContext, useContext, useEffect, useMemo, useState } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { supabase, isSupabaseConfigured } from '../services/supabase';

/**
 * Auth state — Supabase-backed when configured, device-local otherwise.
 *
 * Local mode: signIn/signUp create a local session (no validation) so the app
 * is usable offline / during early testing. Supabase mode: real accounts with
 * validated credentials. The rest of the app only reads `useAuth()`.
 */

export type User = {
  id: string;
  email: string;
  firstName?: string;
};

type AuthState = {
  user: User | null;
  loading: boolean;
  authError: string | null;
  backend: boolean;
  signInWithGoogle: () => Promise<void>;
  signIn: (email: string, password: string) => Promise<void>;
  signUp: (fields: { email: string; password?: string; firstName?: string; lastName?: string }) => Promise<void>;
  signOut: () => Promise<void>;
  clearAuthError: () => void;
};

const STORAGE_KEY = 'chessmaster.user';
const AuthContext = createContext<AuthState | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [authError, setAuthError] = useState<string | null>(null);

  useEffect(() => {
    if (isSupabaseConfigured && supabase) {
      supabase.auth.getSession().then(({ data }) => {
        setUser(mapUser(data.session?.user));
        setLoading(false);
      });
      const { data: sub } = supabase.auth.onAuthStateChange((_event, session) => {
        setUser(mapUser(session?.user));
      });
      return () => sub.subscription.unsubscribe();
    }
    // local mode
    (async () => {
      try {
        const raw = await AsyncStorage.getItem(STORAGE_KEY);
        if (raw) setUser(JSON.parse(raw));
      } catch {
        // ignore
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  const persistLocal = async (next: User | null) => {
    setUser(next);
    try {
      if (next) await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(next));
      else await AsyncStorage.removeItem(STORAGE_KEY);
    } catch {
      // best-effort
    }
  };

  const value = useMemo<AuthState>(
    () => ({
      user,
      loading,
      authError,
      backend: isSupabaseConfigured,
      clearAuthError: () => setAuthError(null),

      signInWithGoogle: async () => {
        setAuthError(null);
        if (isSupabaseConfigured && supabase) {
          const redirectTo =
            typeof window !== 'undefined' && window.location ? window.location.origin : undefined;
          const { error } = await supabase.auth.signInWithOAuth({
            provider: 'google',
            options: { redirectTo },
          });
          // On web this redirects the browser to Google; the session is picked
          // up on return via detectSessionInUrl. Only errors land here.
          if (error) setAuthError(error.message);
          return;
        }
        // Local mode (no backend configured): sign in a device-only account so
        // the app is still usable for offline testing.
        await persistLocal({ id: 'local', email: 'you@chessmaster.app' });
      },

      signIn: async (email, password) => {
        setAuthError(null);
        if (isSupabaseConfigured && supabase) {
          const { error } = await supabase.auth.signInWithPassword({ email, password });
          if (error) setAuthError(error.message);
          return;
        }
        await persistLocal({ id: 'local', email });
      },

      signUp: async ({ email, password, firstName }) => {
        setAuthError(null);
        if (isSupabaseConfigured && supabase) {
          const { error } = await supabase.auth.signUp({
            email,
            password: password ?? '',
            options: { data: { first_name: firstName } },
          });
          if (error) setAuthError(error.message);
          return;
        }
        await persistLocal({ id: 'local', email: email || 'you@chessmaster.app', firstName });
      },

      signOut: async () => {
        if (isSupabaseConfigured && supabase) {
          await supabase.auth.signOut();
          return;
        }
        await persistLocal(null);
      },
    }),
    [user, loading, authError],
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

function mapUser(u: any): User | null {
  if (!u) return null;
  return { id: u.id, email: u.email ?? '', firstName: u.user_metadata?.first_name };
}

export function useAuth(): AuthState {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used within an AuthProvider');
  return ctx;
}
