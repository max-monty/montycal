import { useEffect, useState } from 'react';
import { useCalendarStore } from './stores/calendar-store';
import { useCategoryStore } from './stores/category-store';
import { useAuthStore } from './stores/auth-store';
import { useUIStore } from './stores/ui-store';
import { useKeyboardNav } from './hooks/useKeyboardNav';
import { initRepository, switchRepository } from './data/repository';
import { getAuthReady } from './data/firebase-config';
import { Header } from './components/layout/Header';
import { Sidebar } from './components/sidebar/Sidebar';
import { CalendarGrid } from './components/grid/CalendarGrid';
import { DayModal } from './components/modal/DayModal';
import type { AuthUser } from './types';

function App() {
  const loadCalendarData = useCalendarStore((s) => s.loadData);
  const calendarLoaded = useCalendarStore((s) => s.loaded);
  const loadCategories = useCategoryStore((s) => s.loadCategories);
  const categoriesLoaded = useCategoryStore((s) => s.loaded);
  const { setUser, setLoading, loadSharedCalendars } = useAuthStore();
  const theme = useUIStore((s) => s.theme);
  const [repoReady, setRepoReady] = useState(false);

  useKeyboardNav();

  // Apply theme class to <html>
  useEffect(() => {
    const root = document.documentElement;
    root.classList.remove('light', 'dark');
    root.classList.add(theme);
  }, [theme]);

  // Initialize: check auth state, then set up the right repository
  useEffect(() => {
    async function init() {
      // Check if user is already signed in with Google
      const firebaseUser = await getAuthReady();

      if (firebaseUser && !firebaseUser.isAnonymous) {
        // User is signed in with Google
        const user: AuthUser = {
          uid: firebaseUser.uid,
          email: firebaseUser.email || '',
          displayName: firebaseUser.displayName || '',
          photoURL: firebaseUser.photoURL || '',
        };
        setUser(user);
        await switchRepository('firebase', user.uid);
        setLoading(false);
        setRepoReady(true);
        loadCalendarData();
        loadCategories();
        loadSharedCalendars();
      } else {
        // Not signed in — use localStorage (demo mode)
        setUser(null);
        setLoading(false);
        await initRepository('localStorage');
        setRepoReady(true);
        loadCalendarData();
        loadCategories();
      }
    }
    init();
  }, [loadCalendarData, loadCategories, setUser, setLoading, loadSharedCalendars]);

  if (!repoReady || !calendarLoaded || !categoriesLoaded) {
    return (
      <div className="h-full flex items-center justify-center">
        <div className="text-cal-text-muted text-sm">Loading...</div>
      </div>
    );
  }

  return (
    <div className="h-full flex flex-col">
      <Header />
      <CalendarGrid />
      <Sidebar />
      <DayModal />
    </div>
  );
}

export default App;
