# Data Model: UI Redesign

Since this is a UI redesign feature with no new functionality, the existing data models remain unchanged. Below is documentation of the current data structures for reference.

## Existing Entities

### Presentation
- **Fields**:
  - `id: string` - Unique identifier
  - `title?: string` - Optional presentation title
  - `pageCount: number` - Number of pages in the PDF
  - `thumbnailCache?: Record<number, string>` - Optional cache of page thumbnails
- **Validation**: Must have valid pageCount >= 1
- **Relationships**: Used by PdfViewer component

### RecordingSegment
- **Fields**:
  - `segmentId: string` - Unique segment identifier
  - `startTime: string` - ISO timestamp of recording start
  - `endTime?: string` - Optional ISO timestamp of recording end
  - `startSlide: number` - Starting slide number
  - `endSlide: number` - Ending slide number
  - `blobRef?: Blob` - Audio blob reference
  - `uploadState: 'queued' | 'uploading' | 'failed' | 'evaluated'` - Current upload status
  - `evaluation?: any` - Evaluation result from webhook
- **Validation**: Must have segmentId, startSlide, endSlide; endTime must be after startTime if present
- **Relationships**: Managed by RecordingController, uploaded via webhook

## UI State
- File upload state (File object)
- Current page number (number)
- Page count (number)
- Segments array (RecordingSegment[])
- Recording controller reference

No new entities or relationships are introduced in this redesign.