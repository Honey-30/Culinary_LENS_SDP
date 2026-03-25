import { Ingredient } from '../types';

export class PantryService {
  private static STORAGE_KEY = 'CULINARY_LENS_PANTRY';

  static getPantry(): Ingredient[] {
    const data = localStorage.getItem(this.STORAGE_KEY);
    return data ? JSON.parse(data) : [];
  }

  static addToPantry(ingredient: Ingredient) {
    const pantry = this.getPantry();
    const existing = pantry.find(i => i.name.toLowerCase() === ingredient.name.toLowerCase());
    
    if (existing) {
      // Update existing
      const updated = pantry.map(i => 
        i.name.toLowerCase() === ingredient.name.toLowerCase() ? { ...i, ...ingredient } : i
      );
      localStorage.setItem(this.STORAGE_KEY, JSON.stringify(updated));
    } else {
      localStorage.setItem(this.STORAGE_KEY, JSON.stringify([...pantry, ingredient]));
    }
  }

  static removeFromPantry(id: string) {
    const pantry = this.getPantry();
    const updated = pantry.filter(i => i.id !== id);
    localStorage.setItem(this.STORAGE_KEY, JSON.stringify(updated));
  }

  static checkExpiry(): Ingredient[] {
    const pantry = this.getPantry();
    const now = new Date();
    return pantry.filter(i => {
      if (!i.expiryDate) return false;
      const expiry = new Date(i.expiryDate);
      const diff = expiry.getTime() - now.getTime();
      return diff < (1000 * 60 * 60 * 24 * 3); // Expiring in 3 days
    });
  }
}
