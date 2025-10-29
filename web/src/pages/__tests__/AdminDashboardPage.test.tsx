import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { AdminDashboardPage } from '../AdminDashboardPage';
import * as evaluationService from '../../services/evaluationService';

// Mock the services
vi.mock('../../services/evaluationService');

// Mock EvaluationList component
vi.mock('../../components/EvaluationList', () => ({
  EvaluationList: ({ evaluations }: { evaluations: any[] }) => (
    <div data-testid="evaluation-list">
      {evaluations.map((e) => (
        <div key={e.id}>{e.id}</div>
      ))}
    </div>
  ),
}));

describe('AdminDashboardPage', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('should render loading state initially', () => {
    vi.mocked(evaluationService.fetchEvaluations).mockImplementation(() => new Promise(() => {}));

    render(<AdminDashboardPage />);

    expect(screen.getByText(/Loading evaluations/i)).toBeInTheDocument();
    expect(screen.getByTestId('loading')).toBeInTheDocument();
  });

  it('should fetch and display evaluations on mount', async () => {
    const mockEvaluations = [
      {
        id: 'eval-1',
        input: 'Test input 1',
        output: 'Test output 1',
        created_at: '2025-01-15T10:00:00Z',
        startSlide: '1',
        endSlide: '5',
        audience: 'Test audience',
      },
      {
        id: 'eval-2',
        input: 'Test input 2',
        output: 'Test output 2',
        created_at: '2025-01-14T10:00:00Z',
        startSlide: '2',
        endSlide: '6',
        audience: 'Another audience',
      },
    ];

    vi.mocked(evaluationService.fetchEvaluations).mockResolvedValue(mockEvaluations);

    render(<AdminDashboardPage />);

    await waitFor(() => {
      expect(screen.getByTestId('evaluation-list')).toBeInTheDocument();
    });

    expect(screen.getByText('eval-1')).toBeInTheDocument();
    expect(screen.getByText('eval-2')).toBeInTheDocument();
  });

  it('should sort evaluations by created_at descending', async () => {
    const mockEvaluations = [
      {
        id: 'eval-old',
        input: 'Old',
        output: 'Old output',
        created_at: '2025-01-10T10:00:00Z',
        startSlide: null,
        endSlide: null,
        audience: null,
      },
      {
        id: 'eval-new',
        input: 'New',
        output: 'New output',
        created_at: '2025-01-20T10:00:00Z',
        startSlide: null,
        endSlide: null,
        audience: null,
      },
    ];

    vi.mocked(evaluationService.fetchEvaluations).mockResolvedValue(mockEvaluations);

    const { container } = render(<AdminDashboardPage />);

    await waitFor(() => {
      expect(screen.getByTestId('evaluation-list')).toBeInTheDocument();
    });

    // Check order: newer first
    const items = container.querySelectorAll('[data-testid="evaluation-list"] > div');
    expect(items[0].textContent).toBe('eval-new');
    expect(items[1].textContent).toBe('eval-old');
  });

  it('should display error state when fetch fails', async () => {
    vi.mocked(evaluationService.fetchEvaluations).mockRejectedValue(new Error('Network error'));

    render(<AdminDashboardPage />);

    await waitFor(() => {
      expect(screen.getByText(/Error Loading Evaluations/i)).toBeInTheDocument();
    });

    expect(screen.getByText(/Network error/i)).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /Retry/i })).toBeInTheDocument();
  });

  it('should retry fetching evaluations when retry button is clicked', async () => {
    const user = userEvent.setup();

    vi.mocked(evaluationService.fetchEvaluations)
      .mockRejectedValueOnce(new Error('Network error'))
      .mockResolvedValueOnce([
        {
          id: 'eval-1',
          input: 'Test',
          output: 'Test output',
          created_at: '2025-01-15T10:00:00Z',
          startSlide: null,
          endSlide: null,
          audience: null,
        },
      ]);

    render(<AdminDashboardPage />);

    // Wait for error state
    await waitFor(() => {
      expect(screen.getByText(/Error Loading Evaluations/i)).toBeInTheDocument();
    });

    // Click retry
    const retryButton = screen.getByRole('button', { name: /Retry/i });
    await user.click(retryButton);

    // Wait for success
    await waitFor(() => {
      expect(screen.getByTestId('evaluation-list')).toBeInTheDocument();
    });

    expect(screen.getByText('eval-1')).toBeInTheDocument();
    expect(evaluationService.fetchEvaluations).toHaveBeenCalledTimes(2);
  });

  it('should display empty state when no evaluations exist', async () => {
    vi.mocked(evaluationService.fetchEvaluations).mockResolvedValue([]);

    render(<AdminDashboardPage />);

    await waitFor(() => {
      expect(screen.getByText(/No Evaluations Yet/i)).toBeInTheDocument();
    });

    expect(
      screen.getByText(/No evaluation results are available at this time/i)
    ).toBeInTheDocument();
  });

  it('should handle evaluations with missing created_at gracefully', async () => {
    const mockEvaluations = [
      {
        id: 'eval-1',
        input: 'Test',
        output: 'Test output',
        created_at: '2025-01-15T10:00:00Z',
        startSlide: null,
        endSlide: null,
        audience: null,
      },
      {
        id: 'eval-2',
        input: 'Test 2',
        output: 'Test output 2',
        created_at: null as any, // Malformed data
        startSlide: null,
        endSlide: null,
        audience: null,
      },
    ];

    vi.mocked(evaluationService.fetchEvaluations).mockResolvedValue(mockEvaluations);

    render(<AdminDashboardPage />);

    await waitFor(() => {
      expect(screen.getByTestId('evaluation-list')).toBeInTheDocument();
    });

    // Should render both evaluations despite missing timestamp
    expect(screen.getByText('eval-1')).toBeInTheDocument();
    expect(screen.getByText('eval-2')).toBeInTheDocument();
  });
});
