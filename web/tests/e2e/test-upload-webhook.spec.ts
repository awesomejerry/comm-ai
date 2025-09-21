import { test, expect } from '@playwright/test';
import { uploadSegmentToWebhook } from '../../src/services/uploader';

test('upload audio segment contract', async () => {
  // Mock fetch
  const mockFetch = globalThis.fetch;
  globalThis.fetch = async (url: string | URL | Request, options?: RequestInit) => {
    expect(url).toBe('https://n8n.awesomejerry.space/webhook/commoon/upload-audio');
    expect(options?.method).toBe('POST');
    const formData = options?.body as FormData;
    const audioFile = formData.get('audio') as File;
    expect(audioFile).toBeInstanceOf(File);
    expect(audioFile.name).toBe('test-segment-1.webm');
    expect(formData.get('startSlide')).toBe('1');
    expect(formData.get('endSlide')).toBe('5');
    return { ok: true, json: async () => ({ evaluation: 'mock result' }) } as Response;
  };

  const blob = new Blob(['test audio'], { type: 'audio/webm' });
  const result = await uploadSegmentToWebhook(
    'https://n8n.awesomejerry.space/webhook/commoon/upload-audio',
    {
      id: 'test-segment-1',
      blob,
      startSlide: 1,
      endSlide: 5,
    }
  );

  expect(result).toEqual({ evaluation: 'mock result' });

  // Restore fetch
  globalThis.fetch = mockFetch;
});
