import { describe, it, expect, vi } from 'vitest';
import { RecordingController } from '../recordingController';

describe('RecordingController', () => {
  it('calls onSegmentReady on confirmUpload', async () => {
    // Mock MediaRecorder via global
    const chunks: any[] = [];
    class MockMediaRecorder {
      static isTypeSupported = vi.fn(() => true);
      ondataavailable: any = null;
      onstop: any = null;
      start() {}
      stop() {
        if (this.onstop) this.onstop();
      }
    }

    // @ts-ignore
    global.MediaRecorder = MockMediaRecorder;
    // @ts-ignore
    global.navigator = { mediaDevices: { getUserMedia: async () => ({}) } };

    const onReady = vi.fn();
    const rc = new RecordingController({ onSegmentReady: onReady });
    await rc.start();
    rc.pause(2);
    expect(onReady).not.toHaveBeenCalled(); // Not called on pause
    rc.review();
    rc.confirmUpload(3);
    expect(onReady).toHaveBeenCalled();
  });

  it('manages recording state correctly', async () => {
    const onStateChange = vi.fn();
    const rc = new RecordingController({ onStateChange });

    // Mock dependencies
    class MockMediaRecorder {
      static isTypeSupported = vi.fn(() => true);
      ondataavailable: any = null;
      onstop: any = null;
      start() {}
      stop() {
        if (this.onstop) this.onstop();
      }
    }
    // @ts-ignore
    global.MediaRecorder = MockMediaRecorder;
    // @ts-ignore
    global.navigator = { mediaDevices: { getUserMedia: async () => ({}) } };

    expect(rc.getState()).toBe('recording');

    await rc.start();
    expect(rc.getState()).toBe('recording');
    expect(onStateChange).toHaveBeenCalledWith('recording');

    rc.pause(1);
    expect(rc.getState()).toBe('paused');
    expect(onStateChange).toHaveBeenCalledWith('paused');
    expect(rc.getCurrentRecording()).not.toBeNull();

    rc.review();
    expect(rc.getState()).toBe('reviewed');
    expect(onStateChange).toHaveBeenCalledWith('reviewed');

    const onSegmentReady = vi.fn();
    const rc2 = new RecordingController({ onSegmentReady, onStateChange });
    await rc2.start();
    rc2.pause(1);
    rc2.review();
    rc2.confirmUpload(2);
    expect(rc2.getState()).toBe('uploaded');
    expect(onSegmentReady).toHaveBeenCalled();
    expect(rc2.getCurrentRecording()).toBeNull();

    rc.deleteRecording();
    expect(rc.getState()).toBe('deleted');
  });
});
