import type { Project } from '@/api/projectTypes';

export type CheckpointReviewProps = {
  project: Project;
  onAdvanceFromLockedReview?: () => void;
};

export const hasDraggedFiles = (event: DragEvent) => {
  return Boolean(event.dataTransfer && Array.from(event.dataTransfer.types).includes('Files'));
};
