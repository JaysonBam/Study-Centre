import { supabase } from './_internal/supabase';
import { apiResult } from './_internal/result';

export const listCourseChoices = () => apiResult(supabase.from('courses').select('id,name').order('name'));

export const listCourseNames = () => apiResult(supabase.from('courses').select('id, name'));

export const listCourses = () => apiResult(supabase.from('courses').select('*'));

export const deleteCourses = (id: readonly (string | number)[]) =>
  apiResult(supabase.from('courses').delete().in('id', id));

export const updateCourse = (id: string | number, updates: Record<string, unknown>) =>
  apiResult(supabase.from('courses').update(updates).eq('id', id));

export const createCourses = (records: Record<string, unknown>[]) =>
  apiResult(supabase.from('courses').insert(records));
