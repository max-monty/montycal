import { create } from 'zustand';
import { googleSignIn, emailSignIn, emailSignUp, firebaseSignOut } from '../data/firebase-config';
import type { User as FirebaseUser } from 'firebase/auth';
import { switchRepository } from '../data/repository';
import { useCalendarStore } from './calendar-store';
import { useCategoryStore } from './category-store';
import type { AuthUser, SharedCalendar } from '../types';

interface AuthState {
  user: AuthUser | null;
  loading: boolean;
  activeCalendarUid: string | null; // null = own calendar, or another user's UID
  activeCalendarName: string | null;
  sharedCalendars: SharedCalendar[];

  setUser: (user: AuthUser | null) => void;
  setLoading: (loading: boolean) => void;
  signInWithGoogle: () => Promise<void>;
  signInWithEmail: (email: string, password: string) => Promise<void>;
  signUpWithEmail: (email: string, password: string) => Promise<void>;
  signOut: () => Promise<void>;
  setActiveCalendar: (uid: string | null, name?: string | null) => void;
  loadSharedCalendars: () => Promise<void>;
}

async function reloadData() {
  await Promise.all([
    useCalendarStore.getState().loadData(),
    useCategoryStore.getState().loadCategories(),
  ]);
}

async function handlePostSignIn(
  firebaseUser: FirebaseUser,
  set: (partial: Partial<AuthState>) => void,
  get: () => AuthState,
) {
  const user: AuthUser = {
    uid: firebaseUser.uid,
    email: firebaseUser.email || '',
    displayName: firebaseUser.displayName || firebaseUser.email || '',
    photoURL: firebaseUser.photoURL || '',
  };
  set({ user, activeCalendarUid: null, activeCalendarName: null });

  await switchRepository('firebase', user.uid);

  const { FirebaseRepository } = await import('../data/firebase-repository');
  const repo = new FirebaseRepository();
  repo.setActiveUid(user.uid);
  await repo.saveProfile(user.email, user.displayName);

  await reloadData();
  await get().loadSharedCalendars();
}

export const useAuthStore = create<AuthState>((set, get) => ({
  user: null,
  loading: true,
  activeCalendarUid: null,
  activeCalendarName: null,
  sharedCalendars: [],

  setUser: (user) => set({ user }),
  setLoading: (loading) => set({ loading }),

  signInWithGoogle: async () => {
    const firebaseUser = await googleSignIn();
    await handlePostSignIn(firebaseUser, set, get);
  },

  signInWithEmail: async (email: string, password: string) => {
    const firebaseUser = await emailSignIn(email, password);
    await handlePostSignIn(firebaseUser, set, get);
  },

  signUpWithEmail: async (email: string, password: string) => {
    const firebaseUser = await emailSignUp(email, password);
    await handlePostSignIn(firebaseUser, set, get);
  },

  signOut: async () => {
    await firebaseSignOut();
    set({ user: null, activeCalendarUid: null, activeCalendarName: null, sharedCalendars: [] });

    // Switch back to localStorage (demo mode)
    await switchRepository('localStorage');
    await reloadData();
  },

  setActiveCalendar: async (uid, name) => {
    const { user } = get();
    set({ activeCalendarUid: uid, activeCalendarName: name || null });

    if (uid && user) {
      // Switch to viewing another user's data
      await switchRepository('firebase', uid);
    } else if (user) {
      // Back to own calendar
      await switchRepository('firebase', user.uid);
    }
    await reloadData();
  },

  loadSharedCalendars: async () => {
    try {
      const { FirebaseRepository } = await import('../data/firebase-repository');
      const repo = new FirebaseRepository();
      const shares = await repo.getSharedWithMe();
      const calendars: SharedCalendar[] = shares.map((s) => ({
        ownerUid: s.ownerUid,
        ownerEmail: s.ownerEmail,
        ownerName: s.ownerName,
        shareId: s.id,
      }));
      set({ sharedCalendars: calendars });
    } catch {
      // Not signed in or no shares
      set({ sharedCalendars: [] });
    }
  },
}));
