import { GoogleGenAI } from '@google/genai';

const recipeImageCache = new Map<string, string>();

function escapeXml(value: string): string {
  return value
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&apos;');
}

function hashString(value: string): number {
  let hash = 0;
  for (let i = 0; i < value.length; i++) {
    hash = (hash << 5) - hash + value.charCodeAt(i);
    hash |= 0;
  }
  return Math.abs(hash);
}

function buildPlaceholder(recipeName: string): string {
  const safeName = (recipeName || 'Recipe').trim() || 'Recipe';
  const hash = hashString(safeName);
  const palettes = [
    ['#0f172a', '#1f2937', '#334155'],
    ['#111827', '#1f2937', '#374151'],
    ['#18181b', '#27272a', '#3f3f46'],
    ['#0b1324', '#172554', '#1e293b'],
  ];
  const [c1, c2, c3] = palettes[hash % palettes.length];

  const svg = `
  <svg xmlns="http://www.w3.org/2000/svg" width="1200" height="600" viewBox="0 0 1200 600" role="img" aria-label="${escapeXml(safeName)} placeholder image">
    <defs>
      <linearGradient id="bg" x1="0" y1="0" x2="1" y2="1">
        <stop offset="0%" stop-color="${c1}" />
        <stop offset="55%" stop-color="${c2}" />
        <stop offset="100%" stop-color="${c3}" />
      </linearGradient>
    </defs>
    <rect width="1200" height="600" fill="url(#bg)" rx="42" ry="42" />
    <circle cx="210" cy="170" r="80" fill="rgba(255,255,255,0.08)" />
    <circle cx="1040" cy="460" r="120" fill="rgba(255,255,255,0.06)" />

    <g transform="translate(520,220)" fill="none" stroke="#f8fafc" stroke-width="14" stroke-linecap="round" stroke-linejoin="round">
      <ellipse cx="70" cy="70" rx="92" ry="48" />
      <path d="M-36 8v130" />
      <path d="M-58 8v62" />
      <path d="M-14 8v62" />
      <path d="M188 8c0 30-24 56-24 96v34" />
    </g>

    <text x="80" y="470" fill="#f8fafc" font-size="30" font-family="Inter, Segoe UI, Arial" font-weight="700">
      ${escapeXml(safeName)}
    </text>
    <text x="80" y="515" fill="rgba(248,250,252,0.85)" font-size="20" font-family="Inter, Segoe UI, Arial">
      AI recipe image unavailable, using premium placeholder
    </text>
  </svg>`;

  return `data:image/svg+xml;charset=UTF-8,${encodeURIComponent(svg)}`;
}

function extractBase64Image(response: any): string | null {
  const generated = response?.generatedImages?.[0]?.image?.imageBytes;
  if (typeof generated === 'string' && generated.length > 0) return generated;

  const parts = response?.candidates?.[0]?.content?.parts;
  if (Array.isArray(parts)) {
    for (const part of parts) {
      const data = part?.inlineData?.data;
      const mimeType = part?.inlineData?.mimeType;
      if (typeof data === 'string' && data.length > 0 && String(mimeType || '').includes('image')) {
        return data;
      }
    }
  }

  return null;
}

export async function generateRecipeImage(recipeName: string, ingredients: string[]): Promise<string> {
  const cacheKey = (recipeName || '').trim().toLowerCase();
  if (cacheKey && recipeImageCache.has(cacheKey)) {
    return recipeImageCache.get(cacheKey)!;
  }

  const fallback = buildPlaceholder(recipeName);
  const apiKey = localStorage.getItem('GEMINI_API_KEY') || process.env.GEMINI_API_KEY || '';

  if (!apiKey) {
    if (cacheKey) recipeImageCache.set(cacheKey, fallback);
    return fallback;
  }

  try {
    const ai = new GoogleGenAI({ apiKey });
    const prompt = `Generate a beautiful, appetizing, professional food photography image of ${recipeName} made with ${ingredients.join(', ')}. Vibrant colors, well-plated, restaurant quality.`;

    const response = await ai.models.generateContent({
      model: 'gemini-2.0-flash-exp',
      contents: [{ parts: [{ text: prompt }] }],
      config: {
        responseModalities: ['IMAGE', 'TEXT'],
      } as any,
    });

    const bytes = extractBase64Image(response);
    const result = bytes ? `data:image/jpeg;base64,${bytes}` : fallback;

    if (cacheKey) recipeImageCache.set(cacheKey, result);
    return result;
  } catch {
    if (cacheKey) recipeImageCache.set(cacheKey, fallback);
    return fallback;
  }
}
