import type { Project, Part } from '@/api/projectTypes';
import { useProjects } from '@/features/projects/context/ProjectContext';
import { useSettings } from '@/features/settings/context/SettingsContext';
import { useStaffActionName } from '@/features/auth/hooks/useStaffActionName';
import { compareQuoteSnapshot } from '@/features/workflow/model/quoteState';
import { useEffect, useMemo, useState } from 'react';
import { useFeedback } from '@/shared/context/FeedbackProvider';
import { getStudentEmail } from '@/features/workflow/model/operations';
import { createGmailDraft, GmailAuthError, requestGmailDraftAccess } from '@/api/gmail/client';
import { createQuotePdfBytes, loadQuoteLogoImage } from '@/features/reports/lib/quotePdf';
import { renderEmailTemplate } from '@/features/gmail/model/emailTemplates';
import { buildProjectQuoteAttachment } from '@/features/reports/lib/projectQuoteAttachment';
import { copyRichTextToClipboard } from '@/shared/lib/clipboard';
import { getPartFilamentSource, isProvidedFilamentSource } from '@/features/settings/model/filamentSource.ts';
import {
  buildQuoteViews,
  formatCurrency,
  formatLineMaterialLabel,
  formatLineWeight,
} from '@/features/workflow/model/quoteCostSummaryModel';

export function useQuoteConfirmation(props: { project: Project; onAdvanceToProduction?: () => void }) {
  const { project, onAdvanceToProduction } = props;
  const { updateProject, transitionProjectState } = useProjects();

  const {
    getFilamentPrice,
    filaments,
    providedFilamentPricePerGram,
    emailTemplates,
    emailSignature,
    refreshEmailSettings,
  } = useSettings();

  const { requestStaffName } = useStaffActionName();

  const { confirm, notify, prompt, showMessage } = useFeedback();

  const [isOpeningGmail, setIsOpeningGmail] = useState(false);

  const [pendingAction, setPendingAction] = useState<'quote' | 'printing' | 'archive' | null>(null);

  const getPrimaryCost = (part: Part) => {
    const weight = part.primaryEstimatedWeight || 0;
    const source = getPartFilamentSource(part.primaryFilamentSource, part.primaryOwnFilament);
    return isProvidedFilamentSource(source)
      ? weight * providedFilamentPricePerGram
      : weight * getFilamentPrice(part.primaryMaterial);
  };

  const getSecondaryCost = (part: Part) => {
    if (!part.secondaryMaterial) return 0;
    const weight = part.secondaryEstimatedWeight || 0;
    const source = getPartFilamentSource(part.secondaryFilamentSource, part.secondaryOwnFilament);
    return isProvidedFilamentSource(source)
      ? weight * providedFilamentPricePerGram
      : weight * getFilamentPrice(part.secondaryMaterial);
  };

  const liveTotalCost = project.parts.reduce((sum, p) => sum + getPrimaryCost(p) + getSecondaryCost(p), 0);

  const issuedSnapshot = project.quoteSnapshot;

  const quoteComparison = compareQuoteSnapshot(project, issuedSnapshot, getPrimaryCost, getSecondaryCost);

  const quoteActionMode = quoteComparison.status === 'no_quote' ? 'initial' : 'update';

  const quoteActionButtonLabel =
    quoteComparison.status === 'no_quote'
      ? 'Issue Initial Quote'
      : quoteComparison.status === 'outdated'
        ? 'Update Quote From Draft'
        : 'Issued Quote Up To Date';

  const snapshots = (project.quoteSnapshots || [])
    .slice()
    .sort((left, right) => left.snapshot_version - right.snapshot_version);

  const issuedSnapshots = snapshots.filter((snapshot) => snapshot.status === 'ISSUED');

  const currentIssuedSnapshot = issuedSnapshot || issuedSnapshots[issuedSnapshots.length - 1];

  const currentIssuedVersion = currentIssuedSnapshot?.snapshot_version ?? null;

  const previousSnapshots = snapshots.filter(
    (snapshot) => snapshot.snapshot_version !== currentIssuedVersion,
  );

  const [selectedQuoteViewId, setSelectedQuoteViewId] = useState<string>(
    currentIssuedSnapshot ? `snapshot-${currentIssuedSnapshot.snapshot_version}` : 'draft-current',
  );

  const draftLineSummary = quoteComparison.currentLineSummary;

  const draftTotalCost = quoteComparison.currentTotalCost || liveTotalCost;

  const quoteViews = useMemo(
    () =>
      buildQuoteViews({
        previousSnapshots,
        currentIssuedSnapshot,
        quoteStatus: quoteComparison.status,
        draftTotalCost,
        draftLineSummary,
      }),
    [currentIssuedSnapshot, draftLineSummary, draftTotalCost, previousSnapshots, quoteComparison.status],
  );

  const selectedQuoteView = quoteViews.find((view) => view.id === selectedQuoteViewId) ?? quoteViews[0];

  const showQuoteViewSelect =
    quoteViews.length > 1 && (previousSnapshots.length > 0 || quoteComparison.status === 'outdated');

  const quoteIsIssued = quoteComparison.hasSnapshot;

  const quotePdfLines = (currentIssuedSnapshot?.line_summary || []).map((line) => ({
    partNumber: line.part_number,
    partName: line.part_name,
    materials: line.materials.map(formatLineMaterialLabel),
    weights: line.materials.map((material) => formatLineWeight(material.grams)),
    costs: line.materials.map((material) => formatCurrency(Number(material.cost || 0))),
  }));

  useEffect(() => {
    if (quoteViews.length === 0) return;
    if (!quoteViews.some((view) => view.id === selectedQuoteViewId)) {
      setSelectedQuoteViewId(
        currentIssuedSnapshot ? `snapshot-${currentIssuedSnapshot.snapshot_version}` : quoteViews[0].id,
      );
    }
  }, [currentIssuedSnapshot, quoteViews, selectedQuoteViewId]);

  const studentNeedsToPay =
    project.needsPayment &&
    !project.moduleOrLecturerPays &&
    !(project.paymentOverrideNote && project.paymentOverrideNote.trim() !== '');

  const unverifiedParts = project.parts.filter(
    (part) =>
      !['VERIFIED', 'READY', 'PRINTING', 'PRINTED', 'POST_PROCESSING', 'COLLECTED'].includes(
        part.printStatus,
      ),
  );

  const validateQuoteActions = async () => {
    if (project.parts.length === 0) {
      await showMessage({
        title: 'No parts to quote',
        messages: ['Add and verify at least one part before continuing.'],
        tone: 'warning',
      });
      return false;
    }

    if (unverifiedParts.length > 0) {
      await showMessage({
        title: 'Parts still need verification',
        messages: ['Please verify all parts before continuing.'],
        tone: 'warning',
      });
      return false;
    }

    return true;
  };

  const handleIssueQuote = async () => {
    if (pendingAction) return;
    if (!(await validateQuoteActions())) return;

    const technicianName = await requestStaffName('issuing this quote');
    if (!technicianName) return;

    setPendingAction('quote');
    const result = await transitionProjectState({
      projectId: project.id,
      action: 'ISSUE_QUOTE',
      technicianName,
    });
    setPendingAction(null);

    if (!result.ok) {
      await showMessage({
        title: quoteActionMode === 'initial' ? 'Initial quote was not created' : 'Quote was not updated',
        messages: result.errors,
        tone: 'error',
      });
      return;
    }

    if (result.warnings && result.warnings.length > 0) {
      await showMessage({
        title:
          quoteActionMode === 'initial'
            ? 'Initial quote created with warnings'
            : 'Quote updated with warnings',
        messages: result.warnings,
        tone: 'warning',
      });
    } else {
      notify({
        title: quoteActionMode === 'initial' ? 'Initial quote created' : 'Quote updated',
        message: 'The issued pricing snapshot is now up to date.',
        tone: 'success',
      });
    }
  };

  const handleMoveToPrinting = async () => {
    if (pendingAction) return;
    if (!(await validateQuoteActions())) return;

    if (!quoteComparison.hasSnapshot) {
      await showMessage({
        title: 'Initial quote required',
        messages: ['Make an initial quote before confirming production.'],
        tone: 'warning',
      });
      return;
    }

    const technicianName = await requestStaffName('starting production');
    if (!technicianName) return;

    const paymentHandled =
      !project.needsPayment ||
      (project.receiptNumber && project.receiptNumber.trim() !== '') ||
      project.moduleOrLecturerPays ||
      (project.paymentOverrideNote && project.paymentOverrideNote.trim() !== '');

    const resultValues = paymentHandled
      ? null
      : await prompt({
          title: 'Payment override required',
          message: 'Payment is not cleared. Record an emergency override note before releasing this project.',
          confirmLabel: 'Confirm Quote and Start Printing',
          tone: 'warning',
          fields: [
            { name: 'overrideNote', label: 'Override note', type: 'textarea' as const, required: true },
          ],
        });
    const overrideNote = resultValues?.overrideNote?.trim();
    if (!paymentHandled && !overrideNote) return;

    setPendingAction('printing');
    const result = await transitionProjectState({
      projectId: project.id,
      action: 'MOVE_TO_PRINTING',
      technicianName,
      overrideNote,
    });
    setPendingAction(null);

    if (!result.ok) {
      await showMessage({ title: 'Cannot move to printing', messages: result.errors, tone: 'error' });
      return;
    }

    if (result.warnings && result.warnings.length > 0) {
      await showMessage({ title: 'Moved with warnings', messages: result.warnings, tone: 'warning' });
    } else {
      notify({ title: 'Production started', message: 'Project moved to Production.', tone: 'success' });
    }
    onAdvanceToProduction?.();
  };

  const handleArchive = async () => {
    if (pendingAction) return;
    const shouldCancel = await confirm({
      title: 'Cancel project',
      message: 'This keeps the record but removes it from the active workflow.',
      confirmLabel: 'Cancel Project',
      tone: 'error',
    });
    if (!shouldCancel) return;

    const technicianName = await requestStaffName('cancelling this project');
    if (!technicianName) return;

    const resultValues = await prompt({
      title: 'Cancellation details',
      confirmLabel: 'Record Cancellation',
      fields: [{ name: 'reason', label: 'Reason', type: 'textarea', required: true }],
    });
    const reason = resultValues?.reason.trim();
    if (!reason) return;

    setPendingAction('archive');
    const result = await transitionProjectState({
      projectId: project.id,
      action: 'CANCEL_PROJECT',
      technicianName,
      reason,
    });
    setPendingAction(null);

    if (!result.ok) {
      await showMessage({ title: 'Project was not cancelled', messages: result.errors, tone: 'error' });
      return;
    }

    if (result.warnings && result.warnings.length > 0) {
      await showMessage({ title: 'Cancelled with warnings', messages: result.warnings, tone: 'warning' });
    } else {
      notify({
        title: 'Project archived',
        message: 'The project was removed from the active workflow.',
        tone: 'success',
      });
    }
  };

  const getQuotePdfFilename = () => `MISC-quote-${project.priorityNumber}-${project.studentNumber}.pdf`;

  const buildQuotePdfBytes = async () =>
    createQuotePdfBytes({
      project,
      totalCost: Number(currentIssuedSnapshot?.total_cost || 0),
      lines: quotePdfLines,
      filaments,
      providedFilamentPricePerGram,
      logo: await loadQuoteLogoImage(),
    });

  const downloadQuotePdf = async () => {
    if (!quoteIsIssued || !currentIssuedSnapshot) {
      await showMessage({
        title: 'Initial quote required',
        messages: ['Issue the initial quote before downloading an official quote PDF.'],
        tone: 'warning',
      });
      return;
    }

    try {
      const bytes = await buildQuotePdfBytes();
      const pdfBuffer = new ArrayBuffer(bytes.byteLength);
      new Uint8Array(pdfBuffer).set(bytes);
      const blob = new Blob([pdfBuffer], { type: 'application/pdf' });
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = getQuotePdfFilename();
      document.body.appendChild(link);
      link.click();
      link.remove();
      URL.revokeObjectURL(url);
    } catch (error) {
      await showMessage({
        title: 'Quote PDF was not downloaded',
        messages: [error instanceof Error ? error.message : 'Unexpected PDF generation error.'],
        tone: 'error',
      });
    }
  };

  const quoteEmailTemplateKey = studentNeedsToPay ? 'quote_payment_required' : 'quote_no_payment_required';

  const communicationEmail = renderEmailTemplate({
    templates: emailTemplates,
    signature: emailSignature,
    templateKey: quoteEmailTemplateKey,
    project,
    suppressSignature: true,
  });

  const replyEmail = renderEmailTemplate({
    templates: emailTemplates,
    signature: emailSignature,
    templateKey: quoteEmailTemplateKey,
    project,
  });

  const emailContent = communicationEmail.plainBody;

  const displayedEmailContent = quoteIsIssued
    ? emailContent
    : 'Issue an initial quote before preparing student communication.';

  const copyToClipboard = async () => {
    if (!quoteIsIssued) {
      await showMessage({
        title: 'Initial quote required',
        messages: ['Issue the initial quote before copying student communication.'],
        tone: 'warning',
      });
      return;
    }

    await copyRichTextToClipboard(emailContent, communicationEmail.htmlBody);
    notify({ message: 'Email content copied to clipboard.', tone: 'success' });
  };

  const getQuotePdfAttachment = async () =>
    buildProjectQuoteAttachment(project, getFilamentPrice, filaments, providedFilamentPricePerGram);

  const createAndOpenDraft = async (
    subject: string,
    body: string,
    htmlBody: string,
    attachQuote: boolean,
  ) => {
    if (isOpeningGmail) return false;
    setIsOpeningGmail(true);
    const studentEmail = project.email?.trim() || getStudentEmail(project.studentNumber);
    if (!studentEmail) {
      try {
        await showMessage({
          title: 'Cannot prepare email',
          messages: ['Student number must be exactly 8 digits before a Tuks email address can be generated.'],
          tone: 'warning',
        });
      } finally {
        setIsOpeningGmail(false);
      }
      return false;
    }

    try {
      const draft = await createGmailDraft({
        to: studentEmail,
        subject,
        body,
        htmlBody,
        attachments: attachQuote ? [await getQuotePdfAttachment()] : [],
      });
      window.open(draft.url, '_blank', 'noopener,noreferrer');
      return true;
    } catch (error) {
      if (error instanceof GmailAuthError) {
        const shouldReconnect = await confirm({
          title: 'Gmail access needed',
          message:
            'To create Gmail drafts with attachments, sign in with Google again and approve Gmail draft access.',
          messages: [error.message],
          confirmLabel: 'Grant Gmail Access',
        });
        if (shouldReconnect) await requestGmailDraftAccess();
        return false;
      }

      await showMessage({
        title: 'Gmail draft was not created',
        messages: [error instanceof Error ? error.message : 'Unexpected Gmail API error.'],
        tone: 'error',
      });
      return false;
    } finally {
      setIsOpeningGmail(false);
    }
  };

  const sendEmail = async () => {
    if (!quoteIsIssued) {
      await showMessage({
        title: 'Initial quote required',
        messages: ['Issue the initial quote before opening student communication.'],
        tone: 'warning',
      });
      return;
    }

    const latestEmailSettings = await refreshEmailSettings();
    const emailForDraft = renderEmailTemplate({
      templates: latestEmailSettings.emailTemplates,
      signature: latestEmailSettings.emailSignature,
      templateKey: quoteEmailTemplateKey,
      project,
    });

    await createAndOpenDraft(
      emailForDraft.subject,
      emailForDraft.plainBody,
      emailForDraft.htmlBody,
      emailForDraft.attachQuote,
    );
  };

  const quoteStatusTitle =
    quoteComparison.status === 'no_quote'
      ? 'No quote issued yet'
      : quoteComparison.status === 'up_to_date'
        ? 'Issued quote up to date'
        : 'Issued quote outdated';

  const quoteStatusBody =
    quoteComparison.status === 'no_quote'
      ? 'Make an initial quote to lock the current pricing snapshot.'
      : quoteComparison.status === 'up_to_date'
        ? 'The latest issued quote matches the current project data.'
        : 'The latest issued quote no longer matches the current project data. You can still continue to printing, or update the quote first if you want the snapshot to match.';

  const quoteStatusTotal =
    quoteComparison.status === 'no_quote'
      ? `Current total: ${formatCurrency(liveTotalCost)}`
      : quoteComparison.status === 'up_to_date'
        ? `Issued total: ${formatCurrency(quoteComparison.issuedTotalCost)}`
        : `Issued total: ${formatCurrency(quoteComparison.issuedTotalCost)} | Current total: ${formatCurrency(quoteComparison.currentTotalCost)}`;

  const productionReadinessBody =
    quoteComparison.status === 'no_quote'
      ? 'You need an initial quote before production can be confirmed.'
      : quoteComparison.status === 'outdated'
        ? 'The latest issued quote is outdated, but you can still continue to printing. Update it first if you want the snapshot to match the current project data.'
        : 'The latest issued quote is current. If payment is not cleared, confirmation will require an emergency override note.';
  return {
    updateProject,
    isOpeningGmail,
    pendingAction,
    quoteComparison,
    quoteActionMode,
    quoteActionButtonLabel,
    currentIssuedSnapshot,
    currentIssuedVersion,
    selectedQuoteViewId,
    setSelectedQuoteViewId,
    quoteViews,
    selectedQuoteView,
    showQuoteViewSelect,
    quoteIsIssued,
    unverifiedParts,
    handleIssueQuote,
    handleMoveToPrinting,
    handleArchive,
    downloadQuotePdf,
    replyEmail,
    displayedEmailContent,
    copyToClipboard,
    getQuotePdfAttachment,
    sendEmail,
    quoteStatusTitle,
    quoteStatusBody,
    quoteStatusTotal,
    productionReadinessBody,
  };
}
