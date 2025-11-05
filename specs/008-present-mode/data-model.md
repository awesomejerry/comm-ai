# Data Model: Immersive Present Mode with Auto-Recording

## Entities

### PresentationMode

Represents the current presentation mode state.

**Fields**:

- `mode`: 'practice' | 'present' (the active presentation mode)
- `isTransitioning`: boolean (true during mode switch animation/setup)

**Relationships**:

- Controls RecordingSession behavior (auto-start/stop based on mode)
- Determines UI layout (PresentModeView vs standard presenter view)

**Validation Rules**:

- Mode must be either 'practice' or 'present'
- Transitions from practice → present trigger recording start (if microphone available)
- Transitions from present → practice trigger recording stop

**State Transitions**:

- practice → present: Enter full-screen, auto-start recording
- present → practice: Exit full-screen, auto-stop recording, show upload UI

---

### RecordingSession (Extended)

Extends existing Recording entity with present mode capabilities.

**New Fields** (in addition to existing fields):

- `mode`: 'practice' | 'present' (recording mode)
- `timestamps`: SlideNavigationEvent[] (array of navigation events during recording)
- `expiryDate`: Date (7 days from creation for local storage cleanup)
- `isPersisted`: boolean (true if saved to IndexedDB)
- `uploadStatus`: 'pending' | 'uploading' | 'uploaded' | 'failed' (tracks upload lifecycle)

**Existing Fields** (from feature 003):

- `id`: string (unique identifier)
- `audioBlob`: Blob (recorded audio data)
- `duration`: number (length in seconds)
- `timestamp`: Date (when recording started)
- `state`: RecordingState (recording, paused, reviewed, uploaded, deleted)

**Relationships**:

- Has many SlideNavigationEvent (timestamps during recording)
- Belongs to PresentationMode (mode field indicates origin)
- Processed by RecordingPersistence (local storage management)
- Uploaded via EvaluationService (with mode field in payload)

**Validation Rules**:

- mode field required for all new recordings
- timestamps array only populated for present mode recordings
- expiryDate must be 7 days after timestamp
- duration must be ≥30 seconds for upload (warning shown if shorter)
- audioBlob bitrate should be 64 kbps (configured in MediaRecorder)

**State Transitions** (present mode):

1. Mode switches to 'present' → state: 'recording' created with mode: 'present'
2. User navigates slides → timestamps array populated
3. Mode exits 'present' → state: 'paused', recording stops, blob finalized
4. Recording auto-persisted to IndexedDB with expiryDate
5. User reviews → state: 'reviewed'
6. User uploads → uploadStatus: 'uploading' → state: 'uploaded'
7. API responds → uploadStatus: 'uploaded' OR 'failed'

---

### SlideNavigationEvent

Represents a single slide transition during present mode recording.

**Fields**:

- `slideIndex`: number (destination slide number, 1-based)
- `timestamp`: number (milliseconds from recording start)
- `transitionType`: 'next' | 'previous' | 'jump' (how user navigated)

**Relationships**:

- Belongs to RecordingSession (part of timestamps array)
- Corresponds to slide in PDF presentation

**Validation Rules**:

- slideIndex must be ≥ 1 and ≤ total page count
- timestamp must be ≥ 0 and ≤ recording duration
- timestamps should be monotonically increasing (array ordered by time)

**Example**:

```typescript
{
  slideIndex: 3,
  timestamp: 45230,  // 45.23 seconds into presentation
  transitionType: 'next'
}
```

---

### PresentModeEvaluationRequest

Represents the API payload for present mode evaluations.

**Fields**:

- `audio`: Blob (audio file, 64 kbps)
- `startSlide`: number (always 1 for present mode, or first slide if recording started mid-presentation)
- `endSlide`: number (last slide viewed)
- `audience`: string (target audience selection, from existing UI)
- `mode`: string (value: "present")
- `timestamps`: string (JSON-encoded SlideNavigationEvent array)

**Relationships**:

- Created from RecordingSession data
- Sent to evaluation webhook endpoint
- Returns EvaluationResult (existing entity from feature 005)

**Validation Rules**:

- mode must equal "present" for present mode recordings
- timestamps must be valid JSON string when included
- All existing validation rules from practice mode still apply (audio format, slide ranges, etc.)

**Example**:

```javascript
FormData {
  audio: <Blob>,
  startSlide: 1,
  endSlide: 12,
  audience: "investors",
  mode: "present",
  timestamps: '[{"slideIndex":1,"timestamp":0,"transitionType":"jump"},{"slideIndex":2,"timestamp":12340,"transitionType":"next"}]'
}
```

---

### PersistedRecording

Represents a recording stored in IndexedDB.

**Fields** (stored in IndexedDB):

- `id`: string (primary key, from RecordingSession.id)
- `audioBlob`: Blob (binary audio data)
- `timestamps`: SlideNavigationEvent[] (navigation events)
- `duration`: number (recording length in seconds)
- `createdAt`: number (Unix timestamp in milliseconds)
- `expiryDate`: number (Unix timestamp, createdAt + 7 days)
- `uploadStatus`: 'pending' | 'uploaded' | 'failed'
- `metadata`: object (startSlide, endSlide, audience, mode)

**Relationships**:

- One-to-one with RecordingSession (persisted version)
- Managed by RecordingPersistence service

**Validation Rules**:

- expiryDate must be exactly 7 days after createdAt
- Recordings past expiryDate automatically deleted on retrieval attempt
- audioBlob must be a valid Blob object
- uploadStatus tracks whether recording has been sent to server

**Lifecycle**:

1. Created when present mode recording completes
2. Retrieved when user returns to app with pending recordings
3. Deleted after successful upload OR after 7 days (whichever comes first)
4. Cleanup happens on app load (check all records, delete expired)

---

## Data Flow

### Present Mode Recording Flow

1. User clicks "Enter Present Mode" toggle → PresentationMode state: { mode: 'present', isTransitioning: true }
2. RecordingController.start() called with mode: 'present' → RecordingSession created
3. MediaRecorder starts with 64 kbps bitrate → state: 'recording'
4. User navigates slides → TimestampTracker captures SlideNavigationEvent → appended to session.timestamps
5. User clicks "Exit Present Mode" → RecordingController.pause() called
6. MediaRecorder stops → audioBlob finalized → state: 'paused'
7. RecordingPersistence saves to IndexedDB → PersistedRecording created with 7-day expiry
8. UI shows upload interface with duration warning if <30 seconds
9. User clicks "Upload" → EvaluationService creates PresentModeEvaluationRequest with mode: "present"
10. API responds → uploadStatus updated, state: 'uploaded'

### Storage & Cleanup Flow

- **On recording completion**: RecordingSession → PersistedRecording (IndexedDB)
- **On app load**: Query IndexedDB → delete records where Date.now() > expiryDate
- **On successful upload**: Delete PersistedRecording from IndexedDB (frees space)
- **On 7-day expiry**: Automatic deletion when cleanup runs (next app load)

---

## Storage Considerations

### IndexedDB Schema

**Object Store**: `recordings`

- **Key**: `id` (string, primary key)
- **Indexes**:
  - `expiryDate` (for efficient cleanup queries)
  - `uploadStatus` (to find pending uploads)

**Estimated Storage**:

- 10-minute recording at 64 kbps ≈ 4.8 MB
- 3-hour maximum ≈ 86 MB
- 7 days of daily 10-min recordings ≈ 34 MB (well within browser limits)

### Cleanup Strategy

- **Automatic cleanup** on app initialization
- **Manual cleanup** option in UI (future enhancement)
- **Upload triggers deletion** immediately (free space early)
- **Browser quota**: IndexedDB typically allows 50%+ of available disk, no issues expected

---

## Type Definitions (TypeScript)

```typescript
// Present mode state
type PresentationMode = {
  mode: "practice" | "present";
  isTransitioning: boolean;
};

// Slide navigation tracking
type SlideNavigationEvent = {
  slideIndex: number;
  timestamp: number; // milliseconds from recording start
  transitionType: "next" | "previous" | "jump";
};

// Extended recording session for present mode
type PresentModeRecordingSession = Recording & {
  mode: "practice" | "present";
  timestamps: SlideNavigationEvent[];
  expiryDate: Date;
  isPersisted: boolean;
  uploadStatus: "pending" | "uploading" | "uploaded" | "failed";
};

// Persisted recording in IndexedDB
type PersistedRecording = {
  id: string;
  audioBlob: Blob;
  timestamps: SlideNavigationEvent[];
  duration: number;
  createdAt: number; // Unix timestamp
  expiryDate: number; // Unix timestamp
  uploadStatus: "pending" | "uploaded" | "failed";
  metadata: {
    startSlide: number;
    endSlide: number;
    audience: string;
    mode: "present";
  };
};

// API payload for present mode
type PresentModeEvaluationPayload = {
  audio: Blob;
  startSlide: number;
  endSlide: number;
  audience: string;
  mode: "present";
  timestamps: string; // JSON-encoded SlideNavigationEvent[]
};
```
