import { supabase } from './_internal/supabase';
import { apiResult } from './_internal/result';

export const getCurrentProfile = (email: string) =>
  apiResult(
    supabase
      .from('profiles')
      .select('full_name, profile_url, settings, authorisation, analytics, access_expires_at')
      .eq('email', email)
      .single(),
  );

export const listProfiles = () => apiResult(supabase.from('profiles').select('*').order('email'));

export const setAccessExpiry = (parameters: Record<string, unknown>) =>
  apiResult(supabase.rpc('set_profile_access_expiry', parameters));

export const updateProfilePermission = (email: string, updates: Record<string, unknown>) =>
  apiResult(supabase.from('profiles').update(updates).eq('email', email).select('email').single());

export const deleteProfile = (email: string) =>
  apiResult(supabase.from('profiles').delete().eq('email', email).select('email'));

export const addProfileAccess = (parameters: Record<string, unknown>) =>
  apiResult(supabase.rpc('set_profile_access_expiry', parameters));

export const getLoginProfile = (email: string) =>
  apiResult(supabase.from('profiles').select('*').eq('email', email).single());

export const completeProfileLogin = (email: string, updates: Record<string, unknown>) =>
  apiResult(supabase.from('profiles').update(updates).eq('email', email).select('email').single());
