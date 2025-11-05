import { describe, it, expect, vi } from 'vitest';
import { uploadSegmentToWebhook } from '../uploader';

describe('uploader', () => {
  it('posts formdata to the webhook', async () => {
    const mockFetch = vi.fn(async (url: string, opts: any) => {
      // inspect form data
      const body: FormData = opts.body;
      expect(body.get('startSlide')).toBe('1');
      expect(body.get('endSlide')).toBe('1');
      expect(body.get('audio')).toBeTruthy();
      return { ok: true, json: async () => ({ input: 'ok', output: 'good' }) };
    });
    // @ts-ignore
    global.fetch = mockFetch;

    const blob = new Blob(['a'], { type: 'audio/webm' });
    const res = await uploadSegmentToWebhook(
      'https://n8n.awesomejerry.space/webhook/comm-ai/upload-pitch',
      { id: 's1', blob, startSlide: 1, endSlide: 1 }
    );
    expect(res.input).toBe('ok');
  });

  it('includes mode and timestamps fields when provided (T024, T025)', async () => {
    const mockFetch = vi.fn(async (url: string, opts: any) => {
      const body: FormData = opts.body;

      // Verify mode field is included
      expect(body.get('mode')).toBe('present');

      // Verify timestamps field is included
      const timestamps = body.get('timestamps');
      expect(timestamps).toBeTruthy();
      expect(typeof timestamps).toBe('string');

      // Verify timestamps can be parsed as JSON
      const parsed = JSON.parse(timestamps as string);
      expect(Array.isArray(parsed)).toBe(true);
      expect(parsed.length).toBe(2);
      expect(parsed[0]).toHaveProperty('slideNumber');
      expect(parsed[0]).toHaveProperty('timestamp');

      return { ok: true, json: async () => ({ input: 'test', output: 'result' }) };
    });
    // @ts-ignore
    global.fetch = mockFetch;

    const blob = new Blob(['audio data'], { type: 'audio/webm' });
    const timestampsJSON = JSON.stringify([
      { slideNumber: 1, timestamp: 0 },
      { slideNumber: 2, timestamp: 5000 },
    ]);

    const res = await uploadSegmentToWebhook(
      'https://n8n.awesomejerry.space/webhook/comm-ai/upload-pitch',
      {
        id: 's1',
        blob,
        startSlide: 1,
        endSlide: 2,
        mode: 'present',
        timestamps: timestampsJSON,
      }
    );

    expect(res.input).toBe('test');
    expect(mockFetch).toHaveBeenCalledTimes(1);
  });

  it('does not include mode and timestamps when not provided', async () => {
    const mockFetch = vi.fn(async (url: string, opts: any) => {
      const body: FormData = opts.body;

      // Verify mode and timestamps are not included for practice mode recordings
      expect(body.get('mode')).toBeNull();
      expect(body.get('timestamps')).toBeNull();

      return { ok: true, json: async () => ({ input: 'ok', output: 'good' }) };
    });
    // @ts-ignore
    global.fetch = mockFetch;

    const blob = new Blob(['a'], { type: 'audio/webm' });
    const res = await uploadSegmentToWebhook(
      'https://n8n.awesomejerry.space/webhook/comm-ai/upload-pitch',
      { id: 's1', blob, startSlide: 1, endSlide: 1 }
    );

    expect(res.input).toBe('ok');
  });
});
