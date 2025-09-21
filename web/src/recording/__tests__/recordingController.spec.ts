import { describe, it, expect, vi } from 'vitest';
import { RecordingController } from '../recordingController';

describe('RecordingController', () => {
  it('calls onSegmentReady on pause', async () => {
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
    expect(onReady).toHaveBeenCalled();
  });
});
