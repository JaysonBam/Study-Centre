import { supabase } from './_internal/supabase';
import { apiResult } from './_internal/result';

export const listRooms = () => apiResult(supabase.from('rooms').select('*'));

export const listBookableRooms = () =>
  apiResult(
    supabase
      .from('rooms')
      .select('id,name,borrowable_items,is_available,dynamic_labels,max_people,min_people')
      .order('name'),
  );

export const listRoomMaintenance = () =>
  apiResult(supabase.from('rooms').select('id, name, dynamic_labels').order('name'));

export const updateRoomLabels = (id: string | number, updates: Record<string, unknown>) =>
  apiResult(supabase.from('rooms').update(updates).eq('id', id));

export const listRoomNames = () => apiResult(supabase.from('rooms').select('id, name'));

export const deleteRooms = (id: readonly (string | number)[]) =>
  apiResult(supabase.from('rooms').delete().in('id', id));

export const updateRoom = (id: string | number, updates: Record<string, unknown>) =>
  apiResult(supabase.from('rooms').update(updates).eq('id', id));

export const createRooms = (records: Record<string, unknown> | Record<string, unknown>[]) =>
  apiResult(supabase.from('rooms').insert(records));
