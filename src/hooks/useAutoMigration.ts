import { useCallback, useRef } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from '@/hooks/use-toast';
import type { ProjectFile } from '@/types';

/**
 * Hook that auto-executes SQL migration files on a connected Supabase project
 * after code generation completes.
 */
export function useAutoMigration(projectId: string | null) {
  const executedMigrations = useRef<Set<string>>(new Set());

  const runMigrations = useCallback(async (files: Record<string, ProjectFile>) => {
    if (!projectId) return;

    // 1. Check if the project has a connected Supabase
    const { data: proj } = await supabase
      .from('projects')
      .select('supabase_url')
      .eq('id', projectId)
      .single();

    if (!proj?.supabase_url) return;

    // Extract project_ref from URL
    const match = proj.supabase_url.match(/https:\/\/([^.]+)\.supabase\.co/);
    if (!match) return;
    const projectRef = match[1];

    // 2. Find SQL migration files
    const migrationFiles = Object.entries(files)
      .filter(([path]) => {
        const isMigration =
          path.match(/^(supabase\/)?migrations\/.*\.sql$/i) ||
          path.match(/^supabase\/migrations\/.*\.sql$/i);
        return isMigration && !executedMigrations.current.has(path);
      })
      .sort(([a], [b]) => a.localeCompare(b)); // Execute in order

    if (migrationFiles.length === 0) return;

    // 3. Get session token
    const { data: sessionData } = await supabase.auth.getSession();
    const accessToken = sessionData.session?.access_token;
    if (!accessToken) return;

    // 4. Execute each migration
    let successCount = 0;
    let failCount = 0;

    for (const [filePath, file] of migrationFiles) {
      const sql = file.content?.trim();
      if (!sql) continue;

      try {
        const res = await supabase.functions.invoke('supabase-oauth', {
          body: { action: 'run-sql', project_ref: projectRef, query: sql },
          headers: { Authorization: `Bearer ${accessToken}` },
        });

        if (res.data?.error) {
          console.error(`Migration ${filePath} failed:`, res.data.error, res.data.details);
          failCount++;
        } else {
          executedMigrations.current.add(filePath);
          successCount++;
        }
      } catch (err) {
        console.error(`Migration ${filePath} error:`, err);
        failCount++;
      }
    }

    // 5. Show result toast
    if (successCount > 0 && failCount === 0) {
      toast({
        title: '✅ Migrations Executed',
        description: `${successCount} migration(s) auto-executed on your database.`,
      });
    } else if (failCount > 0) {
      toast({
        title: '⚠️ Migration Issues',
        description: `${successCount} succeeded, ${failCount} failed. Check console for details.`,
        variant: 'destructive',
      });
    }
  }, [projectId]);

  return { runMigrations };
}
