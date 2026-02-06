import { memo } from 'react';

export const DayHeader = memo(function DayHeader() {
  return (
    <div
      className="sticky top-0 z-20 grid bg-cal-bg/95 backdrop-blur-sm border-b border-cal-border"
      style={{
        gridTemplateColumns: 'var(--label-w) repeat(31, var(--cell-w))',
      }}
    >
      {/* Empty corner cell */}
      <div className="flex items-center justify-center h-8 border-r border-cal-border" />

      {/* Day numbers 1-31 */}
      {Array.from({ length: 31 }, (_, i) => (
        <div
          key={i + 1}
          className="flex items-center justify-center h-8 text-xs font-semibold text-cal-text-muted border-r border-cal-border last:border-r-0"
        >
          {i + 1}
        </div>
      ))}
    </div>
  );
});
