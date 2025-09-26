import { describe, it, expect } from 'vitest';
import { parseSrtToText, isValidSrt } from '../../src/services/srtParser';

describe('SRT Parser', () => {
  describe('parseSrtToText', () => {
    it('should parse valid SRT content to plain text', () => {
      const srtContent = `1
00:00:01,000 --> 00:00:05,000
Hello, this is a test.

2
00:00:06,000 --> 00:00:10,000
How are you today?`;

      const result = parseSrtToText(srtContent);
      expect(result).toBe('Hello, this is a test. How are you today?');
    });

    it('should handle SRT with multiple lines per subtitle', () => {
      const srtContent = `1
00:00:01,000 --> 00:00:05,000
Hello, this is a test.
With multiple lines.

2
00:00:06,000 --> 00:00:10,000
How are you today?`;

      const result = parseSrtToText(srtContent);
      expect(result).toBe('Hello, this is a test. With multiple lines. How are you today?');
    });

    it('should return empty string for invalid input', () => {
      expect(parseSrtToText(null as any)).toBe('');
      expect(parseSrtToText('')).toBe('');
      expect(parseSrtToText(123 as any)).toBe('');
    });

    it('should handle malformed SRT gracefully', () => {
      const malformedSrt = `1
00:00:01,000 --> 00:00:05,000
Some text
more text`;

      const result = parseSrtToText(malformedSrt);
      expect(result).toBe('Some text more text');
    });
  });

  describe('isValidSrt', () => {
    it('should return true for valid SRT format', () => {
      const validSrt = `1
00:00:01,000 --> 00:00:05,000
Hello world.`;

      expect(isValidSrt(validSrt)).toBe(true);
    });

    it('should return false for invalid formats', () => {
      expect(isValidSrt('')).toBe(false);
      expect(isValidSrt('not srt')).toBe(false);
      expect(isValidSrt('1\n00:00:01,000\nmissing arrow')).toBe(false);
      expect(isValidSrt(null as any)).toBe(false);
    });

    it('should return true for multi-subtitle SRT', () => {
      const multiSrt = `1
00:00:01,000 --> 00:00:05,000
First subtitle.

2
00:00:06,000 --> 00:00:10,000
Second subtitle.`;

      expect(isValidSrt(multiSrt)).toBe(true);
    });
  });
});
