export type RecordingState = 'recording' | 'paused' | 'reviewed' | 'uploaded' | 'deleted';

export type Recording = {
  id: string;
  audioBlob: Blob;
  duration: number;
  timestamp: Date;
  state: RecordingState;
};

export type Presentation = {
  id: string;
  title?: string;
  pageCount: number;
  thumbnailCache?: Record<number, string>;
  currentRecording: Recording | null;
  recordingHistory: Recording[];
};

export function validatePresentation(p: Partial<Presentation>) {
  if (!p || typeof p.pageCount !== 'number') return false;
  return p.pageCount >= 1;
}
