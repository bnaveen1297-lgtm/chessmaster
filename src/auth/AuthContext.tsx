import React, { createContext, useContext, useEffect, useMemo, useState } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';

/**
 * Client-side auth state, persisted locally.
 *
 * This is intentionally backend-agnostic: `signIn` / `signUp` currently create
 * a local session so the app is fully usable during launch. When the API is
 * ready, swap the bodies of these functions for real network calls (see
 * docs/BACKEND.md) — the rest of the app consumes `useAuth()` and won't change.
 */

export type User = {
  id: string;
  email: string;
  firstName?: string;
};

type AuthState = {
  user: User | null;
  loading: boolean;
  signIn: (email: string, password: string) => Promise<void>;
  signUp: (fields: { email: string; firstName?: string; lastName?: string }) => Promise<void>;
  signOut: () => Promise<void>;
};

const STORAGE_KEY = 'chessmaster.user';

const AuthContext = createContext<AuthState | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  // Restore any saved session on launch.
  useEffect(() => {
    (async () => {
      try {
        const raw = await AsyncStorage.getItem(STORAGE_KEY);
        if (raw) setUser(JSON.parse(raw));
      } catch {
        // ignore — treat as signed out
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  const persist = async (next: User | null) => {
    setUser(next);
    try {
      if (next) await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(next));
      else await AsyncStorage.removeItem(STORAGE_KEY);
    } catch {
      // best-effort; session still works in-memory
    }
  };

  const value = useMemo<AuthState>(
    () => ({
      user,
      loading,
      // TODO(backend): POST /auth/login → { user, token }
      signIn: async (email) => {
        await persist({ id: 'local', email });
      },
      // TODO(backend): POST /auth/register → { user, token }
      signUp: async ({ email, firstName }) => {
        await persist({ id: 'local', email: email || 'you@chessmaster.app', firstName });
      },
      signOut: async () => {
        await persist(null);
      },
    }),
    [user, loading],
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth(): AuthState {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used within an AuthProvider');
  return ctx;
}
