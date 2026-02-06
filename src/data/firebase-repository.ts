import {
  doc,
  getDoc,
  setDoc,
  deleteDoc,
  collection,
  getDocs,
  writeBatch,
  query,
  where,
} from 'firebase/firestore';
import { db, auth } from './firebase-config';
import type { DataRepository } from './repository';
import type { CalendarEvent, DayData, Category, Share } from '../types';

/** Strip undefined values from an object (Firestore rejects them) */
// eslint-disable-next-line @typescript-eslint/no-explicit-any
function clean(obj: any): Record<string, any> {
  return Object.fromEntries(
    Object.entries(obj).filter(([, v]) => v !== undefined)
  );
}

export class FirebaseRepository implements DataRepository {
  private activeUid: string | null = null;

  /** Override which user's data to read/write (for shared calendars) */
  setActiveUid(uid: string): void {
    this.activeUid = uid;
  }

  private getUserUid(): string {
    if (this.activeUid) return this.activeUid;
    const user = auth.currentUser;
    if (!user) throw new Error('Not authenticated');
    return user.uid;
  }

  private userPath(): string {
    return `users/${this.getUserUid()}`;
  }

  async getEvents(): Promise<Record<string, CalendarEvent>> {
    const base = this.userPath();
    const snap = await getDocs(collection(db, `${base}/events`));
    const result: Record<string, CalendarEvent> = {};
    snap.forEach((d) => {
      result[d.id] = d.data() as CalendarEvent;
    });
    return result;
  }

  async saveEvent(event: CalendarEvent): Promise<void> {
    const base = this.userPath();
    await setDoc(doc(db, `${base}/events`, event.id), clean(event as never));
  }

  async deleteEvent(id: string): Promise<void> {
    const base = this.userPath();
    await deleteDoc(doc(db, `${base}/events`, id));
  }

  async getDayData(): Promise<Record<string, DayData>> {
    const base = this.userPath();
    const snap = await getDocs(collection(db, `${base}/days`));
    const result: Record<string, DayData> = {};
    snap.forEach((d) => {
      result[d.id] = d.data() as DayData;
    });
    return result;
  }

  async saveDayData(dayData: DayData): Promise<void> {
    const base = this.userPath();
    await setDoc(doc(db, `${base}/days`, dayData.dateKey), clean(dayData as never));
  }

  async deleteDayData(dateKey: string): Promise<void> {
    const base = this.userPath();
    await deleteDoc(doc(db, `${base}/days`, dateKey));
  }

  async getCategories(): Promise<Category[]> {
    const base = this.userPath();
    const snap = await getDoc(doc(db, `${base}/meta`, 'categories'));
    if (snap.exists()) {
      return (snap.data().list as Category[]) || [];
    }
    return [];
  }

  async saveCategories(categories: Category[]): Promise<void> {
    const base = this.userPath();
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
    const base = this.userPath();
    const batch = writeBatch(db);

    if (data.events) {
      for (const [id, event] of Object.entries(data.events)) {
        batch.set(doc(db, `${base}/events`, id), clean(event as Record<string, unknown>));
      }
    }

    if (data.days) {
      for (const [key, day] of Object.entries(data.days)) {
        batch.set(doc(db, `${base}/days`, key), clean(day as Record<string, unknown>));
      }
    }

    if (data.categories) {
      batch.set(doc(db, `${base}/meta`, 'categories'), { list: data.categories });
    }

    await batch.commit();
  }

  // ─── Sharing ─────────────────────────────────────────

  /** Save the current user's profile info (used for share display names) */
  async saveProfile(email: string, displayName: string): Promise<void> {
    const uid = this.getUserUid();
    await setDoc(doc(db, `users/${uid}/meta`, 'profile'), { email, displayName });
  }

  /** Share this calendar with another user by email */
  async shareCalendar(collaboratorEmail: string): Promise<void> {
    const user = auth.currentUser;
    if (!user) throw new Error('Not authenticated');

    // Use a placeholder doc ID; will be updated with deterministic ID once collaborator signs in
    const shareId = `${user.uid}_pending_${collaboratorEmail.replace(/[^a-zA-Z0-9]/g, '_')}`;
    const shareData: Omit<Share, 'id'> = {
      ownerUid: user.uid,
      ownerEmail: user.email || '',
      ownerName: user.displayName || '',
      collaboratorEmail,
      collaboratorUid: null,
      createdAt: Date.now(),
    };
    await setDoc(doc(db, 'shares', shareId), shareData);
  }

  /** Get calendars I've shared with others */
  async getMyShares(): Promise<Share[]> {
    const user = auth.currentUser;
    if (!user) return [];

    const q = query(collection(db, 'shares'), where('ownerUid', '==', user.uid));
    const snap = await getDocs(q);
    return snap.docs.map((d) => ({ id: d.id, ...d.data() } as Share));
  }

  /** Get calendars shared with me */
  async getSharedWithMe(): Promise<Share[]> {
    const user = auth.currentUser;
    if (!user) return [];

    // Query by email (covers pending shares) and by UID (covers accepted shares)
    const byEmail = query(
      collection(db, 'shares'),
      where('collaboratorEmail', '==', user.email),
    );
    const snap = await getDocs(byEmail);
    const shares = snap.docs.map((d) => ({ id: d.id, ...d.data() } as Share));

    // Claim any pending shares by setting collaboratorUid
    for (const share of shares) {
      if (!share.collaboratorUid) {
        // Update to deterministic ID: ownerUid_collaboratorUid
        const deterministicId = `${share.ownerUid}_${user.uid}`;
        if (share.id !== deterministicId) {
          // Create doc with deterministic ID, delete old one
          const { id: _, ...data } = share;
          await setDoc(doc(db, 'shares', deterministicId), {
            ...data,
            collaboratorUid: user.uid,
          });
          await deleteDoc(doc(db, 'shares', share.id));
          share.id = deterministicId;
        } else {
          await setDoc(doc(db, 'shares', share.id), { collaboratorUid: user.uid }, { merge: true });
        }
        share.collaboratorUid = user.uid;
      }
    }

    return shares;
  }

  /** Remove a share (owner only) */
  async removeShare(shareId: string): Promise<void> {
    await deleteDoc(doc(db, 'shares', shareId));
  }
}
