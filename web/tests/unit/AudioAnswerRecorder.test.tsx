import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { render, screen, waitFor, fireEvent } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { AudioAnswerRecorder } from '../../src/components/AudioAnswerRecorder';

// Mock BlobEvent if not available
if (typeof BlobEvent === 'undefined') {
  global.BlobEvent = class BlobEvent extends Event {
    data: Blob;
    constructor(type: string, options: { data: Blob }) {
      super(type);
      this.data = options.data;
    }
  } as any;
}

// Mock MediaRecorder
class MockMediaRecorder {
  state: 'inactive' | 'recording' | 'paused' = 'inactive';
  ondataavailable: ((event: any) => void) | null = null;
  onstop: (() => void) | null = null;
  onerror: ((event: Event) => void) | null = null;
  stream: MediaStream;

  constructor(stream: MediaStream, _options?: MediaRecorderOptions) {
    this.stream = stream;
  }

  start() {
    this.state = 'recording';
  }

  stop() {
    this.state = 'inactive';
    if (this.ondataavailable) {
      const blob = new Blob(['fake audio data'], { type: 'audio/webm' });
      const event = { data: blob };
      this.ondataavailable(event);
    }
    if (this.onstop) {
      this.onstop();
    }
  }

  pause() {
    this.state = 'paused';
  }

  resume() {
    this.state = 'recording';
  }

  static isTypeSupported(_mimeType: string): boolean {
    return true;
  }
}

describe('AudioAnswerRecorder', () => {
  let mockGetUserMedia: ReturnType<typeof vi.fn>;
  let mockMediaStream: MediaStream;

  beforeEach(() => {
    // Mock getUserMedia
    mockMediaStream = {
      getTracks: () => [{ stop: vi.fn() } as unknown as MediaStreamTrack],
    } as MediaStream;

    mockGetUserMedia = vi.fn().mockResolvedValue(mockMediaStream);
    Object.defineProperty(global.navigator, 'mediaDevices', {
      value: {
        getUserMedia: mockGetUserMedia,
      },
      writable: true,
      configurable: true,
    });

    // Mock MediaRecorder
    global.MediaRecorder = MockMediaRecorder as any;
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  describe('Initial State', () => {
    it('should render start recording button', () => {
      const mockOnComplete = vi.fn();
      render(<AudioAnswerRecorder questionId="q1" onRecordingComplete={mockOnComplete} />);

      expect(screen.getByRole('button', { name: /start recording/i })).toBeInTheDocument();
    });

    it('should show instructions', () => {
      const mockOnComplete = vi.fn();
      render(<AudioAnswerRecorder questionId="q1" onRecordingComplete={mockOnComplete} />);

      expect(screen.getByText(/Click "Start Recording" to begin/i)).toBeInTheDocument();
    });

    it('should disable button when disabled prop is true', () => {
      const mockOnComplete = vi.fn();
      render(<AudioAnswerRecorder questionId="q1" onRecordingComplete={mockOnComplete} disabled />);

      const button = screen.getByRole('button', { name: /start recording/i });
      expect(button).toBeDisabled();
    });
  });

  describe('Recording Flow', () => {
    it('should start recording on button click', async () => {
      const user = userEvent.setup({ delay: null });
      const mockOnComplete = vi.fn();

      render(<AudioAnswerRecorder questionId="q1" onRecordingComplete={mockOnComplete} />);

      const startButton = screen.getByRole('button', { name: /start recording/i });
      await user.click(startButton);

      await waitFor(() => {
        expect(mockGetUserMedia).toHaveBeenCalledWith({ audio: true });
      });

      expect(screen.getByText(/recording/i)).toBeInTheDocument();
    });

    it('should show recording indicator when recording', async () => {
      const user = userEvent.setup({ delay: null });
      const mockOnComplete = vi.fn();

      render(<AudioAnswerRecorder questionId="q1" onRecordingComplete={mockOnComplete} />);

      await user.click(screen.getByRole('button', { name: /start recording/i }));

      await waitFor(() => {
        expect(screen.getByText(/recording/i)).toBeInTheDocument();
      });

      // Check for pulsing indicator
      const indicator = document.querySelector('.animate-pulse');
      expect(indicator).toBeInTheDocument();
    });

    it('should display timer during recording', async () => {
      const mockOnComplete = vi.fn();

      render(<AudioAnswerRecorder questionId="q1" onRecordingComplete={mockOnComplete} />);

      const startButton = screen.getByRole('button', { name: /start recording/i });
      fireEvent.click(startButton);

      await waitFor(() => {
        expect(screen.getByText(/recording/i)).toBeInTheDocument();
      });

      expect(screen.getByText('00:00')).toBeInTheDocument();

      await waitFor(
        () => {
          expect(screen.getByText('00:01')).toBeInTheDocument();
        },
        { timeout: 2000 }
      );
    });

    it('should show pause and stop buttons during recording', async () => {
      const user = userEvent.setup({ delay: null });
      const mockOnComplete = vi.fn();

      render(<AudioAnswerRecorder questionId="q1" onRecordingComplete={mockOnComplete} />);

      await user.click(screen.getByRole('button', { name: /start recording/i }));

      await waitFor(() => {
        expect(screen.getByRole('button', { name: /pause/i })).toBeInTheDocument();
        expect(screen.getByRole('button', { name: /stop/i })).toBeInTheDocument();
        expect(screen.getByRole('button', { name: /cancel/i })).toBeInTheDocument();
      });
    });
  });

  describe('Pause/Resume Functionality', () => {
    it('should pause recording', async () => {
      const user = userEvent.setup({ delay: null });
      const mockOnComplete = vi.fn();

      render(<AudioAnswerRecorder questionId="q1" onRecordingComplete={mockOnComplete} />);

      await user.click(screen.getByRole('button', { name: /start recording/i }));
      await waitFor(() => screen.getByRole('button', { name: /pause/i }));

      await user.click(screen.getByRole('button', { name: /pause/i }));

      await waitFor(() => {
        expect(screen.getByText(/paused/i)).toBeInTheDocument();
        expect(screen.getByRole('button', { name: /resume/i })).toBeInTheDocument();
      });
    });

    it('should resume recording after pause', async () => {
      const user = userEvent.setup({ delay: null });
      const mockOnComplete = vi.fn();

      render(<AudioAnswerRecorder questionId="q1" onRecordingComplete={mockOnComplete} />);

      await user.click(screen.getByRole('button', { name: /start recording/i }));
      await waitFor(() => screen.getByRole('button', { name: /pause/i }));

      await user.click(screen.getByRole('button', { name: /pause/i }));
      await waitFor(() => screen.getByRole('button', { name: /resume/i }));

      await user.click(screen.getByRole('button', { name: /resume/i }));

      await waitFor(() => {
        expect(screen.getByText(/recording/i)).toBeInTheDocument();
      });
    });
  });

  describe('Stop and Complete', () => {
    it('should call onRecordingComplete when stopped', async () => {
      const user = userEvent.setup({ delay: null });
      const mockOnComplete = vi.fn();

      render(<AudioAnswerRecorder questionId="q1" onRecordingComplete={mockOnComplete} />);

      await user.click(screen.getByRole('button', { name: /start recording/i }));
      await waitFor(() => screen.getByRole('button', { name: /stop/i }));

      await user.click(screen.getByRole('button', { name: /stop/i }));

      await waitFor(() => {
        expect(mockOnComplete).toHaveBeenCalled();
      });

      const [blob, duration, format] = mockOnComplete.mock.calls[0];
      expect(blob).toBeInstanceOf(Blob);
      expect(typeof duration).toBe('number');
      expect(['webm', 'mp4']).toContain(format);
    });

    it('should reset state after stopping', async () => {
      const user = userEvent.setup({ delay: null });
      const mockOnComplete = vi.fn();

      render(<AudioAnswerRecorder questionId="q1" onRecordingComplete={mockOnComplete} />);

      await user.click(screen.getByRole('button', { name: /start recording/i }));
      await waitFor(() => screen.getByRole('button', { name: /stop/i }));

      await user.click(screen.getByRole('button', { name: /stop/i }));

      await waitFor(() => {
        expect(screen.getByRole('button', { name: /start recording/i })).toBeInTheDocument();
      });
    });
  });

  describe('Cancel Functionality', () => {
    it('should call onCancel when cancelled', async () => {
      const user = userEvent.setup({ delay: null });
      const mockOnComplete = vi.fn();
      const mockOnCancel = vi.fn();

      render(
        <AudioAnswerRecorder
          questionId="q1"
          onRecordingComplete={mockOnComplete}
          onCancel={mockOnCancel}
        />
      );

      await user.click(screen.getByRole('button', { name: /start recording/i }));
      await waitFor(() => screen.getByRole('button', { name: /cancel/i }));

      await user.click(screen.getByRole('button', { name: /cancel/i }));

      await waitFor(() => {
        expect(mockOnCancel).toHaveBeenCalled();
        expect(mockOnComplete).not.toHaveBeenCalled();
      });
    });

    it('should reset state after cancelling', async () => {
      const user = userEvent.setup({ delay: null });
      const mockOnComplete = vi.fn();

      render(<AudioAnswerRecorder questionId="q1" onRecordingComplete={mockOnComplete} />);

      await user.click(screen.getByRole('button', { name: /start recording/i }));
      await waitFor(() => screen.getByRole('button', { name: /cancel/i }));

      await user.click(screen.getByRole('button', { name: /cancel/i }));

      await waitFor(() => {
        expect(screen.getByRole('button', { name: /start recording/i })).toBeInTheDocument();
      });
    });
  });

  describe('Permission Handling', () => {
    it('should show error when permission denied', async () => {
      const user = userEvent.setup({ delay: null });
      const mockOnComplete = vi.fn();

      mockGetUserMedia.mockRejectedValueOnce(
        Object.assign(new Error('Permission denied'), { name: 'NotAllowedError' })
      );

      render(<AudioAnswerRecorder questionId="q1" onRecordingComplete={mockOnComplete} />);

      await user.click(screen.getByRole('button', { name: /start recording/i }));

      await waitFor(() => {
        expect(screen.getByText(/microphone access denied/i)).toBeInTheDocument();
      });
    });

    it('should show error for other failures', async () => {
      const user = userEvent.setup({ delay: null });
      const mockOnComplete = vi.fn();

      mockGetUserMedia.mockRejectedValueOnce(new Error('Device not found'));

      render(<AudioAnswerRecorder questionId="q1" onRecordingComplete={mockOnComplete} />);

      await user.click(screen.getByRole('button', { name: /start recording/i }));

      await waitFor(() => {
        expect(screen.getByRole('alert')).toBeInTheDocument();
      });
    });
  });

  describe('Max Duration', () => {
    it('should show progress bar when maxDuration is set', async () => {
      const user = userEvent.setup({ delay: null });
      const mockOnComplete = vi.fn();

      render(
        <AudioAnswerRecorder
          questionId="q1"
          onRecordingComplete={mockOnComplete}
          maxDuration={60}
        />
      );

      await user.click(screen.getByRole('button', { name: /start recording/i }));

      await waitFor(() => {
        expect(screen.getByText(/remaining/i)).toBeInTheDocument();
      });
    });

    it('should auto-stop at max duration', async () => {
      const mockOnComplete = vi.fn();

      render(
        <AudioAnswerRecorder questionId="q1" onRecordingComplete={mockOnComplete} maxDuration={1} />
      );

      fireEvent.click(screen.getByRole('button', { name: /start recording/i }));

      await waitFor(
        () => {
          expect(mockOnComplete).toHaveBeenCalled();
        },
        { timeout: 4000 }
      );
    });
  });
});
