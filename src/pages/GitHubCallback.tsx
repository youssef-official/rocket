import React, { useEffect, useRef, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { useIntegrations } from '@/hooks/useIntegrations';
import { useAuth } from '@/contexts/AuthContext';
import { Loader2 } from 'lucide-react';

const GitHubCallback: React.FC = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const { handleGitHubCallback } = useIntegrations();
  const { user, loading: authLoading } = useAuth();
  const processed = useRef(false);
  const [status, setStatus] = useState<'loading' | 'error'>('loading');

  useEffect(() => {
    if (authLoading || !user) return;
    if (processed.current) return;
    processed.current = true;

    const code = searchParams.get('code');
    const state = searchParams.get('state');
    const returnTo = sessionStorage.getItem('github_return_to') || '/';
    sessionStorage.removeItem('github_return_to');

    if (code && state) {
      handleGitHubCallback(code, state).then((success) => {
        if (success) {
          navigate(returnTo, { replace: true });
        } else {
          setStatus('error');
          setTimeout(() => navigate(returnTo, { replace: true }), 2000);
        }
      }).catch(() => {
        setStatus('error');
        setTimeout(() => navigate(returnTo, { replace: true }), 2000);
      });
    } else {
      setStatus('error');
      setTimeout(() => navigate(returnTo, { replace: true }), 2000);
    }
  }, [searchParams, authLoading, user]);

  return (
    <div className="min-h-screen bg-background flex items-center justify-center">
      <div className="text-center">
        {status === 'loading' ? (
          <>
            <Loader2 className="w-8 h-8 animate-spin text-muted-foreground mx-auto mb-4" />
            <p className="text-muted-foreground">Connecting GitHub...</p>
          </>
        ) : (
          <p className="text-destructive">Failed to connect. Redirecting...</p>
        )}
      </div>
    </div>
  );
};

export default GitHubCallback;
