import { supabase } from './_internal/supabase';
import type { AvailabilityData } from './types';

export async function getAvailability(date: string): Promise<AvailabilityData> {
  const { data, error } = await supabase.functions.invoke('slots-available-', { body: { date } });
  if (error) throw error;
  return data as AvailabilityData;
}
