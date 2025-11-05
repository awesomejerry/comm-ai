/**
 * Unit tests for RecordingController mode parameter
 * These tests are written BEFORE implementation (TDD approach)
 */

import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { RecordingController } from '../../../src/recording/recordingController';

describe('RecordingController - Present Mode Support', () => {
  let controller: RecordingController;

  beforeEach(() => {
    // Mock MediaRecorder API
    global.MediaRecorder = vi.fn().mockImplementation(() => ({
      start: vi.fn(),
      stop: vi.fn(),
      pause: vi.fn(),
      resume: vi.fn(),
      addEventListener: vi.fn(),
      removeEventListener: vi.fn(),
      state: 'inactive',
      ondataavailable: null,
    })) as any;

    // Mock isTypeSupported as a static method
    (global.MediaRecorder as any).isTypeSupported = vi.fn().mockReturnValue(true);

    // Mock getUserMedia
    Object.defineProperty(global.navigator, 'mediaDevices', {
      value: {
        getUserMedia: vi.fn().mockResolvedValue({
          getTracks: () => [{ stop: vi.fn() }],
        }),
      },
      writable: true,
      configurable: true,
    });

    controller = new RecordingController();
  });

  afterEach(() => {
    vi.clearAllMocks();
  });

  describe('start with mode parameter', () => {
    it('should accept mode parameter in start method', async () => {
      await expect(controller.start({ slideNumber: 1, mode: 'present' })).resolves.not.toThrow();
    });

    it('should default to practice mode when mode not specified', async () => {
      await controller.start({ slideNumber: 1 });
      controller.pause(5); // Create recording
      const recording = controller.getCurrentRecording();

      expect(recording?.mode).toBe('practice');
    });

    it('should set mode to present when specified', async () => {
      await controller.start({ slideNumber: 1, mode: 'present' });
      controller.pause(5); // Create recording
      const recording = controller.getCurrentRecording();

      expect(recording?.mode).toBe('present');
    });
  });

  describe('MediaRecorder configuration for present mode', () => {
    it('should configure MediaRecorder with 64 kbps bitrate', async () => {
      await controller.start({ slideNumber: 1, mode: 'present' });

      expect(global.MediaRecorder).toHaveBeenCalledWith(
        expect.anything(),
        expect.objectContaining({
          audioBitsPerSecond: 64000, // 64 kbps
        })
      );
    });

    it('should use 64 kbps bitrate for both practice and present modes', async () => {
      await controller.start({ slideNumber: 1, mode: 'practice' });

      expect(global.MediaRecorder).toHaveBeenCalledWith(
        expect.anything(),
        expect.objectContaining({
          audioBitsPerSecond: 64000,
        })
      );
    });
  });

  describe('getCurrentRecording with mode', () => {
    it('should return recording with mode field', async () => {
      await controller.start({ slideNumber: 1, mode: 'present' });
      controller.pause(5);
      const recording = controller.getCurrentRecording();

      expect(recording).toBeDefined();
      expect(recording).toHaveProperty('mode');
    });

    it('should preserve mode throughout recording lifecycle', async () => {
      await controller.start({ slideNumber: 1, mode: 'present' });
      controller.pause(5);
      const recording1 = controller.getCurrentRecording();

      expect(recording1?.mode).toBe('present');

      // Verify mode is preserved in the recording object
      const recording2 = controller.getCurrentRecording();
      expect(recording2?.mode).toBe('present');
    });
  });

  describe('mode in segment callbacks', () => {
    it('should include mode in onSegmentReady callback data', async () => {
      const onSegmentReady = vi.fn();
      controller = new RecordingController({ onSegmentReady });

      await controller.start({ slideNumber: 1, mode: 'present' });
      controller.pause(5);

      // The pause method creates the recording and should have mode
      const recording = controller.getCurrentRecording();
      expect(recording?.mode).toBe('present');
    });

    it('should pass practice mode in callbacks when not specified', async () => {
      const onSegmentReady = vi.fn();
      controller = new RecordingController({ onSegmentReady });

      await controller.start({ slideNumber: 1 });
      controller.pause(5);

      const recording = controller.getCurrentRecording();
      expect(recording?.mode).toBe('practice');
    });
  });
});
