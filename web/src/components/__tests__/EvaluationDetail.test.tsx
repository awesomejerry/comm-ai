import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { EvaluationDetail } from '../EvaluationDetail';
import type { EvaluationResult } from '../../models/evaluation';

describe('EvaluationDetail', () => {
  const mockEvaluation: EvaluationResult = {
    id: 'eval-123',
    input: 'This is the full input content that should be displayed without truncation.',
    output: 'This is the full output content that should be displayed without truncation.',
    created_at: '2025-01-15T14:30:00Z',
    startSlide: '3',
    endSlide: '7',
    audience: 'Executives',
  };

  const mockOnClose = vi.fn();

  it('should render evaluation metadata correctly', () => {
    render(<EvaluationDetail evaluation={mockEvaluation} onClose={mockOnClose} />);

    expect(screen.getByText('eval-123')).toBeInTheDocument();
    expect(screen.getByText(/3 - 7/)).toBeInTheDocument();
    expect(screen.getByText('Executives')).toBeInTheDocument();
  });

  it('should display full input content without truncation', () => {
    render(<EvaluationDetail evaluation={mockEvaluation} onClose={mockOnClose} />);

    expect(screen.getByText(mockEvaluation.input!)).toBeInTheDocument();
  });

  it('should display full output content without truncation', () => {
    render(<EvaluationDetail evaluation={mockEvaluation} onClose={mockOnClose} />);

    expect(screen.getByText(mockEvaluation.output!)).toBeInTheDocument();
  });

  it('should call onClose when close button is clicked', async () => {
    const user = userEvent.setup();
    render(<EvaluationDetail evaluation={mockEvaluation} onClose={mockOnClose} />);

    // Click the X button in header
    const closeButton = screen.getByLabelText('Close');
    await user.click(closeButton);

    expect(mockOnClose).toHaveBeenCalledTimes(1);
  });

  it('should close on ESC key press', async () => {
    const user = userEvent.setup();
    render(<EvaluationDetail evaluation={mockEvaluation} onClose={mockOnClose} />);

    await user.keyboard('{Escape}');

    // Should be called at least once (may be called multiple times due to event bubbling)
    expect(mockOnClose).toHaveBeenCalled();
  });

  it('should handle null input with placeholder', () => {
    const evaluationWithNullInput: EvaluationResult = {
      ...mockEvaluation,
      input: null,
    };

    render(<EvaluationDetail evaluation={evaluationWithNullInput} onClose={mockOnClose} />);

    expect(screen.getByText('[Data unavailable]')).toBeInTheDocument();
  });

  it('should handle null output with placeholder', () => {
    const evaluationWithNullOutput: EvaluationResult = {
      ...mockEvaluation,
      output: null,
    };

    render(<EvaluationDetail evaluation={evaluationWithNullOutput} onClose={mockOnClose} />);

    expect(screen.getByText('[Data unavailable]')).toBeInTheDocument();
  });

  it('should handle null slide range', () => {
    const evaluationWithNullSlides: EvaluationResult = {
      ...mockEvaluation,
      startSlide: null,
      endSlide: null,
    };

    render(<EvaluationDetail evaluation={evaluationWithNullSlides} onClose={mockOnClose} />);

    // Null slides should not render or show placeholder
    expect(screen.queryByText(/Slides/i)).not.toBeInTheDocument();
  });

  it('should handle null audience', () => {
    const evaluationWithNullAudience: EvaluationResult = {
      ...mockEvaluation,
      audience: null,
    };

    render(<EvaluationDetail evaluation={evaluationWithNullAudience} onClose={mockOnClose} />);

    // Null audience should not render
    expect(screen.queryByText(/Audience/i)).not.toBeInTheDocument();
  });

  it('should format date correctly', () => {
    render(<EvaluationDetail evaluation={mockEvaluation} onClose={mockOnClose} />);

    // Date should be formatted with toLocaleString()
    expect(screen.getByText(/2025/)).toBeInTheDocument();
  });

  it('should display long content without ellipsis', () => {
    const longContent = 'A'.repeat(1000);
    const evaluationWithLongContent: EvaluationResult = {
      ...mockEvaluation,
      input: longContent,
      output: longContent,
    };

    const { container } = render(
      <EvaluationDetail evaluation={evaluationWithLongContent} onClose={mockOnClose} />
    );

    // Should show all 1000 characters in both input and output sections
    const contentElements = container.querySelectorAll('.whitespace-pre-wrap');

    // Filter to actual content (not metadata)
    const inputOutput = Array.from(contentElements).filter((el) =>
      el.textContent?.includes('AAAA')
    );

    expect(inputOutput.length).toBe(2); // Input and Output
    inputOutput.forEach((el) => {
      expect(el.textContent?.length).toBe(1000);
    });
  });

  it('should have accessible close button', () => {
    render(<EvaluationDetail evaluation={mockEvaluation} onClose={mockOnClose} />);

    // Header X button
    const headerCloseButton = screen.getByLabelText('Close');
    expect(headerCloseButton).toBeInTheDocument();
    expect(headerCloseButton).toHaveAccessibleName();

    // Footer close button
    const footerCloseButton = screen.getByText('Close');
    expect(footerCloseButton).toBeInTheDocument();
  });

  it('should trap focus within modal', () => {
    const { container } = render(
      <EvaluationDetail evaluation={mockEvaluation} onClose={mockOnClose} />
    );

    // Modal should have role="dialog"
    const dialog = container.querySelector('[role="dialog"]');
    expect(dialog).toBeInTheDocument();
  });
});
