/**
 * Unit tests for RecordingPersistence
 * These tests are written BEFORE implementation (TDD approach)
 */

import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import 'fake-indexeddb/auto';
import { RecordingPersistence } from '../../../src/recording/recordingPersistence';

describe('RecordingPersistence', () => {
  let persistence: RecordingPersistence;

  beforeEach(async () => {
    persistence = new RecordingPersistence();
    await persistence.clear(); // Clean state for each test
  });

  afterEach(async () => {
    await persistence.clear(); // Cleanup after tests
  });

  describe('saveRecording', () => {
    it('should save recording blob with metadata to IndexedDB', async () => {
      const blob = new Blob(['test audio data'], { type: 'audio/webm' });
      const timestamps = JSON.stringify({
        sessionStart: Date.now(),
        events: [{ timestamp: Date.now(), slideNumber: 0, eventTime: new Date() }],
      });

      const id = await persistence.saveRecording(blob, timestamps);

      expect(id).toBeDefined();
      expect(typeof id).toBe('string');
    });

    it('should set createdAt timestamp automatically', async () => {
      const blob = new Blob(['test'], { type: 'audio/webm' });
      const timestamps = JSON.stringify({ sessionStart: Date.now(), events: [] });

      const id = await persistence.saveRecording(blob, timestamps);
      const recording = await persistence.getRecording(id);

      expect(recording).toBeDefined();
      expect(recording!.createdAt).toBeInstanceOf(Date);
      expect(recording!.createdAt.getTime()).toBeLessThanOrEqual(Date.now());
    });

    it('should calculate expiry date as 7 days from creation', async () => {
      const blob = new Blob(['test'], { type: 'audio/webm' });
      const timestamps = JSON.stringify({ sessionStart: Date.now(), events: [] });

      const id = await persistence.saveRecording(blob, timestamps);
      const recording = await persistence.getRecording(id);

      expect(recording).toBeDefined();
      const expectedExpiry = new Date(recording!.createdAt);
      expectedExpiry.setDate(expectedExpiry.getDate() + 7);

      expect(recording!.expiresAt.getTime()).toBeCloseTo(
        expectedExpiry.getTime(),
        -3 // Allow 1 second tolerance
      );
    });
  });

  describe('getRecording', () => {
    it('should retrieve saved recording by ID', async () => {
      const blob = new Blob(['test data'], { type: 'audio/webm' });
      const timestamps = JSON.stringify({ sessionStart: Date.now(), events: [] });

      const id = await persistence.saveRecording(blob, timestamps);
      const retrieved = await persistence.getRecording(id);

      expect(retrieved).toBeDefined();
      expect(retrieved!.id).toBe(id);
      expect(retrieved!.blob).toBeDefined();
      expect(retrieved!.timestamps).toBe(timestamps);
    });

    it('should return null for non-existent recording', async () => {
      const retrieved = await persistence.getRecording('non-existent-id');
      expect(retrieved).toBeNull();
    });
  });

  describe('getAllRecordings', () => {
    it('should return all saved recordings', async () => {
      const blob1 = new Blob(['test1'], { type: 'audio/webm' });
      const blob2 = new Blob(['test2'], { type: 'audio/webm' });
      const timestamps = JSON.stringify({ sessionStart: Date.now(), events: [] });

      await persistence.saveRecording(blob1, timestamps);
      await persistence.saveRecording(blob2, timestamps);

      const all = await persistence.getAllRecordings();
      expect(all).toHaveLength(2);
    });

    it('should return empty array when no recordings exist', async () => {
      const all = await persistence.getAllRecordings();
      expect(all).toHaveLength(0);
    });
  });

  describe('deleteRecording', () => {
    it('should delete recording by ID', async () => {
      const blob = new Blob(['test'], { type: 'audio/webm' });
      const timestamps = JSON.stringify({ sessionStart: Date.now(), events: [] });

      const id = await persistence.saveRecording(blob, timestamps);
      await persistence.deleteRecording(id);

      const retrieved = await persistence.getRecording(id);
      expect(retrieved).toBeNull();
    });

    it('should not throw error when deleting non-existent recording', async () => {
      await expect(persistence.deleteRecording('non-existent')).resolves.not.toThrow();
    });
  });

  describe('cleanupExpired', () => {
    it('should remove recordings older than 7 days', async () => {
      const blob = new Blob(['old'], { type: 'audio/webm' });
      const timestamps = JSON.stringify({ sessionStart: Date.now(), events: [] });

      const id = await persistence.saveRecording(blob, timestamps);

      // Manually set expiry to past date
      const recording = await persistence.getRecording(id);
      if (recording) {
        recording.expiresAt = new Date(Date.now() - 1000); // Expired 1 second ago
        await persistence['updateRecording'](recording); // Internal method
      }

      await persistence.cleanupExpired();

      const retrieved = await persistence.getRecording(id);
      expect(retrieved).toBeNull();
    });

    it('should keep recordings that have not expired', async () => {
      const blob = new Blob(['fresh'], { type: 'audio/webm' });
      const timestamps = JSON.stringify({ sessionStart: Date.now(), events: [] });

      const id = await persistence.saveRecording(blob, timestamps);
      await persistence.cleanupExpired();

      const retrieved = await persistence.getRecording(id);
      expect(retrieved).toBeDefined();
    });
  });

  describe('clear', () => {
    it('should remove all recordings', async () => {
      const blob = new Blob(['test'], { type: 'audio/webm' });
      const timestamps = JSON.stringify({ sessionStart: Date.now(), events: [] });

      await persistence.saveRecording(blob, timestamps);
      await persistence.saveRecording(blob, timestamps);

      await persistence.clear();

      const all = await persistence.getAllRecordings();
      expect(all).toHaveLength(0);
    });
  });
});
