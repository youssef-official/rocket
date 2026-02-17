import React, { useEffect, useRef } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { Loader2 } from 'lucide-react';
import { useIntegrations } from '@/hooks/useIntegrations';

export const VercelOAuthCallback: React.FC = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const { handleVercelCallback } = useIntegrations();
  const processed = useRef(false);

  useEffect(() => {
    if (processed.current) return;
    processed.current = true;

    const code = searchParams.get('code');
    // Redirect back to wherever the user came from (stored in sessionStorage), default to home
    const returnTo = sessionStorage.getItem('vercel_return_to') || '/';
    sessionStorage.removeItem('vercel_return_to');

    if (code) {
      handleVercelCallback(code).then(() => {
        navigate(returnTo, { replace: true });
      });
    } else {
      navigate(returnTo, { replace: true });
    }
  }, [searchParams]);

  return (
    <div className="min-h-screen bg-background flex items-center justify-center">
      <div className="text-center">
        <Loader2 className="w-8 h-8 animate-spin text-muted-foreground mx-auto mb-4" />
        <p className="text-muted-foreground">Connecting Vercel account...</p>
      </div>
    </div>
  );
};
