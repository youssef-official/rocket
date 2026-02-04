import React from 'react';
import { VivoraXLogo } from '@/components/shared/VivoraXLogo';

export const OAuthConsent: React.FC = () => {
  return (
    <div className="min-h-screen bg-slate-950 text-white flex flex-col items-center justify-center p-4">
      <div className="max-w-md w-full bg-slate-900 border border-slate-800 rounded-2xl p-8 shadow-2xl">
        <div className="flex justify-center mb-6">
          <VivoraXLogo size="lg" />
        </div>
        <h1 className="text-2xl font-bold text-center mb-4">Authorize Application</h1>
        <p className="text-slate-400 text-center mb-8">
          An application is requesting access to your Vivora X account.
        </p>
        <div className="space-y-4">
          <button 
            onClick={() => {
              // Supabase handles the actual authorization logic via URL params
              const urlParams = new URLSearchParams(window.location.search);
              const returnUrl = urlParams.get('return_to') || '/';
              window.location.href = returnUrl;
            }}
            className="w-full py-3 bg-primary text-primary-foreground rounded-xl font-medium hover:bg-primary/90 transition-colors"
          >
            Allow Access
          </button>
          <button 
            onClick={() => window.history.back()}
            className="w-full py-3 bg-slate-800 text-white rounded-xl font-medium hover:bg-slate-700 transition-colors"
          >
            Cancel
          </button>
        </div>
      </div>
    </div>
  );
};
