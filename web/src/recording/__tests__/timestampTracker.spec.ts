import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { TimestampTracker } from '../timestampTracker';

describe('TimestampTracker', () => {
  let tracker: TimestampTracker;

  beforeEach(() => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date('2025-01-01T00:00:00.000Z'));
    tracker = new TimestampTracker();
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it('initializes with session start timestamp', () => {
    const timestamps = tracker.getTimestamps();
    expect(timestamps.sessionStart).toBe(Date.now());
    expect(timestamps.sessionStop).toBeUndefined();
    expect(timestamps.events).toHaveLength(0);
  });

  it('tracks slide navigation events', () => {
    tracker.trackNavigation(1);
    vi.advanceTimersByTime(1000);
    tracker.trackNavigation(2);
    vi.advanceTimersByTime(2000);
    tracker.trackNavigation(3);

    const timestamps = tracker.getTimestamps();
    expect(timestamps.events).toHaveLength(3);
    expect(timestamps.events[0].slideNumber).toBe(1);
    expect(timestamps.events[1].slideNumber).toBe(2);
    expect(timestamps.events[2].slideNumber).toBe(3);

    // Check timestamps are sequential
    expect(timestamps.events[1].timestamp).toBeGreaterThan(timestamps.events[0].timestamp);
    expect(timestamps.events[2].timestamp).toBeGreaterThan(timestamps.events[1].timestamp);
  });

  it('records sessionStop when stopSession is called', () => {
    tracker.trackNavigation(1);
    vi.advanceTimersByTime(5000);
    tracker.stopSession();

    const timestamps = tracker.getTimestamps();
    expect(timestamps.sessionStop).toBeDefined();
    expect(timestamps.sessionStop).toBe(Date.now());
    expect(timestamps.sessionStop! - timestamps.sessionStart).toBe(5000);
  });

  it('resets all state including sessionStop', () => {
    tracker.trackNavigation(1);
    tracker.trackNavigation(2);
    tracker.stopSession();

    const beforeReset = tracker.getTimestamps();
    expect(beforeReset.events).toHaveLength(2);
    expect(beforeReset.sessionStop).toBeDefined();

    vi.advanceTimersByTime(1000);
    tracker.reset();

    const afterReset = tracker.getTimestamps();
    expect(afterReset.events).toHaveLength(0);
    expect(afterReset.sessionStop).toBeUndefined();
    expect(afterReset.sessionStart).toBe(Date.now());
  });

  it('serializes to JSON with sessionStop when present', () => {
    const startTime = Date.now();
    tracker.trackNavigation(1);
    vi.advanceTimersByTime(3000);
    tracker.trackNavigation(2);
    vi.advanceTimersByTime(2000);
    tracker.stopSession();

    const json = tracker.toJSON();
    const parsed = JSON.parse(json);

    expect(parsed.sessionStart).toBe(startTime);
    expect(parsed.sessionStop).toBe(startTime + 5000);
    expect(parsed.events).toHaveLength(2);
    expect(parsed.events[0].slideNumber).toBe(1);
    expect(parsed.events[0].timestamp).toBe(startTime);
    expect(parsed.events[1].slideNumber).toBe(2);
    expect(parsed.events[1].timestamp).toBe(startTime + 3000);
  });

  it('serializes to JSON without sessionStop when not stopped', () => {
    tracker.trackNavigation(1);
    tracker.trackNavigation(2);

    const json = tracker.toJSON();
    const parsed = JSON.parse(json);

    expect(parsed.sessionStart).toBeDefined();
    expect(parsed.sessionStop).toBeUndefined();
    expect(parsed.events).toHaveLength(2);
  });

  it('includes eventTime as ISO string in JSON', () => {
    tracker.trackNavigation(1);
    const json = tracker.toJSON();
    const parsed = JSON.parse(json);

    expect(parsed.events[0].eventTime).toBe('2025-01-01T00:00:00.000Z');
  });

  it('returns a copy of events to prevent external mutation', () => {
    tracker.trackNavigation(1);
    const timestamps1 = tracker.getTimestamps();
    const timestamps2 = tracker.getTimestamps();

    expect(timestamps1.events).not.toBe(timestamps2.events);
    expect(timestamps1.events).toEqual(timestamps2.events);
  });

  it('can be stopped multiple times (last stop wins)', () => {
    tracker.trackNavigation(1);
    vi.advanceTimersByTime(1000);
    tracker.stopSession();
    const firstStop = Date.now();

    vi.advanceTimersByTime(2000);
    tracker.stopSession();
    const secondStop = Date.now();

    const timestamps = tracker.getTimestamps();
    expect(timestamps.sessionStop).toBe(secondStop);
    expect(timestamps.sessionStop).not.toBe(firstStop);
  });
});
