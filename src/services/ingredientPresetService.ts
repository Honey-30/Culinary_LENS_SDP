import { Ingredient } from '../types';

const STORAGE_KEY = 'CULINARY_LENS_INGREDIENT_PRESETS';

export interface IngredientPreset {
  id: string;
  name: string;
  ingredients: Ingredient[];
  createdAt: string;
}

function readPresets(): IngredientPreset[] {
  const raw = localStorage.getItem(STORAGE_KEY);
  if (!raw) return [];

  try {
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? (parsed as IngredientPreset[]) : [];
  } catch {
    return [];
  }
}

function writePresets(presets: IngredientPreset[]) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(presets));
}

export class IngredientPresetService {
  static list(): IngredientPreset[] {
    return readPresets().sort((a, b) => b.createdAt.localeCompare(a.createdAt));
  }

  static save(name: string, ingredients: Ingredient[]): IngredientPreset[] {
    const trimmedName = name.trim();
    if (!trimmedName) return this.list();

    const preset: IngredientPreset = {
      id: `preset-${Date.now()}`,
      name: trimmedName,
      ingredients,
      createdAt: new Date().toISOString(),
    };

    const current = readPresets();
    const next = [preset, ...current].slice(0, 20);
    writePresets(next);
    return this.list();
  }

  static remove(presetId: string): IngredientPreset[] {
    const next = readPresets().filter((preset) => preset.id !== presetId);
    writePresets(next);
    return this.list();
  }
}
