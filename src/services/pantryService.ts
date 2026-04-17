import { Ingredient } from '../types';
import { getExpiryDateFromShelfLife, getPantryProductMeta } from './pantryProductDataset';

export class PantryService {
  private static STORAGE_KEY = 'CULINARY_LENS_PANTRY';
  private static LAST_COOK_ACTIVITY_KEY = 'CULINARY_LENS_LAST_COOK_ACTIVITY';

  private static saveLastCookActivity(activity: { recipeTitle: string; consumedCount: number; at: string }) {
    localStorage.setItem(this.LAST_COOK_ACTIVITY_KEY, JSON.stringify(activity));
  }

  private static normalizeName(value: string): string {
    return value
      .toLowerCase()
      .replace(/[^a-z0-9\s-]/g, ' ')
      .replace(/\s+/g, ' ')
      .trim();
  }

  private static sanitizeIngredient(ingredient: Ingredient): Ingredient {
    const meta = getPantryProductMeta(ingredient.name);
    return {
      ...ingredient,
      name: ingredient.name.trim(),
      category: ingredient.category || meta.category,
      expiryDate: ingredient.expiryDate || getExpiryDateFromShelfLife(ingredient.name),
      pantryDetails: ingredient.pantryDetails || {
        storage: meta.storage,
        shelfLifeDays: meta.shelfLifeDays,
        source: 'MANUAL',
      },
    };
  }

  private static savePantry(items: Ingredient[]) {
    localStorage.setItem(this.STORAGE_KEY, JSON.stringify(items));
  }

  static getPantry(): Ingredient[] {
    const data = localStorage.getItem(this.STORAGE_KEY);
    if (!data) return [];

    try {
      const parsed = JSON.parse(data) as Ingredient[];
      if (!Array.isArray(parsed)) return [];
      return parsed.map((item) => this.sanitizeIngredient(item));
    } catch {
      return [];
    }
  }

  static addToPantry(ingredient: Ingredient) {
    const normalized = this.sanitizeIngredient(ingredient);
    const pantry = this.getPantry();
    const existing = pantry.find(i => i.name.toLowerCase() === normalized.name.toLowerCase());
    
    if (existing) {
      const updated = pantry.map(i => 
        i.name.toLowerCase() === normalized.name.toLowerCase()
          ? {
              ...i,
              ...normalized,
              id: i.id,
              expiryDate: normalized.expiryDate || i.expiryDate,
              pantryDetails: normalized.pantryDetails || i.pantryDetails,
            }
          : i
      );
      this.savePantry(updated);
    } else {
      this.savePantry([...pantry, normalized]);
    }
  }

  static addManualItem(name: string, expiryDate?: string) {
    const meta = getPantryProductMeta(name);
    const ingredient: Ingredient = {
      id: `pantry-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
      name: name.trim(),
      category: meta.category,
      confidence: 1,
      expiryDate: expiryDate || getExpiryDateFromShelfLife(name),
      pantryDetails: {
        storage: meta.storage,
        shelfLifeDays: meta.shelfLifeDays,
        source: 'MANUAL',
      },
    };

    this.addToPantry(ingredient);
  }

  static addDetectedIngredients(ingredients: Ingredient[]) {
    ingredients.forEach((ingredient) => {
      const meta = getPantryProductMeta(ingredient.name);
      this.addToPantry({
        ...ingredient,
        category: ingredient.category || meta.category,
        expiryDate: ingredient.expiryDate || getExpiryDateFromShelfLife(ingredient.name),
        pantryDetails: {
          storage: meta.storage,
          shelfLifeDays: meta.shelfLifeDays,
          source: 'SCAN',
        },
      });
    });
  }

  static removeFromPantry(id: string) {
    const pantry = this.getPantry();
    const updated = pantry.filter(i => i.id !== id);
    this.savePantry(updated);
  }

  static checkExpiry(): Ingredient[] {
    const pantry = this.getPantry();
    const now = new Date();
    return pantry.filter(i => {
      if (!i.expiryDate) return false;
      const expiry = new Date(i.expiryDate);
      const diff = expiry.getTime() - now.getTime();
      return diff >= 0 && diff < (1000 * 60 * 60 * 24 * 3);
    });
  }

  static consumeIngredientsByNames(ingredientNames: string[]): number {
    if (!Array.isArray(ingredientNames) || ingredientNames.length === 0) return 0;

    const targets = ingredientNames
      .map((name) => this.normalizeName(name))
      .filter((name) => name.length > 0);

    if (targets.length === 0) return 0;

    const pantry = this.getPantry();
    const remaining: Ingredient[] = [];
    let removedCount = 0;

    for (const item of pantry) {
      const itemName = this.normalizeName(item.name);
      const matchedIndex = targets.findIndex((target) => itemName.includes(target) || target.includes(itemName));

      if (matchedIndex >= 0) {
        removedCount += 1;
        targets.splice(matchedIndex, 1);
      } else {
        remaining.push(item);
      }
    }

    if (removedCount > 0) {
      this.savePantry(remaining);
    }

    return removedCount;
  }

  static getSourceCounts(): { total: number; scanned: number; manual: number } {
    const pantry = this.getPantry();
    const scanned = pantry.filter((item) => item.pantryDetails?.source === 'SCAN').length;
    return {
      total: pantry.length,
      scanned,
      manual: pantry.length - scanned,
    };
  }

  static recordLastCookActivity(recipeTitle: string, consumedCount: number) {
    this.saveLastCookActivity({
      recipeTitle: recipeTitle || 'Unknown recipe',
      consumedCount: Math.max(0, consumedCount || 0),
      at: new Date().toISOString(),
    });
  }

  static getLastCookActivity(): { recipeTitle: string; consumedCount: number; at: string } | null {
    const raw = localStorage.getItem(this.LAST_COOK_ACTIVITY_KEY);
    if (!raw) return null;

    try {
      const parsed = JSON.parse(raw);
      if (!parsed || typeof parsed.recipeTitle !== 'string' || typeof parsed.at !== 'string') {
        return null;
      }

      return {
        recipeTitle: parsed.recipeTitle,
        consumedCount: Number(parsed.consumedCount) || 0,
        at: parsed.at,
      };
    } catch {
      return null;
    }
  }
}
