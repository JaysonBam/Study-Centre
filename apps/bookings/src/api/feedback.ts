import { supabase } from './_internal/supabase';
import { apiResult } from './_internal/result';

export const listFeedback = (status: string) => {
  let query = supabase.from('bugs').select('*').order('upvotes', { ascending: false });
  if (status === 'not_fixed') query = query.in('status', ['new', 'acknowledged']);
  else if (status !== 'all') query = query.eq('status', status);
  return apiResult(query);
};

export const createFeedback = (records: Record<string, unknown> | Record<string, unknown>[]) =>
  apiResult(supabase.from('bugs').insert(records));

export const upvoteFeedback = (parameters: Record<string, unknown>) =>
  apiResult(supabase.rpc('increment_bug_upvotes', parameters));
