import { describe, it, expect, beforeEach } from 'vitest';
import { render, screen } from '@testing-library/react';
import { Provider } from 'jotai';
import { useHydrateAtoms } from 'jotai/utils';
import { QAProgressTracker } from '../../src/components/QAProgressTracker';
import { currentQASessionAtom } from '../../src/models/qaSession';
import type { QASession } from '../../src/models/qaSession';
import type { Question } from '../../src/models/question';

// Test wrapper to provide Jotai atoms
const HydrateAtoms = ({ initialValues, children }: any) => {
  useHydrateAtoms(initialValues);
  return children;
};

const TestProvider = ({ initialValues, children }: any) => (
  <Provider>
    <HydrateAtoms initialValues={initialValues}>{children}</HydrateAtoms>
  </Provider>
);

describe('QAProgressTracker', () => {
  const mockQuestions: Question[] = [
    {
      id: 'q1',
      text: 'Question 1',
      order: 1,
      evaluationId: 'eval1',
      createdAt: new Date(),
    },
    {
      id: 'q2',
      text: 'Question 2',
      order: 2,
      evaluationId: 'eval1',
      createdAt: new Date(),
    },
    {
      id: 'q3',
      text: 'Question 3',
      order: 3,
      evaluationId: 'eval1',
      createdAt: new Date(),
    },
  ];

  describe('No Questions', () => {
    it('should not render when no questions exist', () => {
      const emptySession: QASession = {
        id: 'session1',
        evaluationId: 'eval1',
        questions: [],
        answers: new Map(),
        status: 'active',
        createdAt: new Date(),
        updatedAt: new Date(),
        currentQuestionIndex: 0,
      };

      const { container } = render(
        <TestProvider initialValues={[[currentQASessionAtom, emptySession]]}>
          <QAProgressTracker />
        </TestProvider>
      );

      expect(container.firstChild).toBeNull();
    });
  });

  describe('Full Mode (default)', () => {
    it('should render progress summary with 0 answers', () => {
      const session: QASession = {
        id: 'session1',
        evaluationId: 'eval1',
        questions: mockQuestions,
        answers: new Map(),
        status: 'active',
        createdAt: new Date(),
        updatedAt: new Date(),
        currentQuestionIndex: 0,
      };

      render(
        <TestProvider initialValues={[[currentQASessionAtom, session]]}>
          <QAProgressTracker />
        </TestProvider>
      );

      expect(screen.getByText('Question Progress')).toBeInTheDocument();
      expect(screen.getByText('0 of 3 answered')).toBeInTheDocument();
    });

    it('should render progress bar with correct percentage', () => {
      const session: QASession = {
        id: 'session1',
        evaluationId: 'eval1',
        questions: mockQuestions,
        answers: new Map([
          [
            'q1',
            {
              id: 'a1',
              questionId: 'q1',
              audioBlob: new Blob(),
              audioFormat: 'webm',
              duration: 30,
              uploadStatus: 'pending',
              submittedAt: new Date(),
            },
          ],
        ]),
        status: 'active',
        createdAt: new Date(),
        updatedAt: new Date(),
        currentQuestionIndex: 0,
      };

      render(
        <TestProvider initialValues={[[currentQASessionAtom, session]]}>
          <QAProgressTracker />
        </TestProvider>
      );

      const progressBar = screen.getByRole('progressbar');
      expect(progressBar).toBeInTheDocument();
      expect(progressBar).toHaveAttribute('aria-valuenow', '1');
      expect(progressBar).toHaveAttribute('aria-valuemax', '3');
      expect(progressBar).toHaveStyle({ width: '33%' });
    });

    it('should render question indicator dots', () => {
      const session: QASession = {
        id: 'session1',
        evaluationId: 'eval1',
        questions: mockQuestions,
        answers: new Map(),
        status: 'active',
        createdAt: new Date(),
        updatedAt: new Date(),
        currentQuestionIndex: 0,
      };

      render(
        <TestProvider initialValues={[[currentQASessionAtom, session]]}>
          <QAProgressTracker />
        </TestProvider>
      );

      expect(screen.getByLabelText('Question 1 - not answered')).toBeInTheDocument();
      expect(screen.getByLabelText('Question 2 - not answered')).toBeInTheDocument();
      expect(screen.getByLabelText('Question 3 - not answered')).toBeInTheDocument();
    });

    it('should show checkmarks for answered questions', () => {
      const session: QASession = {
        id: 'session1',
        evaluationId: 'eval1',
        questions: mockQuestions,
        answers: new Map([
          [
            'q1',
            {
              id: 'a1',
              questionId: 'q1',
              audioBlob: new Blob(),
              audioFormat: 'webm',
              duration: 30,
              uploadStatus: 'pending',
              submittedAt: new Date(),
            },
          ],
          [
            'q3',
            {
              id: 'a3',
              questionId: 'q3',
              audioBlob: new Blob(),
              audioFormat: 'webm',
              duration: 30,
              uploadStatus: 'pending',
              submittedAt: new Date(),
            },
          ],
        ]),
        status: 'active',
        createdAt: new Date(),
        updatedAt: new Date(),
        currentQuestionIndex: 0,
      };

      render(
        <TestProvider initialValues={[[currentQASessionAtom, session]]}>
          <QAProgressTracker />
        </TestProvider>
      );

      expect(screen.getByLabelText('Question 1 - answered')).toBeInTheDocument();
      expect(screen.getByLabelText('Question 2 - not answered')).toBeInTheDocument();
      expect(screen.getByLabelText('Question 3 - answered')).toBeInTheDocument();
    });

    it('should show completion message when all questions answered', () => {
      const session: QASession = {
        id: 'session1',
        evaluationId: 'eval1',
        questions: mockQuestions,
        answers: new Map([
          [
            'q1',
            {
              id: 'a1',
              questionId: 'q1',
              audioBlob: new Blob(),
              audioFormat: 'webm',
              duration: 30,
              uploadStatus: 'pending',
              submittedAt: new Date(),
            },
          ],
          [
            'q2',
            {
              id: 'a2',
              questionId: 'q2',
              audioBlob: new Blob(),
              audioFormat: 'webm',
              duration: 30,
              uploadStatus: 'pending',
              submittedAt: new Date(),
            },
          ],
          [
            'q3',
            {
              id: 'a3',
              questionId: 'q3',
              audioBlob: new Blob(),
              audioFormat: 'webm',
              duration: 30,
              uploadStatus: 'pending',
              submittedAt: new Date(),
            },
          ],
        ]),
        status: 'active',
        createdAt: new Date(),
        updatedAt: new Date(),
        currentQuestionIndex: 0,
      };

      render(
        <TestProvider initialValues={[[currentQASessionAtom, session]]}>
          <QAProgressTracker />
        </TestProvider>
      );

      expect(screen.getByText('All questions answered!')).toBeInTheDocument();
      expect(screen.getByText('Great work completing the Q&A session.')).toBeInTheDocument();
      expect(screen.getByText('3 of 3 answered')).toBeInTheDocument();
    });

    it('should have correct ARIA attributes', () => {
      const session: QASession = {
        id: 'session1',
        evaluationId: 'eval1',
        questions: mockQuestions,
        answers: new Map(),
        status: 'active',
        createdAt: new Date(),
        updatedAt: new Date(),
        currentQuestionIndex: 0,
      };

      render(
        <TestProvider initialValues={[[currentQASessionAtom, session]]}>
          <QAProgressTracker />
        </TestProvider>
      );

      const progressBar = screen.getByRole('progressbar');
      expect(progressBar).toHaveAttribute('aria-label', '0 of 3 questions answered');

      const indicatorList = screen.getByRole('list', { name: 'Question status indicators' });
      expect(indicatorList).toBeInTheDocument();
    });
  });

  describe('Compact Mode', () => {
    it('should render compact text summary', () => {
      const session: QASession = {
        id: 'session1',
        evaluationId: 'eval1',
        questions: mockQuestions,
        answers: new Map([
          [
            'q1',
            {
              id: 'a1',
              questionId: 'q1',
              audioBlob: new Blob(),
              audioFormat: 'webm',
              duration: 30,
              uploadStatus: 'pending',
              submittedAt: new Date(),
            },
          ],
        ]),
        status: 'active',
        createdAt: new Date(),
        updatedAt: new Date(),
        currentQuestionIndex: 0,
      };

      const { container } = render(
        <TestProvider initialValues={[[currentQASessionAtom, session]]}>
          <QAProgressTracker compact={true} />
        </TestProvider>
      );

      expect(screen.getByText('1 of 3 answered')).toBeInTheDocument();
      expect(screen.getByText('(33%)')).toBeInTheDocument();

      // Should NOT render full components
      expect(screen.queryByText('Question Progress')).not.toBeInTheDocument();
      expect(screen.queryByRole('progressbar')).not.toBeInTheDocument();

      const compactElement = container.querySelector('[data-testid="progress-tracker-compact"]');
      expect(compactElement).toBeInTheDocument();
    });

    it('should show 100% in compact mode when all answered', () => {
      const session: QASession = {
        id: 'session1',
        evaluationId: 'eval1',
        questions: mockQuestions,
        answers: new Map([
          [
            'q1',
            {
              id: 'a1',
              questionId: 'q1',
              audioBlob: new Blob(),
              audioFormat: 'webm',
              duration: 30,
              uploadStatus: 'pending',
              submittedAt: new Date(),
            },
          ],
          [
            'q2',
            {
              id: 'a2',
              questionId: 'q2',
              audioBlob: new Blob(),
              audioFormat: 'webm',
              duration: 30,
              uploadStatus: 'pending',
              submittedAt: new Date(),
            },
          ],
          [
            'q3',
            {
              id: 'a3',
              questionId: 'q3',
              audioBlob: new Blob(),
              audioFormat: 'webm',
              duration: 30,
              uploadStatus: 'pending',
              submittedAt: new Date(),
            },
          ],
        ]),
        status: 'active',
        createdAt: new Date(),
        updatedAt: new Date(),
        currentQuestionIndex: 0,
      };

      render(
        <TestProvider initialValues={[[currentQASessionAtom, session]]}>
          <QAProgressTracker compact={true} />
        </TestProvider>
      );

      expect(screen.getByText('3 of 3 answered')).toBeInTheDocument();
      expect(screen.getByText('(100%)')).toBeInTheDocument();
    });
  });

  describe('Progress Calculations', () => {
    it('should calculate percentage correctly for partial completion', () => {
      const session: QASession = {
        id: 'session1',
        evaluationId: 'eval1',
        questions: mockQuestions,
        answers: new Map([
          [
            'q1',
            {
              id: 'a1',
              questionId: 'q1',
              audioBlob: new Blob(),
              audioFormat: 'webm',
              duration: 30,
              uploadStatus: 'pending',
              submittedAt: new Date(),
            },
          ],
          [
            'q2',
            {
              id: 'a2',
              questionId: 'q2',
              audioBlob: new Blob(),
              audioFormat: 'webm',
              duration: 30,
              uploadStatus: 'pending',
              submittedAt: new Date(),
            },
          ],
        ]),
        status: 'active',
        createdAt: new Date(),
        updatedAt: new Date(),
        currentQuestionIndex: 0,
      };

      render(
        <TestProvider initialValues={[[currentQASessionAtom, session]]}>
          <QAProgressTracker />
        </TestProvider>
      );

      const progressBar = screen.getByRole('progressbar');
      expect(progressBar).toHaveStyle({ width: '67%' }); // 2/3 = 66.67% rounded to 67%
    });

    it('should handle single question session', () => {
      const singleQuestion = [mockQuestions[0]];
      const session: QASession = {
        id: 'session1',
        evaluationId: 'eval1',
        questions: singleQuestion,
        answers: new Map(),
        status: 'active',
        createdAt: new Date(),
        updatedAt: new Date(),
        currentQuestionIndex: 0,
      };

      render(
        <TestProvider initialValues={[[currentQASessionAtom, session]]}>
          <QAProgressTracker />
        </TestProvider>
      );

      expect(screen.getByText('0 of 1 answered')).toBeInTheDocument();
      expect(screen.getByLabelText('Question 1 - not answered')).toBeInTheDocument();
    });
  });
});
