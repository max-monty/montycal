import { create } from 'zustand';

export type Theme = 'light' | 'dark';

function getInitialTheme(): Theme {
  const stored = localStorage.getItem('monty-cal-theme') as Theme | null;
  if (stored === 'light' || stored === 'dark') return stored;
  return 'dark';
}

interface UIState {
  sidebarOpen: boolean;
  modalOpen: boolean;
  editingEventId: string | null;
  theme: Theme;

  toggleSidebar: () => void;
  setSidebarOpen: (open: boolean) => void;
  openModal: () => void;
  closeModal: () => void;
  setEditingEventId: (id: string | null) => void;
  toggleTheme: () => void;
}

export const useUIStore = create<UIState>((set) => ({
  sidebarOpen: false,
  modalOpen: false,
  editingEventId: null,
  theme: getInitialTheme(),

  toggleSidebar: () => set((s) => ({ sidebarOpen: !s.sidebarOpen })),
  setSidebarOpen: (open) => set({ sidebarOpen: open }),
  openModal: () => set({ modalOpen: true }),
  closeModal: () => set({ modalOpen: false, editingEventId: null }),
  setEditingEventId: (id) => set({ editingEventId: id }),
  toggleTheme: () =>
    set((s) => {
      const next = s.theme === 'dark' ? 'light' : 'dark';
      localStorage.setItem('monty-cal-theme', next);
      return { theme: next };
    }),
}));
