import { supabase } from './_internal/supabase';

export const getPublicProject = (projectCode: string) =>
  supabase.rpc('get_public_project_status', { project_code: projectCode });
