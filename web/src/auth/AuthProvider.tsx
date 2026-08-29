import { createContext, useContext, useEffect, useMemo, useState, type ReactNode } from 'react';
import { supabase, isSupabaseConfigured } from '@/lib/supabase';

export type User = { id: string; email: string; firstName?: string; avatarUrl?: string };

type AuthState = {
  user: User | null;
  loading: boolean;
  authError: string | null;
  backend: boolean;
  signInWithGoogle: () => Promise<void>;
  signInWithEmail: (email: string, password: string) => Promise<void>;
  signUpWithEmail: (email: string, password: string, firstName?: string) => Promise<{ needsConfirm: boolean }>;
  continueAsGuest: () => void;
  isGuest: boolean;
  signOut: () => Promise<void>;
  clearError: () => void;
};

const GUEST_KEY = 'chessmaster.guest';
const GUEST_USER: User = { id: 'guest', email: 'guest@chessmaster.app', firstName: 'Guest' };

const AuthContext = createContext<AuthState | undefined>(undefined);

function mapUser(u: any): User | null {
  if (!u) return null;
  return {
    id: u.id,
    email: u.email ?? '',
    firstName: u.user_metadata?.full_name?.split(' ')?.[0] ?? u.user_metadata?.name?.split(' ')?.[0],
    avatarUrl: u.user_metadata?.avatar_url,
  };
}

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [guest, setGuest] = useState(false);
  const [loading, setLoading] = useState(true);
  const [authError, setAuthError] = useState<string | null>(null);

  useEffect(() => {
    let isGuestStored = false;
    try {
      isGuestStored = localStorage.getItem(GUEST_KEY) === '1';
    } catch {
      /* ignore */
    }
    if (isGuestStored) setGuest(true);

    if (!isSupabaseConfigured || !supabase) {
      setLoading(false);
      return;
    }
    supabase.auth.getSession().then(({ data }) => {
      setUser(mapUser(data.session?.user));
      setLoading(false);
    });
    const { data: sub } = supabase.auth.onAuthStateChange((_e, session) => {
      setUser(mapUser(session?.user));
    });
    return () => sub.subscription.unsubscribe();
  }, []);

  const value = useMemo<AuthState>(
    () => ({
      user: user ?? (guest ? GUEST_USER : null),
      loading,
      authError,
      backend: isSupabaseConfigured,
      isGuest: !user && guest,
      continueAsGuest: () => {
        try { localStorage.setItem(GUEST_KEY, '1'); } catch { /* ignore */ }
        setGuest(true);
      },
      signInWithGoogle: async () => {
        setAuthError(null);
        if (!supabase) {
          setAuthError('Sign-in is not configured.');
          return;
        }
        const redirectTo = typeof window !== 'undefined' ? window.location.origin : undefined;
        const { error } = await supabase.auth.signInWithOAuth({ provider: 'google', options: { redirectTo } });
        if (error) setAuthError(error.message);
      },
      signInWithEmail: async (email, password) => {
        setAuthError(null);
        if (!supabase) { setAuthError('Sign-in is not configured.'); return; }
        const { error } = await supabase.auth.signInWithPassword({ email: email.trim(), password });
        if (error) setAuthError(error.message);
      },
      signUpWithEmail: async (email, password, firstName) => {
        setAuthError(null);
        if (!supabase) { setAuthError('Sign-up is not configured.'); return { needsConfirm: false }; }
        const { data, error } = await supabase.auth.signUp({
          email: email.trim(),
          password,
          options: { data: { full_name: firstName } },
        });
        if (error) { setAuthError(error.message); return { needsConfirm: false }; }
        // If email confirmation is on, there's a user but no session yet.
        return { needsConfirm: !!data.user && !data.session };
      },
      signOut: async () => {
        try { localStorage.removeItem(GUEST_KEY); } catch { /* ignore */ }
        setGuest(false);
        if (supabase) await supabase.auth.signOut();
        setUser(null);
      },
      clearError: () => setAuthError(null),
    }),
    [user, guest, loading, authError],
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth(): AuthState {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used within AuthProvider');
  return ctx;
}
