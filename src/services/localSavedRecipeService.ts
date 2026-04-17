import { Recipe } from '../types';

const LOCAL_SAVED_RECIPES_KEY = 'CULINARY_LENS_LOCAL_SAVED_RECIPES';

function readSavedRecipes(): Recipe[] {
  const raw = localStorage.getItem(LOCAL_SAVED_RECIPES_KEY);
  if (!raw) return [];

  try {
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? (parsed as Recipe[]) : [];
  } catch {
    return [];
  }
}

function writeSavedRecipes(recipes: Recipe[]) {
  localStorage.setItem(LOCAL_SAVED_RECIPES_KEY, JSON.stringify(recipes));
}

export class LocalSavedRecipeService {
  static getSavedRecipes(): Recipe[] {
    return readSavedRecipes();
  }

  static saveRecipe(recipe: Recipe): Recipe[] {
    const current = readSavedRecipes();
    const exists = current.some((item) => item.id === recipe.id);
    const next = exists ? current : [recipe, ...current];
    writeSavedRecipes(next);
    return next;
  }

  static deleteRecipe(recipeId: string): Recipe[] {
    const next = readSavedRecipes().filter((item) => item.id !== recipeId);
    writeSavedRecipes(next);
    return next;
  }
}
