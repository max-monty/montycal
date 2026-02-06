import { initializeApp } from 'firebase/app';
import { getFirestore } from 'firebase/firestore';
import {
  initializeAuth,
  browserLocalPersistence,
  indexedDBLocalPersistence,
  onAuthStateChanged,
  signInWithPopup,
  signOut,
  GoogleAuthProvider,
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  browserPopupRedirectResolver,
  type User,
} from 'firebase/auth';

const firebaseConfig = {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY,
  authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN,
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID,
  storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID,
  appId: import.meta.env.VITE_FIREBASE_APP_ID,
};

const app = initializeApp(firebaseConfig);
export const db = getFirestore(app);

// Explicitly set persistence so the user survives tab closes
export const auth = initializeAuth(app, {
  persistence: [indexedDBLocalPersistence, browserLocalPersistence],
});

const googleProvider = new GoogleAuthProvider();

/** Sign in with Google popup */
export async function googleSignIn(): Promise<User> {
  const result = await signInWithPopup(auth, googleProvider, browserPopupRedirectResolver);
  return result.user;
}

/** Sign up with email + password */
export async function emailSignUp(email: string, password: string): Promise<User> {
  const result = await createUserWithEmailAndPassword(auth, email, password);
  return result.user;
}

/** Sign in with email + password */
export async function emailSignIn(email: string, password: string): Promise<User> {
  const result = await signInWithEmailAndPassword(auth, email, password);
  return result.user;
}

/** Sign out */
export async function firebaseSignOut(): Promise<void> {
  await signOut(auth);
}

/**
 * Wait for Firebase auth to resolve the initial state.
 * Returns the current user or null (does NOT auto-create anonymous users).
 */
let authReady: Promise<User | null>;

export function getAuthReady(): Promise<User | null> {
  if (!authReady) {
    authReady = new Promise((resolve) => {
      const unsub = onAuthStateChanged(auth, (user) => {
        unsub();
        resolve(user);
      });
    });
  }
  return authReady;
}

/** Reset the authReady promise (used after sign-in/sign-out to re-evaluate) */
export function resetAuthReady(): void {
  authReady = undefined as unknown as Promise<User | null>;
}
