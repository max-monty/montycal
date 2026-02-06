import { initializeApp } from 'firebase/app';
import { getFirestore } from 'firebase/firestore';
import {
  initializeAuth,
  browserLocalPersistence,
  indexedDBLocalPersistence,
  signInAnonymously,
  onAuthStateChanged,
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

// Explicitly set persistence so the anonymous user survives tab closes
export const auth = initializeAuth(app, {
  persistence: [indexedDBLocalPersistence, browserLocalPersistence],
});

let authReady: Promise<string>;

export function getAuthReady(): Promise<string> {
  if (!authReady) {
    authReady = new Promise((resolve, reject) => {
      // onAuthStateChanged waits for persistence to load before first callback
      const unsub = onAuthStateChanged(auth, (user) => {
        unsub();
        if (user) {
          resolve(user.uid);
        } else {
          signInAnonymously(auth)
            .then((cred) => resolve(cred.user.uid))
            .catch(reject);
        }
      });
    });
  }
  return authReady;
}
