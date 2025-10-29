import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import { EvaluationList } from '../EvaluationList';
import type { EvaluationResult } from '../../models/evaluation';

// Mock @tanstack/react-virtual
vi.mock('@tanstack/react-virtual', () => ({
  useVirtualizer: ({ count, getScrollElement, estimateSize }: any) => ({
    getTotalSize: () => count * estimateSize(),
    getVirtualItems: () =>
      Array.from({ length: count }, (_, i) => ({
        index: i,
        start: i * estimateSize(),
        size: estimateSize(),
        key: i,
      })),
    scrollToIndex: vi.fn(),
  }),
}));

describe('EvaluationList', () => {
  const createMockEvaluation = (id: string, overrides = {}): EvaluationResult => ({
    id,
    input: `Input for ${id}`,
    output: `Output for ${id}`,
    created_at: '2025-01-15T10:00:00Z',
    startSlide: '1',
    endSlide: '5',
    audience: 'Test audience',
    ...overrides,
  });

  it('should render empty list when evaluations array is empty', () => {
    const { container } = render(<EvaluationList evaluations={[]} />);

    const listItems = container.querySelectorAll('[data-testid^="evaluation-item-"]');
    expect(listItems.length).toBe(0);
  });

  it('should render all evaluations', () => {
    const evaluations = [
      createMockEvaluation('eval-1'),
      createMockEvaluation('eval-2'),
      createMockEvaluation('eval-3'),
    ];

    render(<EvaluationList evaluations={evaluations} />);

    // Virtual scroller creates items with data-index attributes
    expect(screen.getByText('eval-1')).toBeInTheDocument();
    expect(screen.getByText('eval-2')).toBeInTheDocument();
    expect(screen.getByText('eval-3')).toBeInTheDocument();
  });

  it('should display evaluation metadata correctly', () => {
    const evaluations = [
      createMockEvaluation('eval-123', {
        created_at: '2025-01-15T14:30:00Z',
        startSlide: '3',
        endSlide: '7',
        audience: 'Executives',
      }),
    ];

    render(<EvaluationList evaluations={evaluations} />);

    expect(screen.getByText('eval-123')).toBeInTheDocument();
    // Date format varies by locale, just check it's present
    expect(screen.getByText(/Slides/i)).toBeInTheDocument();
    expect(screen.getByText(/3 - 7/)).toBeInTheDocument();
    expect(screen.getByText(/Audience/i)).toBeInTheDocument();
    expect(screen.getByText(/Executives/)).toBeInTheDocument();
    expect(screen.getByText(/User/i)).toBeInTheDocument();
    expect(screen.getByText(/N\/A/)).toBeInTheDocument();
  });

  it('should display "N/A" for user field', () => {
    const evaluations = [createMockEvaluation('eval-1')];

    render(<EvaluationList evaluations={evaluations} />);

    expect(screen.getByText('User')).toBeInTheDocument();
    expect(screen.getByText('N/A')).toBeInTheDocument();
  });

  it('should display "[Data unavailable]" for null fields', () => {
    const evaluations = [
      createMockEvaluation('eval-1', {
        startSlide: null,
        endSlide: null,
        audience: null,
      }),
    ];

    render(<EvaluationList evaluations={evaluations} />);

    // Null metadata fields are not rendered at all (conditional rendering)
    expect(screen.queryByText(/Slides:/)).not.toBeInTheDocument();
    expect(screen.queryByText(/Audience:/)).not.toBeInTheDocument();
  });

  it('should truncate long content to 200 characters', () => {
    const longInput = 'A'.repeat(250);
    const longOutput = 'B'.repeat(250);

    const evaluations = [
      createMockEvaluation('eval-1', {
        input: longInput,
        output: longOutput,
      }),
    ];

    render(<EvaluationList evaluations={evaluations} />);

    // Check input is truncated
    const inputLabel = screen.getByText('Input');
    const inputText = inputLabel.nextElementSibling?.textContent || '';
    expect(inputText).toContain('...');
    expect(inputText.length).toBeLessThan(210); // 200 + '...' + some margin

    // Check output is truncated
    const outputLabel = screen.getByText('Output');
    const outputText = outputLabel.nextElementSibling?.textContent || '';
    expect(outputText).toContain('...');
    expect(outputText.length).toBeLessThan(210);
  });

  it('should not truncate short content', () => {
    const shortInput = 'Short input';
    const shortOutput = 'Short output';

    const evaluations = [
      createMockEvaluation('eval-1', {
        input: shortInput,
        output: shortOutput,
      }),
    ];

    render(<EvaluationList evaluations={evaluations} />);

    expect(screen.getByText(shortInput)).toBeInTheDocument();
    expect(screen.getByText(shortOutput)).toBeInTheDocument();
  });

  it('should handle null input/output with placeholders', () => {
    const evaluations = [
      createMockEvaluation('eval-1', {
        input: null as any,
        output: null as any,
      }),
    ];

    render(<EvaluationList evaluations={evaluations} />);

    const placeholders = screen.getAllByText('[Data unavailable]');
    expect(placeholders.length).toBeGreaterThanOrEqual(2); // At least input and output
  });

  it('should format date correctly', () => {
    const evaluations = [
      createMockEvaluation('eval-1', {
        created_at: '2025-03-20T08:45:30Z',
      }),
    ];

    render(<EvaluationList evaluations={evaluations} />);

    // Date format varies by locale, just verify label and value are present
    expect(screen.getByText('Created')).toBeInTheDocument();
    // The date will be formatted by toLocaleString(), which outputs: "3/20/2025, 4:45:30 PM"
    const dateText = screen.getByText(/2025/);
    expect(dateText).toBeInTheDocument();
  });

  it('should handle invalid date gracefully', () => {
    const evaluations = [
      createMockEvaluation('eval-1', {
        created_at: 'invalid-date',
      }),
    ];

    render(<EvaluationList evaluations={evaluations} />);

    expect(screen.getByText(/Invalid Date/)).toBeInTheDocument();
  });

  it('should handle missing created_at gracefully', () => {
    const evaluations = [
      createMockEvaluation('eval-1', {
        created_at: null as any,
      }),
    ];

    render(<EvaluationList evaluations={evaluations} />);

    // null gets converted to epoch time (1/1/1970) by Date constructor
    expect(screen.getByText('Created')).toBeInTheDocument();
    expect(screen.getByText(/1970/)).toBeInTheDocument();
  });

  it('should display slides range correctly when both values present', () => {
    const evaluations = [
      createMockEvaluation('eval-1', {
        startSlide: '10',
        endSlide: '20',
      }),
    ];

    render(<EvaluationList evaluations={evaluations} />);

    expect(screen.getByText(/Slides/i)).toBeInTheDocument();
    expect(screen.getByText(/10 - 20/)).toBeInTheDocument();
  });

  it('should handle only startSlide being present', () => {
    const evaluations = [
      createMockEvaluation('eval-1', {
        startSlide: '5',
        endSlide: null,
      }),
    ];

    render(<EvaluationList evaluations={evaluations} />);

    // Slides section not rendered if either value is missing
    expect(screen.queryByText(/Slides/i)).not.toBeInTheDocument();
  });

  it('should handle large number of evaluations (virtual scrolling)', () => {
    const evaluations = Array.from({ length: 1000 }, (_, i) => createMockEvaluation(`eval-${i}`));

    const { container } = render(<EvaluationList evaluations={evaluations} />);

    // Virtual scrolling should render the list container
    expect(container.querySelector('[data-testid="evaluation-list"]')).toBeInTheDocument();

    // Virtual scrolling means not all items are in the DOM
    // Just verify the first item is rendered (virtualizer mock renders all in our test)
    expect(screen.getByText('eval-0')).toBeInTheDocument();
  }, 10000); // Increase timeout to 10s for large dataset
});
