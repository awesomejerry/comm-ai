import { describe, it, expect, vi, beforeEach } from 'vitest';
import { UploaderQueue } from '../uploaderQueue';
import { uploadSegmentToWebhook } from '../uploader';

// Mock the uploader
vi.mock('../uploader', () => ({
  uploadSegmentToWebhook: vi.fn(),
}));

const mockUpload = vi.mocked(uploadSegmentToWebhook);

describe('UploaderQueue', () => {
  let queue: UploaderQueue;
  const uploadUrl = 'https://example.com/upload';

  beforeEach(() => {
    queue = new UploaderQueue(uploadUrl, 2); // maxRetries = 2
    vi.clearAllMocks();
  });

  it('adds segments to the queue', () => {
    // Mock upload to never resolve so segment stays in uploading status
    mockUpload.mockImplementation(() => new Promise(() => {}));

    const blob = new Blob(['test']);
    queue.addSegment({
      id: 'seg-1',
      blob,
      startSlide: 1,
      endSlide: 2,
    });

    const status = queue.getQueueStatus();
    expect(status.total).toBe(1);
    expect(status.uploading).toBe(1);
  });

  it('processes pending segments automatically', async () => {
    mockUpload.mockResolvedValue({
      id: 'seg-1',
      input: 'test transcript',
      output: 'test response',
    });

    const blob = new Blob(['test']);
    queue.addSegment({
      id: 'seg-1',
      blob,
      startSlide: 1,
      endSlide: 2,
    });

    // Wait for async processing
    await new Promise((resolve) => setTimeout(resolve, 10));

    expect(mockUpload).toHaveBeenCalledWith(uploadUrl, {
      id: 'seg-1',
      blob,
      startSlide: 1,
      endSlide: 2,
    });
  });

  it('can clear completed segments', async () => {
    mockUpload.mockResolvedValue({
      id: 'seg-1',
      input: 'test transcript',
      output: 'test response',
    });

    const blob = new Blob(['test']);
    queue.addSegment({
      id: 'seg-1',
      blob,
      startSlide: 1,
      endSlide: 2,
    });

    await new Promise((resolve) => setTimeout(resolve, 10));

    expect(queue.getQueueStatus().total).toBe(1);
    expect(queue.getQueueStatus().completed).toBe(1);

    queue.clearCompletedSegments();

    expect(queue.getQueueStatus().total).toBe(0);
  });

  it('calls onComplete callback when upload succeeds', async () => {
    const onComplete = vi.fn();
    mockUpload.mockResolvedValue({
      id: 'seg-1',
      input: 'test transcript',
      output: 'test response',
      evaluation: 'good',
    });

    const blob = new Blob(['test']);
    queue.addSegment({
      id: 'seg-1',
      blob,
      startSlide: 1,
      endSlide: 2,
      onComplete,
    });

    await new Promise((resolve) => setTimeout(resolve, 10));

    expect(onComplete).toHaveBeenCalledWith({
      id: 'seg-1',
      input: 'test transcript',
      output: 'test response',
      evaluation: 'good',
    });
  });

  it('handles upload failures', async () => {
    const onError = vi.fn();
    mockUpload.mockRejectedValue(new Error('Network error'));

    // Use fake timers to control setTimeout
    vi.useFakeTimers();

    try {
      const blob = new Blob(['test']);
      queue.addSegment({
        id: 'seg-1',
        blob,
        startSlide: 1,
        endSlide: 2,
        onError,
      });

      // Fast-forward through all retry timeouts
      await vi.runAllTimersAsync();

      expect(onError).toHaveBeenCalled();
      const status = queue.getQueueStatus();
      expect(status.failed).toBe(1);
    } finally {
      vi.useRealTimers();
    }
  });

  it('can retrieve segment by ID', () => {
    const blob = new Blob(['test']);
    queue.addSegment({
      id: 'seg-1',
      blob,
      startSlide: 1,
      endSlide: 2,
    });

    const segment = queue.getSegmentById('seg-1');
    expect(segment).toBeDefined();
    expect(segment?.id).toBe('seg-1');
    expect(segment?.startSlide).toBe(1);
  });

  it('provides accurate queue status', () => {
    // Mock upload to never resolve so segments stay in uploading status
    mockUpload.mockImplementation(() => new Promise(() => {}));

    const blob1 = new Blob(['test1']);
    queue.addSegment({
      id: 'seg-1',
      blob: blob1,
      startSlide: 1,
      endSlide: 2,
    });

    const blob2 = new Blob(['test2']);
    queue.addSegment({
      id: 'seg-2',
      blob: blob2,
      startSlide: 2,
      endSlide: 3,
    });

    const status = queue.getQueueStatus();
    expect(status.total).toBe(2);
    // With maxConcurrentUploads = 2, both should be uploading
    expect(status.uploading).toBe(2);
  });
});
