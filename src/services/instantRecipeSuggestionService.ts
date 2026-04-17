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
  return value
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9\s]/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}

function stemWord(value: string): string {
  if (value.endsWith('ies') && value.length > 4) return `${value.slice(0, -3)}y`;
  if (value.endsWith('es') && value.length > 3) return value.slice(0, -2);
  if (value.endsWith('s') && value.length > 2) return value.slice(0, -1);
  return value;
}

function normalizeTokens(value: string): string[] {
  return normalize(value)
    .split(' ')
    .map((token) => stemWord(token))
    .filter((token) => token.length > 1);
}

function collectIngredientNames(pantry: Ingredient[], scans: ScanResult[], sessionIngredients: Ingredient[] = []): Set<string> {
  const names = new Set<string>();

  pantry.forEach((item) => names.add(normalize(item.name)));
  sessionIngredients.forEach((item) => names.add(normalize(item.name)));
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

function hasStrongIngredientMatch(available: string, recipeIngredient: string): boolean {
  const availableNormalized = normalize(available);
  const recipeNormalized = normalize(recipeIngredient);

  if (!availableNormalized || !recipeNormalized) return false;
  if (availableNormalized === recipeNormalized) return true;

  const availableTokens = normalizeTokens(availableNormalized);
  const recipeTokens = normalizeTokens(recipeNormalized);

  if (availableTokens.length === 0 || recipeTokens.length === 0) return false;

  const overlap = recipeTokens.filter((token) =>
    availableTokens.some((availableToken) => availableToken === token || availableToken.includes(token) || token.includes(availableToken))
  );

  return overlap.length > 0;
}

function getMatchStats(recipe: Recipe, availableIngredients: Set<string>): { readiness: number; matches: number; required: number } {
  const required = recipe.ingredients.length;
  if (!required) return { readiness: 0, matches: 0, required: 0 };

  const available = [...availableIngredients];
  const matches = recipe.ingredients.filter((ingredient) =>
    available.some((availableIngredient) => hasStrongIngredientMatch(availableIngredient, ingredient))
  ).length;

  return {
    readiness: Math.round((matches / required) * 100),
    matches,
    required,
  };
}

export class InstantRecipeSuggestionService {
  static suggestFromPantryAndHistory(scans: ScanResult[], limit: number = 3, sessionIngredients: Ingredient[] = []): InstantSuggestion[] {
    const pantry = PantryService.getPantry();
    const tasteModel = TasteModelService.getTasteModel();
    const blocked = TasteModelService.getBlockedIngredients();
    const availableIngredients = collectIngredientNames(pantry, scans, sessionIngredients);

    const rankedAll = ALL_RECIPES.map((recipe) => {
      const { readiness, matches, required } = getMatchStats(recipe, availableIngredients);
      const personalizedMultiplier =
        cuisineBoost(recipe, tasteModel) *
        dietBoost(recipe, tasteModel) *
        spicyBoost(recipe, tasteModel) *
        allergyPenalty(recipe, blocked);

      const weightedScore = readiness * personalizedMultiplier;
      return { recipe, readiness, weightedScore, matches, required };
    });

    const qualityFiltered = rankedAll
      .filter((item) => item.readiness > 0)
      .filter((item) => item.matches >= Math.min(2, item.required) || item.readiness >= 35);

    const fallbackPool = rankedAll.filter((item) => item.readiness > 0);
    const source = qualityFiltered.length > 0 ? qualityFiltered : fallbackPool;

    return source
      .sort((a, b) => b.weightedScore - a.weightedScore)
      .slice(0, limit)
      .map((item) => ({
        recipe: item.recipe,
        readinessScore: item.readiness,
        totalMinutes: item.recipe.prepTime + item.recipe.cookTime,
        reason: this.buildReason(item.recipe, tasteModel, item.readiness, item.matches, item.required),
      }));
  }

  private static buildReason(recipe: Recipe, model: TasteModel, baseReadiness: number, matches: number, required: number): string {
    const reasons: string[] = [`${matches}/${required} ingredients available (${baseReadiness}% match)`];

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
