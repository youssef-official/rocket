import { supabase } from '@/integrations/supabase/client';
import type { ProjectFile } from '@/types';

/**
 * Scans generated project files for VIDEO-PROMPT comments and triggers video generation.
 * After generation, replaces the placeholder video src with the actual URL.
 */
export async function processVideoPrompts(
  files: Record<string, ProjectFile>
): Promise<Record<string, ProjectFile>> {
  // Support both HTML comments <!-- VIDEO-PROMPT: ... --> and JSX comments {/* VIDEO-PROMPT: ... */}
  const videoPromptRegex = /(?:<!--\s*VIDEO-PROMPT:\s*(.+?)\s*-->|\{\/\*\s*VIDEO-PROMPT:\s*(.+?)\s*\*\/\})/g;
  const updatedFiles = { ...files };
  
  for (const [path, file] of Object.entries(files)) {
    if (!file.content) continue;
    
    const matches = [...file.content.matchAll(videoPromptRegex)];
    if (matches.length === 0) continue;
    
    let updatedContent = file.content;
    
    for (const match of matches) {
      const prompt = (match[1] || match[2] || '').replace(/["\[\]]/g, '').trim();
      if (!prompt) continue;
      
      console.log(`[video-gen] Found VIDEO-PROMPT in ${path}: "${prompt.substring(0, 60)}..."`);
      
      try {
        const { data: sessionData } = await supabase.auth.getSession();
        const token = sessionData?.session?.access_token;
        
        const res = await fetch(
          `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/generate-video`,
          {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              'Authorization': `Bearer ${token}`,
              'apikey': import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY,
            },
            body: JSON.stringify({ prompt, aspect_ratio: '16:9' }),
          }
        );
        
        if (res.ok) {
          const result = await res.json();
          if (result.video_url) {
            console.log(`[video-gen] Video generated: ${result.video_url}`);
            // Replace placeholder with actual video URL
            updatedContent = updatedContent.replace(
              '/videos/hero-video.mp4',
              result.video_url
            );
            // Remove the VIDEO-PROMPT comment
            updatedContent = updatedContent.replace(match[0], '');
          }
        } else {
          console.warn(`[video-gen] Video generation failed: ${res.status}`);
        }
      } catch (err) {
        console.error('[video-gen] Error generating video:', err);
      }
    }
    
    if (updatedContent !== file.content) {
      updatedFiles[path] = { ...file, content: updatedContent };
    }
  }
  
  return updatedFiles;
}

/**
 * Checks if any files contain VIDEO-PROMPT comments
 */
export function hasVideoPrompts(files: Record<string, ProjectFile>): boolean {
  const regex = /(?:<!--\s*VIDEO-PROMPT:|\{\/\*\s*VIDEO-PROMPT:)/;
  return Object.values(files).some(f => f.content && regex.test(f.content));
}
