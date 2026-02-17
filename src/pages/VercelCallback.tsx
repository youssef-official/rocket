import React, { useEffect, useRef, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { Loader2 } from 'lucide-react';
import { useIntegrations } from '@/hooks/useIntegrations';
import { useAuth } from '@/contexts/AuthContext';

export const VercelOAuthCallback: React.FC = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const { handleVercelCallback } = useIntegrations();
  const { user, loading: authLoading } = useAuth();
  const processed = useRef(false);
  const [status, setStatus] = useState<'loading' | 'error'>('loading');

  useEffect(() => {
    // Wait for auth to finish loading and user to be available
    if (authLoading || !user) return;
    if (processed.current) return;
    processed.current = true;

    const code = searchParams.get('code');
    const returnTo = sessionStorage.getItem('vercel_return_to') || '/';
    sessionStorage.removeItem('vercel_return_to');

    if (code) {
      handleVercelCallback(code).then((success) => {
        if (success) {
          navigate(returnTo, { replace: true });
        } else {
          setStatus('error');
          // Still redirect after a delay so user sees the error
          setTimeout(() => navigate(returnTo, { replace: true }), 2000);
        }
      });
    } else {
      navigate(returnTo, { replace: true });
    }
  }, [searchParams, authLoading, user]);

  return (
    <div className="min-h-screen bg-background flex items-center justify-center">
      <div className="text-center">
        {status === 'loading' ? (
          <>
            <Loader2 className="w-8 h-8 animate-spin text-muted-foreground mx-auto mb-4" />
            <p className="text-muted-foreground">Connecting Vercel account...</p>
          </>
        ) : (
          <p className="text-destructive">Failed to connect. Redirecting...</p>
        )}
      </div>
    </div>
  );
};
