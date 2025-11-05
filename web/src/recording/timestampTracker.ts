/**
 * TimestampTracker
 *
 * Tracks slide navigation events during present mode recording.
 * Captures timestamps with millisecond precision for evaluation API.
 */

import type { SlideNavigationEvent, SlideTimestamps } from '../models/segment';

export class TimestampTracker {
  private events: SlideNavigationEvent[] = [];
  private sessionStart: number;
  private sessionStop?: number;

  constructor() {
    this.sessionStart = Date.now();
  }

  /**
   * Record a slide navigation event with current timestamp
   * @param slideNumber - The slide index (0-based) being navigated to
   */
  trackNavigation(slideNumber: number): void {
    const timestamp = Date.now();
    const event: SlideNavigationEvent = {
      timestamp,
      slideNumber,
      eventTime: new Date(timestamp),
    };

    this.events.push(event);
  }

  /**
   * Mark the end of the recording session
   * Should be called when recording is stopped/paused
   */
  stopSession(): void {
    this.sessionStop = Date.now();
  }

  /**
   * Get all recorded timestamps
   * @returns SlideTimestamps object with session start and navigation events
   */
  getTimestamps(): SlideTimestamps {
    return {
      sessionStart: this.sessionStart,
      sessionStop: this.sessionStop,
      events: [...this.events], // Return copy to prevent external mutation
    };
  }

  /**
   * Reset tracker state
   * Clears all events and updates session start time
   */
  reset(): void {
    this.events = [];
    this.sessionStart = Date.now();
    this.sessionStop = undefined;
  }

  /**
   * Serialize timestamps to JSON string for API payload
   * @returns JSON string representation of timestamps
   */
  toJSON(): string {
    const data: any = {
      sessionStart: this.sessionStart,
      events: this.events.map((event) => ({
        timestamp: event.timestamp,
        slideNumber: event.slideNumber,
        eventTime: event.eventTime.toISOString(),
      })),
    };

    // Only include sessionStop if it was set
    if (this.sessionStop !== undefined) {
      data.sessionStop = this.sessionStop;
    }

    return JSON.stringify(data);
  }
}
