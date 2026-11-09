import { useCallback, useEffect, useRef, useState } from 'react';
import { getPublicProject } from '@/api/projects';
import type { PublicProjectDto } from '@/api/types';

export function usePublicProject(projectId: string | undefined) {
  const [project, setProject] = useState<PublicProjectDto | null>(null);
  const [loading, setLoading] = useState(true);
  const [errorType, setErrorType] = useState<'not-found' | 'service' | ''>('');
  const requestSequence = useRef(0);

  const fetchPublicProject = useCallback(async () => {
    const requestId = ++requestSequence.current;
    if (!projectId) {
      setErrorType('not-found');
      setLoading(false);
      return;
    }

    setLoading(true);
    setErrorType('');

    try {
      const { data, error } = await getPublicProject(projectId);
      if (requestId !== requestSequence.current) return;
      if (error) throw error;
      const payload = Array.isArray(data) ? data[0] : data;
      if (!payload?.project_code) {
        setProject(null);
        setErrorType('not-found');
        return;
      }
      setProject(payload as PublicProjectDto);
    } catch (error) {
      if (requestId !== requestSequence.current) return;
      console.error('Unable to load public project status:', error);
      setProject(null);
      setErrorType('service');
    } finally {
      if (requestId === requestSequence.current) {
        setLoading(false);
      }
    }
  }, [projectId]);

  useEffect(() => {
    void fetchPublicProject();
    return () => {
      requestSequence.current += 1;
    };
  }, [fetchPublicProject]);

  return { project, loading, errorType, fetchPublicProject };
}
