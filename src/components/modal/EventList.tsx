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
            className="flex items-start gap-2 p-2 rounded-lg hover:bg-cal-surface transition-colors group"
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
            <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity shrink-0">
              <button
                onClick={() => onEdit(event)}
                className="text-xs text-cal-text-muted hover:text-cal-text px-1.5 py-0.5 rounded hover:bg-cal-surface-hover"
              >
                Edit
              </button>
              <button
                onClick={() => deleteEvent(event.id)}
                className="text-xs text-red-400 hover:text-red-300 px-1.5 py-0.5 rounded hover:bg-red-500/10"
              >
                Del
              </button>
            </div>
          </div>
        );
      })}
    </div>
  );
}
