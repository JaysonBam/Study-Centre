import { useEffect, useMemo, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import type { Project } from '@/api/projectTypes';
import { useProjects } from '@/features/projects/context/ProjectContext';
import { useSettings } from '@/features/settings/context/SettingsContext';
import { useFeedback } from '@/shared/context/FeedbackProvider';
import { getStudentEmail, isValidEmail, isValidStudentNumber } from '@/features/workflow/model/operations';
import { normalizeModuleCode } from '@/features/projects/model/moduleCode';
import {
  DEFAULT_FILAMENT_SOURCE,
  normalizeFilamentSource,
} from '@/features/settings/model/filamentSource.ts';
import { extractProjectSuggestions, isSupportedGmailAttachment } from '@/features/gmail/model/gmailParsing';
import {
  linkProjectGmailThread,
  unlinkProjectGmailThread,
} from '@/features/gmail/actions/gmailProjectService';
import {
  downloadPreparedGmailAttachments,
  prepareGmailAttachmentDownload,
  type PreparedGmailAttachmentDownload,
} from '@/features/gmail/actions/gmailAttachmentDownload';
import type { GmailThreadListItem } from '@/api/gmail/types';
import { useProjectGmailThreadAccess } from '@/features/gmail/hooks/gmailThreadAccess';
import { useLocalHelper } from '@/features/local-files/context/LocalHelperContext';
import { getNextProjectPriority } from '@/features/projects/model/projectPriority';
import { gmailProjectFormValues } from '@/features/gmail/model/gmailProjectForm';
import { buildInitialEmail } from '../model/projectIntakeModel';

export function useProjectIntake(props: { project?: Project; initialGmailThread?: GmailThreadListItem }) {
  const { project, initialGmailThread } = props;
  const navigate = useNavigate();

  const { addProject, updateProject, projectSummaries } = useProjects();

  const { modules } = useSettings();

  const { confirm, notify, prompt, showMessage } = useFeedback();

  const { state: helperState, client: helperClient } = useLocalHelper();

  const { canUseGmail } = useProjectGmailThreadAccess(
    project || { gmailThreadId: null, gmailAccountEmail: null },
  );

  const automaticPriority = useMemo(() => getNextProjectPriority(projectSummaries), [projectSummaries]);

  const priorityManuallyAdjustedRef = useRef(false);

  const [formData, setFormData] = useState(() => ({
    studentName: project?.studentName || '',
    studentNumber: project?.studentNumber || '',
    email: buildInitialEmail(project),
    priorityNumber: project?.priorityNumber ?? automaticPriority,
    course: project?.course ? (normalizeModuleCode(project.course) ?? project.course) : '',
    lecturer: project?.lecturer || '',
    needsPayment: project?.needsPayment ?? true,
    moduleOrLecturerPays: project?.moduleOrLecturerPays ?? false,
    defaultFilamentSource: normalizeFilamentSource(project?.defaultFilamentSource),
    ...(!project && initialGmailThread
      ? gmailProjectFormValues(initialGmailThread, projectSummaries, modules)
      : {}),
  }));

  const [errors, setErrors] = useState<Record<string, string>>({});

  const [gmailPickerOpen, setGmailPickerOpen] = useState(false);

  const [selectedGmailThread, setSelectedGmailThread] = useState<GmailThreadListItem | null>(
    initialGmailThread || null,
  );

  const [gmailLinking, setGmailLinking] = useState(false);

  const [saving, setSaving] = useState(false);

  const initialThreadReviewed = useRef(false);

  useEffect(() => {
    if (!initialGmailThread || initialThreadReviewed.current) return;
    initialThreadReviewed.current = true;
    const { studentNumberCandidates } = extractProjectSuggestions(
      initialGmailThread.snapshot,
      projectSummaries,
    );
    if (studentNumberCandidates.length > 1)
      notify({
        title: 'Student number needs review',
        message: `Found multiple eight-digit numbers: ${studentNumberCandidates.join(', ')}. No number was selected.`,
        tone: 'warning',
      });
  }, [initialGmailThread, projectSummaries, notify]);

  useEffect(() => {
    if (project || priorityManuallyAdjustedRef.current) return;
    setFormData((previous) =>
      previous.priorityNumber === automaticPriority
        ? previous
        : { ...previous, priorityNumber: automaticPriority },
    );
  }, [automaticPriority, project]);

  const applySelectedThread = async (item: GmailThreadListItem) => {
    if (project) {
      if (project.gmailThreadId && project.gmailThreadId !== item.threadId) {
        const replace = await confirm({
          title: 'Replace Main Gmail Thread?',
          message: 'The cached correspondence for the current Main Gmail Thread will be removed.',
          messages: [project.gmailThreadSubject || project.gmailThreadId, `Replace with: ${item.subject}`],
          confirmLabel: 'Replace thread',
          cancelLabel: 'Keep current thread',
        });
        if (!replace) return;
      }
      setGmailLinking(true);
      try {
        if (project.gmailThreadId && project.gmailThreadId !== item.threadId)
          await unlinkProjectGmailThread(project.id);
        await linkProjectGmailThread(project.id, item.snapshot);
        updateProject(project.id, {
          gmailThreadId: item.snapshot.id,
          gmailAccountEmail: item.snapshot.accountEmail,
          gmailThreadSubject: item.snapshot.subject,
          gmailMainContactEmail: item.snapshot.mainContactEmail,
          gmailLastSyncedAt: item.snapshot.syncedAt,
        });
        notify({ title: 'Main Gmail Thread linked', message: item.subject, tone: 'success' });
      } catch (error) {
        await showMessage({
          title: 'Main Gmail Thread was not linked',
          messages: [error instanceof Error ? error.message : 'Unexpected Gmail linking error.'],
          tone: 'error',
        });
      } finally {
        setGmailLinking(false);
      }
      return;
    }

    const suggestions = extractProjectSuggestions(item.snapshot, projectSummaries);
    setSelectedGmailThread(item);
    setFormData((previous) => ({ ...previous, ...gmailProjectFormValues(item, projectSummaries, modules) }));
    setErrors({});
    if (suggestions.studentNumberCandidates.length > 1) {
      notify({
        title: 'Student number needs review',
        message: `Found multiple eight-digit numbers: ${suggestions.studentNumberCandidates.join(', ')}. No number was selected.`,
        tone: 'warning',
      });
    }
  };

  const unlinkThread = async () => {
    if (!project?.gmailThreadId || gmailLinking) return;
    const approved = await confirm({
      title: 'Unlink Main Gmail Thread?',
      message:
        'Cached Gmail messages and attachment download records for this project will be removed. Gmail itself is not changed.',
      confirmLabel: 'Unlink thread',
      cancelLabel: 'Keep linked',
    });
    if (!approved) return;
    setGmailLinking(true);
    try {
      await unlinkProjectGmailThread(project.id);
      updateProject(project.id, {
        gmailThreadId: null,
        gmailAccountEmail: null,
        gmailThreadSubject: null,
        gmailMainContactEmail: null,
        gmailLastSyncedAt: null,
      });
      notify({
        title: 'Main Gmail Thread unlinked',
        message: 'The project is no longer linked to Gmail.',
        tone: 'success',
      });
    } catch (error) {
      await showMessage({
        title: 'Main Gmail Thread was not unlinked',
        messages: [error instanceof Error ? error.message : 'Unexpected unlink error.'],
        tone: 'error',
      });
    } finally {
      setGmailLinking(false);
    }
  };

  const updateStudentNumber = (value: string) => {
    const sanitizedStudentNumber = value.replace(/\D/g, '').slice(0, 8);
    const previousSuggestedEmail = getStudentEmail(formData.studentNumber);
    const nextSuggestedEmail = getStudentEmail(sanitizedStudentNumber);
    const shouldRefreshEmail = !formData.email.trim() || formData.email === previousSuggestedEmail;

    setFormData((prev) => ({
      ...prev,
      studentNumber: sanitizedStudentNumber,
      email: shouldRefreshEmail ? nextSuggestedEmail : prev.email,
    }));
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target;

    if (name === 'studentNumber') {
      updateStudentNumber(value);
      return;
    }

    if (name === 'priorityNumber') {
      priorityManuallyAdjustedRef.current = true;
      setFormData((prev) => ({
        ...prev,
        priorityNumber: Math.max(1, Number.parseInt(value, 10) || 1),
      }));
      return;
    }

    if (name === 'course') {
      const normalizedCourse = normalizeModuleCode(value);
      const nextCourse = normalizedCourse ?? value;
      const matchedModule = normalizedCourse
        ? modules.find((module) => normalizeModuleCode(module.code) === normalizedCourse)
        : undefined;
      setErrors((previous) => ({ ...previous, course: '' }));
      if (matchedModule) {
        setFormData((prev) => ({
          ...prev,
          course: nextCourse,
          lecturer: matchedModule.lecturer,
          needsPayment: !matchedModule.modulePayment,
          moduleOrLecturerPays: !!matchedModule.modulePayment,
          defaultFilamentSource: normalizeFilamentSource(matchedModule.defaultFilamentSource),
        }));
        return;
      }
      setFormData((previous) => ({ ...previous, course: nextCourse }));
      return;
    }

    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleSave = async () => {
    if (saving) return;
    const missing: string[] = [];
    const trimmedEmail = formData.email.trim();
    const normalizedCourse = formData.course.trim() ? normalizeModuleCode(formData.course) : '';
    const moduleCodeError =
      formData.course.trim() && !normalizedCourse
        ? 'Module code must be three letters, one space, and three numbers (for example, MRN 422).'
        : '';

    if (!formData.studentName.trim()) missing.push('Student name is required.');
    if (!formData.studentNumber.trim()) missing.push('Student number is required.');
    else if (!isValidStudentNumber(formData.studentNumber))
      missing.push('Student number must be exactly 8 digits.');
    if (!trimmedEmail) missing.push('Email is required.');
    else if (!isValidEmail(trimmedEmail)) missing.push('Email address must be valid.');
    if (moduleCodeError) missing.push(moduleCodeError);

    setErrors({
      studentName: !formData.studentName.trim() ? 'This field is required.' : '',
      studentNumber: !formData.studentNumber.trim()
        ? 'This field is required.'
        : !isValidStudentNumber(formData.studentNumber)
          ? 'Student number must be exactly 8 digits.'
          : '',
      email: !trimmedEmail
        ? 'This field is required.'
        : !isValidEmail(trimmedEmail)
          ? 'Enter a valid email address.'
          : '',
      course: moduleCodeError,
      priorityNumber: formData.priorityNumber < 1 ? 'Priority number must be at least 1.' : '',
    });

    if (missing.length > 0 || formData.priorityNumber < 1) {
      const messages = [...missing];
      if (formData.priorityNumber < 1) messages.push('Priority number must be at least 1.');

      await showMessage({
        title: 'Project details incomplete',
        messages,
        tone: 'warning',
      });
      return;
    }

    const payload = {
      ...formData,
      priorityNumber:
        project || priorityManuallyAdjustedRef.current ? formData.priorityNumber : automaticPriority,
      email: trimmedEmail,
      course: normalizedCourse || '',
      needsPayment: formData.moduleOrLecturerPays ? false : formData.needsPayment,
      defaultFilamentSource: normalizeFilamentSource(
        formData.defaultFilamentSource || DEFAULT_FILAMENT_SOURCE,
      ),
      ...(selectedGmailThread
        ? {
            gmailThreadId: selectedGmailThread.snapshot.id,
            gmailAccountEmail: selectedGmailThread.snapshot.accountEmail,
            gmailThreadSubject: selectedGmailThread.snapshot.subject,
            gmailMainContactEmail: selectedGmailThread.snapshot.mainContactEmail,
            gmailLastSyncedAt: selectedGmailThread.snapshot.syncedAt,
          }
        : {}),
    };

    if (project) {
      updateProject(project.id, payload);
      notify({ title: 'Project details updated', message: 'Your changes are being saved.', tone: 'success' });
      return;
    }

    setSaving(true);
    try {
      const newId = await addProject({
        ...payload,
        state: 'REVIEW',
      });
      if (!newId) {
        await showMessage({
          title: 'Project was not created',
          messages: ['Supabase did not save the project. Review the synchronization warning and try again.'],
          tone: 'error',
        });
        return;
      }

      const createdProject: Project = {
        id: newId,
        ...payload,
        state: 'REVIEW',
        parts: [],
        createdAt: new Date().toISOString(),
        archived: false,
      };

      let gmailCacheSaved = true;
      if (selectedGmailThread) {
        try {
          await linkProjectGmailThread(newId, selectedGmailThread.snapshot);
        } catch (error) {
          gmailCacheSaved = false;
          notify({
            title: 'Project created; Gmail cache needs attention',
            message:
              error instanceof Error
                ? error.message
                : 'The Main Gmail Thread was linked, but its cached messages were not saved.',
            tone: 'warning',
          });
        }
      }

      if (selectedGmailThread && gmailCacheSaved) {
        const supportedCount = selectedGmailThread.snapshot.messages
          .flatMap((message) => message.attachments)
          .filter((attachment) => isSupportedGmailAttachment(attachment.filename)).length;
        if (supportedCount > 0 && helperState !== 'connected') {
          notify({
            title: 'Attachments not downloaded',
            message:
              'The local helper is unavailable. Use View Correspondence on the main workstation to download the missing STL and 3MF files.',
            tone: 'warning',
          });
        } else if (supportedCount > 0) {
          try {
            let prepared = await prepareGmailAttachmentDownload(createdProject, helperClient);
            if (prepared.resolution.status === 'ambiguous') {
              const labels = prepared.resolution.candidates.map(
                (candidate) => `${candidate.folderName} — ${candidate.workflowFolder.replaceAll('_', ' ')}`,
              );
              const selection = await prompt({
                title: 'Choose the project folder',
                message:
                  'Several folders use this project priority. Choose the confirmed match before downloading attachments.',
                fields: [
                  {
                    name: 'folder',
                    label: 'Project folder',
                    type: 'select',
                    options: labels,
                    required: true,
                  },
                ],
                confirmLabel: 'Use this folder',
              });
              const selectedCandidate =
                prepared.resolution.candidates[labels.indexOf(selection?.folder || '')];
              if (selectedCandidate)
                prepared = await prepareGmailAttachmentDownload(
                  createdProject,
                  helperClient,
                  selectedCandidate.candidateId,
                );
            }
            if (prepared.resolution.status === 'ambiguous') {
              notify({
                title: 'Attachments not downloaded',
                message: 'No project folder was selected. The files remain available for later download.',
                tone: 'warning',
              });
            } else if (prepared.resolution.status === 'not_found') {
              notify({
                title: 'Attachments not downloaded',
                message: 'The project folder could not be found or created.',
                tone: 'warning',
              });
            } else if (prepared.attachments.length > 0 && 'projectKey' in prepared.resolution) {
              const shouldDownload = await confirm({
                title: 'Download Gmail attachments?',
                message: `Download ${prepared.attachments.length} supported ${prepared.attachments.length === 1 ? 'file' : 'files'} to ${prepared.resolution.folderName}?`,
                messages: prepared.attachments.map((attachment) => attachment.filename),
                tone: 'info',
                confirmLabel: 'Download files',
                cancelLabel: 'Download later',
              });
              if (shouldDownload) {
                const result = await downloadPreparedGmailAttachments(
                  createdProject,
                  helperClient,
                  prepared as PreparedGmailAttachmentDownload,
                );
                notify({
                  title: result.failed
                    ? 'Attachment download completed with warnings'
                    : 'Gmail attachments downloaded',
                  message: `${result.saved} saved, ${result.skipped} skipped, ${result.renamed} safely renamed${result.failed ? `, ${result.failed} failed` : ''}.`,
                  tone: result.failed ? 'warning' : 'success',
                });
              }
            }
          } catch (error) {
            notify({
              title: 'Attachments not downloaded',
              message:
                error instanceof Error
                  ? error.message
                  : 'The local helper could not prepare the project folder.',
              tone: 'warning',
            });
          }
        }
      }

      navigate(`/project/${newId}`, {
        state: selectedGmailThread ? undefined : { autoCreateLocalFolderFor: newId },
      });
    } finally {
      setSaving(false);
    }
  };

  const inputBaseClassName =
    'forge-command-input h-11 w-full px-3.5 text-sm font-semibold placeholder:text-slate-500 dark:placeholder:text-slate-400';

  const defaultInputClassName = inputBaseClassName;

  const errorInputClassName = `${inputBaseClassName} border-rose-500 bg-rose-50 dark:bg-rose-950/40 focus:border-rose-600 focus:ring-rose-200`;

  const sectionClassName = 'forge-panel space-y-5 p-5';
  return {
    modules,
    canUseGmail,
    formData,
    setFormData,
    errors,
    setErrors,
    gmailPickerOpen,
    setGmailPickerOpen,
    selectedGmailThread,
    gmailLinking,
    saving,
    applySelectedThread,
    unlinkThread,
    handleChange,
    handleSave,
    defaultInputClassName,
    errorInputClassName,
    sectionClassName,
  };
}
