/**
 * Unit tests for TimestampTracker
 * These tests are written BEFORE implementation (TDD approach)
 */

import { describe, it, expect, beforeEach } from 'vitest';
import { TimestampTracker } from '../../../src/recording/timestampTracker';

describe('TimestampTracker', () => {
  let tracker: TimestampTracker;

  beforeEach(() => {
    tracker = new TimestampTracker();
  });

  describe('initialization', () => {
    it('should start with empty event list', () => {
      const timestamps = tracker.getTimestamps();
      expect(timestamps.events).toHaveLength(0);
    });

    it('should record session start time on creation', () => {
      const timestamps = tracker.getTimestamps();
      expect(timestamps.sessionStart).toBeGreaterThan(0);
      expect(timestamps.sessionStart).toBeLessThanOrEqual(Date.now());
    });
  });

  describe('trackNavigation', () => {
    it('should record slide navigation event with timestamp', () => {
      const slideNumber = 2;
      tracker.trackNavigation(slideNumber);

      const timestamps = tracker.getTimestamps();
      expect(timestamps.events).toHaveLength(1);
      expect(timestamps.events[0].slideNumber).toBe(slideNumber);
      expect(timestamps.events[0].timestamp).toBeGreaterThan(0);
    });

    it('should record multiple navigation events in sequence', () => {
      tracker.trackNavigation(0);
      tracker.trackNavigation(1);
      tracker.trackNavigation(2);

      const timestamps = tracker.getTimestamps();
      expect(timestamps.events).toHaveLength(3);
      expect(timestamps.events[0].slideNumber).toBe(0);
      expect(timestamps.events[1].slideNumber).toBe(1);
      expect(timestamps.events[2].slideNumber).toBe(2);
    });

    it('should maintain chronological order of events', () => {
      tracker.trackNavigation(0);
      tracker.trackNavigation(5);
      tracker.trackNavigation(3);

      const timestamps = tracker.getTimestamps();
      expect(timestamps.events[0].timestamp).toBeLessThanOrEqual(timestamps.events[1].timestamp);
      expect(timestamps.events[1].timestamp).toBeLessThanOrEqual(timestamps.events[2].timestamp);
    });

    it('should include eventTime as Date object', () => {
      tracker.trackNavigation(1);

      const timestamps = tracker.getTimestamps();
      expect(timestamps.events[0].eventTime).toBeInstanceOf(Date);
    });
  });

  describe('reset', () => {
    it('should clear all events when reset', () => {
      tracker.trackNavigation(0);
      tracker.trackNavigation(1);
      tracker.reset();

      const timestamps = tracker.getTimestamps();
      expect(timestamps.events).toHaveLength(0);
    });

    it('should update session start time on reset', () => {
      const originalStart = tracker.getTimestamps().sessionStart;
      tracker.reset();
      const newStart = tracker.getTimestamps().sessionStart;

      expect(newStart).toBeGreaterThanOrEqual(originalStart);
    });
  });

  describe('toJSON', () => {
    it('should serialize timestamps to JSON format for API', () => {
      tracker.trackNavigation(0);
      tracker.trackNavigation(1);

      const json = tracker.toJSON();
      const parsed = JSON.parse(json);

      expect(parsed).toHaveProperty('sessionStart');
      expect(parsed).toHaveProperty('events');
      expect(parsed.events).toHaveLength(2);
    });

    it('should include all required fields in JSON', () => {
      tracker.trackNavigation(5);

      const json = tracker.toJSON();
      const parsed = JSON.parse(json);

      expect(parsed.events[0]).toHaveProperty('timestamp');
      expect(parsed.events[0]).toHaveProperty('slideNumber');
      expect(parsed.events[0]).toHaveProperty('eventTime');
    });
  });
});
