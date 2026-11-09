import { useCallback, useEffect, useRef, useState } from 'react';
import { useProjects } from '@/features/projects/context/ProjectContext';
import { useSettings } from '@/features/settings/context/SettingsContext';
import { useStaffActionName } from '@/features/auth/hooks/useStaffActionName';
import { useFeedback } from '@/shared/context/FeedbackProvider';
import { uploadThumbnailFromBlobUrl } from '@/api/thumbnailUploads';
import { isPartVerifiedForReview } from '@/shared/model/partVerification';
import { analyzeProjectFiles } from '@/features/local-files/actions/projectFileImport';
import { type CheckpointReviewProps, hasDraggedFiles } from '../model/partReviewModel';

export function usePartReview(props: CheckpointReviewProps) {
  const { project, onAdvanceFromLockedReview } = props;
  const { transitionProjectState, addExtractedParts, addPart } = useProjects();

  const { getFilamentPrice } = useSettings();

  const { requestStaffName } = useStaffActionName();

  const { notify, prompt, showMessage } = useFeedback();

  const [loading, setLoading] = useState(false);

  const [advancing, setAdvancing] = useState(false);

  const [isDragActive, setIsDragActive] = useState(false);

  const dragDepth = useRef(0);

  const fileInputRef = useRef<HTMLInputElement | null>(null);

  const processFiles = useCallback(
    async (newFiles: FileList | File[]) => {
      setLoading(true);

      try {
        const { parts, errors } = await analyzeProjectFiles({
          files: Array.from(newFiles),
          startPartNumber: project.parts.length + 1,
          getFilamentPrice,
          uploadThumbnail: uploadThumbnailFromBlobUrl,
        });
        if (parts.length > 0) await addExtractedParts(project.id, parts);

        if (errors.length > 0) {
          await showMessage({
            title: 'Some files need attention',
            messages: errors,
            tone: 'warning',
          });
        }
      } catch (err) {
        await showMessage({
          title: 'File analysis failed',
          messages: [err instanceof Error ? err.message : 'Failed to parse one or more files.'],
          tone: 'error',
        });
      } finally {
        setLoading(false);
      }
    },
    [addExtractedParts, getFilamentPrice, project.id, project.parts.length, showMessage],
  );

  const handleFinishReview = async () => {
    if (advancing) return;
    if (project.parts.length === 0) {
      await showMessage({
        title: 'No parts yet',
        messages: ['Add at least one printable part before moving to quote.'],
        tone: 'warning',
      });
      return;
    }

    const unverifiedParts = project.parts.filter((part) => !isPartVerifiedForReview(part));
    if (unverifiedParts.length > 0) {
      await showMessage({
        title: 'Parts still need verification',
        messages: ['Please verify all parts before completing this step.'],
        tone: 'warning',
      });
      return;
    }

    const technicianName = await requestStaffName('completing review');
    if (!technicianName) return;

    if (project.state !== 'INTAKE' && project.state !== 'REVIEW') {
      const reasonResult = await prompt({
        title: 'Reopen review',
        message: `Project is currently ${project.state}. Record why review is being reopened.`,
        confirmLabel: 'Reopen Review',
        fields: [{ name: 'reason', label: 'Reason', type: 'textarea', required: true }],
      });
      const reason = reasonResult?.reason.trim();
      if (!reason) return;

      const reopenResult = await transitionProjectState({
        projectId: project.id,
        action: 'REOPEN_REVIEW',
        technicianName,
        reason,
      });

      if (!reopenResult.ok) {
        await showMessage({
          title: 'Review cannot be reopened',
          messages: reopenResult.errors,
          tone: 'error',
        });
        return;
      }

      if (reopenResult.warnings && reopenResult.warnings.length > 0) {
        await showMessage({
          title: 'Reopened with warnings',
          messages: reopenResult.warnings,
          tone: 'warning',
        });
      }
    }

    setAdvancing(true);
    const result = await transitionProjectState({
      projectId: project.id,
      action: 'COMPLETE_REVIEW',
      technicianName,
    });
    setAdvancing(false);

    if (!result.ok) {
      await showMessage({ title: 'Cannot move to quote', messages: result.errors, tone: 'error' });
      return;
    }

    if (result.warnings && result.warnings.length > 0) {
      await showMessage({ title: 'Moved with warnings', messages: result.warnings, tone: 'warning' });
    } else {
      notify({ title: 'Review complete', message: 'Project moved to Quote.', tone: 'success' });
    }
    onAdvanceFromLockedReview?.();
  };

  const handleManualAdd = () => {
    addPart(project.id);
  };

  useEffect(() => {
    const handleDocumentDragEnter = (event: DragEvent) => {
      if (!hasDraggedFiles(event)) return;
      event.preventDefault();
      dragDepth.current += 1;
      setIsDragActive(true);
    };

    const handleDocumentDragOver = (event: DragEvent) => {
      if (!hasDraggedFiles(event)) return;
      event.preventDefault();
      event.dataTransfer!.dropEffect = 'copy';
      setIsDragActive(true);
    };

    const handleDocumentDragLeave = (event: DragEvent) => {
      if (!hasDraggedFiles(event)) return;
      event.preventDefault();
      dragDepth.current = Math.max(0, dragDepth.current - 1);
      if (dragDepth.current === 0) {
        setIsDragActive(false);
      }
    };

    const handleDocumentDrop = (event: DragEvent) => {
      if (!hasDraggedFiles(event)) return;
      event.preventDefault();
      dragDepth.current = 0;
      setIsDragActive(false);

      if (event.dataTransfer && event.dataTransfer.files.length > 0 && !loading) {
        void processFiles(Array.from(event.dataTransfer.files));
      }
    };

    document.addEventListener('dragenter', handleDocumentDragEnter);
    document.addEventListener('dragover', handleDocumentDragOver);
    document.addEventListener('dragleave', handleDocumentDragLeave);
    document.addEventListener('drop', handleDocumentDrop);

    return () => {
      document.removeEventListener('dragenter', handleDocumentDragEnter);
      document.removeEventListener('dragover', handleDocumentDragOver);
      document.removeEventListener('dragleave', handleDocumentDragLeave);
      document.removeEventListener('drop', handleDocumentDrop);
      dragDepth.current = 0;
    };
  }, [loading, processFiles]);
  return {
    loading,
    advancing,
    isDragActive,
    fileInputRef,
    processFiles,
    handleFinishReview,
    handleManualAdd,
  };
}
