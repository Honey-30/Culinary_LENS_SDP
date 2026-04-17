import { AllergyService } from './allergyService';

export type DietPreference = 'ANY' | 'VEG' | 'HIGH_PROTEIN' | 'LOW_CARB';

export interface TasteModel {
  spicyTolerance: number;
  cuisinePreferences: string[];
  dietPreference: DietPreference;
  updatedAt: string;
}

const STORAGE_KEY = 'CULINARY_LENS_TASTE_MODEL';

const DEFAULT_MODEL: TasteModel = {
  spicyTolerance: 5,
  cuisinePreferences: ['ALL'],
  dietPreference: 'ANY',
  updatedAt: new Date(0).toISOString(),
};

function safeParse(data: string | null): TasteModel | null {
  if (!data) return null;

  try {
    const parsed = JSON.parse(data) as Partial<TasteModel>;
    if (typeof parsed !== 'object' || !parsed) return null;

    const spicyTolerance = Number(parsed.spicyTolerance);
    const cuisinePreferences = Array.isArray(parsed.cuisinePreferences)
      ? parsed.cuisinePreferences
          .map((item) => String(item).trim().toUpperCase())
          .filter(Boolean)
      : ['ALL'];

    const dietPreference =
      parsed.dietPreference === 'VEG' ||
      parsed.dietPreference === 'HIGH_PROTEIN' ||
      parsed.dietPreference === 'LOW_CARB' ||
      parsed.dietPreference === 'ANY'
        ? parsed.dietPreference
        : 'ANY';

    return {
      spicyTolerance: Number.isFinite(spicyTolerance) ? Math.min(10, Math.max(0, spicyTolerance)) : 5,
      cuisinePreferences: cuisinePreferences.length ? cuisinePreferences : ['ALL'],
      dietPreference,
      updatedAt: typeof parsed.updatedAt === 'string' ? parsed.updatedAt : new Date().toISOString(),
    };
  } catch {
    return null;
  }
}

export class TasteModelService {
  static getTasteModel(): TasteModel {
    return safeParse(localStorage.getItem(STORAGE_KEY)) || DEFAULT_MODEL;
  }

  static saveTasteModel(model: Partial<TasteModel>): TasteModel {
    const current = this.getTasteModel();
    const merged: TasteModel = {
      ...current,
      ...model,
      spicyTolerance: Math.min(10, Math.max(0, Number(model.spicyTolerance ?? current.spicyTolerance))),
      cuisinePreferences: Array.isArray(model.cuisinePreferences)
        ? model.cuisinePreferences.map((item) => item.toUpperCase()).filter(Boolean)
        : current.cuisinePreferences,
      dietPreference: model.dietPreference || current.dietPreference,
      updatedAt: new Date().toISOString(),
    };

    localStorage.setItem(STORAGE_KEY, JSON.stringify(merged));
    return merged;
  }

  static getEffectiveCuisines(): string[] {
    const model = this.getTasteModel();
    if (model.cuisinePreferences.includes('ALL')) return ['ALL'];
    return model.cuisinePreferences;
  }

  static getBlockedIngredients(): string[] {
    return AllergyService.getAllergies().map((item) => item.toLowerCase());
  }
}
