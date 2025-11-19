import { atom } from 'jotai';
import type { Question } from './question';
import type { AudioAnswer } from './audioAnswer';

/**
 * Q&A Session Status
 * Represents the current state of a Q&A session
 */
export type SessionStatus = 'not-started' | 'active' | 'completed';

/**
 * Q&A Session
 * Represents a post-evaluation question and answer session
 */
export interface QASession {
  /** Unique identifier for the session */
  id: string;

  /** Links to completed evaluation (from evaluation API) */
  evaluationId: string;

  /** Array of LLM-generated questions (3-5 items) */
  questions: Question[];

  /** Map of questionId to audio answer */
  answers: Map<string, AudioAnswer>;

  /** Current question being viewed/answered (0-based) */
  currentQuestionIndex: number;

  /** Current session state */
  status: SessionStatus;

  /** Session creation timestamp */
  createdAt: Date;

  /** Last modification timestamp */
  updatedAt: Date;
}

/**
 * Validation: Check if session status transition is valid
 */
export function isValidStatusTransition(from: SessionStatus, to: SessionStatus): boolean {
  const transitions: Record<SessionStatus, SessionStatus[]> = {
    'not-started': ['active'],
    active: ['completed'],
    completed: [], // Cannot transition from completed
  };

  return transitions[from]?.includes(to) ?? false;
}

/**
 * Validation: Check if session is valid
 */
export function validateSession(session: QASession): string[] {
  const errors: string[] = [];

  // Validate question count
  if (session.questions.length < 3 || session.questions.length > 5) {
    errors.push('Session must have 3-5 questions');
  }

  // Validate current index
  if (
    session.currentQuestionIndex < 0 ||
    session.currentQuestionIndex >= session.questions.length
  ) {
    errors.push('Current question index must be within questions array bounds');
  }

  return errors;
}

// ============================================================================
// Jotai Atoms for State Management
// ============================================================================

/**
 * Current Q&A session
 */
export const currentQASessionAtom = atom<QASession | null>(null);

/**
 * Questions for current session
 */
export const questionsAtom = atom<Question[]>((get) => {
  const session = get(currentQASessionAtom);
  return session?.questions ?? [];
});

/**
 * Answers map (questionId -> AudioAnswer)
 */
export const answersAtom = atom<Map<string, AudioAnswer>>((get) => {
  const session = get(currentQASessionAtom);
  return session?.answers ?? new Map();
});

/**
 * Current question index
 */
const _currentQuestionIndexAtom = atom<number>(0);

export const currentQuestionIndexAtom = atom<number, [number], void>(
  (get) => {
    const session = get(currentQASessionAtom);
    return session?.currentQuestionIndex ?? get(_currentQuestionIndexAtom);
  },
  (get, set, newIndex: number) => {
    set(_currentQuestionIndexAtom, newIndex);
    const session = get(currentQASessionAtom);
    if (session) {
      set(currentQASessionAtom, {
        ...session,
        currentQuestionIndex: newIndex,
        updatedAt: new Date(),
      });
    }
  }
);

/**
 * Derived: Current question
 */
export const currentQuestionAtom = atom<Question | null>((get) => {
  const questions = get(questionsAtom);
  const index = get(currentQuestionIndexAtom);
  return questions[index] ?? null;
});

/**
 * Derived: Progress (answered count / total count)
 */
export const progressAtom = atom<{ answered: number; total: number }>((get) => {
  const questions = get(questionsAtom);
  const answers = get(answersAtom);

  const answered = questions.filter((q) => answers.has(q.id)).length;
  const total = questions.length;

  return { answered, total };
});

/**
 * Recording state (for current answer being recorded)
 */
export const isRecordingAtom = atom<boolean>(false);

/**
 * Current recording question ID (null if not recording)
 */
export const recordingQuestionIdAtom = atom<string | null>(null);
