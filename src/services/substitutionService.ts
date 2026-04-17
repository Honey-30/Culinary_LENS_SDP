import { GoogleGenAI } from '@google/genai';
import { Substitution } from '../types';

const STATIC_SUBSTITUTION_FALLBACKS: Record<string, Array<{ substitute: string; confidence: number; notes: string }>> = {
  butter: [
    { substitute: 'olive oil', confidence: 0.9, notes: 'Good for sauteing and savory cooking.' },
    { substitute: 'ghee', confidence: 0.88, notes: 'Similar flavor profile and cooking behavior.' },
    { substitute: 'coconut oil', confidence: 0.75, notes: 'Works well in baking and pan-cooking.' },
  ],
  egg: [
    { substitute: 'flaxseed meal + water', confidence: 0.92, notes: 'Common egg replacement in baking.' },
    { substitute: 'chia seeds + water', confidence: 0.86, notes: 'Good binder for cakes and pancakes.' },
    { substitute: 'unsweetened applesauce', confidence: 0.72, notes: 'Best for moisture-forward baking.' },
  ],
  milk: [
    { substitute: 'oat milk', confidence: 0.88, notes: 'Neutral taste and smooth texture.' },
    { substitute: 'soy milk', confidence: 0.86, notes: 'Good protein-rich dairy replacement.' },
    { substitute: 'almond milk', confidence: 0.81, notes: 'Light texture and mild flavor.' },
  ],
  flour: [
    { substitute: 'oat flour', confidence: 0.84, notes: 'Great for pancakes and quick breads.' },
    { substitute: 'almond flour', confidence: 0.8, notes: 'Lower-carb option for baking.' },
    { substitute: 'whole wheat flour', confidence: 0.76, notes: 'Heavier texture with more fiber.' },
  ],
  sugar: [
    { substitute: 'honey', confidence: 0.82, notes: 'Natural sweetener; reduce liquid elsewhere.' },
    { substitute: 'maple syrup', confidence: 0.78, notes: 'Works well in sauces and baking.' },
    { substitute: 'stevia', confidence: 0.7, notes: 'Very concentrated sweetener; use sparingly.' },
  ],
};

function normalize(value: string): string {
  return value
    .toLowerCase()
    .replace(/[^a-z0-9\s-]/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}

function hasPantryMatch(substitute: string, pantryItems: string[]): boolean {
  const normalizedSubstitute = normalize(substitute);
  const normalizedPantry = pantryItems.map(normalize);
  return normalizedPantry.some((item) =>
    item.includes(normalizedSubstitute) || normalizedSubstitute.includes(item)
  );
}

function fromFallback(missingIngredient: string, pantryItems: string[]): Substitution[] {
  const normalizedMissing = normalize(missingIngredient);
  const fallbackKey = Object.keys(STATIC_SUBSTITUTION_FALLBACKS).find((key) =>
    normalizedMissing.includes(key) || key.includes(normalizedMissing)
  ) || 'butter';

  const items = STATIC_SUBSTITUTION_FALLBACKS[fallbackKey] || [];

  return items
    .map((item) => ({
      substitute: item.substitute,
      confidence: item.confidence,
      notes: item.notes,
      pantryMatch: hasPantryMatch(item.substitute, pantryItems),
    }))
    .sort((a, b) => {
      if (a.pantryMatch !== b.pantryMatch) return a.pantryMatch ? -1 : 1;
      return b.confidence - a.confidence;
    });
}

function sanitizeSubstitutions(raw: unknown, pantryItems: string[]): Substitution[] {
  if (!Array.isArray(raw)) return [];

  const normalized = raw
    .filter((item) => typeof (item as any)?.substitute === 'string')
    .map((item) => {
      const candidate = item as any;
      const substitute = String(candidate.substitute).trim();
      const confidence = Number(candidate.confidence);
      return {
        substitute,
        confidence: Number.isFinite(confidence) ? Math.min(1, Math.max(0, confidence)) : 0.6,
        notes: typeof candidate.notes === 'string' && candidate.notes.trim()
          ? candidate.notes.trim()
          : 'AI-suggested alternative based on your context.',
        pantryMatch: hasPantryMatch(substitute, pantryItems),
      } as Substitution;
    })
    .filter((item) => item.substitute.length > 0);

  const dedupedMap = new Map<string, Substitution>();
  for (const item of normalized) {
    const key = normalize(item.substitute);
    if (!dedupedMap.has(key) || dedupedMap.get(key)!.confidence < item.confidence) {
      dedupedMap.set(key, item);
    }
  }

  return Array.from(dedupedMap.values()).sort((a, b) => {
    if (a.pantryMatch !== b.pantryMatch) return a.pantryMatch ? -1 : 1;
    return b.confidence - a.confidence;
  });
}

export async function getSubstitutions(
  missingIngredient: string,
  pantryItems: string[],
  dietaryPrefs: string[]
): Promise<Substitution[]> {
  const apiKey = localStorage.getItem('GEMINI_API_KEY') || process.env.GEMINI_API_KEY || '';
  if (!apiKey) {
    return fromFallback(missingIngredient, pantryItems);
  }

  try {
    const ai = new GoogleGenAI({ apiKey });
    const response = await ai.models.generateContent({
      model: 'gemini-2.5-flash',
      contents: [
        {
          parts: [
            {
              text: `You are a culinary substitution assistant.
Return ranked substitutes for the missing ingredient in strict JSON.

Missing ingredient: ${missingIngredient}
Pantry items: ${JSON.stringify(pantryItems)}
Dietary preferences: ${JSON.stringify(dietaryPrefs)}

Return JSON array of up to 5 objects only:
[{"substitute":"...","confidence":0.0-1.0,"notes":"short practical cooking note"}]

Rules:
- Prefer practical, recipe-compatible substitutes.
- Respect dietary preferences.
- Confidence must be between 0 and 1.
- No markdown, no prose, JSON only.`
            }
          ]
        }
      ],
      config: {
        responseMimeType: 'application/json'
      }
    });

    const parsed = JSON.parse(response.text || '[]');
    const sanitized = sanitizeSubstitutions(parsed, pantryItems);

    if (sanitized.length > 0) {
      return sanitized;
    }

    return fromFallback(missingIngredient, pantryItems);
  } catch (error) {
    console.error('SubstitutionService: failed to fetch AI substitutions', error);
    return fromFallback(missingIngredient, pantryItems);
  }
}
