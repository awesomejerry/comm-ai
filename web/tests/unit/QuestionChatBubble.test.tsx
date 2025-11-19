import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import { QuestionChatBubble } from '../../src/components/QuestionChatBubble';
import type { Question } from '../../src/models/question';

describe('QuestionChatBubble', () => {
  const mockQuestion: Question = {
    id: '7a3e8400-e29b-41d4-a716-446655440001',
    text: 'Can you explain the main concept you presented?',
    order: 1,
    context: 'Based on your evaluation, you covered the introduction effectively.',
    evaluationId: '550e8400-e29b-41d4-a716-446655440000',
    createdAt: new Date('2025-11-10T14:30:00.000Z'),
  };

  describe('Rendering', () => {
    it('should render question text', () => {
      render(<QuestionChatBubble question={mockQuestion} />);

      expect(screen.getByText(mockQuestion.text)).toBeInTheDocument();
    });

    it('should render question number by default', () => {
      render(<QuestionChatBubble question={mockQuestion} />);

      const numberBadge = screen.getByLabelText('Question 1');
      expect(numberBadge).toBeInTheDocument();
      expect(numberBadge).toHaveTextContent('1');
    });

    it('should hide question number when showNumber is false', () => {
      render(<QuestionChatBubble question={mockQuestion} showNumber={false} />);

      expect(screen.queryByLabelText('Question 1')).not.toBeInTheDocument();
    });

    it('should render context when provided', () => {
      render(<QuestionChatBubble question={mockQuestion} />);

      expect(screen.getByText(/Based on your evaluation/)).toBeInTheDocument();
      expect(screen.getByText('Context:', { exact: false })).toBeInTheDocument();
    });

    it('should not render context section when context is undefined', () => {
      const questionWithoutContext: Question = {
        ...mockQuestion,
        context: undefined,
      };

      render(<QuestionChatBubble question={questionWithoutContext} />);

      expect(screen.queryByText('Context:', { exact: false })).not.toBeInTheDocument();
    });

    it('should render timestamp', () => {
      render(<QuestionChatBubble question={mockQuestion} />);

      // Should render a time (format may vary by locale)
      const timeRegex = /\d{1,2}:\d{2}/; // Matches time like "2:30" or "14:30"
      expect(screen.getByText(timeRegex)).toBeInTheDocument();
    });
  });

  describe('Accessibility', () => {
    it('should have proper ARIA role', () => {
      render(<QuestionChatBubble question={mockQuestion} />);

      const article = screen.getByRole('article');
      expect(article).toHaveAccessibleName('Question');
    });

    it('should have accessible question number label', () => {
      render(<QuestionChatBubble question={mockQuestion} />);

      const numberBadge = screen.getByLabelText(`Question ${mockQuestion.order}`);
      expect(numberBadge).toBeInTheDocument();
    });
  });

  describe('Styling', () => {
    it('should apply left-aligned chat bubble styles', () => {
      const { container } = render(<QuestionChatBubble question={mockQuestion} />);

      // Check for left alignment
      const wrapper = container.querySelector('.justify-start');
      expect(wrapper).toBeInTheDocument();
    });

    it('should apply blue/gray color scheme', () => {
      const { container } = render(<QuestionChatBubble question={mockQuestion} />);

      // Check for blue background
      const bubble = container.querySelector('.bg-blue-50');
      expect(bubble).toBeInTheDocument();

      // Check for blue border
      const border = container.querySelector('.border-blue-200');
      expect(border).toBeInTheDocument();
    });

    it('should limit width to 80%', () => {
      const { container } = render(<QuestionChatBubble question={mockQuestion} />);

      const content = container.querySelector('.max-w-\\[80\\%\\]');
      expect(content).toBeInTheDocument();
    });
  });

  describe('Edge Cases', () => {
    it('should handle very long question text', () => {
      const longQuestion: Question = {
        ...mockQuestion,
        text: 'A'.repeat(500),
      };

      render(<QuestionChatBubble question={longQuestion} />);

      expect(screen.getByText('A'.repeat(500))).toBeInTheDocument();
    });

    it('should handle question with order > 9', () => {
      const questionTen: Question = {
        ...mockQuestion,
        order: 10,
      };

      render(<QuestionChatBubble question={questionTen} />);

      const numberBadge = screen.getByLabelText('Question 10');
      expect(numberBadge).toHaveTextContent('10');
    });

    it('should handle empty context string', () => {
      const questionWithEmptyContext: Question = {
        ...mockQuestion,
        context: '',
      };

      render(<QuestionChatBubble question={questionWithEmptyContext} />);

      // Empty context should NOT render context section (empty string is falsy)
      expect(screen.queryByText('Context:', { exact: false })).not.toBeInTheDocument();
    });
  });
});
