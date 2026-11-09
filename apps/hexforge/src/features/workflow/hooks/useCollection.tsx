import type { Project, Part } from '@/api/projectTypes';
import { useProjects } from '@/features/projects/context/ProjectContext';
import { useSettings } from '@/features/settings/context/SettingsContext';
import { useStaffActionName } from '@/features/auth/hooks/useStaffActionName';
import { useState } from 'react';
import { useFeedback } from '@/shared/context/FeedbackProvider';
import { getStudentEmail, isCollectionBlocked } from '@/features/workflow/model/operations';
import { createGmailDraft, GmailAuthError, requestGmailDraftAccess } from '@/api/gmail/client';
import { renderEmailTemplate } from '@/features/gmail/model/emailTemplates';
import { buildProjectQuoteAttachment } from '@/features/reports/lib/projectQuoteAttachment';
import { copyRichTextToClipboard } from '@/shared/lib/clipboard';
import { getPartFilamentSource, isProvidedFilamentSource } from '@/features/settings/model/filamentSource.ts';

export function useCollection(props: { project: Project; onReturnToProduction?: () => void }) {
  const { project, onReturnToProduction } = props;
  const { updateProject, transitionPartStatus } = useProjects();

  const {
    getFilamentPrice,
    filaments,
    providedFilamentPricePerGram,
    emailTemplates,
    emailSignature,
    refreshEmailSettings,
  } = useSettings();

  const { activeStaffName, requestStaffName } = useStaffActionName();

  const { confirm, notify, showMessage } = useFeedback();

  const [isOpeningGmail, setIsOpeningGmail] = useState(false);

  const [collectionAction, setCollectionAction] = useState<string | null>(null);

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

  const displayedReceiptTotal = project.quoteSnapshot
    ? Number(project.quoteSnapshot.total_cost || 0)
    : liveTotalCost;

  const printableCollectionParts = project.parts.filter(
    (p) =>
      p.printStatus === 'PRINTED' || p.printStatus === 'POST_PROCESSING' || p.printStatus === 'COLLECTED',
  );

  const isPaymentBlocked = isCollectionBlocked(project);

  const returnForReprint = async (part: Part) => {
    if (collectionAction) return;
    setCollectionAction(`reprint:${part.id}`);
    try {
      const technicianName = await requestStaffName('returning this part for reprint');
      if (!technicianName) return;

      const result = await transitionPartStatus({
        projectId: project.id,
        partId: part.id,
        action: 'RETURN_FOR_REPRINT',
        technicianName,
        reason: 'Returned for reprint.',
      });
      if (!result.ok) {
        await showMessage({ title: 'Part was not returned', messages: result.errors, tone: 'error' });
        return;
      }
      notify({
        title: 'Part queued for reprint',
        message: `${part.partName} is back in the normal printing queue.`,
        tone: 'success',
      });
      onReturnToProduction?.();
    } finally {
      setCollectionAction(null);
    }
  };

  const collectPart = async (partId: string) => {
    if (collectionAction) return;
    if (isPaymentBlocked) {
      await showMessage({
        title: 'Collection blocked',
        messages: [
          'This project still requires payment. Save the receipt number in the collection panel before collecting any parts.',
        ],
        tone: 'warning',
      });
      return;
    }

    const name = await requestStaffName('collecting this part');
    if (!name) return;

    setCollectionAction(partId);
    const result = await transitionPartStatus({
      projectId: project.id,
      partId,
      action: 'COLLECT_PART',
      technicianName: name,
    });
    setCollectionAction(null);

    if (!result.ok) {
      await showMessage({ title: 'Part was not collected', messages: result.errors, tone: 'error' });
      return;
    }
    notify({ title: 'Part collected', message: 'The collection record was saved.', tone: 'success' });
  };

  const collectAll = async () => {
    if (collectionAction) return;
    if (isPaymentBlocked) {
      await showMessage({
        title: 'Collection blocked',
        messages: [
          'This project still requires payment. Save the receipt number in the collection panel before collecting any parts.',
        ],
        tone: 'warning',
      });
      return;
    }

    const staffName = await requestStaffName('collecting these parts');
    if (!staffName) return;

    setCollectionAction('all');
    let collectedCount = 0;
    try {
      for (const part of printableCollectionParts) {
        if (part.printStatus !== 'COLLECTED') {
          const result = await transitionPartStatus({
            projectId: project.id,
            partId: part.id,
            action: 'COLLECT_PART',
            technicianName: staffName.trim(),
          });
          if (!result.ok) {
            await showMessage({ title: 'Collection stopped', messages: result.errors, tone: 'error' });
            return;
          }
          collectedCount += 1;
        }
      }
      notify({
        title: 'Collection complete',
        message: `${collectedCount} ${collectedCount === 1 ? 'part was' : 'parts were'} marked collected.`,
        tone: 'success',
      });
    } finally {
      setCollectionAction(null);
    }
  };

  const collectionEmailTemplateKey = isPaymentBlocked ? 'collection_payment_reminder' : 'collection_ready';

  const communicationEmail = renderEmailTemplate({
    templates: emailTemplates,
    signature: emailSignature,
    templateKey: collectionEmailTemplateKey,
    project,
    suppressSignature: true,
  });

  const replyEmail = renderEmailTemplate({
    templates: emailTemplates,
    signature: emailSignature,
    templateKey: collectionEmailTemplateKey,
    project,
  });

  const emailContent = communicationEmail.plainBody;

  const copyToClipboard = async () => {
    await copyRichTextToClipboard(emailContent, communicationEmail.htmlBody);
    notify({ message: 'Email content copied to clipboard.', tone: 'success' });
  };

  const sendEmail = async () => {
    if (isOpeningGmail) return;
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
      return;
    }

    try {
      const latestEmailSettings = await refreshEmailSettings();
      const emailForDraft = renderEmailTemplate({
        templates: latestEmailSettings.emailTemplates,
        signature: latestEmailSettings.emailSignature,
        templateKey: collectionEmailTemplateKey,
        project,
      });

      const draft = await createGmailDraft({
        to: studentEmail,
        subject: emailForDraft.subject,
        body: emailForDraft.plainBody,
        htmlBody: emailForDraft.htmlBody,
        attachments: emailForDraft.attachQuote
          ? [
              await buildProjectQuoteAttachment(
                project,
                getFilamentPrice,
                filaments,
                providedFilamentPricePerGram,
              ),
            ]
          : [],
      });
      window.open(draft.url, '_blank', 'noopener,noreferrer');
    } catch (error) {
      if (error instanceof GmailAuthError) {
        const shouldReconnect = await confirm({
          title: 'Gmail access needed',
          message: 'To create Gmail drafts, sign in with Google again and approve Gmail draft access.',
          messages: [error.message],
          confirmLabel: 'Grant Gmail Access',
        });
        if (shouldReconnect) await requestGmailDraftAccess();
        return;
      }

      await showMessage({
        title: 'Gmail draft was not created',
        messages: [error instanceof Error ? error.message : 'Unexpected Gmail API error.'],
        tone: 'error',
      });
    } finally {
      setIsOpeningGmail(false);
    }
  };
  return {
    updateProject,
    getFilamentPrice,
    filaments,
    providedFilamentPricePerGram,
    activeStaffName,
    isOpeningGmail,
    collectionAction,
    displayedReceiptTotal,
    printableCollectionParts,
    isPaymentBlocked,
    returnForReprint,
    collectPart,
    collectAll,
    replyEmail,
    emailContent,
    copyToClipboard,
    sendEmail,
  };
}
