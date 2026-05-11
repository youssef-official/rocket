import { useState } from 'react';
export function useIntegrations() {
  const [integrations] = useState<any>(null);
  return {
    integrations, loading: false,
    saveVercelToken: async (_t: string) => false,
    saveGitHubToken: async (_t: string) => false,
    disconnectVercel: async () => true,
    disconnectGitHub: async () => true,
    pushToGitHub: async (_args: any) => ({ success: false, error: 'GitHub push disabled in local build' }),
    refetch: async () => {},
  };
}
