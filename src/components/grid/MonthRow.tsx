import { memo, useMemo } from 'react';
import { getDaysInMonth } from 'date-fns';
import type { ZoomTier, MultiDaySegment } from '../../types';
import { MonthLabel } from './MonthLabel';
import { DayCell } from './DayCell';
import { MultiDayBar } from './MultiDayBar';

interface MonthRowProps {
  year: number;
  month: number; // 0-indexed
  zoomTier: ZoomTier;
  multiDaySegments: MultiDaySegment[];
}

export const MonthRow = memo(function MonthRow({ year, month, zoomTier, multiDaySegments }: MonthRowProps) {
  const daysInMonth = getDaysInMonth(new Date(year, month));

  const cells = useMemo(() => {
    return Array.from({ length: 31 }, (_, i) => {
      const day = i + 1;
      const isValid = day <= daysInMonth;
      const date = new Date(year, month, isValid ? day : 1);
      return { day, isValid, date };
    });
  }, [year, month, daysInMonth]);

  return (
    <div
      className="relative grid"
      style={{
        gridTemplateColumns: 'var(--label-w) repeat(31, var(--cell-w))',
        gridTemplateRows: 'var(--cell-h)',
      }}
    >
      <MonthLabel month={month} />
      {cells.map(({ day, isValid, date }) => (
        <DayCell key={day} date={date} isValid={isValid} zoomTier={zoomTier} />
      ))}

      {/* Multi-day bars overlaid on cells, positioned at the bottom */}
      {multiDaySegments.map((seg) => (
        <MultiDayBar
          key={`${seg.eventId}-${seg.monthIndex}`}
          segment={seg}
        />
      ))}
    </div>
  );
});
