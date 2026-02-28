import React, { useEffect, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { Loader2, CheckCircle, XCircle } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { VivoraXLogo } from '@/components/shared/VivoraXLogo';
import spaceHeroBg from '@/assets/space-hero-bg.jpg';

type Status = 'exchanging' | 'success' | 'error';

export default function SupabaseCallbackPage() {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const [status, setStatus] = useState<Status>('exchanging');
  const [errorMsg, setErrorMsg] = useState('');

  useEffect(() => {
    const code = searchParams.get('code');
    if (!code) {
      setStatus('error');
      setErrorMsg('No authorization code received');
      return;
    }

    const exchangeToken = async () => {
      try {
        const { data: session } = await supabase.auth.getSession();
        const token = session?.session?.access_token;
        if (!token) {
          setStatus('error');
          setErrorMsg('You must be logged in');
          return;
        }

        const res = await supabase.functions.invoke('supabase-oauth', {
          body: {
            action: 'exchange',
            code,
            redirect_uri: `${window.location.origin}/supabase-callback`,
          },
          headers: {
            Authorization: `Bearer ${token}`,
          },
        });

        if (res.error || res.data?.error) {
          setStatus('error');
          setErrorMsg(res.data?.error || res.error?.message || 'Token exchange failed');
          return;
        }

        setStatus('success');
        // Redirect back to last project after 2 seconds
        setTimeout(() => {
          const lastProject = sessionStorage.getItem('sb_oauth_return_project');
          if (lastProject) {
            sessionStorage.removeItem('sb_oauth_return_project');
            navigate(`/projects/${lastProject}`);
          } else {
            navigate('/');
          }
        }, 2000);
      } catch (e: any) {
        setStatus('error');
        setErrorMsg(e.message || 'Unknown error');
      }
    };

    exchangeToken();
  }, [searchParams, navigate]);

  return (
    <div
      className="min-h-screen flex items-center justify-center"
      style={{ backgroundImage: `url(${spaceHeroBg})`, backgroundSize: 'cover', backgroundPosition: 'center' }}
    >
      <div className="absolute inset-0 bg-black/60" />
      <div className="relative z-10 bg-white/10 backdrop-blur-xl rounded-2xl border border-white/10 p-10 text-center max-w-md w-full mx-4">
        <VivoraXLogo size="lg" className="mx-auto mb-6" />

        {status === 'exchanging' && (
          <div className="flex flex-col items-center gap-4">
            <Loader2 className="w-10 h-10 text-green-400 animate-spin" />
            <h2 className="text-xl font-bold text-white">Connecting to Supabase...</h2>
            <p className="text-white/60 text-sm">Exchanging authorization token</p>
          </div>
        )}

        {status === 'success' && (
          <div className="flex flex-col items-center gap-4">
            <CheckCircle className="w-12 h-12 text-green-400" />
            <h2 className="text-xl font-bold text-white">Connected Successfully!</h2>
            <p className="text-white/60 text-sm">Redirecting back to your project...</p>
          </div>
        )}

        {status === 'error' && (
          <div className="flex flex-col items-center gap-4">
            <XCircle className="w-12 h-12 text-red-400" />
            <h2 className="text-xl font-bold text-white">Connection Failed</h2>
            <p className="text-red-300 text-sm">{errorMsg}</p>
            <button
              onClick={() => navigate('/')}
              className="mt-4 px-6 py-2.5 bg-white/10 hover:bg-white/20 text-white rounded-xl transition-colors text-sm"
            >
              Back to Home
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
