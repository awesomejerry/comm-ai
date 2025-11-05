/**
 * Unit tests for PresentModeToggle component
 * These tests are written BEFORE implementation (TDD approach)
 */

import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { PresentModeToggle } from '../../../src/components/PresentModeToggle';

describe('PresentModeToggle', () => {
  describe('rendering', () => {
    it('should render toggle button', () => {
      render(<PresentModeToggle mode="practice" onToggle={vi.fn()} />);

      const button = screen.getByRole('button');
      expect(button).toBeInTheDocument();
    });

    it('should display "Enter Present Mode" when in practice mode', () => {
      render(<PresentModeToggle mode="practice" onToggle={vi.fn()} />);

      expect(screen.getByText(/present mode/i)).toBeInTheDocument();
    });

    it('should display "Exit Present Mode" when in present mode', () => {
      render(<PresentModeToggle mode="present" onToggle={vi.fn()} />);

      expect(screen.getByText(/exit|practice/i)).toBeInTheDocument();
    });
  });

  describe('interaction', () => {
    it('should call onToggle when clicked', () => {
      const onToggle = vi.fn();
      render(<PresentModeToggle mode="practice" onToggle={onToggle} />);

      const button = screen.getByRole('button');
      fireEvent.click(button);

      expect(onToggle).toHaveBeenCalledTimes(1);
    });

    it('should be disabled when isRecording is true', () => {
      render(<PresentModeToggle mode="practice" onToggle={vi.fn()} isRecording={true} />);

      const button = screen.getByRole('button');
      expect(button).toBeDisabled();
    });

    it('should be enabled when isRecording is false', () => {
      render(<PresentModeToggle mode="practice" onToggle={vi.fn()} isRecording={false} />);

      const button = screen.getByRole('button');
      expect(button).not.toBeDisabled();
    });
  });

  describe('accessibility', () => {
    it('should have accessible name', () => {
      render(<PresentModeToggle mode="practice" onToggle={vi.fn()} />);

      const button = screen.getByRole('button');
      expect(button).toHaveAccessibleName();
    });

    it('should indicate current mode state to screen readers', () => {
      const { rerender } = render(<PresentModeToggle mode="practice" onToggle={vi.fn()} />);

      let button = screen.getByRole('button');
      expect(button.getAttribute('aria-label')).toContain('practice');

      rerender(<PresentModeToggle mode="present" onToggle={vi.fn()} />);
      button = screen.getByRole('button');
      expect(button.getAttribute('aria-label')).toContain('present');
    });
  });
});
