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
});
