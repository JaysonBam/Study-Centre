import { createPrintingRequest } from './_internal/printingRequest';

export type HexForgeProfile = {
  email: string;
  full_name: string | null;
  profile_url: string | null;
  status: 'active' | 'pending';
};

const requestHexForgeAccess = createPrintingRequest({
  functionName: 'bookings-profile-access',
  missingConfiguration: 'HexForge access is not configured.',
  signedOut: 'You must be signed in to manage HexForge access.',
  failure: 'HexForge request failed',
});

export const fetchHexForgeProfiles = () => requestHexForgeAccess<HexForgeProfile[]>();

export const addHexForgeProfile = (email: string) =>
  requestHexForgeAccess<HexForgeProfile>('', {
    method: 'POST',
    body: JSON.stringify({ email }),
  });

export const deleteHexForgeProfile = (email: string) =>
  requestHexForgeAccess<void>(`?email=${encodeURIComponent(email)}`, {
    method: 'DELETE',
  });
