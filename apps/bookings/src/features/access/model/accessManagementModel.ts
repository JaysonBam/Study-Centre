export type Profile = {
  email: string;
  full_name: string | null;
  profile_url: string | null;
  status: 'active' | 'pending';
  settings: boolean;
  authorisation: boolean;
  analytics: boolean;
  access_expires_at: string | null;
};

export type PermissionField = 'settings' | 'authorisation' | 'analytics';

export const permissionFields: PermissionField[] = ['settings', 'analytics', 'authorisation'];

export const getErrorMessage = (error: unknown, fallback: string) =>
  error instanceof Error ? error.message : fallback;
