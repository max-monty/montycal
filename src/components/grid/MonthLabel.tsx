import { memo } from 'react';

const MONTH_NAMES = ['JAN', 'FEB', 'MAR', 'APR', 'MAY', 'JUN', 'JUL', 'AUG', 'SEP', 'OCT', 'NOV', 'DEC'];

// Direct hex colors that work well on both light and dark backgrounds
const MONTH_HEX_COLORS = [
  '#3b82f6', // blue
  '#a855f7', // purple
  '#22c55e', // green
  '#10b981', // emerald
  '#14b8a6', // teal
  '#06b6d4', // cyan
  '#0ea5e9', // sky
  '#6366f1', // indigo
  '#8b5cf6', // violet
  '#f59e0b', // amber
  '#f97316', // orange
  '#ef4444', // red
];

interface MonthLabelProps {
  month: number; // 0-indexed
}

export const MonthLabel = memo(function MonthLabel({ month }: MonthLabelProps) {
  return (
    <div
      className="sticky left-0 z-10 flex items-center justify-center bg-cal-bg/95 backdrop-blur-sm border-r border-cal-border font-bold text-sm tracking-wider"
      style={{ width: 'var(--label-w)', color: MONTH_HEX_COLORS[month] }}
    >
      {MONTH_NAMES[month]}
    </div>
  );
});
