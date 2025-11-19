import React from 'react';
import { AnswerRating } from '../models/audioAnswer';

export interface RatingDisplayProps {
  rating: AnswerRating;
  compact?: boolean;
}

/**
 * RatingDisplay component - displays answer rating with score and feedback
 *
 * Features:
 * - Score badge (0-100) with color-coded styling
 * - Feedback text display
 * - Timestamp of when rating was received
 * - Optional compact mode for inline display
 *
 * @param rating - The rating object containing score, feedback, and ratedAt
 * @param compact - If true, uses more condensed layout (default: false)
 */
export const RatingDisplay: React.FC<RatingDisplayProps> = ({ rating, compact = false }) => {
  // Color-code score badge based on score value
  const getScoreColorClasses = (score: number): string => {
    if (score >= 80) {
      return 'bg-green-600 text-white';
    } else if (score >= 60) {
      return 'bg-yellow-500 text-white';
    } else if (score >= 40) {
      return 'bg-orange-500 text-white';
    } else {
      return 'bg-red-600 text-white';
    }
  };

  if (compact) {
    // Compact mode: score badge + truncated feedback (single line)
    return (
      <div className="flex items-center gap-2" data-testid="rating-display-compact">
        <span
          className={`px-2 py-1 rounded text-xs font-bold ${getScoreColorClasses(rating.score)}`}
          aria-label={`Score: ${rating.score} out of 100`}
        >
          {rating.score}/100
        </span>
        <span className="text-xs text-gray-600 truncate" title={rating.feedback}>
          {rating.feedback}
        </span>
      </div>
    );
  }

  // Full mode: score badge + full feedback + timestamp
  return (
    <div className="space-y-2" data-testid="rating-display-full">
      <div className="flex items-center gap-2">
        <span className="text-sm font-semibold text-gray-700">Rating:</span>
        <span
          className={`px-3 py-1 rounded-md text-sm font-bold ${getScoreColorClasses(rating.score)}`}
          aria-label={`Score: ${rating.score} out of 100`}
        >
          {rating.score}/100
        </span>
      </div>

      <p className="text-sm text-gray-700 leading-relaxed">{rating.feedback}</p>

      <p className="text-xs text-gray-500">Rated {rating.ratedAt.toLocaleString()}</p>
    </div>
  );
};
