import { useState, useEffect } from 'react';
import type { CalendarEvent } from '../../types';
import { useCalendarStore } from '../../stores/calendar-store';
import { useCategoryStore } from '../../stores/category-store';
import { ColorPicker } from '../ui/ColorPicker';

interface EventFormProps {
  dateKey: string;
  editingEvent?: CalendarEvent;
  onDone: () => void;
}

export function EventForm({ dateKey, editingEvent, onDone }: EventFormProps) {
  const [title, setTitle] = useState(editingEvent?.title || '');
  const [description, setDescription] = useState(editingEvent?.description || '');
  const [startTime, setStartTime] = useState(editingEvent?.startTime || editingEvent?.time || '');
  const [endTime, setEndTime] = useState(editingEvent?.endTime || '');
  const [categoryId, setCategoryId] = useState(editingEvent?.categoryId || '');
  const [color, setColor] = useState(editingEvent?.color);
  const [endDate, setEndDate] = useState(editingEvent?.endDate || '');

  const addEvent = useCalendarStore((s) => s.addEvent);
  const updateEvent = useCalendarStore((s) => s.updateEvent);
  const categories = useCategoryStore((s) => s.categories);

  useEffect(() => {
    if (editingEvent) {
      setTitle(editingEvent.title);
      setDescription(editingEvent.description || '');
      setStartTime(editingEvent.startTime || editingEvent.time || '');
      setEndTime(editingEvent.endTime || '');
      setCategoryId(editingEvent.categoryId || '');
      setColor(editingEvent.color);
      setEndDate(editingEvent.endDate || '');
    }
  }, [editingEvent]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim()) return;

    const eventData = {
      title: title.trim(),
      description: description.trim() || undefined,
      startTime: startTime || undefined,
      endTime: endTime || undefined,
      time: startTime || undefined, // keep legacy field in sync
      categoryId: categoryId || undefined,
      color,
      startDate: editingEvent?.startDate || dateKey,
      endDate: endDate || undefined,
    };

    if (editingEvent) {
      await updateEvent(editingEvent.id, eventData);
    } else {
      await addEvent(eventData);
    }

    onDone();
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-3">
      <div>
        <input
          type="text"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          placeholder="Event title..."
          className="w-full bg-cal-bg border border-cal-border rounded-lg px-3 py-2 text-sm text-cal-text placeholder:text-cal-text-dim focus:outline-none focus:border-cal-accent"
          autoFocus
        />
      </div>

      {/* Time row */}
      <div>
        <label className="text-xs text-cal-text-muted block mb-1">Time</label>
        <div className="flex gap-2 items-center">
          <input
            type="time"
            value={startTime}
            onChange={(e) => setStartTime(e.target.value)}
            className="flex-1 bg-cal-bg border border-cal-border rounded-lg px-3 py-1.5 text-sm text-cal-text focus:outline-none focus:border-cal-accent"
          />
          <span className="text-cal-text-dim text-xs">to</span>
          <input
            type="time"
            value={endTime}
            onChange={(e) => setEndTime(e.target.value)}
            className="flex-1 bg-cal-bg border border-cal-border rounded-lg px-3 py-1.5 text-sm text-cal-text focus:outline-none focus:border-cal-accent"
          />
        </div>
      </div>

      {/* End date for multi-day */}
      <div>
        <label className="text-xs text-cal-text-muted block mb-1">End Date (for multi-day events)</label>
        <input
          type="date"
          value={endDate}
          onChange={(e) => setEndDate(e.target.value)}
          min={dateKey}
          className="w-full bg-cal-bg border border-cal-border rounded-lg px-3 py-1.5 text-sm text-cal-text focus:outline-none focus:border-cal-accent"
        />
      </div>

      <textarea
        value={description}
        onChange={(e) => setDescription(e.target.value)}
        placeholder="Description (optional)"
        rows={2}
        className="w-full bg-cal-bg border border-cal-border rounded-lg px-3 py-2 text-sm text-cal-text placeholder:text-cal-text-dim focus:outline-none focus:border-cal-accent resize-none"
      />

      <div>
        <label className="text-xs text-cal-text-muted block mb-1">Category</label>
        <div className="flex flex-wrap gap-1.5">
          <button
            type="button"
            onClick={() => setCategoryId('')}
            className={`px-2 py-0.5 rounded-full text-xs border transition-colors ${
              !categoryId
                ? 'border-cal-accent text-cal-accent'
                : 'border-cal-border text-cal-text-muted hover:border-cal-border-light'
            }`}
          >
            None
          </button>
          {categories.map((cat) => (
            <button
              key={cat.id}
              type="button"
              onClick={() => setCategoryId(cat.id)}
              className={`px-2 py-0.5 rounded-full text-xs border transition-colors ${
                categoryId === cat.id
                  ? 'border-current'
                  : 'border-transparent'
              }`}
              style={{ color: cat.color, backgroundColor: cat.color + '20' }}
            >
              {cat.name}
            </button>
          ))}
        </div>
      </div>

      <div>
        <label className="text-xs text-cal-text-muted block mb-1">Custom Color</label>
        <ColorPicker value={color} onChange={setColor} />
      </div>

      <div className="flex gap-2 pt-1">
        <button
          type="submit"
          disabled={!title.trim()}
          className="flex-1 bg-cal-accent hover:bg-cal-accent/90 disabled:opacity-40 text-white text-sm font-medium py-2 rounded-lg transition-colors"
        >
          {editingEvent ? 'Update' : 'Add Event'}
        </button>
        <button
          type="button"
          onClick={onDone}
          className="px-4 py-2 border border-cal-border text-cal-text-muted text-sm rounded-lg hover:bg-cal-surface transition-colors"
        >
          Cancel
        </button>
      </div>
    </form>
  );
}
