import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  try {
    const { changes, files, userLanguage } = await req.json();
    const OPENROUTER_API_KEY = Deno.env.get("OPENROUTER_API_KEY");

    if (!OPENROUTER_API_KEY) {
      return new Response(JSON.stringify({ error: "OpenRouter API key not configured" }), {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    if (!changes || !Array.isArray(changes) || changes.length === 0) {
      return new Response(JSON.stringify({ error: "No changes provided" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Build a focused prompt describing only the visual changes to apply
    const changeDescriptions = changes.map((c: any, i: number) => {
      const parts = [`Change ${i + 1}: In file "${c.filePath}" at line ${c.startLine}`];
      if (c.newContent !== undefined) parts.push(`  - Change text content to: "${c.newContent}"`);
      if (c.newStyles) {
        const styleEntries = Object.entries(c.newStyles).filter(([_, v]) => v && v !== 'normal' && v !== 'none' && v !== 'inherit');
        if (styleEntries.length > 0) {
          parts.push(`  - Apply styles: ${styleEntries.map(([k, v]) => `${k}: ${v}`).join(', ')}`);
        }
      }
      return parts.join('\n');
    }).join('\n\n');

    // Only include the files that need to be modified
    const affectedFiles = [...new Set(changes.map((c: any) => c.filePath))];
    const fileContents = affectedFiles.map((path: string) => {
      const file = files[path];
      if (!file) return '';
      return `<FILE path="${path}">\n${file.content}\n</FILE>`;
    }).filter(Boolean).join('\n\n');

    const systemPrompt = `You are a precise code editor. You receive visual editing changes from a user and apply them to the source code.

CRITICAL RULES:
1. ONLY modify exactly what is requested - do NOT change anything else
2. Do NOT restructure, refactor, or "improve" the code
3. Do NOT add new imports, components, or functionality
4. Do NOT change any logic, event handlers, or state management
5. Apply the exact style and content changes described
6. Return ONLY the modified files in the exact format specified

For text content changes: Replace the exact text at the specified location.
For style changes: Add or update inline style={{ }} on the element, or update existing Tailwind classes if appropriate.

Return your response as JSON with this structure:
{
  "files": {
    "path/to/file.tsx": { "content": "...full file content with changes applied..." }
  }
}

Return ONLY the files you actually modified. Do not include unchanged files.`;

    const userPrompt = `Apply these visual changes to the code:

${changeDescriptions}

Here are the current file contents:

${fileContents}

Apply ONLY the specified changes. Return the modified files as JSON.`;

    const response = await fetch("https://openrouter.ai/api/v1/chat/completions", {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${OPENROUTER_API_KEY}`,
        "Content-Type": "application/json",
        "HTTP-Referer": "https://vivora-x.app",
      },
      body: JSON.stringify({
        model: "openrouter/aurora-alpha",
        messages: [
          { role: "system", content: systemPrompt },
          { role: "user", content: userPrompt },
        ],
        temperature: 0.1,
        max_tokens: 16000,
      }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error("OpenRouter error:", response.status, errorText);

      if (response.status === 429) {
        return new Response(JSON.stringify({ error: "Rate limit exceeded. Please try again in a moment." }), {
          status: 429,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }

      return new Response(JSON.stringify({ error: "AI processing failed" }), {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const data = await response.json();
    const content = data.choices?.[0]?.message?.content || "";

    // Extract JSON from the response
    let resultFiles: Record<string, { content: string }> = {};

    try {
      // Try direct JSON parse
      const jsonMatch = content.match(/\{[\s\S]*"files"[\s\S]*\}/);
      if (jsonMatch) {
        const parsed = JSON.parse(jsonMatch[0]);
        resultFiles = parsed.files || {};
      }
    } catch {
      // Try extracting from code block
      const codeBlockMatch = content.match(/```(?:json)?\s*([\s\S]*?)```/);
      if (codeBlockMatch) {
        try {
          const parsed = JSON.parse(codeBlockMatch[1]);
          resultFiles = parsed.files || {};
        } catch {
          console.error("Failed to parse AI response");
        }
      }
    }

    return new Response(JSON.stringify({ files: resultFiles }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });

  } catch (e) {
    console.error("visual-edits error:", e);
    return new Response(JSON.stringify({ error: e instanceof Error ? e.message : "Unknown error" }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
