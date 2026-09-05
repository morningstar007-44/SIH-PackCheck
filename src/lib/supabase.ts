import { createClient } from '@supabase/supabase-js';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL || 'https://mock-packcheck.supabase.co';
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY || import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY || 'mock-key';

export const isSupabaseConfigured = () => {
  const url = import.meta.env.VITE_SUPABASE_URL;
  const key = import.meta.env.VITE_SUPABASE_ANON_KEY || import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY;
  return (
    url &&
    url !== 'https://your-project.supabase.co' &&
    url !== 'https://mock-packcheck.supabase.co' &&
    key &&
    key !== 'your-anon-key-here' &&
    key !== 'mock-key'
  );
};

export const supabase = createClient(supabaseUrl, supabaseAnonKey);
