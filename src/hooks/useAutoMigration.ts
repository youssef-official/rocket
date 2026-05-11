// Local stub — no Supabase migrations to auto-run.
import { useCallback } from 'react';

export function useAutoMigration(_projectId: string | null) {
  const runMigrations = useCallback(async (_files: any) => {
    // No-op: project is fully local.
  }, []);
  return { runMigrations };
}
