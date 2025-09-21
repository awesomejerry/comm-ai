# Data Model: Audio Recording Review

## Entities

### Recording

Represents an audio recording session with review capabilities.

**Fields**:

- `id`: string (unique identifier)
- `audioBlob`: Blob (the recorded audio data)
- `duration`: number (length in seconds)
- `timestamp`: Date (when recording started)
- `state`: RecordingState (enum: recording, paused, reviewed, uploaded, deleted)

**Relationships**:

- Belongs to Presentation (existing)
- Processed by uploader service (existing)

**Validation Rules**:

- audioBlob must be valid audio format
- duration > 0 for non-empty recordings
- state transitions: recording → paused → reviewed → (uploaded | deleted)

**State Transitions**:

- recording: active recording in progress
- paused: recording stopped, ready for review
- reviewed: user has listened/reviewed the recording
- uploaded: confirmed and sent to server
- deleted: discarded without upload

### Extended Presentation Model

Add recording state tracking to existing Presentation.

**New Fields**:

- `currentRecording`: Recording | null
- `recordingHistory`: Recording[]

**Validation Rules**:

- Only one active recording per presentation
- Recording history maintained for audit

## Data Flow

1. User starts recording → new Recording created with state 'recording'
2. User pauses recording → state changes to 'paused', audioBlob finalized
3. User reviews recording → state changes to 'reviewed' after playback
4. User confirms upload → state 'uploaded', triggers existing upload flow
5. User deletes recording → state 'deleted', blob discarded

## Storage Considerations

- Audio blobs stored in memory during session
- No persistent storage unless uploaded
- Cleanup: revoke blob URLs after use to free memory
- Server storage: handled by existing evaluation webhook
