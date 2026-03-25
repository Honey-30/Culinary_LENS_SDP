import { Ingredient, ScanResult } from '../types';

const STORAGE_KEY = 'SCAN_VAULT_RESULTS';
const MAX_SCAN_RESULTS = 50;

function safeParse(data: string | null): ScanResult[] {
  if (!data) return [];

  try {
    const parsed = JSON.parse(data);
    if (!Array.isArray(parsed)) return [];
    return parsed as ScanResult[];
  } catch {
    return [];
  }
}

function averageConfidence(ingredients: Ingredient[]): number {
  if (!ingredients.length) return 0;
  const total = ingredients.reduce((sum, ingredient) => sum + (ingredient.confidence || 0), 0);
  return Number((total / ingredients.length).toFixed(2));
}

export class ScanResultService {
  static getScanResults(): ScanResult[] {
    return safeParse(localStorage.getItem(STORAGE_KEY));
  }

  static saveScanResult(imageDataUrl: string | null, ingredients: Ingredient[]): ScanResult {
    const nextResult: ScanResult = {
      id: `scan-${Date.now()}`,
      createdAt: new Date().toISOString(),
      imageDataUrl,
      ingredients,
      ingredientCount: ingredients.length,
      averageConfidence: averageConfidence(ingredients),
    };

    const existing = this.getScanResults();
    const updated = [nextResult, ...existing].slice(0, MAX_SCAN_RESULTS);
    localStorage.setItem(STORAGE_KEY, JSON.stringify(updated));

    return nextResult;
  }

  static deleteScanResult(scanId: string): ScanResult[] {
    const filtered = this.getScanResults().filter((scan) => scan.id !== scanId);
    localStorage.setItem(STORAGE_KEY, JSON.stringify(filtered));
    return filtered;
  }

  static clearScanResults(): void {
    localStorage.removeItem(STORAGE_KEY);
  }
}
