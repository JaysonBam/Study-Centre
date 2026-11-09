import { createClient } from '@supabase/supabase-js';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseAnonKey) {
  // Warn but don't crash immediately, as we may want to handle this in UI
  console.warn('Supabase credentials missing. Check .env file.');
}

// In development, use the current window location to respect network access (e.g. 192.168.x.x)
const isDev = import.meta.env.DEV;
const clientUrl = isDev ? window.location.origin : supabaseUrl || '';

export const supabase = createClient(clientUrl, supabaseAnonKey || '');
