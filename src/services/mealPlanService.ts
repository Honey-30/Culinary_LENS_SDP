/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { 
  collection, 
  doc, 
  setDoc, 
  deleteDoc,
  getDocs,
  onSnapshot,
  query,
  where,
  orderBy
} from 'firebase/firestore';
import { db } from '../firebase';
import { Recipe } from '../types';

const LOCAL_MEAL_PLAN_KEY = 'CULINARY_LENS_LOCAL_MEAL_PLAN';

export interface MealPlanEntry {
  id?: string;
  recipeId: string;
  recipeTitle: string;
  date: string; // ISO date string
  type: 'BREAKFAST' | 'LUNCH' | 'DINNER' | 'SNACK';
  recipeImageUrl?: string;
}

export class MealPlanService {
  static async addEntry(userId: string, entry: MealPlanEntry): Promise<void> {
    if (!userId) {
      const current = this.getLocalEntries();
      const id = entry.id || `meal-${Date.now()}`;
      const next = [{ ...entry, id }, ...current];
      localStorage.setItem(LOCAL_MEAL_PLAN_KEY, JSON.stringify(next));
      return;
    }

    const id = entry.id || `meal-${Date.now()}`;
    const path = `users/${userId}/mealPlan`;
    await setDoc(doc(db, path, id), { ...entry, id });
  }

  static async removeEntry(userId: string, entryId: string): Promise<void> {
    if (!userId) {
      const next = this.getLocalEntries().filter((entry) => entry.id !== entryId);
      localStorage.setItem(LOCAL_MEAL_PLAN_KEY, JSON.stringify(next));
      return;
    }

    const path = `users/${userId}/mealPlan`;
    await deleteDoc(doc(db, path, entryId));
  }

  static async getEntries(userId: string): Promise<MealPlanEntry[]> {
    if (!userId) {
      return this.getLocalEntries();
    }

    const path = `users/${userId}/mealPlan`;
    const q = query(collection(db, path), orderBy('date', 'desc'));
    const snapshot = await getDocs(q);
    return snapshot.docs.map(doc => doc.data() as MealPlanEntry);
  }

  static onMealPlanChange(userId: string, callback: (entries: MealPlanEntry[]) => void) {
    const path = `users/${userId}/mealPlan`;
    const q = query(collection(db, path), orderBy('date', 'desc'));
    return onSnapshot(q, (snapshot) => {
      const entries = snapshot.docs.map(doc => doc.data() as MealPlanEntry);
      callback(entries);
    });
  }

  private static getLocalEntries(): MealPlanEntry[] {
    const raw = localStorage.getItem(LOCAL_MEAL_PLAN_KEY);
    if (!raw) return [];

    try {
      const parsed = JSON.parse(raw);
      return Array.isArray(parsed) ? (parsed as MealPlanEntry[]) : [];
    } catch {
      return [];
    }
  }
}
