export async function uploadSegmentToWebhook(
  url: string,
  seg: {
    id: string;
    blob: Blob;
    startSlide: number;
    endSlide: number;
    audience?: string;
    mode?: 'practice' | 'present'; // T024: Add mode field
    timestamps?: string; // T025: Add timestamps field (JSON string)
  }
) {
  const form = new FormData();
  form.append('audio', seg.blob, seg.id + '.webm');
  form.append('startSlide', String(seg.startSlide));
  form.append('endSlide', String(seg.endSlide));
  if (seg.audience) form.append('audience', seg.audience);
  if (seg.mode) form.append('mode', seg.mode); // T024
  if (seg.timestamps) form.append('timestamps', seg.timestamps); // T025

  const resp = await fetch(url, {
    method: 'POST',
    body: form,
    headers: {
      Accept: 'application/json',
    },
  });
  if (!resp.ok) throw new Error('upload failed');
  return await resp.json();
}
