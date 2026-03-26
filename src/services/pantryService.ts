import { Ingredient } from '../types';
import { getExpiryDateFromShelfLife, getPantryProductMeta } from './pantryProductDataset';

export class PantryService {
  private static STORAGE_KEY = 'CULINARY_LENS_PANTRY';

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
}
