export interface PantryProductMeta {
  category: string;
  storage: 'PANTRY' | 'FRIDGE' | 'FREEZER';
  shelfLifeDays: number;
}

export const PANTRY_PRODUCT_DATASET: Record<string, PantryProductMeta> = {
  'apple': { category: 'Fruit', storage: 'FRIDGE', shelfLifeDays: 21 },
  'banana': { category: 'Fruit', storage: 'PANTRY', shelfLifeDays: 5 },
  'orange': { category: 'Fruit', storage: 'FRIDGE', shelfLifeDays: 21 },
  'lemon': { category: 'Fruit', storage: 'FRIDGE', shelfLifeDays: 21 },
  'lime': { category: 'Fruit', storage: 'FRIDGE', shelfLifeDays: 21 },
  'grapes': { category: 'Fruit', storage: 'FRIDGE', shelfLifeDays: 10 },
  'strawberry': { category: 'Fruit', storage: 'FRIDGE', shelfLifeDays: 5 },
  'blueberry': { category: 'Fruit', storage: 'FRIDGE', shelfLifeDays: 10 },
  'mango': { category: 'Fruit', storage: 'PANTRY', shelfLifeDays: 7 },
  'pineapple': { category: 'Fruit', storage: 'PANTRY', shelfLifeDays: 6 },
  'avocado': { category: 'Fruit', storage: 'PANTRY', shelfLifeDays: 5 },
  'tomato': { category: 'Vegetable', storage: 'PANTRY', shelfLifeDays: 7 },
  'potato': { category: 'Vegetable', storage: 'PANTRY', shelfLifeDays: 30 },
  'onion': { category: 'Vegetable', storage: 'PANTRY', shelfLifeDays: 45 },
  'garlic': { category: 'Vegetable', storage: 'PANTRY', shelfLifeDays: 60 },
  'ginger': { category: 'Vegetable', storage: 'FRIDGE', shelfLifeDays: 21 },
  'carrot': { category: 'Vegetable', storage: 'FRIDGE', shelfLifeDays: 28 },
  'cucumber': { category: 'Vegetable', storage: 'FRIDGE', shelfLifeDays: 10 },
  'spinach': { category: 'Vegetable', storage: 'FRIDGE', shelfLifeDays: 5 },
  'kale': { category: 'Vegetable', storage: 'FRIDGE', shelfLifeDays: 7 },
  'lettuce': { category: 'Vegetable', storage: 'FRIDGE', shelfLifeDays: 7 },
  'cabbage': { category: 'Vegetable', storage: 'FRIDGE', shelfLifeDays: 21 },
  'cauliflower': { category: 'Vegetable', storage: 'FRIDGE', shelfLifeDays: 14 },
  'broccoli': { category: 'Vegetable', storage: 'FRIDGE', shelfLifeDays: 7 },
  'bell pepper': { category: 'Vegetable', storage: 'FRIDGE', shelfLifeDays: 10 },
  'zucchini': { category: 'Vegetable', storage: 'FRIDGE', shelfLifeDays: 7 },
  'eggplant': { category: 'Vegetable', storage: 'FRIDGE', shelfLifeDays: 7 },
  'mushroom': { category: 'Vegetable', storage: 'FRIDGE', shelfLifeDays: 7 },
  'celery': { category: 'Vegetable', storage: 'FRIDGE', shelfLifeDays: 14 },
  'peas': { category: 'Vegetable', storage: 'FREEZER', shelfLifeDays: 180 },
  'corn': { category: 'Vegetable', storage: 'FRIDGE', shelfLifeDays: 7 },
  'green beans': { category: 'Vegetable', storage: 'FRIDGE', shelfLifeDays: 7 },
  'beetroot': { category: 'Vegetable', storage: 'FRIDGE', shelfLifeDays: 14 },
  'radish': { category: 'Vegetable', storage: 'FRIDGE', shelfLifeDays: 10 },
  'milk': { category: 'Dairy', storage: 'FRIDGE', shelfLifeDays: 7 },
  'yogurt': { category: 'Dairy', storage: 'FRIDGE', shelfLifeDays: 10 },
  'butter': { category: 'Dairy', storage: 'FRIDGE', shelfLifeDays: 45 },
  'cheese': { category: 'Dairy', storage: 'FRIDGE', shelfLifeDays: 21 },
  'paneer': { category: 'Dairy', storage: 'FRIDGE', shelfLifeDays: 7 },
  'cream': { category: 'Dairy', storage: 'FRIDGE', shelfLifeDays: 7 },
  'egg': { category: 'Protein', storage: 'FRIDGE', shelfLifeDays: 28 },
  'eggs': { category: 'Protein', storage: 'FRIDGE', shelfLifeDays: 28 },
  'chicken': { category: 'Protein', storage: 'FRIDGE', shelfLifeDays: 2 },
  'chicken breast': { category: 'Protein', storage: 'FRIDGE', shelfLifeDays: 2 },
  'beef': { category: 'Protein', storage: 'FRIDGE', shelfLifeDays: 3 },
  'pork': { category: 'Protein', storage: 'FRIDGE', shelfLifeDays: 3 },
  'fish': { category: 'Protein', storage: 'FRIDGE', shelfLifeDays: 2 },
  'salmon': { category: 'Protein', storage: 'FRIDGE', shelfLifeDays: 2 },
  'shrimp': { category: 'Protein', storage: 'FRIDGE', shelfLifeDays: 2 },
  'tofu': { category: 'Protein', storage: 'FRIDGE', shelfLifeDays: 7 },
  'tempeh': { category: 'Protein', storage: 'FRIDGE', shelfLifeDays: 7 },
  'lentils': { category: 'Legume', storage: 'PANTRY', shelfLifeDays: 365 },
  'chickpeas': { category: 'Legume', storage: 'PANTRY', shelfLifeDays: 365 },
  'kidney beans': { category: 'Legume', storage: 'PANTRY', shelfLifeDays: 365 },
  'black beans': { category: 'Legume', storage: 'PANTRY', shelfLifeDays: 365 },
  'rice': { category: 'Grain', storage: 'PANTRY', shelfLifeDays: 365 },
  'basmati rice': { category: 'Grain', storage: 'PANTRY', shelfLifeDays: 365 },
  'brown rice': { category: 'Grain', storage: 'PANTRY', shelfLifeDays: 365 },
  'quinoa': { category: 'Grain', storage: 'PANTRY', shelfLifeDays: 365 },
  'pasta': { category: 'Grain', storage: 'PANTRY', shelfLifeDays: 365 },
  'noodles': { category: 'Grain', storage: 'PANTRY', shelfLifeDays: 365 },
  'bread': { category: 'Bakery', storage: 'PANTRY', shelfLifeDays: 5 },
  'tortilla': { category: 'Bakery', storage: 'PANTRY', shelfLifeDays: 10 },
  'flour': { category: 'Baking', storage: 'PANTRY', shelfLifeDays: 180 },
  'sugar': { category: 'Baking', storage: 'PANTRY', shelfLifeDays: 730 },
  'salt': { category: 'Spice', storage: 'PANTRY', shelfLifeDays: 3650 },
  'pepper': { category: 'Spice', storage: 'PANTRY', shelfLifeDays: 730 },
  'cumin': { category: 'Spice', storage: 'PANTRY', shelfLifeDays: 730 },
  'coriander': { category: 'Spice', storage: 'PANTRY', shelfLifeDays: 730 },
  'turmeric': { category: 'Spice', storage: 'PANTRY', shelfLifeDays: 730 },
  'paprika': { category: 'Spice', storage: 'PANTRY', shelfLifeDays: 730 },
  'chili powder': { category: 'Spice', storage: 'PANTRY', shelfLifeDays: 730 },
  'oregano': { category: 'Spice', storage: 'PANTRY', shelfLifeDays: 730 },
  'basil': { category: 'Spice', storage: 'PANTRY', shelfLifeDays: 365 },
  'thyme': { category: 'Spice', storage: 'PANTRY', shelfLifeDays: 730 },
  'cinnamon': { category: 'Spice', storage: 'PANTRY', shelfLifeDays: 730 },
  'olive oil': { category: 'Oil', storage: 'PANTRY', shelfLifeDays: 365 },
  'sunflower oil': { category: 'Oil', storage: 'PANTRY', shelfLifeDays: 365 },
  'coconut oil': { category: 'Oil', storage: 'PANTRY', shelfLifeDays: 365 },
  'vinegar': { category: 'Condiment', storage: 'PANTRY', shelfLifeDays: 1095 },
  'soy sauce': { category: 'Condiment', storage: 'PANTRY', shelfLifeDays: 365 },
  'tomato paste': { category: 'Condiment', storage: 'FRIDGE', shelfLifeDays: 14 },
  'ketchup': { category: 'Condiment', storage: 'FRIDGE', shelfLifeDays: 180 },
  'mustard': { category: 'Condiment', storage: 'FRIDGE', shelfLifeDays: 180 },
  'mayonnaise': { category: 'Condiment', storage: 'FRIDGE', shelfLifeDays: 90 },
  'peanut butter': { category: 'Spread', storage: 'PANTRY', shelfLifeDays: 180 },
  'jam': { category: 'Spread', storage: 'FRIDGE', shelfLifeDays: 180 },
  'honey': { category: 'Sweetener', storage: 'PANTRY', shelfLifeDays: 1825 },
  'oats': { category: 'Breakfast', storage: 'PANTRY', shelfLifeDays: 365 },
  'cereal': { category: 'Breakfast', storage: 'PANTRY', shelfLifeDays: 180 },
  'coffee': { category: 'Beverage', storage: 'PANTRY', shelfLifeDays: 365 },
  'tea': { category: 'Beverage', storage: 'PANTRY', shelfLifeDays: 730 },
  'almonds': { category: 'Nut', storage: 'PANTRY', shelfLifeDays: 180 },
  'cashews': { category: 'Nut', storage: 'PANTRY', shelfLifeDays: 180 },
  'walnuts': { category: 'Nut', storage: 'PANTRY', shelfLifeDays: 180 },
  'raisins': { category: 'Dry Fruit', storage: 'PANTRY', shelfLifeDays: 365 },
  'dates': { category: 'Dry Fruit', storage: 'PANTRY', shelfLifeDays: 180 },
  'frozen peas': { category: 'Frozen', storage: 'FREEZER', shelfLifeDays: 180 },
  'frozen corn': { category: 'Frozen', storage: 'FREEZER', shelfLifeDays: 180 },
  'frozen berries': { category: 'Frozen', storage: 'FREEZER', shelfLifeDays: 180 },
  'ice cream': { category: 'Frozen', storage: 'FREEZER', shelfLifeDays: 90 },
  'coconut milk': { category: 'Canned', storage: 'PANTRY', shelfLifeDays: 365 },
  'canned tomato': { category: 'Canned', storage: 'PANTRY', shelfLifeDays: 365 },
  'canned beans': { category: 'Canned', storage: 'PANTRY', shelfLifeDays: 365 },
  'soup stock': { category: 'Canned', storage: 'PANTRY', shelfLifeDays: 365 },
  'baking powder': { category: 'Baking', storage: 'PANTRY', shelfLifeDays: 365 },
  'baking soda': { category: 'Baking', storage: 'PANTRY', shelfLifeDays: 730 },
  'vanilla extract': { category: 'Baking', storage: 'PANTRY', shelfLifeDays: 730 },
  'cocoa powder': { category: 'Baking', storage: 'PANTRY', shelfLifeDays: 730 },
  'chocolate chips': { category: 'Baking', storage: 'PANTRY', shelfLifeDays: 365 },
};

const DEFAULT_META: PantryProductMeta = {
  category: 'Pantry',
  storage: 'PANTRY',
  shelfLifeDays: 14,
};

export function getPantryProductMeta(name: string): PantryProductMeta {
  const key = name.trim().toLowerCase();
  if (!key) return DEFAULT_META;

  if (PANTRY_PRODUCT_DATASET[key]) {
    return PANTRY_PRODUCT_DATASET[key];
  }

  const match = Object.keys(PANTRY_PRODUCT_DATASET).find((known) => key.includes(known) || known.includes(key));
  if (match) return PANTRY_PRODUCT_DATASET[match];

  return DEFAULT_META;
}

export function getExpiryDateFromShelfLife(name: string, baseDate?: Date): string {
  const now = baseDate || new Date();
  const meta = getPantryProductMeta(name);
  return new Date(now.getTime() + meta.shelfLifeDays * 24 * 60 * 60 * 1000).toISOString();
}
