/**
 * Audio Format
 * Supported audio formats for recordings
 */
export type AudioFormat = 'webm' | 'mp4';

/**
 * Upload Status
 * Current state of audio answer upload
 */
export type UploadStatus = 'pending' | 'uploading' | 'uploaded' | 'error';

/**
 * Answer Rating
 * Represents the evaluation/rating of an audio answer
 */
export interface AnswerRating {
  /** Numeric score (0-100) */
  score: number;

  /** Text feedback (max 300 characters) */
  feedback: string;

  /** Rating generation timestamp */
  ratedAt: Date;
}

/**
 * Audio Answer
 * Represents a user's recorded audio response to a question
 */
export interface AudioAnswer {
  /** Unique answer identifier (client-generated) */
  id: string;

  /** Links to question being answered */
  questionId: string;

  /** Recorded audio data */
  audioBlob: Blob;

  /** Format of audio (webm or mp4) */
  audioFormat: AudioFormat;

  /** Recording duration in seconds */
  duration: number;

  /** Current upload state */
  uploadStatus: UploadStatus;

  /** Server-assigned answer ID (after successful upload) */
  answerId?: string;

  /** Rating received from server (null until rated) */
  rating?: AnswerRating;

  /** Answer submission timestamp */
  submittedAt: Date;

  /** Rating received timestamp */
  ratedAt?: Date;
}

/**
 * Validation: Check if upload status transition is valid
 */
export function isValidUploadTransition(from: UploadStatus, to: UploadStatus): boolean {
  const transitions: Record<UploadStatus, UploadStatus[]> = {
    pending: ['uploading'],
    uploading: ['uploaded', 'error'],
    uploaded: [],
    error: ['pending'], // Can retry
  };

  return transitions[from]?.includes(to) ?? false;
}

/**
 * Validation: Check if audio answer is valid
 */
export function validateAudioAnswer(answer: AudioAnswer): string[] {
  const errors: string[] = [];

  // Validate audio blob size (< 50MB)
  const maxSize = 50 * 1024 * 1024; // 50MB
  if (answer.audioBlob.size > maxSize) {
    errors.push('Audio file must be under 50MB');
  }

  // Validate duration
  if (answer.duration <= 0) {
    errors.push('Audio duration must be greater than 0');
  }

  // Validate format
  if (answer.audioFormat !== 'webm' && answer.audioFormat !== 'mp4') {
    errors.push('Audio format must be webm or mp4');
  }

  // Validate rating (if present)
  if (answer.rating) {
    if (answer.uploadStatus !== 'uploaded') {
      errors.push('Rating should only be present when upload status is uploaded');
    }

    if (answer.rating.score < 0 || answer.rating.score > 100) {
      errors.push('Rating score must be between 0 and 100');
    }

    if (!answer.rating.feedback || answer.rating.feedback.trim().length === 0) {
      errors.push('Rating feedback must not be empty');
    }

    if (answer.rating.feedback.length > 300) {
      errors.push('Rating feedback must be 300 characters or less');
    }
  }

  return errors;
}

/**
 * Check if audio format is supported by browser
 */
export function isSupportedAudioFormat(mimeType: string): AudioFormat | null {
  if (mimeType.includes('webm')) {
    return 'webm';
  }
  if (mimeType.includes('mp4') || mimeType.includes('m4a')) {
    return 'mp4';
  }
  return null;
}
