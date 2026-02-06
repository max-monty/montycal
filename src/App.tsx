import { useEffect, useState } from 'react';
import { useCalendarStore } from './stores/calendar-store';
import { useCategoryStore } from './stores/category-store';
import { useUIStore } from './stores/ui-store';
import { useKeyboardNav } from './hooks/useKeyboardNav';
import { initRepository } from './data/repository';
import { Header } from './components/layout/Header';
import { Sidebar } from './components/sidebar/Sidebar';
import { CalendarGrid } from './components/grid/CalendarGrid';
import { DayModal } from './components/modal/DayModal';

function App() {
  const loadCalendarData = useCalendarStore((s) => s.loadData);
  const calendarLoaded = useCalendarStore((s) => s.loaded);
  const loadCategories = useCategoryStore((s) => s.loadCategories);
  const categoriesLoaded = useCategoryStore((s) => s.loaded);
  const theme = useUIStore((s) => s.theme);
  const [repoReady, setRepoReady] = useState(false);

  useKeyboardNav();

  // Apply theme class to <html>
  useEffect(() => {
    const root = document.documentElement;
    root.classList.remove('light', 'dark');
    root.classList.add(theme);
  }, [theme]);

  // Initialize the data repository (localStorage or Firebase) then load data
  useEffect(() => {
    initRepository().then(() => {
      setRepoReady(true);
      loadCalendarData();
      loadCategories();
    });
  }, [loadCalendarData, loadCategories]);

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
