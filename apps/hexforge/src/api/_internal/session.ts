import { supabase } from './supabase';

// Provider credentials are consumed only by API implementations.
export const getProviderSession = () => supabase.auth.getSession();
