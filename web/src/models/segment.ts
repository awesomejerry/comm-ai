export type RecordingSegment = {
  segmentId: string;
  startTime: string;
  endTime?: string;
  startSlide: number;
  endSlide: number;
  audience?: string;
  blobRef?: Blob;
  uploadState: 'queued' | 'uploading' | 'failed' | 'evaluated';
  evaluation?: any;
};

/**
 * Slide Navigation Event
 * Captures timestamp when user navigates to a different slide during present mode
 */
export interface SlideNavigationEvent {
  timestamp: number; // Unix timestamp in milliseconds
  slideNumber: number; // Slide index (0-based)
  eventTime: Date; // Human-readable time
}

/**
 * Collection of slide navigation events for a recording session
 */
export interface SlideTimestamps {
  events: SlideNavigationEvent[];
  sessionStart: number; // Unix timestamp when recording started
  sessionStop?: number; // Unix timestamp when recording stopped (optional, set on stop)
}

export function validateSegment(s: Partial<RecordingSegment>) {
  if (!s.segmentId) return false;
  if (s.startSlide == null || s.endSlide == null) return false;
  if (s.endTime && s.startTime && new Date(s.endTime) < new Date(s.startTime)) return false;
  return true;
}
