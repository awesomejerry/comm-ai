import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import { RatingDisplay } from '../../src/components/RatingDisplay';
import type { AnswerRating } from '../../src/models/audioAnswer';

describe('RatingDisplay', () => {
  const mockRating: AnswerRating = {
    score: 85,
    feedback: 'Great answer! You covered all the key points with clear examples.',
    ratedAt: new Date('2025-11-10T14:30:00Z'),
  };

  describe('Full Mode (default)', () => {
    it('should render rating score with badge', () => {
      render(<RatingDisplay rating={mockRating} />);

      const scoreBadge = screen.getByLabelText('Score: 85 out of 100');
      expect(scoreBadge).toBeInTheDocument();
      expect(scoreBadge).toHaveTextContent('85/100');
    });

    it('should render feedback text', () => {
      render(<RatingDisplay rating={mockRating} />);

      const feedback = screen.getByText(
        'Great answer! You covered all the key points with clear examples.'
      );
      expect(feedback).toBeInTheDocument();
    });

    it('should render timestamp', () => {
      render(<RatingDisplay rating={mockRating} />);

      // Timestamp will be localized, so just check it exists
      const timestamp = screen.getByText(/Rated/);
      expect(timestamp).toBeInTheDocument();
    });

    it('should render "Rating:" label', () => {
      render(<RatingDisplay rating={mockRating} />);

      const label = screen.getByText('Rating:');
      expect(label).toBeInTheDocument();
    });

    it('should use full layout data attribute', () => {
      const { container } = render(<RatingDisplay rating={mockRating} />);

      const displayElement = container.querySelector('[data-testid="rating-display-full"]');
      expect(displayElement).toBeInTheDocument();
    });
  });

  describe('Compact Mode', () => {
    it('should render score badge in compact mode', () => {
      render(<RatingDisplay rating={mockRating} compact={true} />);

      const scoreBadge = screen.getByLabelText('Score: 85 out of 100');
      expect(scoreBadge).toBeInTheDocument();
      expect(scoreBadge).toHaveTextContent('85/100');
    });

    it('should render truncated feedback in compact mode', () => {
      render(<RatingDisplay rating={mockRating} compact={true} />);

      const feedback = screen.getByText(
        'Great answer! You covered all the key points with clear examples.'
      );
      expect(feedback).toBeInTheDocument();
      expect(feedback).toHaveClass('truncate');
    });

    it('should NOT render timestamp in compact mode', () => {
      render(<RatingDisplay rating={mockRating} compact={true} />);

      const timestamp = screen.queryByText(/Rated/);
      expect(timestamp).not.toBeInTheDocument();
    });

    it('should NOT render "Rating:" label in compact mode', () => {
      render(<RatingDisplay rating={mockRating} compact={true} />);

      const label = screen.queryByText('Rating:');
      expect(label).not.toBeInTheDocument();
    });

    it('should use compact layout data attribute', () => {
      const { container } = render(<RatingDisplay rating={mockRating} compact={true} />);

      const displayElement = container.querySelector('[data-testid="rating-display-compact"]');
      expect(displayElement).toBeInTheDocument();
    });
  });

  describe('Score Color Coding', () => {
    it('should use green color for high scores (80+)', () => {
      const highScoreRating = { ...mockRating, score: 85 };
      render(<RatingDisplay rating={highScoreRating} />);

      const scoreBadge = screen.getByLabelText('Score: 85 out of 100');
      expect(scoreBadge).toHaveClass('bg-green-600');
    });

    it('should use yellow color for good scores (60-79)', () => {
      const goodScoreRating = { ...mockRating, score: 70 };
      render(<RatingDisplay rating={goodScoreRating} />);

      const scoreBadge = screen.getByLabelText('Score: 70 out of 100');
      expect(scoreBadge).toHaveClass('bg-yellow-500');
    });

    it('should use orange color for fair scores (40-59)', () => {
      const fairScoreRating = { ...mockRating, score: 50 };
      render(<RatingDisplay rating={fairScoreRating} />);

      const scoreBadge = screen.getByLabelText('Score: 50 out of 100');
      expect(scoreBadge).toHaveClass('bg-orange-500');
    });

    it('should use red color for low scores (< 40)', () => {
      const lowScoreRating = { ...mockRating, score: 30 };
      render(<RatingDisplay rating={lowScoreRating} />);

      const scoreBadge = screen.getByLabelText('Score: 30 out of 100');
      expect(scoreBadge).toHaveClass('bg-red-600');
    });

    it('should handle edge case score of 80 as green', () => {
      const edgeScoreRating = { ...mockRating, score: 80 };
      render(<RatingDisplay rating={edgeScoreRating} />);

      const scoreBadge = screen.getByLabelText('Score: 80 out of 100');
      expect(scoreBadge).toHaveClass('bg-green-600');
    });

    it('should handle edge case score of 60 as yellow', () => {
      const edgeScoreRating = { ...mockRating, score: 60 };
      render(<RatingDisplay rating={edgeScoreRating} />);

      const scoreBadge = screen.getByLabelText('Score: 60 out of 100');
      expect(scoreBadge).toHaveClass('bg-yellow-500');
    });

    it('should handle edge case score of 40 as orange', () => {
      const edgeScoreRating = { ...mockRating, score: 40 };
      render(<RatingDisplay rating={edgeScoreRating} />);

      const scoreBadge = screen.getByLabelText('Score: 40 out of 100');
      expect(scoreBadge).toHaveClass('bg-orange-500');
    });

    it('should handle score of 0 as red', () => {
      const zeroScoreRating = { ...mockRating, score: 0 };
      render(<RatingDisplay rating={zeroScoreRating} />);

      const scoreBadge = screen.getByLabelText('Score: 0 out of 100');
      expect(scoreBadge).toHaveClass('bg-red-600');
    });

    it('should handle perfect score of 100 as green', () => {
      const perfectScoreRating = { ...mockRating, score: 100 };
      render(<RatingDisplay rating={perfectScoreRating} />);

      const scoreBadge = screen.getByLabelText('Score: 100 out of 100');
      expect(scoreBadge).toHaveClass('bg-green-600');
    });
  });

  describe('Accessibility', () => {
    it('should have aria-label for score badge', () => {
      render(<RatingDisplay rating={mockRating} />);

      const scoreBadge = screen.getByLabelText('Score: 85 out of 100');
      expect(scoreBadge).toHaveAttribute('aria-label', 'Score: 85 out of 100');
    });

    it('should have title attribute for truncated feedback in compact mode', () => {
      render(<RatingDisplay rating={mockRating} compact={true} />);

      const feedback = screen.getByText(
        'Great answer! You covered all the key points with clear examples.'
      );
      expect(feedback).toHaveAttribute(
        'title',
        'Great answer! You covered all the key points with clear examples.'
      );
    });
  });

  describe('Edge Cases', () => {
    it('should handle very long feedback text', () => {
      const longFeedback = 'A'.repeat(300);
      const longFeedbackRating = { ...mockRating, feedback: longFeedback };

      render(<RatingDisplay rating={longFeedbackRating} />);

      const feedback = screen.getByText(longFeedback);
      expect(feedback).toBeInTheDocument();
    });

    it('should handle short feedback text', () => {
      const shortFeedbackRating = { ...mockRating, feedback: 'Good!' };

      render(<RatingDisplay rating={shortFeedbackRating} />);

      const feedback = screen.getByText('Good!');
      expect(feedback).toBeInTheDocument();
    });

    it('should handle empty feedback gracefully', () => {
      const emptyFeedbackRating = { ...mockRating, feedback: '' };

      render(<RatingDisplay rating={emptyFeedbackRating} />);

      // Component should still render score and timestamp
      const scoreBadge = screen.getByLabelText('Score: 85 out of 100');
      expect(scoreBadge).toBeInTheDocument();
    });
  });
});
