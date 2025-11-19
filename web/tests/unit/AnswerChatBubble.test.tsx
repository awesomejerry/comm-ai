import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { AnswerChatBubble } from '../../src/components/AnswerChatBubble';
import type { AudioAnswer } from '../../src/models/audioAnswer';

// Mock HTMLAudioElement
class MockAudioElement {
  src = '';
  currentTime = 0;
  duration = 30;
  paused = true;

  play = vi.fn().mockResolvedValue(undefined);
  pause = vi.fn();

  addEventListener = vi.fn();
  removeEventListener = vi.fn();
}

describe('AnswerChatBubble', () => {
  let mockAnswer: AudioAnswer;

  beforeEach(() => {
    global.HTMLAudioElement = MockAudioElement as any;
    global.URL.createObjectURL = vi.fn().mockReturnValue('blob:mock-url');
    global.URL.revokeObjectURL = vi.fn();

    mockAnswer = {
      id: 'answer-1',
      questionId: 'question-1',
      audioBlob: new Blob(['audio data'], { type: 'audio/webm' }),
      audioFormat: 'webm' as const,
      duration: 30,
      uploadStatus: 'pending' as const,
      submittedAt: new Date('2025-11-10T14:30:00.000Z'),
    };
  });

  describe('Rendering', () => {
    it('should render answer bubble', () => {
      render(<AnswerChatBubble answer={mockAnswer} />);

      expect(screen.getByRole('article', { name: 'Answer' })).toBeInTheDocument();
    });

    it('should show play button', () => {
      render(<AnswerChatBubble answer={mockAnswer} />);

      expect(screen.getByRole('button', { name: /play/i })).toBeInTheDocument();
    });

    it('should display duration', () => {
      render(<AnswerChatBubble answer={mockAnswer} />);

      expect(screen.getByText('00:30')).toBeInTheDocument();
    });

    it('should show question number when provided', () => {
      render(<AnswerChatBubble answer={mockAnswer} questionOrder={2} />);

      expect(screen.getByLabelText('Answer 2')).toBeInTheDocument();
    });
  });

  describe('Upload Status', () => {
    it('should show pending status', () => {
      render(<AnswerChatBubble answer={mockAnswer} />);

      expect(screen.getByText('Not submitted')).toBeInTheDocument();
    });

    it('should show uploading status', () => {
      const uploadingAnswer = { ...mockAnswer, uploadStatus: 'uploading' as const };
      render(<AnswerChatBubble answer={uploadingAnswer} />);

      expect(screen.getByText(/uploading/i)).toBeInTheDocument();
    });

    it('should show uploaded status', () => {
      const uploadedAnswer = { ...mockAnswer, uploadStatus: 'uploaded' as const };
      render(<AnswerChatBubble answer={uploadedAnswer} />);

      expect(screen.getByText('Submitted')).toBeInTheDocument();
    });

    it('should show error status', () => {
      const errorAnswer = { ...mockAnswer, uploadStatus: 'error' as const };
      render(<AnswerChatBubble answer={errorAnswer} />);

      expect(screen.getByText('Upload failed')).toBeInTheDocument();
    });
  });

  describe('Rating Display', () => {
    it('should show rating when available', () => {
      const ratedAnswer = {
        ...mockAnswer,
        uploadStatus: 'uploaded' as const,
        rating: {
          score: 85,
          feedback: 'Great explanation!',
          ratedAt: new Date('2025-11-10T14:35:00.000Z'),
        },
      };

      render(<AnswerChatBubble answer={ratedAnswer} />);

      expect(screen.getByText('Rating:')).toBeInTheDocument();
      expect(screen.getByText('85/100')).toBeInTheDocument();
      expect(screen.getByText('Great explanation!')).toBeInTheDocument();
    });

    it('should not show rating when not available', () => {
      render(<AnswerChatBubble answer={mockAnswer} />);

      expect(screen.queryByText('Rating:')).not.toBeInTheDocument();
    });
  });

  describe('Audio Playback', () => {
    it('should toggle play/pause', async () => {
      const user = userEvent.setup();
      render(<AnswerChatBubble answer={mockAnswer} />);

      const playButton = screen.getByRole('button', { name: /play/i });
      await user.click(playButton);

      // After click, MockAudioElement.play should be called
      expect(screen.getByRole('button', { name: /pause/i })).toBeInTheDocument();
    });
  });

  describe('Styling', () => {
    it('should apply right-aligned styles', () => {
      const { container } = render(<AnswerChatBubble answer={mockAnswer} />);

      const wrapper = container.querySelector('.justify-end');
      expect(wrapper).toBeInTheDocument();
    });

    it('should apply green color scheme', () => {
      const { container } = render(<AnswerChatBubble answer={mockAnswer} />);

      const bubble = container.querySelector('.bg-green-50');
      expect(bubble).toBeInTheDocument();
    });
  });
});
