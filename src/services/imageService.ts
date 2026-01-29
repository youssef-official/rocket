// Generate image using DEEAPI with Polling for guaranteed results
export async function generateImage(prompt: string): Promise<{ success: boolean; url?: string; error?: string }> {
    const apiKey = import.meta.env.VITE_DEEAPI_API;

    if (!apiKey) {
        console.error('[DEEAPI] Missing API key');
        return { success: false, error: 'Missing DEEAPI API key' };
    }

    try {
        console.log('[DEEAPI] Starting image generation with prompt:', prompt.substring(0, 100) + '...');

        // Step 1: Submit the image generation request
        const response = await fetch('https://api.deapi.ai/api/v1/client/txt2img', {
            method: 'POST',
            headers: {
                'accept': 'application/json',
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${apiKey}`
            },
            body: JSON.stringify({
                prompt: prompt,
                model: 'Flux1schnell',
                width: 512,
                height: 512,
                seed: Math.floor(Math.random() * 1000000000),
                steps: 4,
                guidance: 3.5,
                negative_prompt: 'blurry, low quality, distorted, ugly, bad anatomy, text, watermark'
            })
        });

        if (!response.ok) {
            const errorText = await response.text().catch(() => 'Unknown error');
            console.error('[DEEAPI] HTTP Error:', response.status, errorText);
            return { success: false, error: `Image generation failed: ${response.status}` };
        }

        const data = await response.json();
        console.log('[DEEAPI] Request submitted:', data);

        // Check for request_id (standard for async DEEAPI)
        const requestId = data.data?.request_id || data.request_id;

        if (requestId) {
            console.log('[DEEAPI] Polling for result, request_id:', requestId);
            // Step 2: Poll for result (Most reliable method)
            return await pollForImageResult(apiKey, requestId);
        }

        // Check if we got immediate result (sync flow)
        if (data.output && Array.isArray(data.output) && data.output.length > 0) {
            const imageUrl = data.output[0];
            if (typeof imageUrl === 'string' && imageUrl.startsWith('http')) {
                console.log('[DEEAPI] Image generated immediately:', imageUrl);
                return { success: true, url: imageUrl };
            }
        }

        console.error('[DEEAPI] Unexpected response format:', data);
        return { success: false, error: 'Unexpected response format' };

    } catch (error) {
        console.error('[DEEAPI] Error:', error);
        return { success: false, error: error instanceof Error ? error.message : 'Unknown error' };
    }
}

// Poll for image result every 3 seconds
async function pollForImageResult(apiKey: string, requestId: string): Promise<{ success: boolean; url?: string; error?: string }> {
    const maxAttempts = 60; // 3 minutes total
    const pollInterval = 3000; // 3 seconds

    // Correct endpoint based on deAPI documentation: /api/v1/client/request-status/{request_id}
    const statusUrl = `https://api.deapi.ai/api/v1/client/request-status/${requestId}`;

    for (let attempt = 0; attempt < maxAttempts; attempt++) {
        try {
            console.log(`[DEEAPI] Polling attempt ${attempt + 1}/${maxAttempts}...`);

            const response = await fetch(statusUrl, {
                headers: {
                    'accept': 'application/json',
                    'Authorization': `Bearer ${apiKey}`
                }
            });

            if (response.ok) {
                const data = await response.json();
                console.log('[DEEAPI] Poll response:', data);

                // Documentation says data should be in data property
                const taskData = data.data || data;
                const status = taskData.status;

                // deAPI uses "done" for success, "error" for failure
                if (status === 'done') {
                    const resultUrl = taskData.result_url || taskData.output?.[0] || taskData.result;
                    if (resultUrl) {
                        console.log('[DEEAPI] Image ready:', resultUrl);
                        return { success: true, url: resultUrl };
                    }
                }

                if (status === 'error') {
                    console.error('[DEEAPI] Generation failed:', taskData.error);
                    return { success: false, error: `Image generation failed: ${taskData.error || 'Unknown error'}` };
                }

                console.log(`[DEEAPI] Task status: ${status}...`);
            } else {
                console.warn(`[DEEAPI] Polling API returned ${response.status}`);
            }
        } catch (error) {
            console.error('[DEEAPI] Poll request failed:', error);
        }

        await new Promise(resolve => setTimeout(resolve, pollInterval));
    }

    return { success: false, error: 'Image generation timed out after 3 minutes' };
}

// Get image - try AI generation
export async function getOrGenerateImage(
    prompt: string,
    type: 'logo' | 'general' = 'general',
    onStatusUpdate?: (status: string) => void
): Promise<{ success: boolean; url?: string; source: 'generated' | 'none' }> {
    // We only support AI generation for now as requested
    onStatusUpdate?.('Generating Image...');
    const generated = await generateImage(
        type === 'logo'
            ? `minimalist logo design: ${prompt}, flat design, clean, simple, professional, vector style, white background`
            : `${prompt}, professional high quality image, clean, sharp focus`
    );

    if (generated.success && generated.url) {
        onStatusUpdate?.('Generated Image');
        return { success: true, url: generated.url, source: 'generated' };
    }

    return { success: false, source: 'none' };
}

// Analyze image for potential use cases
export function analyzeImageType(imageName: string): 'logo' | 'background' | 'icon' | 'photo' | 'unknown' {
    const name = imageName.toLowerCase();

    if (name.includes('logo')) return 'logo';
    if (name.includes('background') || name.includes('bg')) return 'background';
    if (name.includes('icon')) return 'icon';
    if (name.includes('photo') || name.includes('image') || name.includes('picture')) return 'photo';

    return 'unknown';
}

// Check if user prompt contains image/logo references
export function promptContainsImageRequest(prompt: string): boolean {
    const imageKeywords = [
        'logo', 'image', 'picture', 'photo', 'icon', 'graphic', 'banner',
        'لوجو', 'صورة', 'شعار', 'أيقونة', 'رمز'
    ];
    const lowerPrompt = prompt.toLowerCase();
    return imageKeywords.some(keyword => lowerPrompt.includes(keyword.toLowerCase()));
}

// Extract project type from prompt for logo generation
export function extractProjectType(prompt: string): string {
    const lowerPrompt = prompt.toLowerCase();

    // Common project types with more specific details
    const types = [
        { keywords: ['restaurant', 'food', 'cafe', 'مطعم', 'كافيه', 'مقهى', 'أكل', 'طعام'], type: 'restaurant', category: 'food' },
        { keywords: ['car', 'auto', 'vehicle', 'motor', 'سيارات', 'عربيات', 'سيارة'], type: 'automotive', category: 'cars' },
        { keywords: ['shop', 'store', 'ecommerce', 'متجر', 'تسوق', 'بيع'], type: 'e-commerce store', category: 'shopping' },
        { keywords: ['portfolio', 'personal', 'cv', 'resume', 'معرض أعمال', 'سيرة'], type: 'portfolio', category: 'personal' },
        { keywords: ['blog', 'news', 'magazine', 'article', 'مدونة', 'أخبار'], type: 'blog', category: 'content' },
        { keywords: ['landing', 'marketing', 'startup', 'تسويق'], type: 'landing page', category: 'marketing' },
        { keywords: ['dashboard', 'admin', 'panel', 'لوحة تحكم'], type: 'dashboard', category: 'admin' },
        { keywords: ['social', 'community', 'network', 'تواصل'], type: 'social media', category: 'social' },
        { keywords: ['education', 'school', 'course', 'learn', 'تعليم', 'مدرسة', 'كورس'], type: 'education platform', category: 'education' },
        { keywords: ['health', 'medical', 'clinic', 'doctor', 'hospital', 'صحة', 'طبي', 'عيادة'], type: 'healthcare', category: 'medical' },
        { keywords: ['travel', 'booking', 'hotel', 'flight', 'سفر', 'حجز', 'فندق'], type: 'travel', category: 'travel' },
        { keywords: ['game', 'gaming', 'play', 'لعبة', 'ألعاب'], type: 'gaming', category: 'gaming' },
        { keywords: ['music', 'audio', 'song', 'podcast', 'موسيقى', 'صوت'], type: 'music', category: 'music' },
        { keywords: ['tech', 'technology', 'software', 'app', 'تقنية', 'تطبيق'], type: 'technology', category: 'tech' },
        { keywords: ['fashion', 'clothing', 'clothes', 'wear', 'ملابس', 'أزياء'], type: 'fashion', category: 'fashion' },
        { keywords: ['real estate', 'property', 'house', 'apartment', 'عقارات', 'منزل'], type: 'real estate', category: 'property' },
        { keywords: ['fitness', 'gym', 'workout', 'exercise', 'رياضة', 'جيم'], type: 'fitness', category: 'fitness' },
        { keywords: ['beauty', 'salon', 'spa', 'cosmetic', 'جمال', 'صالون'], type: 'beauty', category: 'beauty' },
    ];

    for (const { keywords, type } of types) {
        if (keywords.some(k => lowerPrompt.includes(k))) {
            return type;
        }
    }

    return 'modern web application';
}

// Extract project name from prompt (e.g., "Create a restaurant called Delicious Bites")
export function extractProjectName(prompt: string): string | null {
    // Common patterns to find project names
    const patterns = [
        /called\s+["']?([^"'\n,]+)["']?/i,
        /named\s+["']?([^"'\n,]+)["']?/i,
        /name\s*(?:is|:)?\s*["']?([^"'\n,]+)["']?/i,
        /اسمه\s*["']?([^"'\n,]+)["']?/i,
        /اسمها\s*["']?([^"'\n,]+)["']?/i,
        /بإسم\s*["']?([^"'\n,]+)["']?/i,
        /باسم\s*["']?([^"'\n,]+)["']?/i,
        /"([A-Za-z\s]+)"\s*(?:restaurant|cafe|shop|store)/i,
        /(?:restaurant|cafe|shop|store)\s*["']([^"']+)["']/i,
    ];

    for (const pattern of patterns) {
        const match = prompt.match(pattern);
        if (match && match[1]) {
            return match[1].trim();
        }
    }

    return null;
}

// Get logo style based on project type
function getLogoStylePrompt(projectType: string, projectName: string | null): string {
    const nameText = projectName ? ` for "${projectName}"` : '';

    const stylesByType: Record<string, string> = {
        'restaurant': `professional restaurant logo${nameText}, fork and knife icon, food related, appetizing, warm colors, elegant dining`,
        'automotive': `sleek car dealership logo${nameText}, modern car silhouette, speed lines, metallic colors, professional automotive`,
        'e-commerce store': `shopping bag or cart logo${nameText}, retail icon, modern commerce, trust badge style`,
        'portfolio': `creative personal brand logo${nameText}, initials monogram, artistic, elegant typography`,
        'blog': `writing or pen icon logo${nameText}, content creation, ink or feather, modern editorial`,
        'landing page': `modern startup logo${nameText}, rocket or growth icon, dynamic, innovative`,
        'dashboard': `analytics chart logo${nameText}, data visualization, professional admin panel`,
        'social media': `connected people icon logo${nameText}, social network, community, communication`,
        'education platform': `book or graduation cap logo${nameText}, learning, academic, knowledge`,
        'healthcare': `medical cross or heart logo${nameText}, health, care, professional clinic`,
        'travel': `airplane or globe logo${nameText}, travel, adventure, exploration`,
        'gaming': `game controller or joystick logo${nameText}, esports, dynamic, energy`,
        'music': `music note or headphone logo${nameText}, audio, sound waves, rhythm`,
        'technology': `tech circuit or code brackets logo${nameText}, software, innovation, digital`,
        'fashion': `elegant clothing or hanger logo${nameText}, style, luxury, trendy`,
        'real estate': `house or building logo${nameText}, property, home, architecture`,
        'fitness': `dumbbell or running figure logo${nameText}, gym, health, strength`,
        'beauty': `flower or mirror logo${nameText}, salon, elegance, cosmetics`,
    };

    return stylesByType[projectType] || `modern business logo${nameText}, professional, clean`;
}

// Generate project logo with status callbacks
export interface LogoGenerationCallbacks {
    onCheckingAttachments?: () => void;
    onAnalyzingImages?: () => void;
    onGeneratingLogo?: () => void;
    onCopyingToPublic?: () => void;
    onComplete?: (logoUrl: string) => void;
    onNoLogoNeeded?: () => void;
    onError?: (error: string) => void;
}

export interface LogoGenerationResult {
    success: boolean;
    logoUrl?: string;
    source: 'attached' | 'generated' | 'none';
    error?: string;
}

export async function generateProjectLogo(
    prompt: string,
    attachedImages: string[] = [],
    callbacks?: LogoGenerationCallbacks
): Promise<LogoGenerationResult> {
    try {
        // Step 1: Check for attached images
        callbacks?.onCheckingAttachments?.();
        await new Promise(r => setTimeout(r, 500)); // Small delay for UI feedback

        if (attachedImages.length > 0) {
            callbacks?.onAnalyzingImages?.();
            console.log('[ImageService] Analyzing attached images for logo intent...');

            try {
                // Call AI to analyze which image is the logo
                const { callingDirectAI } = await import('./directAiService');
                const analysisResponse = await callingDirectAI('image-logic', [
                    {
                        role: 'user',
                        content: `User prompt: "${prompt}". Attached images count: ${attachedImages.length}.`,
                        imageUrls: attachedImages
                    }
                ]);

                if (analysisResponse.ok) {
                    const reader = analysisResponse.body?.getReader();
                    let responseText = '';
                    const decoder = new TextDecoder();
                    while (true) {
                        const { done, value } = await reader?.read() || { done: true, value: undefined };
                        if (done) break;
                        const chunk = decoder.decode(value);
                        const lines = chunk.split('\n');
                        for (const line of lines) {
                            if (line.startsWith('data: ')) {
                                const data = line.slice(6);
                                if (data === '[DONE]') break;
                                try {
                                    const parsed = JSON.parse(data);
                                    responseText += parsed.choices[0]?.delta?.content || '';
                                } catch (e) { }
                            }
                        }
                    }

                    const decision = responseText.toLowerCase().trim();
                    console.log('[ImageService] AI Image Selection Decision:', decision);

                    const index = parseInt(decision);
                    if (!isNaN(index) && index >= 0 && index < attachedImages.length) {
                        const selectedLogo = attachedImages[index];
                        console.log('[ImageService] AI selected attached image as logo:', selectedLogo);
                        callbacks?.onCopyingToPublic?.();
                        await new Promise(r => setTimeout(r, 400));
                        callbacks?.onComplete?.(selectedLogo);
                        return { success: true, logoUrl: selectedLogo, source: 'attached' };
                    }
                }
            } catch (e) {
                console.error('[ImageService] Failed to analyze images, falling back to prompt logic:', e);
            }
        }

        // Step 2: Generate logo using DEEAPI with AI-generated prompt
        callbacks?.onGeneratingLogo?.();

        const projectType = extractProjectType(prompt);
        const projectName = extractProjectName(prompt);

        // If the prompt is already long/detailed (likely from Gemini), use it more directly
        // Otherwise build the template prompt
        const isAiPrompt = prompt.split(' ').length > 10;
        const logoPrompt = isAiPrompt
            ? prompt
            : `${getLogoStylePrompt(projectType, projectName)}, minimalist flat design, clean professional, vector art style, centered composition, white background, no text unless logo includes name, high quality, 2D illustration, limited color palette, modern`;

        console.log('[ImageService] Project type:', projectType);
        console.log('[ImageService] Project name:', projectName);
        console.log('[ImageService] Generating logo with final prompt:', logoPrompt);

        // Try DEEAPI first
        const result = await generateImage(logoPrompt);

        if (result.success && result.url) {
            callbacks?.onCopyingToPublic?.();
            await new Promise(r => setTimeout(r, 400));

            console.log('[ImageService] Logo generated successfully with DEEAPI:', result.url);
            callbacks?.onComplete?.(result.url);
            return { success: true, logoUrl: result.url, source: 'generated' };
        }

        console.log('[ImageService] DEEAPI failed:', result.error);

        // No logo generated - still return success but without URL
        console.log('[ImageService] No logo could be generated');
        callbacks?.onNoLogoNeeded?.();
        return { success: false, source: 'none', error: result.error || 'Could not generate logo' };

    } catch (error) {
        const errorMsg = error instanceof Error ? error.message : 'Unknown error';
        console.error('[ImageService] Logo generation error:', errorMsg);
        callbacks?.onError?.(errorMsg);
        return { success: false, source: 'none', error: errorMsg };
    }
}

// Calculate credits based on actual work done
export function calculateCredits(
    filesChanged: number,
    linesOfCode: number,
    hasImageGeneration: boolean = false
): number {
    let baseCredits = 0.2;

    // Files changed factor
    if (filesChanged > 10) {
        baseCredits += 2.0;
    } else if (filesChanged > 5) {
        baseCredits += 1.0;
    } else if (filesChanged > 2) {
        baseCredits += 0.5;
    }

    // Lines of code factor
    if (linesOfCode > 1000) {
        baseCredits += 2.5;
    } else if (linesOfCode > 500) {
        baseCredits += 1.5;
    } else if (linesOfCode > 200) {
        baseCredits += 0.8;
    } else if (linesOfCode > 50) {
        baseCredits += 0.3;
    }

    // Image generation adds extra cost
    if (hasImageGeneration) {
        baseCredits += 0.5;
    }

    // Cap between 0.2 and 6.0
    return Math.min(Math.max(baseCredits, 0.2), 6.0);
}
