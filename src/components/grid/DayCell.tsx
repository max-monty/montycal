import { memo, useCallback, useMemo } from 'react';
import { format, isToday, isWeekend } from 'date-fns';
import type { ZoomTier } from '../../types';
import { useCalendarStore } from '../../stores/calendar-store';
import { useCategoryStore } from '../../stores/category-store';
import { useViewStore } from '../../stores/view-store';
import { useUIStore } from '../../stores/ui-store';

interface DayCellProps {
  date: Date;
  isValid: boolean;
  zoomTier: ZoomTier;
}

export const DayCell = memo(function DayCell({ date, isValid, zoomTier }: DayCellProps) {
  const dateKey = format(date, 'yyyy-MM-dd');
  const selectedDate = useViewStore((s) => s.selectedDate);
  const setSelectedDate = useViewStore((s) => s.setSelectedDate);
  const openModal = useUIStore((s) => s.openModal);
  const setEditingEventId = useUIStore((s) => s.setEditingEventId);

  const dayData = useCalendarStore((s) => s.dayData[dateKey]);
  const allEvents = useCalendarStore((s) => s.events);
  const categories = useCategoryStore((s) => s.categories);

  const singleDayEvents = useMemo(() => {
    if (!dayData || dayData.eventIds.length === 0) return [];
    return dayData.eventIds
      .map((id) => allEvents[id])
      .filter((e) => e && (!e.endDate || e.endDate === e.startDate));
  }, [dayData, allEvents]);

  const eventCount = singleDayEvents.length;
  const isSelected = selectedDate === dateKey;
  const today = isToday(date);
  const weekend = isWeekend(date);

  const handleCellClick = useCallback(() => {
    if (!isValid) return;
    setSelectedDate(dateKey);
    openModal();
  }, [isValid, dateKey, setSelectedDate, openModal]);

  const handleEventClick = useCallback((e: React.MouseEvent, eventId: string) => {
    e.stopPropagation();
    setSelectedDate(dateKey);
    setEditingEventId(eventId);
    openModal();
  }, [dateKey, setSelectedDate, setEditingEventId, openModal]);

  if (!isValid) {
    return <div className="border-r border-b border-cal-border/30 bg-cal-bg/50" />;
  }

  const bgColor = dayData?.backgroundColor;
  const categoryColor = dayData?.categoryId
    ? categories.find((c) => c.id === dayData.categoryId)?.color
    : undefined;
  const displayColor = bgColor || categoryColor;

  const getEventColor = (event: { color?: string; categoryId?: string }) =>
    event.color || categories.find((c) => c.id === event.categoryId)?.color || '#3b82f6';

  const formatTimeRange = (event: { startTime?: string; endTime?: string; time?: string }) => {
    const start = event.startTime || event.time;
    if (!start) return null;
    if (event.endTime) return `${start}–${event.endTime}`;
    return start;
  };

  const cellStyle = displayColor
    ? { backgroundColor: displayColor + '20' }
    : today
      ? { backgroundColor: 'rgba(245, 158, 11, 0.08)' }
      : undefined;

  return (
    <div
      className={`
        relative border-r border-b border-cal-border/50 cursor-pointer transition-colors duration-100
        ${weekend && !today ? 'bg-cal-weekend' : ''}
        ${isSelected ? 'ring-2 ring-cal-accent ring-inset z-10' : ''}
        ${today ? 'ring-2 ring-cal-today ring-inset z-10' : ''}
        hover:bg-cal-surface-hover
      `}
      style={cellStyle}
      onClick={handleCellClick}
    >
      {/* Low zoom: color swatch + event count badge */}
      {zoomTier === 'low' && (
        <>
          {displayColor && (
            <div
              className="absolute inset-0.5 rounded-sm opacity-30"
              style={{ backgroundColor: displayColor }}
            />
          )}
          {eventCount > 0 && (
            <div className="absolute top-0 right-0 min-w-3 h-3 flex items-center justify-center bg-cal-accent rounded-bl text-[6px] font-bold text-white px-0.5">
              {eventCount}
            </div>
          )}
          {dayData?.notes && (
            <div className="absolute bottom-0 left-0 w-1.5 h-1.5 bg-cal-today rounded-tr" />
          )}
        </>
      )}

      {/* Medium zoom: day number + abbreviated titles */}
      {zoomTier === 'medium' && (
        <div className="p-0.5 h-full flex flex-col">
          <div className="text-[8px] font-medium text-cal-text-muted leading-none mb-0.5">
            {date.getDate()}
          </div>
          <div className="flex-1 min-h-0 overflow-hidden">
            {singleDayEvents.slice(0, 2).map((event) => {
              const color = getEventColor(event);
              return (
                <div
                  key={event.id}
                  className="flex items-center h-[14px] text-[7px] font-semibold truncate rounded-sm px-0.5 mb-px cursor-pointer hover:opacity-80"
                  style={{ backgroundColor: color + '30', color }}
                  onClick={(e) => handleEventClick(e, event.id)}
                >
                  {event.title}
                </div>
              );
            })}
            {eventCount > 2 && (
              <div className="text-[5px] text-cal-text-dim">+{eventCount - 2}</div>
            )}
          </div>
        </div>
      )}

      {/* High zoom: full details */}
      {zoomTier === 'high' && (
        <div className="p-1 h-full flex flex-col">
          <div className="flex items-center justify-between mb-0.5">
            <span className="text-[10px] font-semibold text-cal-text-muted">
              {date.getDate()}
            </span>
            {today && (
              <span className="text-[7px] font-bold text-cal-today bg-cal-today/10 px-1 rounded">
                TODAY
              </span>
            )}
          </div>
          <div className="flex-1 min-h-0 overflow-hidden space-y-0.5">
            {singleDayEvents.slice(0, 4).map((event) => {
              const color = getEventColor(event);
              const timeStr = formatTimeRange(event);
              return (
                <div
                  key={event.id}
                  className="flex items-center h-[14px] text-[7px] font-semibold truncate rounded-sm px-1 cursor-pointer hover:opacity-80"
                  style={{ backgroundColor: color + '25', borderLeft: `2px solid ${color}` }}
                  onClick={(e) => handleEventClick(e, event.id)}
                >
                  {timeStr && (
                    <span className="font-medium text-cal-text-muted mr-1">{timeStr}</span>
                  )}
                  {event.title}
                </div>
              );
            })}
            {eventCount > 4 && (
              <div className="text-[7px] text-cal-text-dim">+{eventCount - 4} more</div>
            )}
          </div>
          {dayData?.notes && (
            <div className="text-[7px] text-cal-text-dim truncate mt-auto pt-0.5 border-t border-cal-border/30">
              {dayData.notes}
            </div>
          )}
        </div>
      )}
    </div>
  );
});
