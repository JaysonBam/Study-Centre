import { supabase } from './supabase';

type PrintingResponse<T> = { data?: T; error?: string; error_description?: string };

// These endpoints deliberately use the booking session with the printing project's API key.
export function createPrintingRequest(options: {
  functionName: string;
  missingConfiguration: string;
  signedOut: string;
  failure: string;
}) {
  const url = import.meta.env.VITE_HEXFORGE_SUPABASE_URL as string;
  const apiKey = import.meta.env.VITE_HEXFORGE_SUPABASE_ANON_KEY as string;
  return async <T>(path = '', init: RequestInit = {}): Promise<T> => {
    if (!url || !apiKey) throw new Error(options.missingConfiguration);
    const { data, error } = await supabase.auth.getSession();
    if (error) throw error;
    const token = data.session?.access_token;
    if (!token) throw new Error(options.signedOut);
    const response = await fetch(`${url.replace(/\/$/, '')}/functions/v1/${options.functionName}${path}`, {
      ...init,
      headers: {
        apikey: apiKey,
        Authorization: `Bearer ${token}`,
        'Content-Type': 'application/json',
        ...(init.headers || {}),
      },
    });
    const payload = (await response.json().catch(() => ({}))) as PrintingResponse<T>;
    if (!response.ok)
      throw new Error(
        payload.error_description || payload.error || `${options.failure} (${response.status})`,
      );
    return payload.data as T;
  };
}
