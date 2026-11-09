import { supabase } from './_internal/supabase';
import { apiResult } from './_internal/result';

export const getTestingClock = () =>
  apiResult(supabase.from('settings').select('value').eq('key', 'testing_clock').maybeSingle());

export const saveTestingClock = (record: Record<string, unknown>) =>
  apiResult(supabase.from('settings').upsert(record));

export const getOperationHours = () =>
  apiResult(supabase.from('settings').select('value').eq('key', 'operation_hours').maybeSingle());

export const getRequiredOperationHours = () =>
  apiResult(supabase.from('settings').select('value').eq('key', 'operation_hours').single());

export const getSaturdayHours = () =>
  apiResult(supabase.from('settings').select('value').eq('key', 'saturday_hours').single());

export const getRequiredTestingClock = () =>
  apiResult(supabase.from('settings').select('value').eq('key', 'testing_clock').single());

export const saveOperationHours = (record: Record<string, unknown>) =>
  apiResult(supabase.from('settings').upsert(record));

export const saveSaturdayHours = (record: Record<string, unknown>) =>
  apiResult(supabase.from('settings').upsert(record));
