import { useState, useCallback, useEffect, useMemo } from 'react';
import { createPortal } from 'react-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { format, parseISO } from 'date-fns';
import { useViewStore } from '../../stores/view-store';
import { useUIStore } from '../../stores/ui-store';
import { useCalendarStore } from '../../stores/calendar-store';
import { useCategoryStore } from '../../stores/category-store';
import { ColorPicker } from '../ui/ColorPicker';
import { EventForm } from './EventForm';
import { EventList } from './EventList';
import type { CalendarEvent } from '../../types';

export function DayModal() {
  const modalOpen = useUIStore((s) => s.modalOpen);
  const closeModal = useUIStore((s) => s.closeModal);
  const editingEventId = useUIStore((s) => s.editingEventId);
  const setEditingEventId = useUIStore((s) => s.setEditingEventId);
  const selectedDate = useViewStore((s) => s.selectedDate);
  const dayData = useCalendarStore((s) => (selectedDate ? s.dayData[selectedDate] : undefined));
  const allEvents = useCalendarStore((s) => s.events);
  const setDayBackground = useCalendarStore((s) => s.setDayBackground);
  const setDayNotes = useCalendarStore((s) => s.setDayNotes);
  const setDayCategory = useCalendarStore((s) => s.setDayCategory);
  const categories = useCategoryStore((s) => s.categories);

  const events = useMemo(() => {
    if (!dayData || dayData.eventIds.length === 0) return [];
    return dayData.eventIds.map((id) => allEvents[id]).filter(Boolean);
  }, [dayData, allEvents]);

  const [showEventForm, setShowEventForm] = useState(false);
  const [editingEvent, setEditingEvent] = useState<CalendarEvent | undefined>();
  const [notes, setNotes] = useState('');

  // If opened from clicking an event on the grid, auto-open edit form
  useEffect(() => {
    if (editingEventId && allEvents[editingEventId]) {
      setEditingEvent(allEvents[editingEventId]);
      setShowEventForm(true);
      setEditingEventId(null);
    }
  }, [editingEventId, allEvents, setEditingEventId]);

  useEffect(() => {
    setNotes(dayData?.notes || '');
    if (!editingEventId) {
      setShowEventForm(false);
      setEditingEvent(undefined);
    }
  }, [selectedDate, dayData?.notes, editingEventId]);

  const handleNotesBlur = useCallback(() => {
    if (selectedDate) {
      setDayNotes(selectedDate, notes);
    }
  }, [selectedDate, notes, setDayNotes]);

  const handleEdit = useCallback((event: CalendarEvent) => {
    setEditingEvent(event);
    setShowEventForm(true);
  }, []);

  const handleFormDone = useCallback(() => {
    setShowEventForm(false);
    setEditingEvent(undefined);
  }, []);

  if (!selectedDate) return null;

  const dateObj = parseISO(selectedDate);
  const formattedDate = format(dateObj, 'EEEE, MMMM d, yyyy');

  return createPortal(
    <AnimatePresence>
      {modalOpen && (
        <>
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/60 z-40"
            onClick={closeModal}
          />

          {/* Modal */}
          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 20 }}
            transition={{ type: 'spring', damping: 25, stiffness: 300 }}
            className="fixed z-50 inset-4 sm:inset-auto sm:top-1/2 sm:left-1/2 sm:-translate-x-1/2 sm:-translate-y-1/2 sm:w-full sm:max-w-lg sm:max-h-[85vh] bg-cal-surface rounded-2xl shadow-2xl border border-cal-border overflow-hidden flex flex-col"
          >
            {/* Header */}
            <div className="flex items-center justify-between px-5 py-4 border-b border-cal-border">
              <div>
                <h2 className="text-lg font-semibold">{formattedDate}</h2>
              </div>
              <button
                onClick={closeModal}
                className="w-8 h-8 flex items-center justify-center rounded-lg hover:bg-cal-surface-hover text-cal-text-muted hover:text-cal-text transition-colors"
              >
                ✕
              </button>
            </div>

            {/* Content */}
            <div className="flex-1 overflow-y-auto px-5 py-4 space-y-4">
              {/* Day color */}
              <div>
                <label className="text-xs font-medium text-cal-text-muted block mb-1.5">Day Color</label>
                <ColorPicker
                  value={dayData?.backgroundColor}
                  onChange={(c) => setDayBackground(selectedDate, c)}
                />
              </div>

              {/* Day category */}
              <div>
                <label className="text-xs font-medium text-cal-text-muted block mb-1.5">Day Category</label>
                <div className="flex flex-wrap gap-1.5">
                  <button
                    onClick={() => setDayCategory(selectedDate, undefined)}
                    className={`px-2 py-0.5 rounded-full text-xs border transition-colors ${
                      !dayData?.categoryId
                        ? 'border-cal-accent text-cal-accent'
                        : 'border-cal-border text-cal-text-muted'
                    }`}
                  >
                    None
                  </button>
                  {categories.map((cat) => (
                    <button
                      key={cat.id}
                      onClick={() => setDayCategory(selectedDate, cat.id)}
                      className={`px-2 py-0.5 rounded-full text-xs border transition-colors ${
                        dayData?.categoryId === cat.id ? 'border-current' : 'border-transparent'
                      }`}
                      style={{ color: cat.color, backgroundColor: cat.color + '20' }}
                    >
                      {cat.name}
                    </button>
                  ))}
                </div>
              </div>

              {/* Notes */}
              <div>
                <label className="text-xs font-medium text-cal-text-muted block mb-1.5">Notes</label>
                <textarea
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  onBlur={handleNotesBlur}
                  placeholder="Day notes..."
                  rows={2}
                  className="w-full bg-cal-bg border border-cal-border rounded-lg px-3 py-2 text-sm text-cal-text placeholder:text-cal-text-dim focus:outline-none focus:border-cal-accent resize-none"
                />
              </div>

              {/* Events */}
              <div>
                <div className="flex items-center justify-between mb-2">
                  <label className="text-xs font-medium text-cal-text-muted">Events</label>
                  {!showEventForm && (
                    <button
                      onClick={() => { setEditingEvent(undefined); setShowEventForm(true); }}
                      className="text-xs text-cal-accent hover:text-cal-accent/80 font-medium"
                    >
                      + Add Event
                    </button>
                  )}
                </div>

                {showEventForm ? (
                  <EventForm
                    dateKey={selectedDate}
                    editingEvent={editingEvent}
                    onDone={handleFormDone}
                  />
                ) : (
                  <EventList events={events} onEdit={handleEdit} />
                )}
              </div>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>,
    document.body
  );
}
