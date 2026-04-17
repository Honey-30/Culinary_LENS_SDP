const fs = require('fs');
const path = require('path');

const filePath = path.join(process.cwd(), 'src', 'services', 'staticRecipes.ts');
const source = fs.readFileSync(filePath, 'utf8');

const match = source.match(/export const STATIC_RECIPES: Recipe\[] = \[\n([\s\S]*?)\.\.\.generateMoreStaticRecipes\(1200\)\n\];/);
if (!match) {
  throw new Error('Could not locate STATIC_RECIPES block with generator spread.');
}

const existingBlock = match[1];

const cuisines = ['ITALIAN', 'CHINESE', 'MEXICAN', 'INDIAN', 'GREEK', 'FRENCH', 'JAPANESE', 'THAI', 'MEDITERRANEAN', 'AMERICAN', 'KOREAN', 'SPANISH', 'MOROCCAN', 'TURKISH'];
const proteins = ['Chicken', 'Beef', 'Pork', 'Tofu', 'Salmon', 'Shrimp', 'Lentils', 'Chickpeas', 'Eggs', 'Tempeh'];
const veggies = ['Broccoli', 'Spinach', 'Bell Pepper', 'Carrots', 'Zucchini', 'Mushrooms', 'Kale', 'Asparagus', 'Cauliflower', 'Sweet Potato'];
const bases = ['Rice', 'Pasta', 'Quinoa', 'Noodles', 'Potatoes', 'Couscous', 'Tortillas', 'Bread', 'Polenta', 'Farro'];
const sauces = ['Soy Sauce', 'Tomato Sauce', 'Pesto', 'Curry Paste', 'Tahini', 'Olive Oil', 'Garlic Butter', 'Sriracha', 'Vinegar', 'Miso'];
const images = [
  'https://images.unsplash.com/photo-1612874742237-6526221588e3?auto=format&fit=crop&q=80&w=1000',
  'https://images.unsplash.com/photo-1603133872878-684f208fb84b?auto=format&fit=crop&q=80&w=1000',
  'https://images.unsplash.com/photo-1540189549336-e6e99c3679fe?auto=format&fit=crop&q=80&w=1000',
  'https://images.unsplash.com/photo-1525351484163-7529414344d8?auto=format&fit=crop&q=80&w=1000',
  'https://images.unsplash.com/photo-1512621776951-a57141f2eefd?auto=format&fit=crop&q=80&w=1000',
  'https://images.unsplash.com/photo-1504674900247-0877df9cc836?auto=format&fit=crop&q=80&w=1000'
];

function cap(s) {
  return s.charAt(0) + s.slice(1).toLowerCase();
}

const extraRecipes = [];
for (let i = 0; i < 1200; i++) {
  const cuisine = cuisines[i % cuisines.length];
  const protein = proteins[i % proteins.length];
  const veggie = veggies[i % veggies.length];
  const base = bases[i % bases.length];
  const sauce = sauces[i % sauces.length];
  const difficulty = i % 3 === 0 ? 'EASY' : i % 3 === 1 ? 'MEDIUM' : 'HARD';

  const block = `  {
    id: 'static-extra-${i}',
    title: '${cap(cuisine)} ${protein} ${base} Bowl',
    description: 'A ${cuisine.toLowerCase()}-inspired recipe with ${protein.toLowerCase()}, ${veggie.toLowerCase()}, and ${base.toLowerCase()} finished with ${sauce.toLowerCase()}.',
    cuisine: '${cuisine}',
    ingredients: ['${protein}', '${veggie}', '${base}', '${sauce}', 'Garlic', 'Onion', 'Salt', 'Pepper'],
    steps: [
      { id: '1', instruction: 'Prepare the ${base.toLowerCase()} according to package directions.' },
      { id: '2', instruction: 'Cook the ${protein.toLowerCase()} in a hot skillet until done.' },
      { id: '3', instruction: 'Add ${veggie.toLowerCase()} and saute until tender.' },
      { id: '4', instruction: 'Mix in ${sauce.toLowerCase()} and simmer briefly.' },
      { id: '5', instruction: 'Combine all components and serve warm.' }
    ],
    prepTime: ${10 + (i % 10)},
    cookTime: ${15 + (i % 15)},
    servings: ${2 + (i % 3)},
    difficulty: '${difficulty}',
    macros: { calories: ${300 + (i % 450)}, protein: ${15 + (i % 30)}, carbs: ${20 + (i % 55)}, fat: ${10 + (i % 20)} },
    imageUrl: '${images[i % images.length]}',
    source: 'STATIC'
  }`;
  extraRecipes.push(block);
}

const header = `/**\n * @license\n * SPDX-License-Identifier: Apache-2.0\n */\n\nimport { Recipe } from '../types';\n\n`;
const final = `${header}export const STATIC_RECIPES: Recipe[] = [\n${existingBlock}${extraRecipes.join(',\n')}\n];\n`;

fs.writeFileSync(filePath, final);
console.log('Expanded staticRecipes.ts to explicit literal objects.');
