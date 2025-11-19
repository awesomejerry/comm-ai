import { openDB, type IDBPDatabase } from 'idb';
import type { QASession } from '../models/qaSession';
import type { AudioAnswer } from '../models/audioAnswer';
import type { Question } from '../models/question';

// ============================================================================
// Database Configuration
// ============================================================================

const DB_NAME = 'commAI';
const DB_VERSION = 3; // Increment from existing version
const QA_SESSIONS_STORE = 'qaSessions';
const AUDIO_ANSWERS_STORE = 'audioAnswers';

// Retention policy
const SESSION_RETENTION_DAYS = 7;
const ANSWER_RETENTION_DAYS = 7;

// ============================================================================
// Database Initialization
// ============================================================================

/**
 * Initialize IndexedDB database with Q&A stores
 */
async function initDB(): Promise<IDBPDatabase> {
  return openDB(DB_NAME, DB_VERSION, {
    upgrade(db, oldVersion, newVersion) {
      // Create qaSessions store if it doesn't exist
      if (!db.objectStoreNames.contains(QA_SESSIONS_STORE)) {
        const qaSessionStore = db.createObjectStore(QA_SESSIONS_STORE, {
          keyPath: 'id',
        });
        qaSessionStore.createIndex('evaluationId', 'evaluationId', { unique: false });
        qaSessionStore.createIndex('status', 'status', { unique: false });
        qaSessionStore.createIndex('createdAt', 'createdAt', { unique: false });
      }

      // Create audioAnswers store if it doesn't exist
      if (!db.objectStoreNames.contains(AUDIO_ANSWERS_STORE)) {
        const audioAnswersStore = db.createObjectStore(AUDIO_ANSWERS_STORE, {
          keyPath: 'id',
        });
        audioAnswersStore.createIndex('questionId', 'questionId', { unique: false });
        audioAnswersStore.createIndex('uploadStatus', 'uploadStatus', { unique: false });
        audioAnswersStore.createIndex('submittedAt', 'submittedAt', { unique: false });
      }
    },
  });
}

// ============================================================================
// Serialization Helpers
// ============================================================================

interface SerializedQASession {
  id: string;
  evaluationId: string;
  questions: Question[];
  answers: Array<[string, AudioAnswer]>; // Map serialized as array of tuples
  currentQuestionIndex: number;
  status: string;
  createdAt: string;
  updatedAt: string;
}

/**
 * Convert QASession to serializable format
 */
function serializeSession(session: QASession): SerializedQASession {
  return {
    id: session.id,
    evaluationId: session.evaluationId,
    questions: session.questions,
    answers: Array.from(session.answers.entries()),
    currentQuestionIndex: session.currentQuestionIndex,
    status: session.status,
    createdAt: session.createdAt.toISOString(),
    updatedAt: session.updatedAt.toISOString(),
  };
}

/**
 * Convert serialized data to QASession
 */
function deserializeSession(data: SerializedQASession): QASession {
  return {
    id: data.id,
    evaluationId: data.evaluationId,
    questions: data.questions.map((q) => ({
      ...q,
      createdAt: new Date(q.createdAt),
    })),
    answers: new Map(
      data.answers.map(([key, answer]) => [
        key,
        {
          ...answer,
          submittedAt: new Date(answer.submittedAt),
          ratedAt: answer.ratedAt ? new Date(answer.ratedAt) : undefined,
          rating: answer.rating
            ? {
                ...answer.rating,
                ratedAt: new Date(answer.rating.ratedAt),
              }
            : undefined,
        },
      ])
    ),
    currentQuestionIndex: data.currentQuestionIndex,
    status: data.status as QASession['status'],
    createdAt: new Date(data.createdAt),
    updatedAt: new Date(data.updatedAt),
  };
}

// ============================================================================
// Public API Functions
// ============================================================================

/**
 * Save Q&A session to IndexedDB
 *
 * @param session - QASession to save
 */
export async function saveSession(session: QASession): Promise<void> {
  try {
    const db = await initDB();
    const serialized = serializeSession(session);
    await db.put(QA_SESSIONS_STORE, serialized);
  } catch (error) {
    console.error('Error saving Q&A session:', error);
    throw new Error('Failed to save session');
  }
}

/**
 * Load Q&A session from IndexedDB by session ID
 *
 * @param sessionId - Session ID to load
 * @returns QASession if found, null otherwise
 */
export async function loadSession(sessionId: string): Promise<QASession | null> {
  try {
    const db = await initDB();
    const data = await db.get(QA_SESSIONS_STORE, sessionId);

    if (!data) {
      return null;
    }

    return deserializeSession(data as SerializedQASession);
  } catch (error) {
    console.error('Error loading Q&A session:', error);
    return null;
  }
}

/**
 * Load Q&A session from IndexedDB by evaluation ID
 *
 * @param evaluationId - Evaluation ID to find session for
 * @returns QASession if found, null otherwise
 */
export async function loadSessionByEvaluationId(evaluationId: string): Promise<QASession | null> {
  try {
    const db = await initDB();
    const tx = db.transaction(QA_SESSIONS_STORE, 'readonly');
    const index = tx.store.index('evaluationId');
    const data = await index.get(evaluationId);

    if (!data) {
      return null;
    }

    return deserializeSession(data as SerializedQASession);
  } catch (error) {
    console.error('Error loading Q&A session by evaluation ID:', error);
    return null;
  }
}

/**
 * Delete Q&A session from IndexedDB
 *
 * @param sessionId - Session ID to delete
 */
export async function deleteSession(sessionId: string): Promise<void> {
  try {
    const db = await initDB();
    await db.delete(QA_SESSIONS_STORE, sessionId);
  } catch (error) {
    console.error('Error deleting Q&A session:', error);
    throw new Error('Failed to delete session');
  }
}

/**
 * Save audio answer to IndexedDB
 *
 * @param answer - AudioAnswer to save
 */
export async function saveAudioAnswer(answer: AudioAnswer): Promise<void> {
  try {
    const db = await initDB();
    await db.put(AUDIO_ANSWERS_STORE, answer);
  } catch (error) {
    console.error('Error saving audio answer:', error);
    throw new Error('Failed to save audio answer');
  }
}

/**
 * Load audio answer from IndexedDB
 *
 * @param answerId - Answer ID to load
 * @returns AudioAnswer if found, null otherwise
 */
export async function loadAudioAnswer(answerId: string): Promise<AudioAnswer | null> {
  try {
    const db = await initDB();
    const answer = await db.get(AUDIO_ANSWERS_STORE, answerId);
    return answer || null;
  } catch (error) {
    console.error('Error loading audio answer:', error);
    return null;
  }
}

/**
 * Delete audio answer from IndexedDB
 *
 * @param answerId - Answer ID to delete
 */
export async function deleteAudioAnswer(answerId: string): Promise<void> {
  try {
    const db = await initDB();
    await db.delete(AUDIO_ANSWERS_STORE, answerId);
  } catch (error) {
    console.error('Error deleting audio answer:', error);
    throw new Error('Failed to delete audio answer');
  }
}

/**
 * Clean up old sessions and answers (7-day retention policy)
 */
export async function cleanup(): Promise<void> {
  try {
    const db = await initDB();
    const now = new Date();
    const sessionCutoff = new Date(now.getTime() - SESSION_RETENTION_DAYS * 24 * 60 * 60 * 1000);
    const answerCutoff = new Date(now.getTime() - ANSWER_RETENTION_DAYS * 24 * 60 * 60 * 1000);

    // Clean up old sessions
    const sessionsTx = db.transaction(QA_SESSIONS_STORE, 'readwrite');
    const sessionsIndex = sessionsTx.store.index('createdAt');
    let sessionsCursor = await sessionsIndex.openCursor();

    while (sessionsCursor) {
      const session = sessionsCursor.value as SerializedQASession;
      const createdAt = new Date(session.createdAt);

      if (createdAt < sessionCutoff) {
        await sessionsCursor.delete();
      }

      sessionsCursor = await sessionsCursor.continue();
    }

    await sessionsTx.done;

    // Clean up old answers (only uploaded ones)
    const answersTx = db.transaction(AUDIO_ANSWERS_STORE, 'readwrite');
    const answersIndex = answersTx.store.index('submittedAt');
    let answersCursor = await answersIndex.openCursor();

    while (answersCursor) {
      const answer = answersCursor.value as AudioAnswer;
      const submittedAt = new Date(answer.submittedAt);

      // Only delete uploaded answers (keep pending ones)
      if (submittedAt < answerCutoff && answer.uploadStatus === 'uploaded') {
        await answersCursor.delete();
      }

      answersCursor = await answersCursor.continue();
    }

    await answersTx.done;
  } catch (error) {
    console.error('Error during cleanup:', error);
    // Don't throw - cleanup is best-effort
  }
}

/**
 * Get all sessions (for debugging/admin)
 */
export async function getAllSessions(): Promise<QASession[]> {
  try {
    const db = await initDB();
    const data = await db.getAll(QA_SESSIONS_STORE);
    return data.map((d) => deserializeSession(d as SerializedQASession));
  } catch (error) {
    console.error('Error getting all sessions:', error);
    return [];
  }
}
