import { useEffect, useState, type ReactNode } from 'react';
import { Navigate } from 'react-router-dom';
import { subscribeToAuthChanges } from '@/api/auth';
import { clearGoogleProviderTokens } from '@/api/gmail/client';
import { resetGmailInbox } from '@/features/gmail/state/gmailInboxStore';
import { clearReadSnapshots } from '@/shared/lib/persistentReads';

export function AuthGuard({ children }: { children: ReactNode }) {
  const [loading, setLoading] = useState(true);
  const [authenticated, setAuthenticated] = useState(false);

  useEffect(() => {
    clearGoogleProviderTokens();
    const subscription = subscribeToAuthChanges((_event, session) => {
      setAuthenticated(Boolean(session));
      setLoading(false);
      if (!session) {
        resetGmailInbox();
        clearGoogleProviderTokens();
        void clearReadSnapshots();
      }
    });

    return () => {
      subscription.unsubscribe();
    };
  }, []);

  if (loading) return null;

  if (!authenticated) {
    return <Navigate to="/login" replace />;
  }

  return <>{children}</>;
}
