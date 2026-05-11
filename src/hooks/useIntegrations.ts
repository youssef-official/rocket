// Local stub — third-party integrations (Vercel/GitHub) removed for OSS build.
import { useState } from 'react';

export function useIntegrations() {
  const [integrations] = useState<any>(null);
  return {
    integrations,
    loading: false,
    saveVercelToken: async (_t: string) => false,
    saveGitHubToken: async (_t: string) => false,
    disconnectVercel: async () => true,
    disconnectGitHub: async () => true,
    refetch: async () => {},
  };
}
