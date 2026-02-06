export interface CalendarEvent {
  id: string;
  title: string;
  description?: string;
  startTime?: string; // "HH:MM"
  endTime?: string;   // "HH:MM"
  time?: string;      // legacy single time field
  categoryId?: string;
  color?: string;
  startDate: string; // "YYYY-MM-DD"
  endDate?: string;  // "YYYY-MM-DD" for multi-day events
  createdAt: number;
  updatedAt: number;
}

export interface DayData {
  dateKey: string; // "YYYY-MM-DD"
  backgroundColor?: string;
  categoryId?: string;
  notes?: string;
  eventIds: string[];
}

export interface Category {
  id: string;
  name: string;
  color: string;
  sortOrder: number;
}

export type ViewMode = 'year' | 'rolling12' | 'infinite';
export type ZoomTier = 'low' | 'medium' | 'high';

export interface MonthInfo {
  year: number;
  month: number; // 0-indexed
  daysInMonth: number;
  startDayOfWeek: number; // 0=Sunday
}

export interface MultiDaySegment {
  eventId: string;
  monthIndex: number; // which month row
  startCol: number;   // 1-based day column
  endCol: number;     // 1-based day column
  lane: number;       // vertical stacking lane
  isStart: boolean;   // rounded left end
  isEnd: boolean;     // rounded right end
  color: string;
  title: string;
}
