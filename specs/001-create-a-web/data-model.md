# Data Model

Entities (client-side):

- Presentation
  - id: string (local generated)
  - title: string
  - pageCount: integer
  - thumbnailCache: map<pageIndex, dataUrl>

- Slide
  - presentationId: string
  - index: integer
  - renderedAt: timestamp

- RecordingSegment
  - segmentId: string (unique)
  - startTime: ISO timestamp
  - endTime: ISO timestamp
  - startSlide: integer
  - endSlide: integer
  - blobRef: temporary in-memory blob or local URL
  - uploadState: enum { queued, uploading, failed, evaluated }
  - evaluation?: EvaluationResult

- EvaluationResult (server response adapter)
  - segmentId: string
  - input: string    # raw input field from evaluation API
  - output: string   # raw output/feedback field from evaluation API
  - receivedAt: ISO timestamp

Adapter: Implement a lightweight adapter that maps the API `input`/`output` to the client-facing fields (e.g., `score`/`feedback`) if needed. Keep the raw API fields available for auditing.

Validation rules:
- Presentation.pageCount >= 1
- Slide.index in [1..pageCount]
- RecordingSegment.endTime >= startTime
- RecordingSegment.startSlide and endSlide within presentation page range

State transitions:
- queued -> uploading -> evaluated | failed
- failed -> queued (manual retry)
