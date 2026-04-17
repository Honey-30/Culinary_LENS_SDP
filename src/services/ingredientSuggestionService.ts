import { LARGE_RECIPE_DATABASE } from './recipeDatabase';
import { STATIC_RECIPES } from './staticRecipes';

const SUGGESTION_LIMIT = 8;

const DEFAULT_INGREDIENTS = [
  'Tomato', 'Onion', 'Garlic', 'Ginger', 'Potato', 'Carrot', 'Broccoli', 'Spinach',
  'Chicken', 'Beef', 'Pork', 'Tofu', 'Salmon', 'Shrimp', 'Egg', 'Milk', 'Butter',
  'Cheese', 'Yogurt', 'Rice', 'Pasta', 'Noodles', 'Bread', 'Quinoa', 'Flour', 'Sugar',
  'Salt', 'Pepper', 'Olive Oil', 'Soy Sauce', 'Curry Paste', 'Vinegar', 'Lemon', 'Lime',
  'Cumin', 'Coriander', 'Paprika', 'Basil', 'Oregano', 'Chili Flakes', 'Mushroom',
  'Bell Pepper', 'Zucchini', 'Kale', 'Cucumber', 'Chickpeas', 'Lentils', 'Tempeh'
];

function buildIngredientDictionary(): string[] {
  const all = new Set<string>();

  DEFAULT_INGREDIENTS.forEach((item) => all.add(item));

  [...STATIC_RECIPES, ...LARGE_RECIPE_DATABASE].forEach((recipe) => {
    recipe.ingredients.forEach((ingredient) => {
      const clean = ingredient.trim();
      if (clean) all.add(clean);
    });
  });

  return Array.from(all).sort((a, b) => a.localeCompare(b));
}

export const INGREDIENT_DICTIONARY = buildIngredientDictionary();

export function getIngredientSuggestions(query: string): string[] {
  const input = query.trim().toLowerCase();
  if (!input) return INGREDIENT_DICTIONARY.slice(0, SUGGESTION_LIMIT);

  return INGREDIENT_DICTIONARY.filter((item) => item.toLowerCase().includes(input)).slice(0, SUGGESTION_LIMIT);
}
