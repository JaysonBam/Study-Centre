import { settingsApi, type SettingsState } from '../api/settings.js';
import { WORKFLOW_FOLDER_KEYS, type WorkflowFolderKey } from '@study-centre/contracts/helper';

const element = <T extends HTMLElement>(id: string): T => {
  const node = document.getElementById(id);
  if (!node) throw new Error(`Missing settings element ${id}.`);
  return node as T;
};

const workflowInputs = Object.fromEntries(
  WORKFLOW_FOLDER_KEYS.map((key) => [key, element<HTMLInputElement>(`workflow-${key}`)]),
) as Record<WorkflowFolderKey, HTMLInputElement>;
const portInput = element<HTMLInputElement>('api-port');
const originsInput = element<HTMLTextAreaElement>('allowed-origins');
const bambuInput = element<HTMLInputElement>('bambu-path');
const curaInput = element<HTMLInputElement>('cura-path');
const startupInput = element<HTMLInputElement>('start-with-windows');
const status = element<HTMLParagraphElement>('save-status');
const form = element<HTMLFormElement>('settings-form');

const setStatus = (message: string, tone: 'neutral' | 'success' | 'error' = 'neutral') => {
  status.textContent = message;
  status.dataset.tone = tone;
};

const load = async () => {
  const settings = await settingsApi.getSettings();
  WORKFLOW_FOLDER_KEYS.forEach((key) => {
    workflowInputs[key].value = settings.workflowFolders[key] ?? '';
  });
  portInput.value = String(settings.port);
  originsInput.value = settings.allowedOrigins.join('\n');
  bambuInput.value = settings.bambuStudioPath ?? '';
  curaInput.value = settings.curaPath ?? '';
  startupInput.checked = settings.startWithWindows;
  element<HTMLElement>('version').textContent = `Version ${settings.version}`;
  document.querySelectorAll<HTMLSelectElement>('[data-extension]').forEach((select) => {
    select.value = settings.defaultApplications[select.dataset.extension ?? ''] ?? 'system';
  });
};

WORKFLOW_FOLDER_KEYS.forEach((key) => {
  element<HTMLButtonElement>(`choose-${key}`).addEventListener('click', async () => {
    const selected = await settingsApi.chooseWorkflowFolder(key);
    if (selected) workflowInputs[key].value = selected;
  });
});
element<HTMLButtonElement>('choose-bambu').addEventListener('click', async () => {
  const selected = await settingsApi.chooseApplication('bambu');
  if (selected) bambuInput.value = selected;
});
element<HTMLButtonElement>('choose-cura').addEventListener('click', async () => {
  const selected = await settingsApi.chooseApplication('cura');
  if (selected) curaInput.value = selected;
});
element<HTMLButtonElement>('open-root').addEventListener('click', () => void settingsApi.openRoot());
element<HTMLButtonElement>('open-logs').addEventListener('click', () => void settingsApi.openLogs());
element<HTMLButtonElement>('create-shortcuts').addEventListener('click', async () => {
  const result = await settingsApi.createShortcuts();
  setStatus(result.message, result.ok ? 'success' : 'error');
});

form.addEventListener('submit', async (event) => {
  event.preventDefault();
  setStatus('Saving…');
  const defaultApplications: Record<string, 'bambu' | 'cura' | 'system'> = {};
  document.querySelectorAll<HTMLSelectElement>('[data-extension]').forEach((select) => {
    defaultApplications[select.dataset.extension ?? ''] = select.value as 'bambu' | 'cura' | 'system';
  });
  try {
    await settingsApi.saveSettings({
      workflowFolders: Object.fromEntries(
        WORKFLOW_FOLDER_KEYS.map((key) => [key, workflowInputs[key].value.trim() || null]),
      ) as Record<WorkflowFolderKey, string | null>,
      port: Number(portInput.value),
      allowedOrigins: originsInput.value
        .split(/\r?\n|,/)
        .map((origin) => origin.trim())
        .filter(Boolean),
      bambuStudioPath: bambuInput.value.trim() || null,
      curaPath: curaInput.value.trim() || null,
      startWithWindows: startupInput.checked,
      defaultApplications,
    });
    setStatus('Settings saved. The local connection is ready to retry.', 'success');
    await load();
  } catch (error) {
    setStatus(error instanceof Error ? error.message : 'Settings could not be saved.', 'error');
  }
});

void load().catch((error) =>
  setStatus(error instanceof Error ? error.message : 'Settings could not be loaded.', 'error'),
);

export {};
