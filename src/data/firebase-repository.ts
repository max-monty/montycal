import {
  doc,
  getDoc,
  setDoc,
  deleteDoc,
  collection,
  getDocs,
  writeBatch,
} from 'firebase/firestore';
import { db, getAuthReady } from './firebase-config';
import type { DataRepository } from './repository';
import type { CalendarEvent, DayData, Category } from '../types';

export class FirebaseRepository implements DataRepository {
  private uid: string | null = null;

  private async userPath(): Promise<string> {
    if (!this.uid) {
      this.uid = await getAuthReady();
    }
    return `users/${this.uid}`;
  }

  async getEvents(): Promise<Record<string, CalendarEvent>> {
    const base = await this.userPath();
    const snap = await getDocs(collection(db, `${base}/events`));
    const result: Record<string, CalendarEvent> = {};
    snap.forEach((d) => {
      result[d.id] = d.data() as CalendarEvent;
    });
    return result;
  }

  async saveEvent(event: CalendarEvent): Promise<void> {
    const base = await this.userPath();
    await setDoc(doc(db, `${base}/events`, event.id), event);
  }

  async deleteEvent(id: string): Promise<void> {
    const base = await this.userPath();
    await deleteDoc(doc(db, `${base}/events`, id));
  }

  async getDayData(): Promise<Record<string, DayData>> {
    const base = await this.userPath();
    const snap = await getDocs(collection(db, `${base}/days`));
    const result: Record<string, DayData> = {};
    snap.forEach((d) => {
      result[d.id] = d.data() as DayData;
    });
    return result;
  }

  async saveDayData(dayData: DayData): Promise<void> {
    const base = await this.userPath();
    await setDoc(doc(db, `${base}/days`, dayData.dateKey), dayData);
  }

  async deleteDayData(dateKey: string): Promise<void> {
    const base = await this.userPath();
    await deleteDoc(doc(db, `${base}/days`, dateKey));
  }

  async getCategories(): Promise<Category[]> {
    const base = await this.userPath();
    const snap = await getDoc(doc(db, `${base}/meta`, 'categories'));
    if (snap.exists()) {
      return (snap.data().list as Category[]) || [];
    }
    return [];
  }

  async saveCategories(categories: Category[]): Promise<void> {
    const base = await this.userPath();
    await setDoc(doc(db, `${base}/meta`, 'categories'), { list: categories });
  }

  async exportAll(): Promise<string> {
    const events = await this.getEvents();
    const days = await this.getDayData();
    const categories = await this.getCategories();
    return JSON.stringify({ events, days, categories }, null, 2);
  }

  async importAll(json: string): Promise<void> {
    const data = JSON.parse(json);
    const base = await this.userPath();
    const batch = writeBatch(db);

    if (data.events) {
      for (const [id, event] of Object.entries(data.events)) {
        batch.set(doc(db, `${base}/events`, id), event as CalendarEvent);
      }
    }

    if (data.days) {
      for (const [key, day] of Object.entries(data.days)) {
        batch.set(doc(db, `${base}/days`, key), day as DayData);
      }
    }

    if (data.categories) {
      batch.set(doc(db, `${base}/meta`, 'categories'), { list: data.categories });
    }

    await batch.commit();
  }
}
