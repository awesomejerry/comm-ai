export type RecordingSegment = {
  segmentId: string
  startTime: string
  endTime?: string
  startSlide: number
  endSlide: number
  blobRef?: Blob
  uploadState: 'queued' | 'uploading' | 'failed' | 'evaluated'
  evaluation?: any
}

export function validateSegment(s: Partial<RecordingSegment>) {
  if (!s.segmentId) return false
  if (s.startSlide == null || s.endSlide == null) return false
  if (s.endTime && s.startTime && new Date(s.endTime) < new Date(s.startTime)) return false
  return true
}
