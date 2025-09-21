import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { AudioReview } from '../AudioReview';

// Mock URL methods
Object.defineProperty(window.URL, 'createObjectURL', {
  writable: true,
  value: vi.fn(() => 'mock-url'),
});
Object.defineProperty(window.URL, 'revokeObjectURL', {
  writable: true,
  value: vi.fn(),
});

describe('AudioReview', () => {
  const mockBlob = new Blob(['test audio'], { type: 'audio/webm' });
  const mockOnPlaybackComplete = vi.fn();

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('renders the review component', () => {
    render(<AudioReview audioBlob={mockBlob} onPlaybackComplete={mockOnPlaybackComplete} />);

    expect(screen.getByText('Review Recording')).toBeInTheDocument();
    expect(screen.getByText('Play')).toBeInTheDocument();
  });

  it('toggles play/pause on button click', () => {
    // Mock audio methods
    HTMLMediaElement.prototype.play = vi.fn().mockResolvedValue(undefined);
    HTMLMediaElement.prototype.pause = vi.fn();

    render(<AudioReview audioBlob={mockBlob} onPlaybackComplete={mockOnPlaybackComplete} />);

    const playButton = screen.getByText('Play');
    fireEvent.click(playButton);

    expect(screen.getByText('Pause')).toBeInTheDocument();
  });

  it('displays audio duration and current time', () => {
    render(<AudioReview audioBlob={mockBlob} onPlaybackComplete={mockOnPlaybackComplete} />);

    // Check for time display format (should show 0:00 / 0:00 initially)
    expect(screen.getByText(/0:00 \/ 0:00/)).toBeInTheDocument();
  });

  it('calls onPlaybackComplete when audio ends', () => {
    render(<AudioReview audioBlob={mockBlob} onPlaybackComplete={mockOnPlaybackComplete} />);

    const audioElement = document.querySelector('audio') as HTMLAudioElement;
    fireEvent.ended(audioElement);

    expect(mockOnPlaybackComplete).toHaveBeenCalled();
  });
});
