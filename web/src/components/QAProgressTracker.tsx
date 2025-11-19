import React from 'react';
import { useAtomValue } from 'jotai';
import { questionsAtom, answersAtom, progressAtom } from '../models/qaSession';

interface QAProgressTrackerProps {
  /** Whether to show as compact inline display */
  compact?: boolean;
}

/**
 * QAProgressTracker Component
 *
 * Displays progress through Q&A questions with visual indicators
 * - Shows X of Y questions completed
 * - Visual progress bar or indicator dots
 * - Distinguishes answered vs unanswered questions
 */
export const QAProgressTracker: React.FC<QAProgressTrackerProps> = ({ compact = false }) => {
  const questions = useAtomValue(questionsAtom);
  const answers = useAtomValue(answersAtom);
  const progress = useAtomValue(progressAtom);

  if (questions.length === 0) {
    return null;
  }

  const completionPercentage =
    questions.length > 0 ? Math.round((progress.answered / progress.total) * 100) : 0;

  if (compact) {
    // Compact mode: just text summary
    return (
      <div
        className="flex items-center gap-2 text-sm text-gray-600"
        data-testid="progress-tracker-compact"
      >
        <span className="font-medium">
          {progress.answered} of {progress.total} answered
        </span>
        <span className="text-gray-400">({completionPercentage}%)</span>
      </div>
    );
  }

  // Full mode: progress bar + indicators
  return (
    <div className="space-y-3" data-testid="progress-tracker-full">
      {/* Text summary */}
      <div className="flex items-center justify-between">
        <span className="text-sm font-semibold text-gray-700">Question Progress</span>
        <span className="text-sm text-gray-600">
          {progress.answered} of {progress.total} answered
        </span>
      </div>

      {/* Progress bar */}
      <div className="relative">
        <div className="h-2 bg-gray-200 rounded-full overflow-hidden">
          <div
            className="h-full bg-blue-600 transition-all duration-500 ease-out"
            style={{ width: `${completionPercentage}%` }}
            role="progressbar"
            aria-valuenow={progress.answered}
            aria-valuemin={0}
            aria-valuemax={progress.total}
            aria-label={`${progress.answered} of ${progress.total} questions answered`}
          />
        </div>
      </div>

      {/* Question indicators (dots) */}
      <div className="flex items-center gap-2" role="list" aria-label="Question status indicators">
        {questions.map((question) => {
          const isAnswered = answers.has(question.id);

          return (
            <div
              key={question.id}
              className={`
                w-8 h-8 rounded-full flex items-center justify-center text-xs font-semibold
                transition-colors duration-200
                ${isAnswered ? 'bg-green-600 text-white' : 'bg-gray-200 text-gray-600'}
              `}
              role="listitem"
              aria-label={`Question ${question.order}${isAnswered ? ' - answered' : ' - not answered'}`}
              title={`Question ${question.order}: ${question.text.substring(0, 50)}...`}
            >
              {isAnswered ? (
                <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                  <path
                    fillRule="evenodd"
                    d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z"
                    clipRule="evenodd"
                  />
                </svg>
              ) : (
                question.order
              )}
            </div>
          );
        })}
      </div>

      {/* Completion message */}
      {progress.answered === progress.total && progress.total > 0 && (
        <div className="mt-4 p-3 bg-green-50 border border-green-200 rounded-md" role="status">
          <div className="flex items-center gap-2">
            <svg
              className="w-5 h-5 text-green-600 flex-shrink-0"
              fill="currentColor"
              viewBox="0 0 20 20"
            >
              <path
                fillRule="evenodd"
                d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z"
                clipRule="evenodd"
              />
            </svg>
            <div>
              <p className="text-sm font-medium text-green-800">All questions answered!</p>
              <p className="text-xs text-green-700 mt-0.5">
                Great work completing the Q&A session.
              </p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
