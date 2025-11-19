import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import { Provider, createStore } from 'jotai';
import { QAChatInterface } from '../../src/components/QAChatInterface';
import { currentQASessionAtom } from '../../src/models/qaSession';
import type { Question } from '../../src/models/question';
import type { QASession } from '../../src/models/qaSession';

// Mock QuestionChatBubble component
vi.mock('../../src/components/QuestionChatBubble', () => ({
  QuestionChatBubble: ({ question }: { question: Question }) => (
    <div data-testid={`question-${question.id}`}>{question.text}</div>
  ),
}));

beforeAll(() => {
  window.HTMLElement.prototype.scrollIntoView = vi.fn();
});

describe('QAChatInterface', () => {
  const mockQuestions: Question[] = [
    {
      id: '7a3e8400-e29b-41d4-a716-446655440001',
      text: 'Can you explain the main concept?',
      order: 1,
      evaluationId: '550e8400-e29b-41d4-a716-446655440000',
      createdAt: new Date('2025-11-10T14:30:00.000Z'),
    },
    {
      id: '7a3e8400-e29b-41d4-a716-446655440002',
      text: 'How would you improve this presentation?',
      order: 2,
      evaluationId: '550e8400-e29b-41d4-a716-446655440000',
      createdAt: new Date('2025-11-10T14:31:00.000Z'),
    },
    {
      id: '7a3e8400-e29b-41d4-a716-446655440000',
      text: 'What are the key takeaways?',
      order: 3,
      evaluationId: '550e8400-e29b-41d4-a716-446655440000',
      createdAt: new Date('2025-11-10T14:32:00.000Z'),
    },
  ];

  const createMockSession = (questions: Question[] = mockQuestions): QASession => ({
    id: 'test-session-id',
    evaluationId: '550e8400-e29b-41d4-a716-446655440000',
    questions,
    answers: new Map(),
    status: 'active' as const,
    currentQuestionIndex: 0,
    createdAt: new Date('2025-11-10T14:30:00.000Z'),
    updatedAt: new Date('2025-11-10T14:30:00.000Z'),
  });

  describe('Loading State', () => {
    it('should display loading indicator when isLoading is true', () => {
      const store = createStore();

      render(
        <Provider store={store}>
          <QAChatInterface isLoading={true} />
        </Provider>
      );

      expect(screen.getByLabelText('Loading progress')).toBeInTheDocument();
      expect(screen.getAllByRole('status')).toHaveLength(4);
    });

    it('should display spinner animation', () => {
      const store = createStore();

      const { container } = render(
        <Provider store={store}>
          <QAChatInterface isLoading={true} />
        </Provider>
      );

      const spinner = container.querySelector('.animate-pulse');
      expect(spinner).toBeInTheDocument();
    });

    it('should not render questions during loading', () => {
      const store = createStore();
      store.set(currentQASessionAtom, createMockSession());

      render(
        <Provider store={store}>
          <QAChatInterface isLoading={true} />
        </Provider>
      );

      expect(
        screen.queryByTestId('question-7a3e8400-e29b-41d4-a716-446655440001')
      ).not.toBeInTheDocument();
    });
  });

  describe('Error State', () => {
    it('should display error message when error prop is provided', () => {
      const errorMessage = 'Failed to generate questions. Network error.';
      const store = createStore();

      render(
        <Provider store={store}>
          <QAChatInterface error={errorMessage} />
        </Provider>
      );

      expect(screen.getByText(errorMessage)).toBeInTheDocument();
    });

    it('should apply error styling', () => {
      const store = createStore();
      const { container } = render(
        <Provider store={store}>
          <QAChatInterface error="Something went wrong" />
        </Provider>
      );

      const errorContainer = container.querySelector('.bg-red-50');
      expect(errorContainer).toBeInTheDocument();

      const errorIcon = container.querySelector('.text-red-600');
      expect(errorIcon).toBeInTheDocument();
    });

    it('should not render questions when error is present', () => {
      const store = createStore();
      store.set(currentQASessionAtom, createMockSession());

      render(
        <Provider store={store}>
          <QAChatInterface error="Error occurred" />
        </Provider>
      );

      expect(
        screen.queryByTestId('question-7a3e8400-e29b-41d4-a716-446655440001')
      ).not.toBeInTheDocument();
    });
  });

  describe('Empty State', () => {
    it('should display empty state when no questions available', () => {
      const store = createStore();

      render(
        <Provider store={store}>
          <QAChatInterface />
        </Provider>
      );

      expect(screen.getByText('No questions available')).toBeInTheDocument();
    });

    it('should display empty state icon', () => {
      const store = createStore();
      const { container } = render(
        <Provider store={store}>
          <QAChatInterface />
        </Provider>
      );

      const icon = container.querySelector('.text-gray-300');
      expect(icon).toBeInTheDocument();
    });

    it('should not display empty state when loading', () => {
      const store = createStore();

      render(
        <Provider store={store}>
          <QAChatInterface isLoading={true} />
        </Provider>
      );

      expect(screen.queryByText('No questions available')).not.toBeInTheDocument();
    });
  });

  describe('Questions Display', () => {
    it('should render all questions from atom', () => {
      const store = createStore();
      store.set(currentQASessionAtom, createMockSession());

      render(
        <Provider store={store}>
          <QAChatInterface />
        </Provider>
      );

      mockQuestions.forEach((question) => {
        expect(screen.getByTestId(`question-${question.id}`)).toBeInTheDocument();
      });
    });

    it('should render questions in order', () => {
      const store = createStore();
      store.set(currentQASessionAtom, createMockSession());

      const { container } = render(
        <Provider store={store}>
          <QAChatInterface />
        </Provider>
      );

      const questionElements = container.querySelectorAll('[data-testid^="question-"]');
      expect(questionElements).toHaveLength(3);

      expect(questionElements[0]).toHaveAttribute(
        'data-testid',
        'question-7a3e8400-e29b-41d4-a716-446655440001'
      );
      expect(questionElements[1]).toHaveAttribute(
        'data-testid',
        'question-7a3e8400-e29b-41d4-a716-446655440002'
      );
      expect(questionElements[2]).toHaveAttribute(
        'data-testid',
        'question-7a3e8400-e29b-41d4-a716-446655440000'
      );
    });

    it('should scroll to latest question anchor', () => {
      const store = createStore();
      store.set(currentQASessionAtom, createMockSession());

      const { container } = render(
        <Provider store={store}>
          <QAChatInterface />
        </Provider>
      );

      const scrollAnchor = container.querySelector('#chat-scroll-anchor');
      expect(scrollAnchor).toBeInTheDocument();
    });
  });

  describe('Accessibility', () => {
    it('should have proper ARIA role for chat feed', () => {
      const store = createStore();
      store.set(currentQASessionAtom, createMockSession());

      render(
        <Provider store={store}>
          <QAChatInterface />
        </Provider>
      );

      expect(screen.getByRole('feed')).toBeInTheDocument();
    });

    it('should have accessible loading state', () => {
      const store = createStore();

      render(
        <Provider store={store}>
          <QAChatInterface isLoading={true} />
        </Provider>
      );

      const status = screen.getByLabelText('Loading progress');
      expect(status).toHaveAccessibleName('Loading progress');
    });
  });

  describe('State Priority', () => {
    it('should prioritize loading state over error', () => {
      const store = createStore();

      render(
        <Provider store={store}>
          <QAChatInterface isLoading={true} error="Some error" />
        </Provider>
      );

      expect(screen.getByLabelText('Loading progress')).toBeInTheDocument();
      expect(screen.queryByText('Some error')).not.toBeInTheDocument();
    });

    it('should prioritize error state over empty', () => {
      const store = createStore();

      render(
        <Provider store={store}>
          <QAChatInterface error="Some error" />
        </Provider>
      );

      expect(screen.getByText('Some error')).toBeInTheDocument();
      expect(screen.queryByText('No questions available')).not.toBeInTheDocument();
    });

    it('should prioritize questions over empty state', () => {
      const store = createStore();
      store.set(currentQASessionAtom, createMockSession());

      render(
        <Provider store={store}>
          <QAChatInterface />
        </Provider>
      );

      expect(
        screen.getByTestId('question-7a3e8400-e29b-41d4-a716-446655440001')
      ).toBeInTheDocument();
      expect(screen.queryByText('No questions available')).not.toBeInTheDocument();
    });
  });

  describe('Edge Cases', () => {
    it('should handle single question', () => {
      const store = createStore();
      store.set(currentQASessionAtom, createMockSession([mockQuestions[0]]));

      render(
        <Provider store={store}>
          <QAChatInterface />
        </Provider>
      );

      expect(
        screen.getByTestId('question-7a3e8400-e29b-41d4-a716-446655440001')
      ).toBeInTheDocument();
      expect(
        screen.queryByTestId('question-7a3e8400-e29b-41d4-a716-446655440002')
      ).not.toBeInTheDocument();
    });

    it('should handle maximum 5 questions', () => {
      const fiveQuestions: Question[] = [...Array(5)].map((_, i) => ({
        id: `question-${i}`,
        text: `Question ${i + 1}`,
        order: i + 1,
        evaluationId: '550e8400-e29b-41d4-a716-446655440000',
        createdAt: new Date(),
      }));

      const store = createStore();
      store.set(currentQASessionAtom, createMockSession(fiveQuestions));

      render(
        <Provider store={store}>
          <QAChatInterface />
        </Provider>
      );

      fiveQuestions.forEach((question) => {
        expect(screen.getByTestId(`question-${question.id}`)).toBeInTheDocument();
      });
    });
  });
});
