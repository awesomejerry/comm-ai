import { nanoid } from 'nanoid';

export type RecordingControllerOptions = {
  onSegmentReady?: (segment: {
    id: string;
    blob: Blob;
    startSlide: number;
    endSlide: number;
  }) => void;
  onError?: (error: Error) => void;
};

export class RecordingController {
  private mediaRecorder: MediaRecorder | null = null;
  private chunks: BlobPart[] = [];
  private options: RecordingControllerOptions;
  private startSlide: number = 1;

  constructor(options: RecordingControllerOptions = {}) {
    this.options = options;
  }

  getSupportedMimeType() {
    const types = [
      'audio/webm;codecs=opus',
      'audio/webm',
      'audio/mp4',
      'audio/ogg;codecs=opus',
      'audio/wav',
    ];

    for (const type of types) {
      if (MediaRecorder.isTypeSupported(type)) {
        return type;
      }
    }
    return 'audio/webm';
  }

  async start(startSlide?: number) {
    if (typeof startSlide === 'number') this.startSlide = startSlide;

    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        audio: {
          echoCancellation: true,
          noiseSuppression: true,
          sampleRate: 44100,
        },
      });
      this.mediaRecorder = new MediaRecorder(stream, {
        mimeType: this.getSupportedMimeType(),
      });
      this.chunks = [];
      this.mediaRecorder.ondataavailable = (e) => this.chunks.push(e.data);
      this.mediaRecorder.start(1000);
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Microphone access denied';
      this.options.onError?.(new Error(`Microphone permission denied: ${errorMessage}`));
      throw error;
    }
  }

  pause(currentSlide: number) {
    if (!this.mediaRecorder) return;
    this.mediaRecorder.stop();
    const blob = new Blob(this.chunks, { type: 'audio/webm' });
    const id = 'seg-' + nanoid();
    this.options.onSegmentReady?.({
      id,
      blob,
      startSlide: this.startSlide,
      endSlide: currentSlide,
    });
  }

  stop() {
    if (!this.mediaRecorder) return;
    this.mediaRecorder.stop();
  }
}
