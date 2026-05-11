import React, { createContext, useContext, useEffect, useState } from 'react';
import type { User } from '@/types';

interface AuthContextType {
  user: User | null;
  session: any;
  loading: boolean;
  signUp: (email: string, password: string, displayName?: string) => Promise<{ error: Error | null }>;
  signIn: (email: string, password: string) => Promise<{ error: Error | null }>;
  signOut: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

const KEY = 'vivora_local_profile';

function loadProfile(): User {
  try {
    const raw = localStorage.getItem(KEY);
    if (raw) return JSON.parse(raw);
  } catch {}
  const u: User = {
    id: 'local-user',
    email: 'you@local.dev',
    displayName: 'You',
    avatarUrl: undefined,
  };
  localStorage.setItem(KEY, JSON.stringify(u));
  return u;
}

export function setLocalProfile(updates: Partial<User>) {
  const cur = loadProfile();
  const next = { ...cur, ...updates };
  localStorage.setItem(KEY, JSON.stringify(next));
  window.dispatchEvent(new Event('vivora-profile-change'));
}

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(loadProfile());
  const [loading] = useState(false);

  useEffect(() => {
    const handler = () => setUser(loadProfile());
    window.addEventListener('vivora-profile-change', handler);
    return () => window.removeEventListener('vivora-profile-change', handler);
  }, []);

  const signUp = async (email: string, _password: string, displayName?: string) => {
    setLocalProfile({ email, displayName: displayName || email.split('@')[0] });
    return { error: null };
  };

  const signIn = async (email: string, _password: string) => {
    setLocalProfile({ email });
    return { error: null };
  };

  const signOut = async () => {
    // Keep the local profile around — there's nothing to sign out of.
  };

  return (
    <AuthContext.Provider value={{ user, session: { user }, loading, signUp, signIn, signOut }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const ctx = useContext(AuthContext);
  if (ctx === undefined) throw new Error('useAuth must be used within an AuthProvider');
  return ctx;
};
