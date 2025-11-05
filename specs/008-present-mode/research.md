# Research: Immersive Present Mode with Auto-Recording

## Phase 0 Findings

### Research Tasks Completed

#### Task: Research full-screen presentation mode implementation in React

**Decision**: Use CSS full-screen with fixed positioning and z-index layering
**Rationale**:

- Browser Fullscreen API (document.fullscreenElement) can be disruptive with user prompts
- CSS-based full-screen provides better control and consistent UX
- Can easily toggle between practice and present modes without browser chrome changes
- Compatible with existing React component structure
- Supports minimal controls (exit button, slide counter) overlaid on full-screen slides

**Alternatives considered**:

- Fullscreen API: Requires user gesture, inconsistent browser support, exit prompts
- Modal overlay: Less immersive, doesn't truly fill screen
- New window/tab: Breaks single-page app flow, complicates state management

#### Task: Research automatic recording triggers in MediaRecorder API

**Decision**: Extend existing RecordingController with mode-aware lifecycle hooks
**Rationale**:

- Existing RecordingController already manages MediaRecorder lifecycle
- Add mode parameter to start() method to trigger auto-recording
- Leverage existing error handling for microphone permissions
- Maintains separation of concerns (UI triggers mode, controller manages recording)
- Consistent with current architecture pattern

**Alternatives considered**:

- Separate PresentModeRecorder class: Code duplication, harder to maintain
- Event-based triggers: Added complexity, harder to test
- React effect hooks: Tight coupling between UI and recording logic

#### Task: Research slide navigation timestamp tracking approaches

**Decision**: Create TimestampTracker class that listens to slide change events
**Rationale**:

- Decouples timestamp logic from slide navigation
- Can track both user navigation and programmatic changes
- Timestamps stored as array of {slideIndex, timestamp, transitionType} objects
- Works with existing slide navigation (currentPage state in PresenterPage)
- Easy to serialize for API payload

**Alternatives considered**:

- Inline timestamp tracking in navigation handlers: Scattered logic, hard to test
- Observer pattern with pub/sub: Overcomplicated for single consumer
- Redux middleware: Not using Redux, Jotai atoms are simpler

#### Task: Research browser local storage for audio blob persistence

**Decision**: Use IndexedDB via idb library for audio blob storage with TTL
**Rationale**:

- LocalStorage limited to strings, not suitable for blobs
- IndexedDB supports binary data (Blob objects) natively
- `idb` library provides Promise-based API (easier than raw IndexedDB)
- Can store metadata (upload status, expiry timestamp, timestamps array)
- 7-day TTL implemented via timestamp comparison on retrieval
- Automatic cleanup of expired recordings on app load

**Alternatives considered**:

- LocalStorage with base64: Inefficient, size limits, encoding overhead
- SessionStorage: Lost on tab close, doesn't persist across sessions
- File System Access API: Limited browser support, requires user permission per file
- Cache API: Designed for network resources, awkward for app state

#### Task: Research best practices for API payload modifications

**Decision**: Add `mode` field to existing FormData payload, maintain backward compatibility
**Rationale**:

- Existing API accepts multipart/form-data with audio, startSlide, endSlide, audience
- Adding `mode: "present"` field is additive, doesn't break practice mode
- Also add `timestamps` field as JSON string for slide navigation data
- Server can distinguish requests via mode field and process accordingly
- Contract test verifies new payload structure

**Alternatives considered**:

- New API endpoint for present mode: API versioning complexity, duplication
- Query parameter for mode: Body is more semantic for request metadata
- Headers for mode: Non-standard, harder to debug

#### Task: Research audio quality settings for 64 kbps recording

**Decision**: Configure MediaRecorder with audioBitsPerSecond: 64000
**Rationale**:

- MediaRecorder options support audioBitsPerSecond parameter
- 64 kbps provides clear speech quality (confirmed in spec clarifications)
- Works with existing codec detection (getSupportedMimeType in RecordingController)
- Balances file size vs quality for 3-hour max recordings
- Standard bitrate for speech applications

**Alternatives considered**:

- Default browser bitrate: Inconsistent across browsers, usually higher than needed
- Post-recording compression: Added complexity, client-side processing overhead
- Server-side transcoding: Requires API changes, increases latency

#### Task: Research 30-second minimum recording validation

**Decision**: Validate duration on upload attempt, show warning before upload
**Rationale**:

- Can calculate duration from audio blob after recording stops
- Display duration in review UI, disable/warn on upload if <30s
- Non-blocking validation (user can still attempt upload, server can enforce)
- Provides clear feedback without preventing edge cases

**Alternatives considered**:

- Block recording stop before 30s: Poor UX, forces waiting
- Silent filtering: Confusing, user doesn't know why upload fails
- Server-side only validation: Late feedback, wasted upload bandwidth

## Technology Stack Confirmation

- **Frontend**: React 18, TypeScript 5.x, Vite, Tailwind CSS (existing)
- **State Management**: Jotai atoms (existing pattern)
- **Audio Recording**: MediaRecorder API with 64 kbps bitrate
- **Storage**: IndexedDB via `idb` library for blob persistence
- **Testing**: Vitest (unit), Playwright (e2e), contract tests for API
- **API**: Extend existing multipart/form-data upload with mode field

## Implementation Notes

- Present mode UI will be a new React component with full-screen CSS
- Recording controller extends existing class with mode-aware behavior
- Timestamp tracker is a standalone module, reusable pattern
- Recording persistence uses IndexedDB with automatic cleanup
- API changes are additive (backward compatible with practice mode)
- All new functionality covered by tests before implementation (test-first)
