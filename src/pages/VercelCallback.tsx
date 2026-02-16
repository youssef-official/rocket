import React, { useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { Loader2 } from 'lucide-react';
import { useIntegrations } from '@/hooks/useIntegrations';

export const VercelOAuthCallback: React.FC = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const { handleVercelCallback } = useIntegrations();

  useEffect(() => {
    const code = searchParams.get('code');
    if (code) {
      handleVercelCallback(code).then((success) => {
        navigate('/settings', { replace: true });
      });
    } else {
      navigate('/settings', { replace: true });
    }
  }, [searchParams]);

  return (
    <div className="min-h-screen bg-[#0a0a12] flex items-center justify-center">
      <div className="text-center">
        <Loader2 className="w-8 h-8 animate-spin text-white/60 mx-auto mb-4" />
        <p className="text-white/60">Connecting Vercel account...</p>
      </div>
    </div>
  );
};
