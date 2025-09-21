import { uploadSegmentToWebhook } from './uploader';

export interface QueuedSegment {
  id: string;
  blob: Blob;
  startSlide: number;
  endSlide: number;
  audience?: string;
  retryCount: number;
  maxRetries: number;
  status: 'pending' | 'uploading' | 'failed' | 'completed';
  lastError?: string;
  onComplete?: (result: any) => void;
  onError?: (error: Error) => void;
}

export class UploaderQueue {
  private queue: QueuedSegment[] = [];
  private readonly maxConcurrentUploads = 2;
  private readonly baseRetryDelay = 1000; // 1 second
  private readonly maxRetryDelay = 30000; // 30 seconds

  constructor(
    private readonly uploadUrl: string,
    private readonly defaultMaxRetries = 3
  ) {}

  addSegment(segment: Omit<QueuedSegment, 'retryCount' | 'maxRetries' | 'status'>): void {
    const queuedSegment: QueuedSegment = {
      ...segment,
      retryCount: 0,
      maxRetries: this.defaultMaxRetries,
      status: 'pending',
    };

    this.queue.push(queuedSegment);
    // Process immediately instead of waiting
    this.processQueue();
  }

  private async processQueue(): Promise<void> {
    if (this.queue.length === 0) {
      return;
    }

    // Get pending segments up to max concurrent limit
    const pendingSegments = this.queue
      .filter((s) => s.status === 'pending')
      .slice(0, this.maxConcurrentUploads);

    if (pendingSegments.length === 0) {
      return;
    }

    // Process segments concurrently without blocking other additions
    const uploadPromises = pendingSegments.map((segment) => this.uploadSegment(segment));

    // Don't await here - let uploads happen asynchronously
    Promise.allSettled(uploadPromises).then(() => {
      // Continue processing if there are more items
      if (this.queue.some((s) => s.status === 'pending')) {
        setTimeout(() => this.processQueue(), 10);
      }
    });
  }

  private async uploadSegment(segment: QueuedSegment): Promise<void> {
    segment.status = 'uploading';

    try {
      const result = await uploadSegmentToWebhook(this.uploadUrl, {
        id: segment.id,
        blob: segment.blob,
        startSlide: segment.startSlide,
        endSlide: segment.endSlide,
        audience: segment.audience,
      });

      segment.status = 'completed';
      segment.onComplete?.(result);
    } catch (error) {
      segment.retryCount++;
      segment.lastError = error instanceof Error ? error.message : 'Unknown error';

      if (segment.retryCount < segment.maxRetries) {
        // Schedule retry with exponential backoff
        const delay = Math.min(
          this.baseRetryDelay * Math.pow(2, segment.retryCount - 1),
          this.maxRetryDelay
        );

        segment.status = 'pending';
        setTimeout(() => {
          this.processQueue();
        }, delay);
      } else {
        segment.status = 'failed';
        segment.onError?.(
          new Error(`Failed after ${segment.maxRetries} retries: ${segment.lastError}`)
        );
      }
    }
  }

  getQueueStatus(): {
    total: number;
    pending: number;
    uploading: number;
    failed: number;
    completed: number;
  } {
    return {
      total: this.queue.length,
      pending: this.queue.filter((s) => s.status === 'pending').length,
      uploading: this.queue.filter((s) => s.status === 'uploading').length,
      failed: this.queue.filter((s) => s.status === 'failed').length,
      completed: this.queue.filter((s) => s.status === 'completed').length,
    };
  }

  retryFailedSegments(): void {
    const failedSegments = this.queue.filter((s) => s.status === 'failed');
    failedSegments.forEach((segment) => {
      segment.status = 'pending';
      segment.retryCount = 0; // Reset retry count for manual retry
    });
    this.processQueue();
  }

  clearCompletedSegments(): void {
    this.queue = this.queue.filter((s) => s.status !== 'completed');
  }

  getSegmentById(id: string): QueuedSegment | undefined {
    return this.queue.find((s) => s.id === id);
  }
}
