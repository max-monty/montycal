import { memo } from 'react';

interface YearSeparatorProps {
  year: number;
}

export const YearSeparator = memo(function YearSeparator({ year }: YearSeparatorProps) {
  return (
    <div
      className="grid items-center"
      style={{
        gridTemplateColumns: 'var(--label-w) 1fr',
        height: '32px',
      }}
    >
      <div />
      <div className="flex items-center gap-3 px-2">
        <div className="h-px flex-1 bg-cal-border-light" />
        <span className="text-sm font-bold text-cal-text-muted tracking-widest">{year}</span>
        <div className="h-px flex-1 bg-cal-border-light" />
      </div>
    </div>
  );
});
