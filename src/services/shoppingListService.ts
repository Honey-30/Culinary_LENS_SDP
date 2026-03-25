/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { db as firestore } from '../firebase';
import { collection, getDocs, query, where, updateDoc, doc, deleteDoc, writeBatch } from 'firebase/firestore';
import { ShoppingListItem } from '../types';

const LOCAL_SHOPPING_LIST_KEY = 'CULINARY_LENS_LOCAL_SHOPPING_LIST';

const getShoppingListCollection = (userId: string) => {
    return collection(firestore, `users/${userId}/shoppingList`);
};

export const ShoppingListService = {
    async getShoppingList(userId: string): Promise<ShoppingListItem[]> {
        if (!userId) {
            return getLocalShoppingList();
        }

        const q = query(getShoppingListCollection(userId));
        const querySnapshot = await getDocs(q);
        return querySnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as ShoppingListItem));
    },

    async addIngredientsToShoppingList(userId: string, items: Omit<ShoppingListItem, 'id' | 'isChecked'>[]): Promise<void> {
        if (!userId) {
            const current = getLocalShoppingList();
            const toAdd: ShoppingListItem[] = items.map((item) => ({
                ...item,
                id: `local-shopping-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
                isChecked: false,
            }));
            setLocalShoppingList([...toAdd, ...current]);
            return;
        }

        const batch = writeBatch(firestore);
        const shoppingListCollection = getShoppingListCollection(userId);

        items.forEach(item => {
            const docRef = doc(shoppingListCollection);
            batch.set(docRef, { ...item, isChecked: false });
        });

        await batch.commit();
    },

    async updateShoppingListItem(userId: string, itemId: string, updates: Partial<ShoppingListItem>): Promise<void> {
        if (!userId) {
            const updated = getLocalShoppingList().map((item) => item.id === itemId ? { ...item, ...updates } : item);
            setLocalShoppingList(updated);
            return;
        }

        const itemRef = doc(firestore, `users/${userId}/shoppingList`, itemId);
        await updateDoc(itemRef, updates);
    },

    async removeShoppingListItem(userId: string, itemId: string): Promise<void> {
        if (!userId) {
            const updated = getLocalShoppingList().filter((item) => item.id !== itemId);
            setLocalShoppingList(updated);
            return;
        }

        const itemRef = doc(firestore, `users/${userId}/shoppingList`, itemId);
        await deleteDoc(itemRef);
    },

    async clearCheckedItems(userId: string): Promise<void> {
        if (!userId) {
            const updated = getLocalShoppingList().filter((item) => !item.isChecked);
            setLocalShoppingList(updated);
            return;
        }

        const q = query(getShoppingListCollection(userId), where("isChecked", "==", true));
        const querySnapshot = await getDocs(q);
        
        const batch = writeBatch(firestore);
        querySnapshot.forEach(doc => {
            batch.delete(doc.ref);
        });

        await batch.commit();
    }
};

function getLocalShoppingList(): ShoppingListItem[] {
    const raw = localStorage.getItem(LOCAL_SHOPPING_LIST_KEY);
    if (!raw) return [];

    try {
        const parsed = JSON.parse(raw);
        return Array.isArray(parsed) ? (parsed as ShoppingListItem[]) : [];
    } catch {
        return [];
    }
}

function setLocalShoppingList(items: ShoppingListItem[]) {
    localStorage.setItem(LOCAL_SHOPPING_LIST_KEY, JSON.stringify(items));
}
