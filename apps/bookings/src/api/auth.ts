import { supabase } from './_internal/supabase';

export type AuthUser = {
  id: string;
  email?: string;
  user_metadata: Record<string, string | undefined>;
};
export type AuthSession = { user: AuthUser };

export const getSession = async (): Promise<{
  data: { session: AuthSession | null };
  error: Error | null;
}> => {
  const { data, error } = await supabase.auth.getSession();
  return { data: { session: data.session }, error };
};
export const signOut = (options?: { scope: 'local' | 'global' | 'others' }) => supabase.auth.signOut(options);
export const onAuthStateChange = (callback: () => void) => supabase.auth.onAuthStateChange(callback);
export const signInWithGoogle = (options: {
  redirectTo: string;
  scopes?: string;
  queryParams?: Record<string, string>;
}) => supabase.auth.signInWithOAuth({ provider: 'google', options });
