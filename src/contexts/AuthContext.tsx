import React, {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
} from 'react';
import type { SignInCredentials } from '@/repositories/interfaces';
import { getActiveRepositories } from '@/repositories/supabaseRepository';
import type { AuthSession, UserProfile } from '@/types/finance';

interface AuthContextValue {
  session: AuthSession | null;
  user: UserProfile | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  signIn: (credentials: SignInCredentials) => Promise<AuthSession>;
  signOut: () => Promise<void>;
  updateProfile: (patch: Partial<UserProfile>) => Promise<UserProfile>;
}

const AuthContext = createContext<AuthContextValue | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const repos = useMemo(() => getActiveRepositories(), []);
  const [session, setSession] = useState<AuthSession | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    let active = true;
    repos.auth
      .getSession()
      .then((loaded) => {
        if (active) setSession(loaded);
      })
      .finally(() => {
        if (active) setIsLoading(false);
      });
    return () => {
      active = false;
    };
  }, [repos]);

  const signIn = useCallback(
    async (credentials: SignInCredentials) => {
      const next = await repos.auth.signIn(credentials);
      setSession(next);
      return next;
    },
    [repos],
  );

  const signOut = useCallback(async () => {
    await repos.auth.signOut();
    setSession(null);
  }, [repos]);

  const updateProfile = useCallback(
    async (patch: Partial<UserProfile>) => {
      const updated = await repos.auth.updateProfile(patch);
      setSession((prev) => (prev ? { ...prev, user: updated } : prev));
      return updated;
    },
    [repos],
  );

  return (
    <AuthContext.Provider
      value={{
        session,
        user: session?.user ?? null,
        isAuthenticated: Boolean(session?.isAuthenticated),
        isLoading,
        signIn,
        signOut,
        updateProfile,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth(): AuthContextValue {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used within AuthProvider');
  return ctx;
}
