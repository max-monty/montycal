import { create } from 'zustand';
import type { ViewMode, ZoomTier } from '../types';

// Zoom tiers based on zoomValue (0-1 slider position)
// Since scale is dynamic (fit-to-width based), we use zoomValue directly
function deriveZoomTier(zoomValue: number): ZoomTier {
  if (zoomValue < 0.2) return 'low';
  if (zoomValue <= 0.5) return 'medium';
  return 'high';
}

interface ViewState {
  viewMode: ViewMode;
  zoomValue: number; // 0-1 continuous
  zoomTier: ZoomTier;
  focusYear: number;
  selectedDate: string | null;

  setViewMode: (mode: ViewMode) => void;
  setZoomValue: (value: number) => void;
  setFocusYear: (year: number) => void;
  setSelectedDate: (date: string | null) => void;
  nextYear: () => void;
  prevYear: () => void;
}

export const useViewStore = create<ViewState>((set) => ({
  viewMode: 'year',
  zoomValue: 0,
  zoomTier: 'low',
  focusYear: new Date().getFullYear(),
  selectedDate: null,

  setViewMode: (mode) => set({ viewMode: mode }),
  setZoomValue: (value) => {
    const clamped = Math.max(0, Math.min(1, value));
    set({ zoomValue: clamped, zoomTier: deriveZoomTier(clamped) });
  },
  setFocusYear: (year) => set({ focusYear: year }),
  setSelectedDate: (date) => set({ selectedDate: date }),
  nextYear: () => set((s) => ({ focusYear: s.focusYear + 1 })),
  prevYear: () => set((s) => ({ focusYear: s.focusYear - 1 })),
}));
