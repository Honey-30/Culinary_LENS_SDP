import { Ingredient, Recipe } from '../types';

export class AllergyService {
  private static STORAGE_KEY = 'CULINARY_LENS_ALLERGIES';

  static getAllergies(): string[] {
    const data = localStorage.getItem(this.STORAGE_KEY);
    return data ? JSON.parse(data) : [];
  }

  static setAllergies(allergies: string[]) {
    localStorage.setItem(this.STORAGE_KEY, JSON.stringify(allergies));
  }

  static isAllergen(ingredientName: string): boolean {
    const allergies = this.getAllergies().map(a => a.toLowerCase());
    const name = ingredientName.toLowerCase();
    return allergies.some(a => name.includes(a) || a.includes(name));
  }

  static filterRecipes(recipes: Recipe[]): Recipe[] {
    const allergies = this.getAllergies().map(a => a.toLowerCase());
    if (allergies.length === 0) return recipes;

    return recipes.filter(recipe => {
      const recipeIngredients = recipe.ingredients.map(i => i.toLowerCase());
      return !recipeIngredients.some(ri => 
        allergies.some(a => ri.includes(a) || a.includes(ri))
      );
    });
  }
}
