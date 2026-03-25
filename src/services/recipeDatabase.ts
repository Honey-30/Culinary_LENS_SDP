import { Recipe } from '../types';

const CUISINES = ['ITALIAN', 'CHINESE', 'MEXICAN', 'INDIAN', 'GREEK', 'FRENCH', 'JAPANESE', 'THAI', 'MEDITERRANEAN', 'AMERICAN'];
const PROTEINS = ['Chicken', 'Beef', 'Pork', 'Tofu', 'Salmon', 'Shrimp', 'Lentils', 'Chickpeas', 'Eggs', 'Tempeh'];
const VEGGIES = ['Broccoli', 'Spinach', 'Bell Pepper', 'Carrots', 'Zucchini', 'Mushrooms', 'Kale', 'Asparagus', 'Cauliflower', 'Sweet Potato'];
const BASES = ['Rice', 'Pasta', 'Quinoa', 'Noodles', 'Potatoes', 'Couscous', 'Tortillas', 'Bread', 'Polenta', 'Farro'];
const SAUCES = ['Soy Sauce', 'Tomato Sauce', 'Pesto', 'Curry Paste', 'Tahini', 'Olive Oil', 'Garlic Butter', 'Sriracha', 'Vinegar', 'Miso'];
const FOOD_IMAGE_DATASET = [
  'https://images.unsplash.com/photo-1612874742237-6526221588e3?auto=format&fit=crop&q=80&w=1000',
  'https://images.unsplash.com/photo-1603133872878-684f208fb84b?auto=format&fit=crop&q=80&w=1000',
  'https://images.unsplash.com/photo-1540189549336-e6e99c3679fe?auto=format&fit=crop&q=80&w=1000',
  'https://images.unsplash.com/photo-1525351484163-7529414344d8?auto=format&fit=crop&q=80&w=1000',
  'https://images.unsplash.com/photo-1512621776951-a57141f2eefd?auto=format&fit=crop&q=80&w=1000',
  'https://images.unsplash.com/photo-1504674900247-0877df9cc836?auto=format&fit=crop&q=80&w=1000'
];

function generateRecipes(count: number): Recipe[] {
  const recipes: Recipe[] = [];
  
  for (let i = 0; i < count; i++) {
    const cuisine = CUISINES[i % CUISINES.length];
    const protein = PROTEINS[i % PROTEINS.length];
    const veggie = VEGGIES[i % VEGGIES.length];
    const base = BASES[i % BASES.length];
    const sauce = SAUCES[i % SAUCES.length];
    
    const title = `${cuisine.charAt(0) + cuisine.slice(1).toLowerCase()} ${protein} & ${veggie} ${base}`;
    const id = `static-${i}`;
    
    recipes.push({
      id,
      title,
      description: `A delicious and balanced ${cuisine.toLowerCase()} inspired dish featuring ${protein.toLowerCase()}, fresh ${veggie.toLowerCase()}, and ${base.toLowerCase()} tossed in a savory ${sauce.toLowerCase()}.`,
      cuisine,
      ingredients: [protein, veggie, base, sauce, 'Garlic', 'Onion', 'Salt', 'Pepper'],
      steps: [
        { id: '1', instruction: `Prepare the ${base.toLowerCase()} according to package instructions.` },
        { id: '2', instruction: `Sauté the ${protein.toLowerCase()} in a large pan until cooked through.` },
        { id: '3', instruction: `Add the ${veggie.toLowerCase()}, garlic, and onion. Cook until tender.` },
        { id: '4', instruction: `Stir in the ${sauce.toLowerCase()} and combine with the ${base.toLowerCase()}.` },
        { id: '5', instruction: `Season with salt and pepper to taste. Serve hot.` }
      ],
      prepTime: 10 + (i % 15),
      cookTime: 15 + (i % 20),
      servings: 2 + (i % 4),
      difficulty: i % 3 === 0 ? 'EASY' : i % 3 === 1 ? 'MEDIUM' : 'HARD',
      macros: {
        calories: 300 + (i % 500),
        protein: 15 + (i % 30),
        carbs: 20 + (i % 60),
        fat: 10 + (i % 25)
      },
      imageUrl: FOOD_IMAGE_DATASET[i % FOOD_IMAGE_DATASET.length],
      source: 'STATIC'
    });
  }
  
  return recipes;
}

// Offline recipe dataset
export const RECIPE_DATASET: Recipe[] = generateRecipes(2000);

// Backward-compatible export used across the app
export const LARGE_RECIPE_DATABASE: Recipe[] = RECIPE_DATASET;
