// Image Service - AI Image Generation and Pexels Fallback

// Generate image using DEEAPI
export async function generateImage(prompt: string): Promise<{ success: boolean; url?: string; error?: string }> {
    const apiKey = import.meta.env.VITE_DEEAPI_API;

    if (!apiKey) {
        return { success: false, error: 'Missing DEEAPI API key' };
    }

    try {
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
                width: 768,
                height: 768,
                seed: Math.floor(Math.random() * 1000000000),
                steps: 4,
                negative_prompt: ''
            })
        });

        if (!response.ok) {
            throw new Error(`Image generation failed: ${response.status}`);
        }

        const data = await response.json();

        if (data.output && data.output.length > 0) {
            return { success: true, url: data.output[0] };
        }

        return { success: false, error: 'No image generated' };
    } catch (error) {
        console.error('Image generation error:', error);
        return { success: false, error: error instanceof Error ? error.message : 'Unknown error' };
    }
}

// Search images using Pexels as fallback
export async function searchPexelsImage(query: string): Promise<{ success: boolean; url?: string; error?: string }> {
    const apiKey = import.meta.env.VITE_PEXELS_API;

    if (!apiKey) {
        return { success: false, error: 'Missing Pexels API key' };
    }

    try {
        const response = await fetch(`https://api.pexels.com/v1/search?query=${encodeURIComponent(query)}&per_page=1`, {
            headers: {
                'Authorization': apiKey
            }
        });

        if (!response.ok) {
            throw new Error(`Pexels search failed: ${response.status}`);
        }

        const data = await response.json();

        if (data.photos && data.photos.length > 0) {
            return { success: true, url: data.photos[0].src.medium };
        }

        return { success: false, error: 'No images found' };
    } catch (error) {
        console.error('Pexels search error:', error);
        return { success: false, error: error instanceof Error ? error.message : 'Unknown error' };
    }
}

// Get image - try AI generation first, then Pexels fallback
export async function getOrGenerateImage(
    prompt: string,
    type: 'logo' | 'general' = 'general',
    onStatusUpdate?: (status: string) => void
): Promise<{ success: boolean; url?: string; source: 'generated' | 'pexels' | 'none' }> {
    // Try AI generation first for logos
    if (type === 'logo') {
        onStatusUpdate?.('Generating Image...');
        const generated = await generateImage(`minimalist logo design: ${prompt}, flat design, clean, simple, professional, vector style, white background`);

        if (generated.success && generated.url) {
            onStatusUpdate?.('Generated Image');
            return { success: true, url: generated.url, source: 'generated' };
        }
    }

    // Fallback to Pexels
    onStatusUpdate?.('Searching for image...');
    const pexels = await searchPexelsImage(prompt);

    if (pexels.success && pexels.url) {
        onStatusUpdate?.('Found image');
        return { success: true, url: pexels.url, source: 'pexels' };
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
