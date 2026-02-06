import { useRef, useMemo } from 'react';
import { useViewStore } from '../../stores/view-store';
import { useCalendarStore } from '../../stores/calendar-store';
import { useCategoryStore } from '../../stores/category-store';
import { useZoom } from '../../hooks/useZoom';
import { computeMultiDaySegments } from '../../hooks/useMultiDayEvents';
import { useInfiniteScroll } from '../../hooks/useInfiniteScroll';
import { DayHeader } from './DayHeader';
import { MonthRow } from './MonthRow';
import { YearSeparator } from './YearSeparator';

export function CalendarGrid() {
  const containerRef = useRef<HTMLDivElement>(null);
  const { scale } = useZoom(containerRef);
  const { viewMode, focusYear, zoomTier } = useViewStore();
  const { months, topSentinelRef, bottomSentinelRef, loadMoreTop, loadMoreBottom } = useInfiniteScroll(focusYear);
  const events = useCalendarStore((s) => s.events);
  const categories = useCategoryStore((s) => s.categories);

  const yearMonths = useMemo(() => {
    if (viewMode === 'year') {
      return Array.from({ length: 12 }, (_, i) => ({ year: focusYear, month: i }));
    }
    if (viewMode === 'rolling12') {
      const now = new Date();
      return Array.from({ length: 12 }, (_, i) => {
        const d = new Date(now.getFullYear(), now.getMonth() + i, 1);
        return { year: d.getFullYear(), month: d.getMonth() };
      });
    }
    return months;
  }, [viewMode, focusYear, months]);

  // Collect all unique years from visible months for multi-day event lookup
  const visibleYears = useMemo(() => {
    const years = new Set(yearMonths.map((m) => m.year));
    return Array.from(years);
  }, [yearMonths]);

  // Get multi-day events for all visible years (pure function, no hooks violation)
  const multiDaySegmentsByYear = useMemo(() => {
    const result: Record<number, ReturnType<typeof computeMultiDaySegments>> = {};
    for (const y of visibleYears) {
      result[y] = computeMultiDaySegments(y, events, categories);
    }
    return result;
  }, [visibleYears, events, categories]);

  // Determine where to show year separators (when year changes between consecutive months)
  const showYearSeparator = useMemo(() => {
    const result: Record<string, boolean> = {};
    for (let i = 0; i < yearMonths.length; i++) {
      const { year, month } = yearMonths[i];
      const key = `${year}-${month}`;
      if (i === 0) {
        // Show separator at start if not a January in year view
        result[key] = viewMode !== 'year';
      } else {
        const prev = yearMonths[i - 1];
        result[key] = year !== prev.year;
      }
    }
    return result;
  }, [yearMonths, viewMode]);

  return (
    <div
      ref={containerRef}
      className="flex-1 overflow-auto relative"
      style={{
        ['--label-w' as string]: '60px',
        ['--cell-w' as string]: '80px',
        ['--cell-h' as string]: zoomTier === 'low' ? '28px' : zoomTier === 'medium' ? '48px' : '80px',
      }}
    >
      <div style={{ zoom: scale }}>
        {zoomTier === 'low' && <DayHeader />}
        {viewMode === 'infinite' && (
          <>
            <div ref={topSentinelRef} className="h-1" />
            <button
              onClick={loadMoreTop}
              className="w-full py-2 text-xs font-medium text-cal-text-muted hover:text-cal-accent hover:bg-cal-surface-hover transition-colors border-b border-cal-border"
            >
              Load earlier months
            </button>
          </>
        )}
        {yearMonths.map(({ year, month }) => {
          const key = `${year}-${month}`;
          const segs = (multiDaySegmentsByYear[year] || []).filter((s) => s.monthIndex === month);
          return (
            <div key={key}>
              {showYearSeparator[key] && <YearSeparator year={year} />}
              <MonthRow
                year={year}
                month={month}
                zoomTier={zoomTier}
                multiDaySegments={segs}
              />
            </div>
          );
        })}
        {viewMode === 'infinite' && (
          <>
            <button
              onClick={loadMoreBottom}
              className="w-full py-2 text-xs font-medium text-cal-text-muted hover:text-cal-accent hover:bg-cal-surface-hover transition-colors border-t border-cal-border"
            >
              Load later months
            </button>
            <div ref={bottomSentinelRef} className="h-1" />
          </>
        )}
      </div>
    </div>
  );
}
