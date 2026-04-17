/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

export interface Ingredient {
  id: string;
  name: string;
  category: string;
  confidence: number;
  aromaticProfile?: string;
  nutritionalEstimate?: {
    calories: number;
    protein: number;
    carbs: number;
    fat: number;
  };
  boundingBox?: [number, number, number, number]; // [ymin, xmin, ymax, xmax]
  x?: number; // 0-100 normalized coordinate
  y?: number; // 0-100 normalized coordinate
  expiryDate?: string; // ISO date string
  isAllergen?: boolean;
  pantryDetails?: {
    storage: 'PANTRY' | 'FRIDGE' | 'FREEZER';
    shelfLifeDays: number;
    source: 'SCAN' | 'MANUAL';
  };
}

export interface RecipeStep {
  id: string;
  instruction: string;
  duration?: number; // in seconds
  tip?: string;
}

export interface Recipe {
  id: string;
  title: string;
  description: string;
  cuisine: string;
  ingredients: string[]; // List of ingredient names
  steps: RecipeStep[];
  prepTime: number;
  cookTime: number;
  servings: number;
  difficulty: 'EASY' | 'MEDIUM' | 'HARD';
  macros: {
    calories: number;
    protein: number;
    carbs: number;
    fat: number;
  };
  imageUrl?: string;
  isAI?: boolean;
  source?: 'STATIC' | 'AI';
}

export type NutritionalGoal = 'ALL' | 'LOW CALORIE' | 'HIGH PROTEIN' | 'LOW CARB' | 'BALANCED';

export interface UserProfile {
  uid: string;
  displayName: string;
  email: string;
  photoURL?: string;
  preferences?: {
    cuisine?: string[];
    dietaryRestrictions?: string[];
    allergies?: string[];
    skillLevel?: 'BEGINNER' | 'INTERMEDIATE' | 'ADVANCED';
  };
  savedRecipes?: string[];
}

export interface ShoppingListItem {
  id: string;
  name: string;
  quantity: number;
  unit: string;
  isChecked: boolean;
  recipeId?: string;
}

export interface ScanResult {
  id: string;
  createdAt: string;
  imageDataUrl: string | null;
  ingredients: Ingredient[];
  ingredientCount: number;
  averageConfidence: number;
}

export interface Substitution {
  substitute: string;
  confidence: number;
  notes: string;
  pantryMatch: boolean;
}

export type WorkflowState = 
  | 'LANDING'
  | 'API_CONFIG'
  | 'CAMERA_SCAN'
  | 'PROCESSING'
  | 'PERCEPTION_MAP'
  | 'INGREDIENT_LIST'
  | 'RECIPE_SELECTOR'
  | 'RECIPE_DETAIL'
  | 'COOKING_MODE'
  | 'POST_COMPLETION'
  | 'SAVED_RECIPES'
  | 'OFFLINE_MANUAL'
  | 'SCAN_HISTORY'
  | 'PANTRY_TRACKER'
  | 'MEAL_PLANNER'
  | 'PROFILE_SETTINGS'
  | 'SHOPPING_LIST';
