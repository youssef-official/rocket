import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version',
};

const SUPABASE_URL = Deno.env.get('SUPABASE_URL')!;
const SUPABASE_SERVICE_KEY = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;

// Parse <FILE path="...">...</FILE> blocks
function parseFileBlocks(text: string): Record<string, string> {
  const files: Record<string, string> = {};
  const regex = /<FILE\s+path=("|')([^"']+)\1>([\s\S]*?)<\/FILE>/g;
  let match;
  while ((match = regex.exec(text)) !== null) {
    files[match[2]] = match[3].trim();
  }
  return files;
}

// Read SSE stream fully
async function readSSEStream(response: Response): Promise<string> {
  const reader = response.body!.getReader();
  const decoder = new TextDecoder();
  let fullText = '';

  while (true) {
    const { done, value } = await reader.read();
    if (done) break;
    const chunk = decoder.decode(value, { stream: true });
    const lines = chunk.split('\n');
    for (const line of lines) {
      if (line.startsWith('data: ')) {
        const data = line.slice(6).trim();
        if (data === '[DONE]') continue;
        try {
          const parsed = JSON.parse(data);
          const delta = parsed.choices?.[0]?.delta?.content;
          if (delta) fullText += delta;
        } catch {}
      }
    }
  }
  return fullText;
}

// Credit calculation by file count
function calculateCreditsByFileCount(fileCount: number, isFirstVersion: boolean): number {
  if (isFirstVersion) return 2;
  if (fileCount <= 2) return 0.5;
  if (fileCount <= 3) return 1;
  if (fileCount <= 5) return 3;
  return 5;
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_KEY);

  try {
    const { job_id } = await req.json();

    if (!job_id) {
      return new Response(JSON.stringify({ error: 'job_id required' }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // Fetch the job
    const { data: job, error: jobError } = await supabase
      .from('generation_jobs')
      .select('*')
      .eq('id', job_id)
      .single();

    if (jobError || !job) {
      return new Response(JSON.stringify({ error: 'Job not found' }), {
        status: 404,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // Mark as processing
    await supabase
      .from('generation_jobs')
      .update({ status: 'processing' })
      .eq('id', job_id);

    // Fetch project files for context
    const { data: project } = await supabase
      .from('projects')
      .select('files, name, description, project_type')
      .eq('id', job.project_id)
      .single();

    const existingFiles = project?.files ? Object.keys(project.files as Record<string, unknown>) : [];
    const isFirstVersion = existingFiles.length === 0;
    const existingFilesContext = existingFiles.length > 0
      ? `\n\nEXISTING FILES IN PROJECT (do targeted edits, don't recreate):\n${existingFiles.join('\n')}`
      : '';

    // Build messages for AI
    const messages = (job.messages as any[]) || [];

    const finalMessages = messages.map((m: any, idx: number) => {
      if (idx === messages.length - 1 && m.role === 'user') {
        const content = typeof m.content === 'string'
          ? m.content + existingFilesContext
          : m.content;
        return { ...m, content };
      }
      return m;
    });

    const systemPrompt = `You are an expert React/Tailwind developer. Output ONLY <FILE path="...">...</FILE> blocks with complete file content. No explanations, no markdown, just FILE blocks.

STRICT RULES:
1. OUTPUT ONLY <FILE> blocks
2. If EDIT request: only modify files related to the request
3. If NEW project: generate 8-15+ files minimum
4. PACKAGES: Only react, lucide-react, framer-motion, clsx, tailwind-merge
5. RESPONSIVE: mobile-first responsive classes
6. BRANDING: index.html MUST include: <script src="https://www.vivorax.online/branding.js" defer></script>
7. DO NOT change design unless explicitly asked

ANTI-ERROR CHECKLIST:
- App.tsx has: export default function App()
- All framer-motion imports include AnimatePresence explicitly
- index.html has <link rel="icon" href="data:," />
- NO exports of contexts from App.tsx`;

    // Call AI via Vercel AI gateway
    const VERCEL_AI_KEY = Deno.env.get('VERCEL_AI_API_KEY') || Deno.env.get('LOVABLE_API_KEY')!;
    const aiResponse = await fetch("https://ai-gateway.vercel.sh/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${VERCEL_AI_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "google/gemini-3-flash",
        messages: [{ role: "system", content: systemPrompt }, ...finalMessages],
        stream: true,
        max_tokens: 100000,
        temperature: 0.1,
      }),
    });

    if (!aiResponse.ok) {
      const errText = await aiResponse.text();
      await supabase
        .from('generation_jobs')
        .update({ status: 'error', error_message: `AI error: ${aiResponse.status} - ${errText}` })
        .eq('id', job_id);
      return new Response(JSON.stringify({ error: 'AI gateway failed' }), {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const fullResponse = await readSSEStream(aiResponse);
    const newFiles = parseFileBlocks(fullResponse);
    const fileList = Object.keys(newFiles);

    // Merge with existing project files
    const existingProjectFiles = (project?.files as Record<string, any>) || {};
    const mergedFiles: Record<string, any> = { ...existingProjectFiles };
    
    for (const [path, content] of Object.entries(newFiles)) {
      const ext = path.split('.').pop() || '';
      const langMap: Record<string, string> = {
        ts: 'typescript', tsx: 'typescript', js: 'javascript', jsx: 'javascript',
        css: 'css', html: 'html', json: 'json', md: 'markdown',
      };
      mergedFiles[path] = {
        name: path.split('/').pop() || path,
        path,
        content,
        language: langMap[ext] || 'text',
      };
    }

    // Update project files
    if (fileList.length > 0) {
      await supabase
        .from('projects')
        .update({ files: mergedFiles, generation_status: 'complete' })
        .eq('id', job.project_id);
    }

    // Build result actions
    const actions = fileList.map(name => ({
      name,
      status: 'done',
      action: existingFiles.includes(name) ? 'edited' : 'created',
    }));

    // Calculate credits by file count (deduct AFTER generation)
    const creditsToDeduct = calculateCreditsByFileCount(fileList.length, isFirstVersion);

    // Deduct credits: daily first, then monthly
    try {
      const { data: planData } = await supabase
        .from('user_plans')
        .select('daily_credits, credits_used_today, total_credits_used, plan')
        .eq('user_id', job.user_id)
        .single();

      if (planData) {
        const dailyRemaining = Math.max(0, (planData.daily_credits || 5) - (planData.credits_used_today || 0));
        const dailyDeduct = Math.min(creditsToDeduct, dailyRemaining);
        const monthlyDeduct = creditsToDeduct - dailyDeduct;

        await supabase
          .from('user_plans')
          .update({
            credits_used_today: (planData.credits_used_today || 0) + dailyDeduct,
            total_credits_used: (planData.total_credits_used || 0) + monthlyDeduct,
            updated_at: new Date().toISOString(),
          })
          .eq('user_id', job.user_id);
      }

      await supabase.from('credit_transactions').insert({
        user_id: job.user_id,
        project_id: job.project_id,
        credits_used: creditsToDeduct,
        work_type: 'background_generation',
        description: `Background: ${fileList.length} files, ${creditsToDeduct} credits`,
      });
    } catch (e) {
      console.error('Credit deduction error:', e);
    }

    // Mark job as done
    const resultMessage = fileList.length > 0
      ? `✅ Done! Generated/modified ${fileList.length} files in background.\n\n${fileList.slice(0, 8).map(f => `- ${f}`).join('\n')}${fileList.length > 8 ? `\n... and ${fileList.length - 8} more files` : ''}`
      : '✅ Background processing complete.';

    await supabase
      .from('generation_jobs')
      .update({
        status: 'done',
        result_files: mergedFiles,
        result_message: resultMessage,
        result_actions: actions,
        credits_used: creditsToDeduct,
      })
      .eq('id', job_id);

    return new Response(JSON.stringify({ success: true, files_generated: fileList.length }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });

  } catch (e) {
    console.error('background-generate error:', e);
    const { job_id } = await req.json().catch(() => ({}));
    if (job_id) {
      await supabase
        .from('generation_jobs')
        .update({ status: 'error', error_message: String(e) })
        .eq('id', job_id);
    }
    return new Response(JSON.stringify({ error: String(e) }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});
