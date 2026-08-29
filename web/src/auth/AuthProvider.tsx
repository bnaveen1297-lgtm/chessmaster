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
  signUpWithEmail: (fields: { email: string; password: string; firstName?: string; phone?: string }) => Promise<{ needsConfirm: boolean }>;
  signOut: () => Promise<void>;
  clearError: () => void;
};

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
  const [loading, setLoading] = useState(true);
  const [authError, setAuthError] = useState<string | null>(null);

  useEffect(() => {
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
      user,
      loading,
      authError,
      backend: isSupabaseConfigured,
      signInWithGoogle: async () => {
        setAuthError(null);
        if (!supabase) { setAuthError('Sign-in is not configured.'); return; }
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
      signUpWithEmail: async ({ email, password, firstName, phone }) => {
        setAuthError(null);
        if (!supabase) { setAuthError('Sign-up is not configured.'); return { needsConfirm: false }; }
        const { data, error } = await supabase.auth.signUp({
          email: email.trim(),
          password,
          options: { data: { full_name: firstName, phone } },
        });
        if (error) { setAuthError(error.message); return { needsConfirm: false }; }
        return { needsConfirm: !!data.user && !data.session };
      },
      signOut: async () => {
        if (supabase) await supabase.auth.signOut();
        setUser(null);
      },
      clearError: () => setAuthError(null),
    }),
    [user, loading, authError],
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth(): AuthState {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used within AuthProvider');
  return ctx;
}
