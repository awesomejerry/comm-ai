/**
 * RecordingPersistence
 *
 * Manages local storage of presentation recordings using IndexedDB.
 * Recordings are stored for 7 days before automatic cleanup.
 */

import { openDB, type IDBPDatabase } from 'idb';

const DB_NAME = 'presentModeRecordings';
const STORE_NAME = 'recordings';
const DB_VERSION = 1;
const RETENTION_DAYS = 7;

export interface PersistedRecording {
  id: string;
  blob: Blob;
  timestamps: string; // JSON string of SlideTimestamps
  createdAt: Date;
  expiresAt: Date;
}

export class RecordingPersistence {
  private dbPromise: Promise<IDBPDatabase>;

  constructor() {
    this.dbPromise = this.initDB();
  }

  private async initDB(): Promise<IDBPDatabase> {
    return openDB(DB_NAME, DB_VERSION, {
      upgrade(db) {
        if (!db.objectStoreNames.contains(STORE_NAME)) {
          const store = db.createObjectStore(STORE_NAME, { keyPath: 'id' });
          store.createIndex('expiresAt', 'expiresAt');
        }
      },
    });
  }

  /**
   * Save a recording to IndexedDB with 7-day expiry
   * @param blob - Audio recording blob
   * @param timestamps - JSON string of slide timestamps
   * @returns Unique ID of the saved recording
   */
  async saveRecording(blob: Blob, timestamps: string): Promise<string> {
    const db = await this.dbPromise;
    const id = crypto.randomUUID();
    const createdAt = new Date();
    const expiresAt = new Date(createdAt);
    expiresAt.setDate(expiresAt.getDate() + RETENTION_DAYS);

    const recording: PersistedRecording = {
      id,
      blob,
      timestamps,
      createdAt,
      expiresAt,
    };

    await db.put(STORE_NAME, recording);
    console.log(`[RecordingPersistence] Saved recording ${id}, expires ${expiresAt.toISOString()}`);
    return id;
  }

  /**
   * Retrieve a recording by ID
   * @param id - Recording ID
   * @returns Recording object or null if not found
   */
  async getRecording(id: string): Promise<PersistedRecording | null> {
    const db = await this.dbPromise;
    const recording = await db.get(STORE_NAME, id);
    return recording || null;
  }

  /**
   * Get all stored recordings
   * @returns Array of all recordings
   */
  async getAllRecordings(): Promise<PersistedRecording[]> {
    const db = await this.dbPromise;
    return db.getAll(STORE_NAME);
  }

  /**
   * Delete a recording by ID
   * @param id - Recording ID to delete
   */
  async deleteRecording(id: string): Promise<void> {
    const db = await this.dbPromise;
    await db.delete(STORE_NAME, id);
    console.log(`[RecordingPersistence] Deleted recording ${id}`);
  }

  /**
   * Remove recordings that have expired (older than 7 days)
   * @returns Number of recordings deleted
   */
  async cleanupExpired(): Promise<number> {
    const db = await this.dbPromise;
    const now = new Date();
    const allRecordings = await db.getAll(STORE_NAME);

    let deletedCount = 0;
    for (const recording of allRecordings) {
      if (recording.expiresAt < now) {
        await db.delete(STORE_NAME, recording.id);
        deletedCount++;
      }
    }

    if (deletedCount > 0) {
      console.log(`[RecordingPersistence] Cleaned up ${deletedCount} expired recordings`);
    }
    return deletedCount;
  }

  /**
   * Delete all recordings (used for testing and cleanup)
   */
  async clear(): Promise<void> {
    const db = await this.dbPromise;
    await db.clear(STORE_NAME);
  }

  /**
   * Internal method to update a recording (used in tests)
   * @private
   */
  private async updateRecording(recording: PersistedRecording): Promise<void> {
    const db = await this.dbPromise;
    await db.put(STORE_NAME, recording);
  }
}
