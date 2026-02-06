import { useEffect, useCallback } from 'react';
import { format, addDays, subDays, addMonths, subMonths, parseISO } from 'date-fns';
import { useViewStore } from '../stores/view-store';
import { useUIStore } from '../stores/ui-store';

export function useKeyboardNav() {
  const { selectedDate, setSelectedDate, focusYear } = useViewStore();
  const { openModal, closeModal, modalOpen } = useUIStore();

  const handleKeyDown = useCallback(
    (e: KeyboardEvent) => {
      // Escape closes modal
      if (e.key === 'Escape') {
        if (modalOpen) {
          closeModal();
          return;
        }
      }

      // Don't handle nav keys if in an input
      if (
        e.target instanceof HTMLInputElement ||
        e.target instanceof HTMLTextAreaElement ||
        e.target instanceof HTMLSelectElement
      ) {
        return;
      }

      if (modalOpen) return;

      const current = selectedDate ? parseISO(selectedDate) : new Date(focusYear, 0, 1);

      switch (e.key) {
        case 'ArrowRight':
          e.preventDefault();
          setSelectedDate(format(addDays(current, 1), 'yyyy-MM-dd'));
          break;
        case 'ArrowLeft':
          e.preventDefault();
          setSelectedDate(format(subDays(current, 1), 'yyyy-MM-dd'));
          break;
        case 'ArrowDown':
          e.preventDefault();
          setSelectedDate(format(addMonths(current, 1), 'yyyy-MM-dd'));
          break;
        case 'ArrowUp':
          e.preventDefault();
          setSelectedDate(format(subMonths(current, 1), 'yyyy-MM-dd'));
          break;
        case 'Enter':
          e.preventDefault();
          if (selectedDate) {
            openModal();
          }
          break;
        case 't':
        case 'T':
          e.preventDefault();
          setSelectedDate(format(new Date(), 'yyyy-MM-dd'));
          break;
      }
    },
    [selectedDate, setSelectedDate, focusYear, openModal, closeModal, modalOpen]
  );

  useEffect(() => {
    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [handleKeyDown]);
}
