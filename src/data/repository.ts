import type { CalendarEvent, DayData, Category } from '../types';

export interface DataRepository {
  // Events
  getEvents(): Promise<Record<string, CalendarEvent>>;
  saveEvent(event: CalendarEvent): Promise<void>;
  deleteEvent(id: string): Promise<void>;

  // Day Data
  getDayData(): Promise<Record<string, DayData>>;
  saveDayData(dayData: DayData): Promise<void>;
  deleteDayData(dateKey: string): Promise<void>;

  // Categories
  getCategories(): Promise<Category[]>;
  saveCategories(categories: Category[]): Promise<void>;

  // Bulk operations
  exportAll(): Promise<string>;
  importAll(json: string): Promise<void>;
}

const EVENTS_KEY = 'montycal_events';
const DAYS_KEY = 'montycal_days';
const CATEGORIES_KEY = 'montycal_categories';

export class LocalStorageRepository implements DataRepository {
  async getEvents(): Promise<Record<string, CalendarEvent>> {
    const raw = localStorage.getItem(EVENTS_KEY);
    return raw ? JSON.parse(raw) : {};
  }

  async saveEvent(event: CalendarEvent): Promise<void> {
    const events = await this.getEvents();
    events[event.id] = event;
    localStorage.setItem(EVENTS_KEY, JSON.stringify(events));
  }

  async deleteEvent(id: string): Promise<void> {
    const events = await this.getEvents();
    delete events[id];
    localStorage.setItem(EVENTS_KEY, JSON.stringify(events));
  }

  async getDayData(): Promise<Record<string, DayData>> {
    const raw = localStorage.getItem(DAYS_KEY);
    return raw ? JSON.parse(raw) : {};
  }

  async saveDayData(dayData: DayData): Promise<void> {
    const days = await this.getDayData();
    days[dayData.dateKey] = dayData;
    localStorage.setItem(DAYS_KEY, JSON.stringify(days));
  }

  async deleteDayData(dateKey: string): Promise<void> {
    const days = await this.getDayData();
    delete days[dateKey];
    localStorage.setItem(DAYS_KEY, JSON.stringify(days));
  }

  async getCategories(): Promise<Category[]> {
    const raw = localStorage.getItem(CATEGORIES_KEY);
    return raw ? JSON.parse(raw) : [];
  }

  async saveCategories(categories: Category[]): Promise<void> {
    localStorage.setItem(CATEGORIES_KEY, JSON.stringify(categories));
  }

  async exportAll(): Promise<string> {
    const events = await this.getEvents();
    const days = await this.getDayData();
    const categories = await this.getCategories();
    return JSON.stringify({ events, days, categories }, null, 2);
  }

  async importAll(json: string): Promise<void> {
    const data = JSON.parse(json);
    if (data.events) localStorage.setItem(EVENTS_KEY, JSON.stringify(data.events));
    if (data.days) localStorage.setItem(DAYS_KEY, JSON.stringify(data.days));
    if (data.categories) localStorage.setItem(CATEGORIES_KEY, JSON.stringify(data.categories));
  }
}

let repository: DataRepository | null = null;

export async function initRepository(): Promise<DataRepository> {
  if (!repository) {
    if (import.meta.env.VITE_STORAGE_BACKEND === 'firebase') {
      const { FirebaseRepository } = await import('./firebase-repository');
      repository = new FirebaseRepository();
    } else {
      repository = new LocalStorageRepository();
    }
  }
  return repository;
}

export function getRepository(): DataRepository {
  if (!repository) {
    repository = new LocalStorageRepository();
  }
  return repository;
}
