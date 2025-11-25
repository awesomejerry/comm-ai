import { useAtomValue, useAtom } from 'jotai';
import { useState, useEffect, useRef } from 'react';
import {
  questionsAtom,
  answersAtom,
  currentQuestionIndexAtom,
  currentQuestionAtom,
  currentQASessionAtom,
} from '../models/qaSession';
import { QuestionChatBubble } from './QuestionChatBubble';
import { AnswerChatBubble } from './AnswerChatBubble';
import { AudioAnswerRecorder } from './AudioAnswerRecorder';
import { QAProgressTracker } from './QAProgressTracker';
import { QAInterfaceSkeleton } from './LoadingSkeleton';
import type { AudioFormat } from '../models/audioAnswer';
import { saveSession } from '../services/qaSessionStorage';
import { submitAnswerForRating } from '../services/qaService';

interface QAChatInterfaceProps {
  isLoading?: boolean;
  error?: string | null;
}

/**
 * QAChatInterface Component
 *
 * Main chat container that displays questions and handles audio recording
 */
export function QAChatInterface({ isLoading = false, error = null }: QAChatInterfaceProps) {
  const questions = useAtomValue(questionsAtom);
  const answers = useAtomValue(answersAtom);
  const currentQuestion = useAtomValue(currentQuestionAtom);
  const [currentQuestionIndex, setCurrentQuestionIndex] = useAtom(currentQuestionIndexAtom);
  const [session, setSession] = useAtom(currentQASessionAtom);
  const [submittingAnswerIds, setSubmittingAnswerIds] = useState<Set<string>>(new Set());
  const scrollAnchorRef = useRef<HTMLDivElement>(null);

  /**
   * Auto-scroll to current question when index changes
   */
  useEffect(() => {
    if (scrollAnchorRef.current) {
      scrollAnchorRef.current.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
    }
  }, [currentQuestionIndex]);

  /**
   * Handle navigation to next question
   */
  const handleNextQuestion = () => {
    if (currentQuestionIndex < questions.length - 1) {
      setCurrentQuestionIndex(currentQuestionIndex + 1);
    }
  };

  /**
   * Handle navigation to previous question
   */
  const handlePreviousQuestion = () => {
    if (currentQuestionIndex > 0) {
      setCurrentQuestionIndex(currentQuestionIndex - 1);
    }
  };

  /**
   * Keyboard navigation
   */
  useEffect(() => {
    const handleKeyPress = (e: KeyboardEvent) => {
      // Only handle arrow keys when not focused on an input/textarea
      if (
        document.activeElement?.tagName === 'INPUT' ||
        document.activeElement?.tagName === 'TEXTAREA' ||
        document.activeElement?.tagName === 'BUTTON'
      ) {
        return;
      }

      if (e.key === 'ArrowRight' || e.key === 'ArrowDown') {
        e.preventDefault();
        handleNextQuestion();
      } else if (e.key === 'ArrowLeft' || e.key === 'ArrowUp') {
        e.preventDefault();
        handlePreviousQuestion();
      }
    };

    window.addEventListener('keydown', handleKeyPress);
    return () => window.removeEventListener('keydown', handleKeyPress);
  }, [currentQuestionIndex, questions.length]);

  /**
   * Handle recording completion
   */
  const handleRecordingComplete = async (
    audioBlob: Blob,
    duration: number,
    format: AudioFormat
  ) => {
    if (!currentQuestion || !session) return;

    // Create audio answer
    const answer = {
      id: crypto.randomUUID(),
      questionId: currentQuestion.id,
      audioBlob,
      audioFormat: format,
      duration,
      uploadStatus: 'pending' as const,
      submittedAt: new Date(),
    };

    // Update session with new answer
    setSession((prevSession) => {
      if (!prevSession) return prevSession;

      const updatedAnswers = new Map(prevSession.answers);
      updatedAnswers.set(currentQuestion.id, answer);

      const updatedSession = {
        ...prevSession,
        answers: updatedAnswers,
        updatedAt: new Date(),
      };

      // Persist to IndexedDB
      saveSession(updatedSession).catch((err) => {
        console.error('Failed to save session:', err);
      });

      return updatedSession;
    });
  };

  /**
   * Handle answer submission for rating
   */
  const handleSubmitAnswer = async (answerId: string) => {
    if (!session) return;

    const answer = Array.from(session.answers.values()).find((a) => a.id === answerId);
    if (!answer) return;

    setSubmittingAnswerIds((prev) => {
      const next = new Set(prev);
      next.add(answerId);
      return next;
    });

    try {
      // Update status to uploading
      setSession((prevSession) => {
        if (!prevSession) return prevSession;
        const updatedAnswers = new Map(prevSession.answers);
        const currentAnswer = updatedAnswers.get(answer.questionId);
        if (!currentAnswer) return prevSession;

        updatedAnswers.set(answer.questionId, {
          ...currentAnswer,
          uploadStatus: 'uploading' as const,
        });

        const updatedSession = {
          ...prevSession,
          answers: updatedAnswers,
          updatedAt: new Date(),
        };

        saveSession(updatedSession).catch(console.error);
        return updatedSession;
      });

      // Submit answer for rating (synchronous response)
      const { answerId: serverAnswerId, rating } = await submitAnswerForRating(
        answer,
        session.evaluationId
      );

      // Update with server answer ID and rating
      setSession((prevSession) => {
        if (!prevSession) return prevSession;
        const updatedAnswers = new Map(prevSession.answers);
        const currentAnswer = updatedAnswers.get(answer.questionId);
        if (!currentAnswer) return prevSession;

        updatedAnswers.set(answer.questionId, {
          ...currentAnswer,
          answerId: serverAnswerId,
          uploadStatus: 'uploaded' as const,
          rating,
          ratedAt: rating.ratedAt,
        });

        const updatedSession = {
          ...prevSession,
          answers: updatedAnswers,
          updatedAt: new Date(),
        };

        saveSession(updatedSession).catch(console.error);
        return updatedSession;
      });
    } catch (err) {
      console.error('Failed to submit answer:', err);

      // Update status to error
      setSession((prevSession) => {
        if (!prevSession) return prevSession;
        const updatedAnswers = new Map(prevSession.answers);
        const currentAnswer = updatedAnswers.get(answer.questionId);
        if (!currentAnswer) return prevSession;

        updatedAnswers.set(answer.questionId, {
          ...currentAnswer,
          uploadStatus: 'error' as const,
        });

        const errorSession = {
          ...prevSession,
          answers: updatedAnswers,
          updatedAt: new Date(),
        };

        saveSession(errorSession).catch(console.error);
        return errorSession;
      });
    } finally {
      setSubmittingAnswerIds((prev) => {
        const next = new Set(prev);
        next.delete(answerId);
        return next;
      });
    }
  };

  if (isLoading) {
    return <QAInterfaceSkeleton />;
  }

  if (error) {
    return (
      <div
        className="flex-1 flex items-center justify-center p-8"
        role="alert"
        aria-live="assertive"
      >
        <div className="bg-red-50 border border-red-200 rounded-lg p-6 max-w-md">
          <div className="flex items-start gap-3">
            <svg
              className="w-6 h-6 text-red-600 flex-shrink-0 mt-0.5"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
              aria-hidden="true"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
              />
            </svg>
            <div>
              <h3 className="text-red-900 font-medium mb-1">Error Loading Questions</h3>
              <p className="text-red-700 text-sm">{error}</p>
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (questions.length === 0) {
    return (
      <div
        className="flex-1 flex items-center justify-center p-8"
        role="status"
        aria-label="No questions available"
      >
        <div className="text-center text-gray-500">
          <svg
            className="w-16 h-16 mx-auto mb-4 text-gray-300"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
            aria-hidden="true"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z"
            />
          </svg>
          <p>No questions available</p>
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col h-full" role="main" aria-label="Q&A Session">
      {/* Progress tracker header */}
      <div
        className="border-b border-gray-200 p-4 bg-white"
        role="region"
        aria-label="Progress tracker"
      >
        <QAProgressTracker />
      </div>

      {/* Chat messages area */}
      <div
        className="flex-1 overflow-y-auto p-6 space-y-4"
        role="feed"
        aria-label="Questions and answers"
        aria-busy={submittingAnswerIds.size > 0}
      >
        {/* Questions and answers list */}
        {questions.map((question, index) => (
          <div
            key={question.id}
            ref={index === currentQuestionIndex ? scrollAnchorRef : null}
            role="article"
            aria-label={`Question ${question.order} ${index === currentQuestionIndex ? '(current)' : ''}`}
          >
            <QuestionChatBubble question={question} showNumber={true} />

            {/* Show answer if it exists */}
            {answers.has(question.id) && (
              <AnswerChatBubble
                answer={answers.get(question.id)!}
                showNumber={true}
                questionOrder={question.order}
                onSubmit={() => handleSubmitAnswer(answers.get(question.id)!.id)}
                isSubmitting={submittingAnswerIds.has(answers.get(question.id)!.id)}
              />
            )}
          </div>
        ))}

        {/* Scroll anchor for auto-scroll */}
        <div id="chat-scroll-anchor" aria-hidden="true" />
      </div>

      {/* Navigation buttons */}
      {questions.length > 1 && (
        <nav className="border-t border-gray-200 p-4 bg-white" aria-label="Question navigation">
          <div className="max-w-4xl mx-auto flex items-center justify-between">
            <button
              onClick={handlePreviousQuestion}
              disabled={currentQuestionIndex === 0}
              className="px-4 py-2 bg-gray-100 text-gray-700 rounded-md hover:bg-gray-200 disabled:bg-gray-50 disabled:text-gray-400 disabled:cursor-not-allowed font-medium transition-colors flex items-center gap-2"
              aria-label={`Previous question${currentQuestionIndex === 0 ? ' (unavailable)' : ''}`}
            >
              <svg
                className="w-4 h-4"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
                aria-hidden="true"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M15 19l-7-7 7-7"
                />
              </svg>
              Previous
            </button>

            <span className="text-sm text-gray-600" aria-live="polite" aria-atomic="true">
              Question {currentQuestionIndex + 1} of {questions.length}
            </span>

            <button
              onClick={handleNextQuestion}
              disabled={currentQuestionIndex === questions.length - 1}
              className="px-4 py-2 bg-gray-100 text-gray-700 rounded-md hover:bg-gray-200 disabled:bg-gray-50 disabled:text-gray-400 disabled:cursor-not-allowed font-medium transition-colors flex items-center gap-2"
              aria-label={`Next question${currentQuestionIndex === questions.length - 1 ? ' (unavailable)' : ''}`}
            >
              Next
              <svg
                className="w-4 h-4"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
                aria-hidden="true"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M9 5l7 7-7 7"
                />
              </svg>
            </button>
          </div>
        </nav>
      )}

      {/* Recording input area (only show for current question without answer) */}
      {currentQuestion && !answers.has(currentQuestion.id) && (
        <section
          className="border-t border-gray-200 p-4 bg-gray-50"
          role="region"
          aria-label={`Recording area for question ${currentQuestion.order}`}
        >
          <div className="max-w-4xl mx-auto">
            <p className="text-sm text-gray-600 mb-3" id={`recording-label-${currentQuestion.id}`}>
              Recording answer for Question {currentQuestion.order}
            </p>
            <AudioAnswerRecorder
              questionId={currentQuestion.id}
              onRecordingComplete={handleRecordingComplete}
            />
          </div>
        </section>
      )}
    </div>
  );
}
