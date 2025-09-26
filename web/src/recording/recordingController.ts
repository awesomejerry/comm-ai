import { nanoid } from 'nanoid';
import type { Recording, RecordingState } from '../models/presentation';

export type RecordingControllerOptions = {
  onSegmentReady?: (segment: {
    id: string;
    blob: Blob;
    startSlide: number;
    endSlide: number;
  }) => void;
  onError?: (error: Error) => void;
  onStateChange?: (state: RecordingState) => void;
};

export class RecordingController {
  private mediaRecorder: MediaRecorder | null = null;
  private mediaStream: MediaStream | null = null;
  private chunks: BlobPart[] = [];
  private options: RecordingControllerOptions;
  private startSlide: number = 1;
  private currentRecording: Recording | null = null;
  private state: RecordingState = 'recording';

  constructor(options: RecordingControllerOptions = {}) {
    this.options = options;
  }

  private stopMediaStream() {
    if (this.mediaStream && typeof this.mediaStream.getTracks === 'function') {
      this.mediaStream.getTracks().forEach((track) => track.stop());
      this.mediaStream = null;
    }
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
      this.mediaStream = stream;
      this.mediaRecorder = new MediaRecorder(stream, {
        mimeType: this.getSupportedMimeType(),
      });
      this.chunks = [];
      this.mediaRecorder.ondataavailable = (e) => this.chunks.push(e.data);
      this.mediaRecorder.start(1000);
      this.state = 'recording';
      this.options.onStateChange?.(this.state);
      console.log('Recording started');
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Microphone access denied';
      this.options.onError?.(new Error(`Microphone permission denied: ${errorMessage}`));
      throw error;
    }
  }

  pause(currentSlide: number) {
    if (!this.mediaRecorder || this.state !== 'recording') return;
    this.mediaRecorder.stop();
    this.stopMediaStream();
    const blob = new Blob(this.chunks, { type: 'audio/webm' });
    const id = 'rec-' + nanoid();
    this.currentRecording = {
      id,
      audioBlob: blob,
      duration: 0, // Will be set when audio loads
      timestamp: new Date(),
      state: 'paused',
    };
    this.state = 'paused';
    this.options.onStateChange?.(this.state);
    console.log('Recording paused for review');
  }

  stop() {
    if (!this.mediaRecorder) return;
    this.mediaRecorder.stop();
    this.stopMediaStream();
  }

  review() {
    if (this.state !== 'paused' || !this.currentRecording) return;
    this.state = 'reviewed';
    this.options.onStateChange?.(this.state);
    console.log('Recording reviewed');
  }

  confirmUpload(currentSlide: number) {
    if ((this.state !== 'reviewed' && this.state !== 'paused') || !this.currentRecording) return;
    this.currentRecording.state = 'uploaded';
    this.options.onSegmentReady?.({
      id: this.currentRecording.id,
      blob: this.currentRecording.audioBlob,
      startSlide: this.startSlide,
      endSlide: currentSlide,
    });
    this.stopMediaStream();
    this.state = 'uploaded';
    this.options.onStateChange?.(this.state);
    this.currentRecording = null;
    console.log('Recording confirmed and uploaded');
  }

  deleteRecording() {
    if (this.state !== 'reviewed' && this.state !== 'paused') return;
    if (this.currentRecording) {
      this.currentRecording.state = 'deleted';
      // Optionally revoke blob URL if created
    }
    this.stopMediaStream();
    this.state = 'deleted';
    this.options.onStateChange?.(this.state);
    this.currentRecording = null;
    console.log('Recording deleted');
  }

  getCurrentRecording(): Recording | null {
    return this.currentRecording;
  }

  getState(): RecordingState {
    return this.state;
  }
}
