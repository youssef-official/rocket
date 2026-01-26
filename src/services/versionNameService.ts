// Generate AI-powered version names based on changes made

const VERSION_NAME_SYSTEM_PROMPT = `You are a creative naming assistant. Generate a SHORT, CATCHY 2-4 word name for a version/update based on what was built or changed.

RULES:
1. Return ONLY 2-4 words max
2. Make it descriptive of what was built/changed
3. Make it catchy and professional
4. No explanation, just the name
5. Use Title Case

Examples:
- Built restaurant homepage → "Restaurant Launch"
- Added dark mode → "Dark Mode Update"
- Fixed navigation bugs → "Nav Fixes"
- Created user dashboard → "Dashboard Creation"
- Added contact form → "Contact Form Added"
- Improved mobile design → "Mobile Refresh"
- Created hero section → "Hero Section"
- Built checkout flow → "Checkout Flow"`;

export async function generateVersionName(
  projectDescription: string,
  changeDescription?: string,
  versionNumber?: number
): Promise<string> {
  const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
  const supabaseKey = import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY;

  const fallbackNames = [
    'Initial Build',
    'Feature Update',
    'UI Enhancement',
    'Bug Fixes',
    'Performance Boost',
    'Style Refresh',
    'Component Upgrade',
    'Layout Update',
  ];

  try {
    const promptContent = changeDescription 
      ? `Project: ${projectDescription}. Change: ${changeDescription}. Generate a short name for this version.`
      : `Project: ${projectDescription}. This is version ${versionNumber || 1}. Generate a short name for this initial build.`;

    const response = await fetch(`${supabaseUrl}/functions/v1/generate-code`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${supabaseKey}`,
      },
      body: JSON.stringify({
        messages: [{ role: 'user', content: promptContent }],
        projectType: 'vite',
        mode: 'version-name',
      }),
    });

    if (!response.ok) {
      return fallbackNames[(versionNumber || 1) % fallbackNames.length];
    }

    if (!response.body) {
      return fallbackNames[(versionNumber || 1) % fallbackNames.length];
    }

    const reader = response.body.getReader();
    const decoder = new TextDecoder();
    let fullResponse = '';
    let buffer = '';

    while (true) {
      const { done, value } = await reader.read();
      if (done) break;

      buffer += decoder.decode(value, { stream: true });
      
      let newlineIndex: number;
      while ((newlineIndex = buffer.indexOf('\n')) !== -1) {
        let line = buffer.slice(0, newlineIndex);
        buffer = buffer.slice(newlineIndex + 1);

        if (line.endsWith('\r')) line = line.slice(0, -1);
        if (line.startsWith(':') || line.trim() === '') continue;
        if (!line.startsWith('data: ')) continue;

        const jsonStr = line.slice(6).trim();
        if (jsonStr === '[DONE]') continue;

        try {
          const parsed = JSON.parse(jsonStr);
          const content = parsed.choices?.[0]?.delta?.content as string | undefined;
          if (content) {
            fullResponse += content;
          }
        } catch {
          buffer = line + '\n' + buffer;
          break;
        }
      }
    }

    // Clean the response
    const cleaned = fullResponse.trim().replace(/["\n]/g, '').trim();
    if (cleaned && cleaned.length > 0 && cleaned.length < 50) {
      return cleaned;
    }
    
    return fallbackNames[(versionNumber || 1) % fallbackNames.length];
  } catch (error) {
    console.error('Version name generation error:', error);
    return fallbackNames[(versionNumber || 1) % fallbackNames.length];
  }
}
