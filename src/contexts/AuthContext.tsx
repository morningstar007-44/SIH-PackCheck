import React, { createContext, useContext, useEffect, useState } from 'react';
import type { User } from '@supabase/supabase-js';
import { supabase, isSupabaseConfigured } from '../lib/supabase';
import type { UserProfile } from '../types';

interface AuthContextType {
  user: User | null;
  profile: UserProfile | null;
  loading: boolean;
  signIn: (email: string, password: string) => Promise<{ error: Error | null }>;
  signUp: (email: string, password: string, fullName: string) => Promise<{ error: Error | null }>;
  signOut: () => Promise<void>;
  updateProfile: (fullName: string, organization: string) => Promise<{ error: Error | null }>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

// Keys for localStorage fallback session
const LS_USER = 'packcheck_user';
const LS_PROFILE = 'packcheck_profile';

function loadLocalSession(): { user: User | null; profile: UserProfile | null } {
  try {
    const u = localStorage.getItem(LS_USER);
    const p = localStorage.getItem(LS_PROFILE);
    if (u && p) return { user: JSON.parse(u), profile: JSON.parse(p) };
  } catch {}
  return { user: null, profile: null };
}

function saveLocalSession(user: any, profile: UserProfile) {
  localStorage.setItem(LS_USER, JSON.stringify(user));
  localStorage.setItem(LS_PROFILE, JSON.stringify(profile));
}

function clearLocalSession() {
  localStorage.removeItem(LS_USER);
  localStorage.removeItem(LS_PROFILE);
}

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState<boolean>(true);

  const buildDefaultProfile = (id: string, email?: string, fullName?: string): UserProfile => ({
    id,
    full_name: fullName || email?.split('@')[0] || 'Inspector',
    role: 'inspector',
    organization: 'Department of Legal Metrology',
  });

  const fetchProfile = async (sessionUser: User) => {
    try {
      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', sessionUser.id)
        .maybeSingle();

      if (!error && data && data.full_name) {
        setProfile(data as UserProfile);
        return;
      }
    } catch (err) {
      console.warn('Profile fetch error (non-fatal):', err);
    }

    // Fallback: build profile from user metadata
    const fallback = buildDefaultProfile(
      sessionUser.id,
      sessionUser.email,
      sessionUser.user_metadata?.full_name
    );
    setProfile(fallback);

    // Try to upsert the profile so it exists for next time
    try {
      await supabase.from('profiles').upsert([fallback], { onConflict: 'id' });
    } catch {}
  };

  // === Session Initialization ===
  useEffect(() => {
    let mounted = true;

    const initSession = async () => {
      // 1. Try real Supabase session first
      if (isSupabaseConfigured()) {
        try {
          const { data: { session } } = await supabase.auth.getSession();
          if (session?.user && mounted) {
            setUser(session.user);
            await fetchProfile(session.user);
            // Persist to localStorage as backup
            const p = buildDefaultProfile(session.user.id, session.user.email, session.user.user_metadata?.full_name);
            saveLocalSession(session.user, p);
            if (mounted) setLoading(false);
            return;
          }
        } catch (err) {
          console.warn('Supabase getSession error:', err);
        }
      }

      // 2. Fallback: load from localStorage (covers email-not-confirmed sessions + demo mode)
      const local = loadLocalSession();
      if (local.user && mounted) {
        setUser(local.user);
        setProfile(local.profile);
      }

      if (mounted) setLoading(false);
    };

    initSession();

    // Listen for auth state changes (real Supabase sessions)
    let subscription: { unsubscribe: () => void } | null = null;
    if (isSupabaseConfigured()) {
      const { data } = supabase.auth.onAuthStateChange((_event, session) => {
        if (!mounted) return;
        if (session?.user) {
          setUser(session.user);
          fetchProfile(session.user);
          const p = buildDefaultProfile(session.user.id, session.user.email, session.user.user_metadata?.full_name);
          saveLocalSession(session.user, p);
        } else {
          // Only clear if explicitly signed out (not on page refresh)
          if (_event === 'SIGNED_OUT') {
            setUser(null);
            setProfile(null);
            clearLocalSession();
          }
        }
      });
      subscription = data.subscription;
    }

    return () => {
      mounted = false;
      subscription?.unsubscribe();
    };
  }, []);

  // === Sign In ===
  const signIn = async (email: string, password: string) => {
    if (!isSupabaseConfigured()) {
      const demoUser: any = { id: 'local-user', email, user_metadata: { full_name: email.split('@')[0] } };
      const demoProfile = buildDefaultProfile('local-user', email);
      setUser(demoUser);
      setProfile(demoProfile);
      saveLocalSession(demoUser, demoProfile);
      return { error: null };
    }

    const { data, error } = await supabase.auth.signInWithPassword({ email, password });

    if (error) {
      // Handle "Email not confirmed" — create local session so user can still use the app
      if (error.message.toLowerCase().includes('email not confirmed')) {
        const fallbackId = 'unconfirmed-' + btoa(email).slice(0, 12);
        const fallbackUser: any = { id: fallbackId, email, user_metadata: { full_name: email.split('@')[0] } };
        const fallbackProfile = buildDefaultProfile(fallbackId, email);
        setUser(fallbackUser);
        setProfile(fallbackProfile);
        saveLocalSession(fallbackUser, fallbackProfile);
        return { error: null };
      }
      return { error };
    }

    if (data.user) {
      setUser(data.user);
      await fetchProfile(data.user);
      const p = buildDefaultProfile(data.user.id, data.user.email, data.user.user_metadata?.full_name);
      saveLocalSession(data.user, p);
    }
    return { error: null };
  };

  // === Sign Up ===
  const signUp = async (email: string, password: string, fullName: string) => {
    if (!isSupabaseConfigured()) {
      const demoUser: any = { id: 'local-user', email, user_metadata: { full_name: fullName } };
      const demoProfile = buildDefaultProfile('local-user', email, fullName);
      setUser(demoUser);
      setProfile(demoProfile);
      saveLocalSession(demoUser, demoProfile);
      return { error: null };
    }

    const { data, error } = await supabase.auth.signUp({
      email,
      password,
      options: { data: { full_name: fullName } },
    });

    if (error) return { error };

    if (data.user) {
      // Even if email confirmation is pending, create a local session
      const newProfile = buildDefaultProfile(data.user.id, email, fullName);
      setUser(data.user);
      setProfile(newProfile);
      saveLocalSession(data.user, newProfile);

      // Try to insert profile row
      try {
        await supabase.from('profiles').upsert([newProfile], { onConflict: 'id' });
      } catch {}
    } else {
      // Supabase returned no user (email confirmation required) — create local fallback
      const fallbackId = 'signup-' + btoa(email).slice(0, 12);
      const fallbackUser: any = { id: fallbackId, email, user_metadata: { full_name: fullName } };
      const fallbackProfile = buildDefaultProfile(fallbackId, email, fullName);
      setUser(fallbackUser);
      setProfile(fallbackProfile);
      saveLocalSession(fallbackUser, fallbackProfile);
    }

    return { error: null };
  };

  // === Sign Out ===
  const signOut = async () => {
    setUser(null);
    setProfile(null);
    clearLocalSession();
    if (isSupabaseConfigured()) {
      try {
        await supabase.auth.signOut();
      } catch {}
    }
  };

  // === Update Profile ===
  const updateProfile = async (fullName: string, organization: string) => {
    if (!user) return { error: new Error('No active user') };

    const updated: UserProfile = {
      id: user.id,
      full_name: fullName,
      role: 'inspector',
      organization,
    };

    setProfile(updated);
    saveLocalSession(user, updated);

    if (isSupabaseConfigured()) {
      const { error } = await supabase
        .from('profiles')
        .upsert({ id: user.id, full_name: fullName, organization, updated_at: new Date().toISOString() });
      if (error) return { error };
    }

    return { error: null };
  };

  return (
    <AuthContext.Provider value={{ user, profile, loading, signIn, signUp, signOut, updateProfile }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
