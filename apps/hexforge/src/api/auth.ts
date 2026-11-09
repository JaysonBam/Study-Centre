import { supabase } from './_internal/supabase';

export type AuthUser = {
  id: string;
  email?: string;
  user_metadata: Record<string, unknown>;
  identities?: Array<{ provider?: string; identity_data?: Record<string, unknown> }>;
};
export type AuthSession = { user: AuthUser };
const publicSession = (session: { user: AuthUser } | null): AuthSession | null =>
  session?.user
    ? {
        user: {
          id: session.user.id,
          email: session.user.email,
          user_metadata: session.user.user_metadata,
          identities: session.user.identities,
        },
      }
    : null;

export const getAuthSession = async (): Promise<{
  data: { session: AuthSession | null };
  error: Error | null;
}> => {
  const { data, error } = await supabase.auth.getSession();
  return { data: { session: publicSession(data.session) }, error };
};
export const getAuthUser = async (): Promise<{ data: { user: AuthUser | null }; error: Error | null }> => {
  const { data, error } = await supabase.auth.getUser();
  return { data: { user: data.user }, error };
};
export const signOut = () => supabase.auth.signOut();
export const subscribeToAuthChanges = (callback: (event: string, session: AuthSession | null) => void) =>
  supabase.auth.onAuthStateChange((event, session) => callback(event, publicSession(session))).data
    .subscription;

export const signInWithGoogleOAuth = (options: {
  redirectTo: string;
  scopes: string;
  queryParams: Record<string, string>;
}) =>
  supabase.auth.signInWithOAuth({
    provider: 'google',
    options,
  });

type OAuthSessionResult = {
  data?: unknown;
  error?: Error | null;
};

export const completeOAuthSessionFromCurrentUrl = async (): Promise<OAuthSessionResult> => {
  const params = new URLSearchParams(window.location.search);
  const code = params.get('code');
  const auth = supabase.auth as unknown as {
    exchangeCodeForSession?: (code: string) => Promise<OAuthSessionResult>;
    getSessionFromUrl?: (options: { storeSession: boolean }) => Promise<OAuthSessionResult>;
    setSession?: (tokens: {
      access_token: string;
      refresh_token: string | null;
    }) => Promise<OAuthSessionResult>;
  };

  if (code && typeof auth.exchangeCodeForSession === 'function') {
    return auth.exchangeCodeForSession.call(supabase.auth, code);
  }

  if (typeof auth.getSessionFromUrl === 'function') {
    return auth.getSessionFromUrl.call(supabase.auth, { storeSession: true });
  }

  try {
    const hash = window.location.hash || window.location.search || '';
    const tokenParams = new URLSearchParams(hash.replace(/^#/, ''));
    const accessToken = tokenParams.get('access_token');
    const refreshToken = tokenParams.get('refresh_token');

    if (accessToken && typeof auth.setSession === 'function') {
      return auth.setSession.call(supabase.auth, {
        access_token: accessToken,
        refresh_token: refreshToken,
      });
    }

    return supabase.auth.getSession();
  } catch (error) {
    return { error: error instanceof Error ? error : new Error(String(error)) };
  }
};
