import type { CalendarEvent } from '../../types';
import { useCalendarStore } from '../../stores/calendar-store';
import { useCategoryStore } from '../../stores/category-store';

interface EventListProps {
  events: CalendarEvent[];
  onEdit: (event: CalendarEvent) => void;
}

export function EventList({ events, onEdit }: EventListProps) {
  const deleteEvent = useCalendarStore((s) => s.deleteEvent);
  const categories = useCategoryStore((s) => s.categories);

  if (events.length === 0) {
    return (
      <p className="text-sm text-cal-text-dim italic py-2">No events for this day.</p>
    );
  }

  return (
    <div className="space-y-1.5">
      {events.map((event) => {
        const category = categories.find((c) => c.id === event.categoryId);
        const color = event.color || category?.color || '#3b82f6';

        return (
          <div
            key={event.id}
            className="flex items-start gap-2 p-2 rounded-lg hover:bg-cal-surface transition-colors"
            style={{ borderLeft: `3px solid ${color}` }}
          >
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2">
                <span className="text-sm font-medium truncate">{event.title}</span>
                {(event.startTime || event.time) && (
                  <span className="text-xs text-cal-text-muted shrink-0">
                    {event.startTime || event.time}
                    {event.endTime && ` – ${event.endTime}`}
                  </span>
                )}
              </div>
              {category && (
                <span
                  className="text-[10px] px-1.5 rounded-full"
                  style={{ color: category.color, backgroundColor: category.color + '20' }}
                >
                  {category.name}
                </span>
              )}
              {event.description && (
                <p className="text-xs text-cal-text-dim mt-0.5 line-clamp-2">{event.description}</p>
              )}
              {event.endDate && event.endDate !== event.startDate && (
                <p className="text-[10px] text-cal-text-dim mt-0.5">
                  → {event.endDate}
                </p>
              )}
            </div>
            <div className="flex gap-0.5 shrink-0">
              <button
                onClick={() => onEdit(event)}
                className="w-7 h-7 flex items-center justify-center rounded-md text-cal-text-dim hover:text-cal-text hover:bg-cal-surface-hover transition-colors"
                title="Edit"
              >
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M17 3a2.85 2.83 0 1 1 4 4L7.5 20.5 2 22l1.5-5.5Z" />
                  <path d="m15 5 4 4" />
                </svg>
              </button>
              <button
                onClick={() => deleteEvent(event.id)}
                className="w-7 h-7 flex items-center justify-center rounded-md text-cal-text-dim hover:text-red-400 hover:bg-red-500/10 transition-colors"
                title="Delete"
              >
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M3 6h18" />
                  <path d="M19 6v14c0 1-1 2-2 2H7c-1 0-2-1-2-2V6" />
                  <path d="M8 6V4c0-1 1-2 2-2h4c1 0 2 1 2 2v2" />
                </svg>
              </button>
            </div>
          </div>
        );
      })}
    </div>
  );
}
