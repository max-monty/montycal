import { useMemo } from 'react';
import { getDaysInMonth, parseISO } from 'date-fns';
import type { MultiDaySegment, MonthInfo, CalendarEvent, Category } from '../types';
import { useCalendarStore } from '../stores/calendar-store';
import { useCategoryStore } from '../stores/category-store';

function getMonthInfos(year: number): MonthInfo[] {
  return Array.from({ length: 12 }, (_, i) => ({
    year,
    month: i,
    daysInMonth: getDaysInMonth(new Date(year, i)),
    startDayOfWeek: new Date(year, i, 1).getDay(),
  }));
}

/** Pure function: compute multi-day segments for a single year */
export function computeMultiDaySegments(
  year: number,
  events: Record<string, CalendarEvent>,
  categories: Category[]
): MultiDaySegment[] {
  const monthInfos = getMonthInfos(year);
  const multiDayEvents = Object.values(events).filter(
    (e) => e.endDate && e.endDate !== e.startDate
  );

  const segments: MultiDaySegment[] = [];

  for (const event of multiDayEvents) {
    const start = parseISO(event.startDate);
    const end = parseISO(event.endDate!);
    const color = event.color || categories.find((c) => c.id === event.categoryId)?.color || '#3b82f6';

    for (let mi = 0; mi < monthInfos.length; mi++) {
      const info = monthInfos[mi];
      const monthStart = new Date(info.year, info.month, 1);
      const monthEnd = new Date(info.year, info.month, info.daysInMonth);

      if (start > monthEnd || end < monthStart) continue;

      const segStart = start < monthStart ? 1 : start.getDate();
      const segEnd = end > monthEnd ? info.daysInMonth : end.getDate();
      const isStart = start >= monthStart;
      const isEnd = end <= monthEnd;

      segments.push({
        eventId: event.id,
        monthIndex: mi,
        startCol: segStart,
        endCol: segEnd,
        lane: 0,
        isStart,
        isEnd,
        color,
        title: event.title,
      });
    }
  }

  // Greedy interval scheduling to assign lanes per month
  for (let mi = 0; mi < 12; mi++) {
    const monthSegs = segments
      .filter((s) => s.monthIndex === mi)
      .sort((a, b) => a.startCol - b.startCol || a.endCol - b.endCol);

    const lanes: number[][] = [];

    for (const seg of monthSegs) {
      let placed = false;
      for (let l = 0; l < lanes.length; l++) {
        const lastEnd = Math.max(...lanes[l]);
        if (seg.startCol > lastEnd) {
          lanes[l].push(seg.endCol);
          seg.lane = l;
          placed = true;
          break;
        }
      }
      if (!placed) {
        seg.lane = lanes.length;
        lanes.push([seg.endCol]);
      }
    }
  }

  return segments;
}

/** Hook wrapper for single-year usage */
export function useMultiDayEvents(year: number): MultiDaySegment[] {
  const events = useCalendarStore((s) => s.events);
  const categories = useCategoryStore((s) => s.categories);

  return useMemo(
    () => computeMultiDaySegments(year, events, categories),
    [events, categories, year]
  );
}
