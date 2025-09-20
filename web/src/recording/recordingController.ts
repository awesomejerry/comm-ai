import { nanoid } from 'nanoid'

export type RecordingControllerOptions = {
  onSegmentReady?: (segment: { id: string; blob: Blob; startSlide: number; endSlide: number }) => void
}

export class RecordingController {
  private mediaRecorder: MediaRecorder | null = null
  private chunks: BlobPart[] = []
  private options: RecordingControllerOptions
  private startSlide: number = 1

  constructor(options: RecordingControllerOptions = {}) {
    this.options = options
  }

  async start(startSlide?: number) {
    if (typeof startSlide === 'number') this.startSlide = startSlide
    const stream = await navigator.mediaDevices.getUserMedia({ audio: true })
    this.mediaRecorder = new MediaRecorder(stream)
    this.chunks = []
    this.mediaRecorder.ondataavailable = e => this.chunks.push(e.data)
    this.mediaRecorder.start()
  }

  pause(currentSlide: number) {
    if (!this.mediaRecorder) return
    this.mediaRecorder.stop()
    const blob = new Blob(this.chunks, { type: 'audio/webm' })
    const id = 'seg-' + nanoid()
    this.options.onSegmentReady?.({ id, blob, startSlide: this.startSlide, endSlide: currentSlide })
  }

  stop() {
    if (!this.mediaRecorder) return
    this.mediaRecorder.stop()
  }
}
