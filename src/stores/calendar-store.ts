import { create } from 'zustand';
import { nanoid } from 'nanoid';
import { format, eachDayOfInterval, parseISO } from 'date-fns';
import type { CalendarEvent, DayData } from '../types';
import { getRepository } from '../data/repository';

interface CalendarState {
  events: Record<string, CalendarEvent>;
  dayData: Record<string, DayData>;
  loaded: boolean;

  loadData: () => Promise<void>;

  // Event CRUD
  addEvent: (event: Omit<CalendarEvent, 'id' | 'createdAt' | 'updatedAt'>) => Promise<CalendarEvent>;
  updateEvent: (id: string, updates: Partial<Omit<CalendarEvent, 'id' | 'createdAt'>>) => Promise<void>;
  deleteEvent: (id: string) => Promise<void>;
  getEventsForDate: (dateKey: string) => CalendarEvent[];

  // Day data
  setDayBackground: (dateKey: string, color: string | undefined) => Promise<void>;
  setDayNotes: (dateKey: string, notes: string) => Promise<void>;
  setDayCategory: (dateKey: string, categoryId: string | undefined) => Promise<void>;
  getDayData: (dateKey: string) => DayData | undefined;

  // Export/Import
  exportData: () => Promise<string>;
  importData: (json: string) => Promise<void>;
}

function ensureDayData(dayData: Record<string, DayData>, dateKey: string): DayData {
  if (!dayData[dateKey]) {
    return { dateKey, eventIds: [] };
  }
  return dayData[dateKey];
}

export const useCalendarStore = create<CalendarState>((set, get) => ({
  events: {},
  dayData: {},
  loaded: false,

  loadData: async () => {
    const repo = getRepository();
    const [events, dayData] = await Promise.all([repo.getEvents(), repo.getDayData()]);
    set({ events, dayData, loaded: true });
  },

  addEvent: async (eventData) => {
    const repo = getRepository();
    const now = Date.now();
    const event: CalendarEvent = {
      ...eventData,
      id: nanoid(),
      createdAt: now,
      updatedAt: now,
    };

    await repo.saveEvent(event);

    // Add event to all days it spans
    const { dayData } = get();
    const newDayData = { ...dayData };
    const dates = event.endDate
      ? eachDayOfInterval({ start: parseISO(event.startDate), end: parseISO(event.endDate) })
      : [parseISO(event.startDate)];

    for (const date of dates) {
      const key = format(date, 'yyyy-MM-dd');
      const dd = ensureDayData(newDayData, key);
      newDayData[key] = { ...dd, eventIds: [...dd.eventIds, event.id] };
      await repo.saveDayData(newDayData[key]);
    }

    set((s) => ({
      events: { ...s.events, [event.id]: event },
      dayData: newDayData,
    }));

    return event;
  },

  updateEvent: async (id, updates) => {
    const repo = getRepository();
    const { events, dayData } = get();
    const existing = events[id];
    if (!existing) return;

    const updated: CalendarEvent = { ...existing, ...updates, updatedAt: Date.now() };

    // Remove from old days
    const newDayData = { ...dayData };
    const oldDates = existing.endDate
      ? eachDayOfInterval({ start: parseISO(existing.startDate), end: parseISO(existing.endDate) })
      : [parseISO(existing.startDate)];
    for (const date of oldDates) {
      const key = format(date, 'yyyy-MM-dd');
      if (newDayData[key]) {
        newDayData[key] = {
          ...newDayData[key],
          eventIds: newDayData[key].eventIds.filter((eid) => eid !== id),
        };
        await repo.saveDayData(newDayData[key]);
      }
    }

    // Add to new days
    const newDates = updated.endDate
      ? eachDayOfInterval({ start: parseISO(updated.startDate), end: parseISO(updated.endDate) })
      : [parseISO(updated.startDate)];
    for (const date of newDates) {
      const key = format(date, 'yyyy-MM-dd');
      const dd = ensureDayData(newDayData, key);
      newDayData[key] = { ...dd, eventIds: [...dd.eventIds, id] };
      await repo.saveDayData(newDayData[key]);
    }

    await repo.saveEvent(updated);
    set({
      events: { ...events, [id]: updated },
      dayData: newDayData,
    });
  },

  deleteEvent: async (id) => {
    const repo = getRepository();
    const { events, dayData } = get();
    const event = events[id];
    if (!event) return;

    // Remove from all days
    const newDayData = { ...dayData };
    const dates = event.endDate
      ? eachDayOfInterval({ start: parseISO(event.startDate), end: parseISO(event.endDate) })
      : [parseISO(event.startDate)];
    for (const date of dates) {
      const key = format(date, 'yyyy-MM-dd');
      if (newDayData[key]) {
        newDayData[key] = {
          ...newDayData[key],
          eventIds: newDayData[key].eventIds.filter((eid) => eid !== id),
        };
        await repo.saveDayData(newDayData[key]);
      }
    }

    await repo.deleteEvent(id);
    const newEvents = { ...events };
    delete newEvents[id];
    set({ events: newEvents, dayData: newDayData });
  },

  getEventsForDate: (dateKey) => {
    const { events, dayData } = get();
    const dd = dayData[dateKey];
    if (!dd) return [];
    return dd.eventIds.map((id) => events[id]).filter(Boolean);
  },

  setDayBackground: async (dateKey, color) => {
    const repo = getRepository();
    const { dayData } = get();
    const dd = ensureDayData(dayData, dateKey);
    const updated = { ...dd, backgroundColor: color };
    await repo.saveDayData(updated);
    set((s) => ({ dayData: { ...s.dayData, [dateKey]: updated } }));
  },

  setDayNotes: async (dateKey, notes) => {
    const repo = getRepository();
    const { dayData } = get();
    const dd = ensureDayData(dayData, dateKey);
    const updated = { ...dd, notes: notes || undefined };
    await repo.saveDayData(updated);
    set((s) => ({ dayData: { ...s.dayData, [dateKey]: updated } }));
  },

  setDayCategory: async (dateKey, categoryId) => {
    const repo = getRepository();
    const { dayData } = get();
    const dd = ensureDayData(dayData, dateKey);
    const updated = { ...dd, categoryId };
    await repo.saveDayData(updated);
    set((s) => ({ dayData: { ...s.dayData, [dateKey]: updated } }));
  },

  getDayData: (dateKey) => get().dayData[dateKey],

  exportData: async () => {
    const repo = getRepository();
    return repo.exportAll();
  },

  importData: async (json) => {
    const repo = getRepository();
    await repo.importAll(json);
    const [events, dayData] = await Promise.all([repo.getEvents(), repo.getDayData()]);
    set({ events, dayData });
  },
}));
