export async function uploadSegmentToWebhook(url: string, seg: { id: string; blob: Blob; startSlide: number; endSlide: number; audience?: string }) {
  const form = new FormData()
  form.append('audio', seg.blob, seg.id + '.webm')
  form.append('startSlide', String(seg.startSlide))
  form.append('endSlide', String(seg.endSlide))
  if (seg.audience) form.append('audience', seg.audience)

  const resp = await fetch(url, { method: 'POST', body: form })
  if (!resp.ok) throw new Error('upload failed')
  return await resp.json()
}
