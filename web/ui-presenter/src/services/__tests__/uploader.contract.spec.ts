import { describe, it, expect, afterEach, vi } from 'vitest'
import { uploadSegmentToWebhook } from '../uploader'

describe('contract: uploadSegmentToWebhook', () => {
  const originalFetch = (globalThis as any).fetch

  afterEach(() => {
  ;(globalThis as any).fetch = originalFetch
    vi.restoreAllMocks()
  })

  it('posts multipart/form-data with audio, startSlide, endSlide and optional audience', async () => {
    let capturedUrl: string | null = null
    let capturedMethod: string | null = null
    let capturedBody: any = null

  ;(globalThis as any).fetch = vi.fn(async (url: any, opts: any) => {
      capturedUrl = String(url)
      capturedMethod = opts?.method ?? 'GET'
      capturedBody = opts?.body

      // return a successful json response
      return {
        ok: true,
        json: async () => ({ input: 'ok', output: 'nice' }),
      } as any
    }) as unknown as typeof fetch

    // create a fake blob-like object; in jsdom environment Blob exists
    const blob = new Blob(['hello'], { type: 'audio/webm' })
    const seg = { id: 'seg1', blob, startSlide: 1, endSlide: 2, audience: 'test' }

  const res = await uploadSegmentToWebhook('https://example.test/webhook', seg)

    // sanity: response returned
    expect(res).toEqual({ input: 'ok', output: 'nice' })

    // fetch called with correct url and method
    expect(capturedUrl).toBe('https://example.test/webhook')
    expect(capturedMethod).toBe('POST')

    // body should be a FormData instance and contain our fields
    expect(capturedBody).toBeDefined()
    // FormData supports get and getAll in browser-like envs
    // Use Array.from to list entries if available
    if (typeof capturedBody.get === 'function') {
      expect(capturedBody.get('startSlide')).toBe(String(seg.startSlide))
      expect(capturedBody.get('endSlide')).toBe(String(seg.endSlide))
      expect(capturedBody.get('audience')).toBe(seg.audience)
      const audio = capturedBody.get('audio')
      // audio should be a File/Blob-like object or have a name when appended with filename
      expect(audio).toBeDefined()
    } else {
      // fallback: iterate entries
      const entries: any[] = []
      for (const e of capturedBody) entries.push(e)
      const keys = entries.map(e => e[0])
      expect(keys).toContain('startSlide')
      expect(keys).toContain('endSlide')
      expect(keys).toContain('audience')
      expect(keys).toContain('audio')
    }
  })
})
