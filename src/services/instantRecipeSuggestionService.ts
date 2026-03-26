import { Ingredient, Recipe, ScanResult } from '../types';
import { LARGE_RECIPE_DATABASE } from './recipeDatabase';
import { PantryService } from './pantryService';
import { STATIC_RECIPES } from './staticRecipes';
import { TasteModel, TasteModelService } from './tasteModelService';

export interface InstantSuggestion {
  recipe: Recipe;
  readinessScore: number;
  totalMinutes: number;
  reason: string;
}

const ALL_RECIPES = [...STATIC_RECIPES, ...LARGE_RECIPE_DATABASE];

function normalize(value: string): string {
  return value.trim().toLowerCase();
}

function collectIngredientNames(pantry: Ingredient[], scans: ScanResult[]): Set<string> {
  const names = new Set<string>();

  pantry.forEach((item) => names.add(normalize(item.name)));
  scans.slice(0, 5).forEach((scan) => {
    scan.ingredients.forEach((item) => names.add(normalize(item.name)));
  });

  return names;
}

function isVegRecipe(recipe: Recipe): boolean {
  const nonVegTerms = ['chicken', 'beef', 'pork', 'fish', 'shrimp', 'mutton', 'lamb', 'bacon'];
  return !recipe.ingredients.some((ing) => {
    const lower = ing.toLowerCase();
    return nonVegTerms.some((term) => lower.includes(term));
  });
}

function cuisineBoost(recipe: Recipe, model: TasteModel): number {
  const preferred = model.cuisinePreferences;
  if (!preferred.length || preferred.includes('ALL')) return 1;
  return preferred.includes(recipe.cuisine.toUpperCase()) ? 1.25 : 1;
}

function dietBoost(recipe: Recipe, model: TasteModel): number {
  if (model.dietPreference === 'ANY') return 1;
  if (model.dietPreference === 'VEG') return isVegRecipe(recipe) ? 1.25 : 0.65;
  if (model.dietPreference === 'HIGH_PROTEIN') return recipe.macros.protein >= 20 ? 1.2 : 0.9;
  if (model.dietPreference === 'LOW_CARB') return recipe.macros.carbs <= 30 ? 1.2 : 0.85;
  return 1;
}

function spicyBoost(recipe: Recipe, model: TasteModel): number {
  const lower = `${recipe.title} ${recipe.description}`.toLowerCase();
  const spicyHints = ['spicy', 'chili', 'masala', 'pepper'];
  const looksSpicy = spicyHints.some((hint) => lower.includes(hint));

  if (!looksSpicy) return 1;
  if (model.spicyTolerance >= 7) return 1.15;
  if (model.spicyTolerance <= 3) return 0.9;
  return 1;
}

function allergyPenalty(recipe: Recipe, blockedIngredients: string[]): number {
  if (blockedIngredients.length === 0) return 1;

  const containsAllergen = recipe.ingredients.some((ingredient) => {
    const lower = ingredient.toLowerCase();
    return blockedIngredients.some((allergen) => lower.includes(allergen) || allergen.includes(lower));
  });

  return containsAllergen ? 0.25 : 1;
}

function overlapScore(recipe: Recipe, availableIngredients: Set<string>): number {
  const matches = recipe.ingredients.filter((ingredient) => {
    const lower = ingredient.toLowerCase();
    return [...availableIngredients].some((available) => available.includes(lower) || lower.includes(available));
  }).length;

  if (!recipe.ingredients.length) return 0;
  return Math.round((matches / recipe.ingredients.length) * 100);
}

export class InstantRecipeSuggestionService {
  static suggestFromPantryAndHistory(scans: ScanResult[], limit: number = 3): InstantSuggestion[] {
    const pantry = PantryService.getPantry();
    const tasteModel = TasteModelService.getTasteModel();
    const blocked = TasteModelService.getBlockedIngredients();
    const availableIngredients = collectIngredientNames(pantry, scans);

    const ranked = ALL_RECIPES.map((recipe) => {
      const readiness = overlapScore(recipe, availableIngredients);
      const personalizedMultiplier =
        cuisineBoost(recipe, tasteModel) *
        dietBoost(recipe, tasteModel) *
        spicyBoost(recipe, tasteModel) *
        allergyPenalty(recipe, blocked);

      const weightedScore = readiness * personalizedMultiplier;
      return { recipe, readiness, weightedScore };
    })
      .filter((item) => item.readiness > 0)
      .sort((a, b) => b.weightedScore - a.weightedScore)
      .slice(0, limit)
      .map((item) => ({
        recipe: item.recipe,
        readinessScore: Math.min(100, Math.round(item.weightedScore)),
        totalMinutes: item.recipe.prepTime + item.recipe.cookTime,
        reason: this.buildReason(item.recipe, tasteModel, item.readiness),
      }));

    return ranked;
  }

  private static buildReason(recipe: Recipe, model: TasteModel, baseReadiness: number): string {
    const reasons: string[] = [`${baseReadiness}% ingredient match`];

    if (!model.cuisinePreferences.includes('ALL') && model.cuisinePreferences.includes(recipe.cuisine.toUpperCase())) {
      reasons.push(`matches your ${recipe.cuisine} preference`);
    }

    if (model.dietPreference === 'HIGH_PROTEIN' && recipe.macros.protein >= 20) {
      reasons.push('fits high-protein goal');
    }

    if (model.dietPreference === 'LOW_CARB' && recipe.macros.carbs <= 30) {
      reasons.push('fits low-carb goal');
    }

    if (model.dietPreference === 'VEG' && isVegRecipe(recipe)) {
      reasons.push('vegetarian-friendly');
    }

    return reasons.join(' • ');
  }
}
