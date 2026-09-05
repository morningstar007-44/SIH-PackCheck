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

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState<boolean>(true);

  const fetchProfile = async (sessionUser: User) => {
    try {
      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', sessionUser.id)
        .maybeSingle();

      if (error) {
        console.error('Error fetching profile from Supabase:', error);
      }

      if (data && data.full_name) {
        setProfile(data as UserProfile);
      } else {
        const metaName = sessionUser.user_metadata?.full_name;
        const fallbackName = metaName || sessionUser.email?.split('@')[0] || 'Inspector';
        const defaultProfile: UserProfile = {
          id: sessionUser.id,
          full_name: fallbackName,
          role: 'inspector',
          organization: 'Department of Legal Metrology',
        };
        setProfile(defaultProfile);
        // Automatically save initial profile in Supabase table
        await supabase.from('profiles').upsert([defaultProfile]);
      }
    } catch (err) {
      console.error('Profile fetch exception:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (!isSupabaseConfigured()) {
      const storedUser = localStorage.getItem('packcheck_demo_user');
      const storedProfile = localStorage.getItem('packcheck_demo_profile');
      if (storedUser && storedProfile) {
        setUser(JSON.parse(storedUser));
        setProfile(JSON.parse(storedProfile));
      } else {
        setUser(null);
        setProfile(null);
      }
      setLoading(false);
      return;
    }

    supabase.auth.getSession().then(({ data: { session } }) => {
      if (session?.user) {
        setUser(session.user);
        fetchProfile(session.user);
      } else {
        setUser(null);
        setProfile(null);
        setLoading(false);
      }
    });

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      if (session?.user) {
        setUser(session.user);
        fetchProfile(session.user);
      } else {
        setUser(null);
        setProfile(null);
        setLoading(false);
      }
    });

    return () => subscription.unsubscribe();
  }, []);

  const signIn = async (email: string, password: string) => {
    if (!isSupabaseConfigured()) {
      const demoU: any = {
        id: 'local-user',
        email,
        user_metadata: { full_name: 'Inspector' },
      };
      const demoP: UserProfile = {
        id: 'local-user',
        full_name: 'Inspector',
        role: 'inspector',
        organization: 'Department of Legal Metrology',
      };
      setUser(demoU);
      setProfile(demoP);
      localStorage.setItem('packcheck_demo_user', JSON.stringify(demoU));
      localStorage.setItem('packcheck_demo_profile', JSON.stringify(demoP));
      return { error: null };
    }

    const { data, error } = await supabase.auth.signInWithPassword({ email, password });
    if (!error && data.user) {
      setUser(data.user);
      await fetchProfile(data.user);
    }
    return { error };
  };

  const signUp = async (email: string, password: string, fullName: string) => {
    if (!isSupabaseConfigured()) {
      const demoU: any = {
        id: 'local-user',
        email,
        user_metadata: { full_name: fullName },
      };
      const demoP: UserProfile = {
        id: 'local-user',
        full_name: fullName,
        role: 'inspector',
        organization: 'Department of Legal Metrology',
      };
      setUser(demoU);
      setProfile(demoP);
      localStorage.setItem('packcheck_demo_user', JSON.stringify(demoU));
      localStorage.setItem('packcheck_demo_profile', JSON.stringify(demoP));
      return { error: null };
    }

    const { data, error } = await supabase.auth.signUp({
      email,
      password,
      options: { data: { full_name: fullName } },
    });

    if (!error && data.user) {
      const newProfile: UserProfile = {
        id: data.user.id,
        full_name: fullName,
        role: 'inspector',
        organization: 'Department of Legal Metrology',
      };
      setProfile(newProfile);
      setUser(data.user);
      await supabase.from('profiles').upsert([newProfile]);
    }
    return { error };
  };

  const signOut = async () => {
    if (!isSupabaseConfigured()) {
      setUser(null);
      setProfile(null);
      localStorage.removeItem('packcheck_demo_user');
      localStorage.removeItem('packcheck_demo_profile');
      return;
    }
    await supabase.auth.signOut();
    setUser(null);
    setProfile(null);
  };

  const updateProfile = async (fullName: string, organization: string) => {
    if (!user) return { error: new Error('No active user') };

    const updated: UserProfile = {
      id: user.id,
      full_name: fullName,
      role: 'inspector',
      organization,
    };

    if (!isSupabaseConfigured()) {
      setProfile(updated);
      localStorage.setItem('packcheck_demo_profile', JSON.stringify(updated));
      return { error: null };
    }

    const { error } = await supabase
      .from('profiles')
      .upsert({ id: user.id, full_name: fullName, organization, updated_at: new Date().toISOString() });

    if (!error) {
      setProfile(updated);
    }
    return { error };
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
