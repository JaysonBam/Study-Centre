// Test-only entry point for API, cache and download contract regressions.
export { getProjects } from '../../src/api/projects';
export * as projectReads from '../../src/api/projects';
export { getPartCounts, buildDashboardLanes } from '../../src/features/workflow/model/operations';
export {
  loadProjectGmailMessages,
  updateAttachmentDownloadStatus,
  syncProjectGmailThread
} from '../../src/features/gmail/actions/gmailProjectService';
export { linkProjectGmailThread } from '../../src/features/gmail/actions/gmailProjectService';
export { suggestedGmailProject } from '../../src/features/gmail/model/gmailProjectMatches';
export * from '../../src/features/gmail/state/gmailInboxStore';
export { gmailProjectFormValues } from '../../src/features/gmail/model/gmailProjectForm';
export { buildCurrentYearPrintEmailQuery, gmailCalendarYear, gmailYearStart } from '../../src/api/gmail/search';
export { readSnapshot, writeSnapshot, removeReadSnapshots } from '../../src/shared/lib/persistentReads';
export { listRecent3dPrintThreads, downloadGmailAttachment } from '../../src/api/gmail/threads';
export {
  prepareGmailAttachmentDownload,
  downloadPreparedGmailAttachments
} from '../../src/features/gmail/actions/gmailAttachmentDownload';
export { supabase } from '../../src/api/_internal/supabase';
export { getGmailInboxProjects, getHiddenGmailThreads, setGmailThreadHidden } from '../../src/api/gmailRecords';
export { buildLinkedGmailThreadKeys, visibleGmailThreads } from '../../src/features/gmail/model/linkedGmailThreads';
export { classifyGmailProxyRequest } from '../../../../services/printing/supabase/functions/_shared/gmailProxyPolicy.ts';
