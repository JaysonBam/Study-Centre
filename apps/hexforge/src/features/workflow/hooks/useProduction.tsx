import { useState } from 'react';
import type { Project } from '@/api/projectTypes';
import { useProjects } from '@/features/projects/context/ProjectContext';
import { useSettings } from '@/features/settings/context/SettingsContext';
import { useStaffActionName } from '@/features/auth/hooks/useStaffActionName';
import { useFeedback } from '@/shared/context/FeedbackProvider';

export function useProduction(props: { project: Project; onAdvanceToCollection?: () => void }) {
  const { project, onAdvanceToCollection } = props;
  const { transitionPartStatus, transitionProjectState, updatePart } = useProjects();

  const { printers, brands } = useSettings();

  const { activeStaffName, requestStaffName, setActiveStaffName, staffOptions } = useStaffActionName();

  const { notify, prompt, showMessage } = useFeedback();

  const [activeAction, setActiveAction] = useState<{
    type: 'START' | 'FINISH' | 'FAIL';
    partId: string;
  } | null>(null);

  const [selectedPrinter, setSelectedPrinter] = useState('');

  const [primaryBrand, setPrimaryBrand] = useState('');

  const [secondaryBrand, setSecondaryBrand] = useState('');

  const [failureReason, setFailureReason] = useState('');

  const [actionStaffName, setActionStaffName] = useState('');

  const [formErrors, setFormErrors] = useState<Record<string, string>>({});

  const [pendingAction, setPendingAction] = useState<string | null>(null);

  const openStart = (partId: string) => {
    const part = project.parts.find((p) => p.id === partId);
    setActiveAction({ type: 'START', partId });
    setSelectedPrinter('');
    setPrimaryBrand(part?.primaryBrand || '');
    setSecondaryBrand(part?.secondaryBrand || '');
    setActionStaffName(activeStaffName);
    setFormErrors({});
  };

  const openFinish = (partId: string) => {
    setActiveAction({ type: 'FINISH', partId });
    setActionStaffName(activeStaffName);
    setFormErrors({});
  };

  const openFail = (partId: string) => {
    setActiveAction({ type: 'FAIL', partId });
    setFailureReason('');
    setActionStaffName(activeStaffName);
    setFormErrors({});
  };

  const closeAction = () => {
    setActiveAction(null);
    setSelectedPrinter('');
    setPrimaryBrand('');
    setSecondaryBrand('');
    setFailureReason('');
    setFormErrors({});
  };

  const confirmAction = async () => {
    if (!activeAction || pendingAction) return;
    const { type: actionType, partId } = activeAction;

    const technicianName = actionStaffName.trim();
    if (!technicianName) {
      setFormErrors((previous) => ({ ...previous, actionStaffName: 'Select a staff member.' }));
      return;
    }
    setActiveStaffName(technicianName);

    if (actionType === 'START') {
      const machineName = selectedPrinter.trim();
      const errors = {
        selectedPrinter: !machineName ? 'This field is required.' : '',
      };
      setFormErrors(errors);
      if (errors.selectedPrinter) return;

      setPendingAction(`${actionType}:${partId}`);
      const result = await transitionPartStatus({
        projectId: project.id,
        partId,
        action: 'START_PRINT',
        technicianName,
        machineName,
      });
      setPendingAction(null);

      if (!result.ok) {
        await showMessage({ title: 'Print was not started', messages: result.errors, tone: 'error' });
        return;
      }

      if (result.warnings && result.warnings.length > 0) {
        await showMessage({ title: 'Started with warnings', messages: result.warnings, tone: 'warning' });
      }

      updatePart(project.id, partId, {
        primaryBrand,
        secondaryBrand: secondaryBrand || undefined,
      });
      closeAction();
    } else if (actionType === 'FINISH') {
      setPendingAction(`${actionType}:${partId}`);
      const result = await transitionPartStatus({
        projectId: project.id,
        partId,
        action: 'FINISH_PRINT',
        technicianName,
      });
      setPendingAction(null);

      if (!result.ok) {
        await showMessage({ title: 'Print was not finished', messages: result.errors, tone: 'error' });
        return;
      }

      if (result.warnings && result.warnings.length > 0) {
        await showMessage({ title: 'Finished with warnings', messages: result.warnings, tone: 'warning' });
      }
      closeAction();
    } else {
      const reason = failureReason.trim();
      const errors = {
        failureReason: !reason ? 'Please fill in a failure reason.' : '',
      };
      setFormErrors(errors);
      if (errors.failureReason) return;

      setPendingAction(`${actionType}:${partId}`);
      const result = await transitionPartStatus({
        projectId: project.id,
        partId,
        action: 'FAIL_PRINT',
        technicianName,
        reason,
      });
      setPendingAction(null);

      if (!result.ok) {
        await showMessage({ title: 'Print was not failed', messages: result.errors, tone: 'error' });
        return;
      }
      closeAction();

      if (result.warnings && result.warnings.length > 0) {
        await showMessage({ title: 'Failed with warnings', messages: result.warnings, tone: 'warning' });
      }
    }
  };

  const allCollectionReady =
    project.parts.length > 0 &&
    project.parts.every((p) => ['PRINTED', 'POST_PROCESSING', 'COLLECTED'].includes(p.printStatus));

  const handleNextStage = async () => {
    if (pendingAction) return;
    if (!allCollectionReady) {
      await showMessage({
        title: 'Printing still in progress',
        messages: ['All parts must be printed or in post-processing before moving to collection.'],
        tone: 'warning',
      });
      return;
    }

    const technicianName = await requestStaffName('moving this project to collection');
    if (!technicianName) return;

    const values = await prompt({
      title: 'Move to collection',
      message: 'Release this completed project to collection and record the final handover location.',
      confirmLabel: 'Move to Collection',
      fields: [
        {
          name: 'printLabel',
          label: 'Print label / location',
          defaultValue: project.printLabel || '',
          placeholder: 'Tray A1',
        },
      ],
    });
    const label = values?.printLabel.trim();

    setPendingAction('next-stage');
    const result = await transitionProjectState({
      projectId: project.id,
      action: 'MARK_READY_FOR_COLLECTION',
      technicianName,
      printLabel: label?.trim() || undefined,
    });
    setPendingAction(null);

    if (!result.ok) {
      await showMessage({ title: 'Cannot move to collection', messages: result.errors, tone: 'error' });
      return;
    }

    if (result.warnings && result.warnings.length > 0) {
      await showMessage({ title: 'Moved with warnings', messages: result.warnings, tone: 'warning' });
    } else {
      notify({ title: 'Ready for collection', message: 'Project moved to Collection.', tone: 'success' });
    }
    onAdvanceToCollection?.();
  };

  const handleRequeue = async (partId: string) => {
    const technicianName = await requestStaffName('requeueing this part');
    if (!technicianName) return;

    const values = await prompt({
      title: 'Requeue part',
      message: 'This returns the part to the production queue and records why.',
      confirmLabel: 'Requeue Part',
      fields: [{ name: 'reason', label: 'Reason', type: 'textarea', required: true }],
    });
    const reason = values?.reason.trim();
    if (!reason) return;

    const result = await transitionPartStatus({
      projectId: project.id,
      partId,
      action: 'REQUEUE_PART',
      technicianName,
      reason,
    });

    if (!result.ok) {
      await showMessage({ title: 'Part was not requeued', messages: result.errors, tone: 'error' });
    }
  };

  const activePart = activeAction ? project.parts.find((p) => p.id === activeAction.partId) : null;

  const queuedParts = project.parts.filter((p) =>
    ['READY', 'VERIFIED', 'FAILED', 'DRAFT'].includes(p.printStatus),
  );

  const printingParts = project.parts.filter((p) => p.printStatus === 'PRINTING');

  const printedParts = project.parts.filter((p) =>
    ['PRINTED', 'POST_PROCESSING', 'COLLECTED'].includes(p.printStatus),
  );

  const getProductionLabel = (status: Project['parts'][number]['printStatus']) => {
    if (status === 'PRINTING') return 'Printing';
    if (status === 'PRINTED' || status === 'POST_PROCESSING' || status === 'COLLECTED') return 'Printed';
    return 'Queued';
  };

  const getRecentRunSummary = (part: Project['parts'][number]) => {
    const runs = part.printRuns || [];
    if (runs.length === 0) return 'No print attempts yet';

    const latest = runs[0];
    if (latest.outcome === 'FAILED') {
      const reason = latest.failure_reason?.trim();
      return reason
        ? `Latest: failed on ${latest.machine_name || 'unknown machine'} - ${reason}`
        : `Latest: failed on ${latest.machine_name || 'unknown machine'}`;
    }
    if (latest.outcome === 'PRINTED' || latest.finished_at) {
      return `Latest: printed on ${latest.machine_name || 'unknown machine'}`;
    }
    if (part.printStatus !== 'PRINTING') {
      return `Latest: removed from ${latest.machine_name || 'unknown machine'} before completion`;
    }
    return `Latest: in progress on ${latest.machine_name || 'unknown machine'}`;
  };

  const renderRunHistory = (part: Project['parts'][number]) => {
    const runs = part.printRuns || [];
    if (runs.length === 0) return null;

    return (
      <div className="mt-2 space-y-1 border-t border-slate-300 dark:border-slate-700 pt-2">
        {runs.map((run, idx) => {
          const outcomeLabel =
            run.outcome ||
            (run.failed_at
              ? 'FAILED'
              : run.finished_at
                ? 'PRINTED'
                : idx === 0 && part.printStatus !== 'PRINTING'
                  ? 'REQUEUED'
                  : 'IN_PROGRESS');
          const failureReasonLabel = run.failure_reason?.trim();
          return (
            <div key={run.id} className="text-[11px] text-slate-500 dark:text-slate-400">
              Attempt {runs.length - idx}: {outcomeLabel} - {run.machine_name || 'Unknown machine'}
              {outcomeLabel === 'FAILED' && failureReasonLabel ? ` - ${failureReasonLabel}` : ''}
            </div>
          );
        })}
      </div>
    );
  };
  return {
    printers,
    brands,
    staffOptions,
    activeAction,
    selectedPrinter,
    setSelectedPrinter,
    primaryBrand,
    setPrimaryBrand,
    secondaryBrand,
    setSecondaryBrand,
    failureReason,
    setFailureReason,
    actionStaffName,
    setActionStaffName,
    formErrors,
    setFormErrors,
    pendingAction,
    openStart,
    openFinish,
    openFail,
    closeAction,
    confirmAction,
    allCollectionReady,
    handleNextStage,
    handleRequeue,
    activePart,
    queuedParts,
    printingParts,
    printedParts,
    getProductionLabel,
    getRecentRunSummary,
    renderRunHistory,
  };
}
