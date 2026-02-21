import React, { useEffect, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { useIntegrations } from '@/hooks/useIntegrations';
import { Loader2 } from 'lucide-react';
import spaceHeroBg from '@/assets/space-hero-bg.jpg';

const GitHubCallback: React.FC = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const { handleGitHubCallback } = useIntegrations();
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const code = searchParams.get('code');
    const state = searchParams.get('state');
    
    if (code && state) {
      handleGitHubCallback(code, state).then((success) => {
        const returnTo = sessionStorage.getItem('github_return_to') || '/';
        sessionStorage.removeItem('github_return_to');
        navigate(returnTo);
      }).catch(() => {
        setError('Failed to connect GitHub');
      });
    } else {
      setError('Missing authorization code');
    }
  }, []);

  return (
    <div className="min-h-screen flex items-center justify-center" style={{ backgroundImage: `url(${spaceHeroBg})`, backgroundSize: 'cover' }}>
      <div className="absolute inset-0 bg-black/70" />
      <div className="relative z-10 text-center">
        {error ? (
          <div className="text-red-400 text-lg">{error}</div>
        ) : (
          <>
            <Loader2 className="w-8 h-8 text-white animate-spin mx-auto mb-4" />
            <p className="text-white">Connecting GitHub...</p>
          </>
        )}
      </div>
    </div>
  );
};

export default GitHubCallback;
