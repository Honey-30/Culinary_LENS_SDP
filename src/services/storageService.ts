/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { 
  collection, 
  doc, 
  setDoc, 
  getDoc, 
  getDocs, 
  query, 
  where, 
  deleteDoc,
  onSnapshot,
  getDocFromServer
} from 'firebase/firestore';
import { 
  signInWithPopup, 
  GoogleAuthProvider, 
  signOut, 
  onAuthStateChanged,
  User
} from 'firebase/auth';
import { db, auth } from '../firebase';
import { Recipe, UserProfile } from '../types';

export enum OperationType {
  CREATE = 'create',
  UPDATE = 'update',
  DELETE = 'delete',
  LIST = 'list',
  GET = 'get',
  WRITE = 'write',
}

export interface FirestoreErrorInfo {
  error: string;
  operationType: OperationType;
  path: string | null;
  authInfo: {
    userId: string | undefined;
    email: string | null | undefined;
    emailVerified: boolean | undefined;
    isAnonymous: boolean | undefined;
    tenantId: string | null | undefined;
    providerInfo: {
      providerId: string;
      displayName: string | null;
      email: string | null;
      photoUrl: string | null;
    }[];
  }
}

function handleFirestoreError(error: unknown, operationType: OperationType, path: string | null) {
  const errInfo: FirestoreErrorInfo = {
    error: error instanceof Error ? error.message : String(error),
    authInfo: {
      userId: auth.currentUser?.uid,
      email: auth.currentUser?.email,
      emailVerified: auth.currentUser?.emailVerified,
      isAnonymous: auth.currentUser?.isAnonymous,
      tenantId: auth.currentUser?.tenantId,
      providerInfo: auth.currentUser?.providerData.map(provider => ({
        providerId: provider.providerId,
        displayName: provider.displayName,
        email: provider.email,
        photoUrl: provider.photoURL
      })) || []
    },
    operationType,
    path
  }
  console.error('Firestore Error: ', JSON.stringify(errInfo));
  throw new Error(JSON.stringify(errInfo));
}

export class StorageService {
  static async signInWithGoogle(): Promise<User | null> {
    const provider = new GoogleAuthProvider();
    try {
      const result = await signInWithPopup(auth, provider);
      return result.user;
    } catch (error: any) {
      if (error.code === 'auth/user-cancelled') {
        console.log('Sign-in cancelled by user.');
        return null;
      } else if (error.code === 'auth/popup-blocked') {
        console.error('Sign-in error: Popup blocked. Please allow popups for this site.');
        throw error;
      } else {
        console.error('Sign-in error:', error);
        throw error;
      }
    }
  }

  static async logout(): Promise<void> {
    await signOut(auth);
  }

  static onAuthChange(callback: (user: User | null) => void) {
    return onAuthStateChanged(auth, callback);
  }

  static async saveRecipe(userId: string, recipe: Recipe): Promise<void> {
    const path = `users/${userId}/savedRecipes`;
    try {
      await setDoc(doc(db, path, recipe.id), recipe);
    } catch (error) {
      handleFirestoreError(error, OperationType.WRITE, path);
    }
  }

  static async deleteRecipe(userId: string, recipeId: string): Promise<void> {
    const path = `users/${userId}/savedRecipes`;
    try {
      await deleteDoc(doc(db, path, recipeId));
    } catch (error) {
      handleFirestoreError(error, OperationType.DELETE, path);
    }
  }

  static onSavedRecipesChange(userId: string, callback: (recipes: Recipe[]) => void) {
    const path = `users/${userId}/savedRecipes`;
    return onSnapshot(collection(db, path), (snapshot) => {
      const recipes = snapshot.docs.map(doc => doc.data() as Recipe);
      callback(recipes);
    }, (error) => {
      handleFirestoreError(error, OperationType.GET, path);
    });
  }

  static async testConnection() {
    try {
      await getDocFromServer(doc(db, 'test', 'connection'));
    } catch (error) {
      if(error instanceof Error && error.message.includes('the client is offline')) {
        console.error("Please check your Firebase configuration. ");
      }
    }
  }
}
