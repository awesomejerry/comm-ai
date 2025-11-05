/**
 * Unit tests for PresentModeView component
 * These tests are written BEFORE implementation (TDD approach)
 */

import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { PresentModeView } from '../../../src/components/PresentModeView';

describe('PresentModeView', () => {
  const mockProps = {
    currentSlide: 1,
    totalSlides: 10,
    isRecording: false,
    onExit: vi.fn(),
    children: <div>Slide Content</div>,
  };

  describe('rendering', () => {
    it('should render children content', () => {
      render(<PresentModeView {...mockProps} />);

      expect(screen.getByText('Slide Content')).toBeInTheDocument();
    });

    it('should display exit button', () => {
      render(<PresentModeView {...mockProps} />);

      const exitButton = screen.getByRole('button', { name: /exit/i });
      expect(exitButton).toBeInTheDocument();
    });

    it('should show recording indicator when isRecording is true', () => {
      render(<PresentModeView {...mockProps} isRecording={true} />);

      expect(screen.getByText(/recording/i)).toBeInTheDocument();
    });

    it('should not show recording indicator when isRecording is false', () => {
      render(<PresentModeView {...mockProps} isRecording={false} />);

      expect(screen.queryByText(/recording/i)).not.toBeInTheDocument();
    });
  });

  describe('full-screen layout', () => {
    it('should apply full-screen CSS classes', () => {
      const { container } = render(<PresentModeView {...mockProps} />);

      const wrapper = container.firstChild as HTMLElement;
      expect(wrapper.className).toMatch(/w-screen|h-screen|fixed|inset-0/);
    });

    it('should have minimal controls visible', () => {
      render(<PresentModeView {...mockProps} />);

      // Exit button and slide counter should be the only controls
      const buttons = screen.getAllByRole('button');
      expect(buttons.length).toBeLessThanOrEqual(1); // Only exit button
    });
  });

  describe('interaction', () => {
    it('should call onExit when exit button is clicked', () => {
      const onExit = vi.fn();
      render(<PresentModeView {...mockProps} onExit={onExit} />);

      const exitButton = screen.getByRole('button', { name: /exit/i });
      fireEvent.click(exitButton);

      expect(onExit).toHaveBeenCalledTimes(1);
    });

    it('should handle Escape key press to exit', () => {
      const onExit = vi.fn();
      const { container } = render(<PresentModeView {...mockProps} onExit={onExit} />);

      fireEvent.keyDown(container.firstChild!, { key: 'Escape', code: 'Escape' });

      expect(onExit).toHaveBeenCalledTimes(1);
    });

    it('should not trigger exit on other key presses', () => {
      const onExit = vi.fn();
      const { container } = render(<PresentModeView {...mockProps} onExit={onExit} />);

      fireEvent.keyDown(container.firstChild!, { key: 'Enter', code: 'Enter' });

      expect(onExit).not.toHaveBeenCalled();
    });
  });

  describe('accessibility', () => {
    it('should indicate recording state to screen readers', () => {
      const { rerender } = render(<PresentModeView {...mockProps} isRecording={false} />);

      // Slide counter is always present with role="status", but recording indicator should not be
      const statuses = screen.queryAllByRole('status');
      expect(statuses.length).toBe(1); // Only slide counter
      expect(statuses[0]).toHaveTextContent('1 / 10'); // Slide counter text (mockProps has 10 slides)

      rerender(<PresentModeView {...mockProps} isRecording={true} />);

      const updatedStatuses = screen.getAllByRole('status');
      expect(updatedStatuses.length).toBe(2); // Both slide counter and recording indicator

      // Check for recording indicator
      const recordingStatus = updatedStatuses.find((status) =>
        status.textContent?.includes('Recording')
      );
      expect(recordingStatus).toHaveTextContent(/recording/i);
    });

    it('should have focus trap for keyboard navigation', () => {
      const { container } = render(<PresentModeView {...mockProps} />);

      // Should have tabindex to trap focus
      const wrapper = container.firstChild as HTMLElement;
      expect(wrapper.getAttribute('tabIndex')).toBe('0');
    });
  });
});
