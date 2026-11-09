import type { WorkflowFolderKey } from '@study-centre/contracts/helper';

export type SettingsState = {
  workflowFolders: Record<WorkflowFolderKey, string | null>;
  port: number;
  allowedOrigins: string[];
  bambuStudioPath: string | null;
  curaPath: string | null;
  startWithWindows: boolean;
  defaultApplications: Record<string, 'bambu' | 'cura' | 'system'>;
  version: string;
};

declare global {
  interface Window {
    hexForgeFileHelper: {
      getSettings: () => Promise<SettingsState>;
      saveSettings: (settings: Partial<SettingsState>) => Promise<SettingsState>;
      chooseWorkflowFolder: (workflowFolder: WorkflowFolderKey) => Promise<string | null>;
      chooseApplication: (application: 'bambu' | 'cura') => Promise<string | null>;
      createShortcuts: () => Promise<{ ok: boolean; message: string }>;
      openRoot: () => Promise<void>;
      openLogs: () => Promise<void>;
    };
  }
}

export const settingsApi = window.hexForgeFileHelper;
