import { useEffect, useState, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useAtom } from 'jotai';
import { currentQASessionAtom } from '../models/qaSession';
import { generateQuestions } from '../services/qaService';
import { saveSession, loadSessionByEvaluationId } from '../services/qaSessionStorage';
import { QAChatInterface } from '../components/QAChatInterface';
import type { QASession } from '../models/qaSession';

const MAX_RETRY_ATTEMPTS = 3;

/**
 * QAPage Component
 *
 * Main Q&A phase page that handles:
 * - Session loading/creation
 * - Question generation with retry and fallback
 * - IndexedDB persistence
 * - Error handling
 */
export function QAPage() {
  const { evaluationId } = useParams<{ evaluationId: string }>();
  const navigate = useNavigate();
  const [session, setSession] = useAtom(currentQASessionAtom);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [retryAttempt, setRetryAttempt] = useState(0);
  const lastEvalIdRef = useRef<string | null>(null);

  useEffect(() => {
    if (!evaluationId) {
      setError('No evaluation ID provided');
      setIsLoading(false);
      return;
    }

    if (lastEvalIdRef.current === evaluationId) {
      // Already loaded this evaluation in the current mount cycle
      return;
    }

    lastEvalIdRef.current = evaluationId;
    loadOrCreateSession(evaluationId);
  }, [evaluationId]);

  /**
   * Load existing session or create new one
   */
  const loadOrCreateSession = async (evalId: string) => {
    try {
      setIsLoading(true);
      setError(null);

      // Try to load existing session
      const existingSession = await loadSessionByEvaluationId(evalId);

      if (existingSession) {
        // Found existing session
        setSession(existingSession);
        setIsLoading(false);
        return;
      }

      // No existing session, create new one
      await createNewSession(evalId);
    } catch (err) {
      console.error('Error loading session:', err);
      setError(
        err instanceof Error ? err.message : 'Failed to load Q&A session. Please try again.'
      );
      setIsLoading(false);
    }
  };

  /**
   * Create new Q&A session and generate questions
   */
  const createNewSession = async (evalId: string) => {
    try {
      // Generate questions from n8n API
      const questions = await generateQuestions(evalId);

      if (questions.length < 3 || questions.length > 5) {
        throw new Error('Invalid number of questions received');
      }

      // Create new session
      const newSession: QASession = {
        id: crypto.randomUUID(),
        evaluationId: evalId,
        questions,
        answers: new Map(),
        currentQuestionIndex: 0,
        status: 'active',
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      // Save to IndexedDB
      await saveSession(newSession);

      // Update state
      setSession(newSession);
      setIsLoading(false);
      setRetryAttempt(0); // Reset retry count on success
    } catch (err) {
      console.error('Error creating session:', err);

      // Retry logic
      if (retryAttempt < MAX_RETRY_ATTEMPTS) {
        setRetryAttempt((prev) => prev + 1);
        setError(
          `Failed to generate questions (attempt ${retryAttempt + 1}/${MAX_RETRY_ATTEMPTS}). Retrying...`
        );

        // Exponential backoff
        const delay = Math.pow(2, retryAttempt) * 1000;
        setTimeout(() => {
          createNewSession(evalId);
        }, delay);
      } else {
        // Max retries exceeded
        setError(
          'Failed to generate questions after multiple attempts. The question generation service may be unavailable. Please try again later.'
        );
        setIsLoading(false);
      }
    }
  };

  /**
   * Manual retry handler
   */
  const handleRetry = () => {
    if (evaluationId) {
      setRetryAttempt(0);
      loadOrCreateSession(evaluationId);
    }
  };

  /**
   * Navigate back to evaluation results
   */
  const handleBack = () => {
    navigate(-1);
  };

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col">
      {/* Header */}
      <header className="bg-white border-b border-gray-200 px-6 py-4">
        <div className="max-w-4xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-4">
            <button
              onClick={handleBack}
              className="text-gray-600 hover:text-gray-900 transition-colors"
              aria-label="Go back"
            >
              <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M15 19l-7-7 7-7"
                />
              </svg>
            </button>
            <h1 className="text-2xl font-bold text-gray-900">Q&A Phase</h1>
          </div>

          {session && (
            <div className="text-sm text-gray-600">
              {session.questions.length} {session.questions.length === 1 ? 'question' : 'questions'}
            </div>
          )}
        </div>
      </header>

      {/* Main content */}
      <main className="flex-1 max-w-4xl w-full mx-auto flex flex-col bg-white shadow-sm">
        <QAChatInterface isLoading={isLoading} error={error} />

        {/* Retry button on error */}
        {error && !isLoading && (
          <div className="p-4 border-t border-gray-200 flex justify-center">
            <button
              onClick={handleRetry}
              className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors font-medium"
            >
              Retry
            </button>
          </div>
        )}
      </main>

      {/* Footer */}
      <footer className="bg-white border-t border-gray-200 px-6 py-4">
        <div className="max-w-4xl mx-auto text-center text-sm text-gray-500">
          {session?.status === 'active' ? (
            <p>Review the questions above and prepare your answers</p>
          ) : (
            <p>Loading your personalized questions...</p>
          )}
        </div>
      </footer>
    </div>
  );
}
