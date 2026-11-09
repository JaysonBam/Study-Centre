import type { Project } from '@/api/projectTypes';
import { getStudentEmail } from '@/features/workflow/model/operations';

export const buildInitialEmail = (project?: Project) =>
  project?.email || getStudentEmail(project?.studentNumber || '');
