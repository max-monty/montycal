import { memo, useCallback } from 'react';
import type { MultiDaySegment } from '../../types';
import { useViewStore } from '../../stores/view-store';
import { useUIStore } from '../../stores/ui-store';
import { useCalendarStore } from '../../stores/calendar-store';

interface MultiDayBarProps {
  segment: MultiDaySegment;
}

const BAR_HEIGHT = 14;
const BAR_GAP = 1;

export const MultiDayBar = memo(function MultiDayBar({ segment }: MultiDayBarProps) {
  const { startCol, endCol, lane, isStart, isEnd, color, title, eventId } = segment;
  const setSelectedDate = useViewStore((s) => s.setSelectedDate);
  const openModal = useUIStore((s) => s.openModal);
  const setEditingEventId = useUIStore((s) => s.setEditingEventId);
  const event = useCalendarStore((s) => s.events[eventId]);

  const handleClick = useCallback(() => {
    if (event) {
      setSelectedDate(event.startDate);
      setEditingEventId(eventId);
      openModal();
    }
  }, [event, eventId, setSelectedDate, setEditingEventId, openModal]);

  // Position from bottom of cell, stacking upward
  const bottomOffset = BAR_GAP + lane * (BAR_HEIGHT + BAR_GAP);

  return (
    <div
      className="absolute flex items-center overflow-hidden cursor-pointer hover:brightness-125 transition-all z-[5]"
      style={{
        left: `calc(var(--label-w) + ${(startCol - 1)} * var(--cell-w) + 2px)`,
        width: `calc(${endCol - startCol + 1} * var(--cell-w) - 4px)`,
        bottom: bottomOffset,
        height: BAR_HEIGHT,
        backgroundColor: color + '50',
        borderLeft: isStart ? `3px solid ${color}` : 'none',
        borderRight: isEnd ? `3px solid ${color}` : 'none',
        borderRadius: `${isStart ? 3 : 0}px ${isEnd ? 3 : 0}px ${isEnd ? 3 : 0}px ${isStart ? 3 : 0}px`,
      }}
      onClick={handleClick}
    >
      <span
        className="text-[7px] font-semibold truncate px-1 whitespace-nowrap"
        style={{ color }}
      >
        {title}
      </span>
    </div>
  );
});
