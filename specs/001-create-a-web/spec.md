# Feature Specification: Slide-based PDF presenter with audio recording & evaluation

**Feature Branch**: `001-create-a-web`  
**Created**: 2025-09-17  
**Status**: Draft  
**Input**: User description: "Create a web app. Users can choose a pdf file from their computer and the app will display the pdf file as slides with controls. Users can record their audio while navigating through slides. When users pause audio recording, it'll upload to an existing server to be evaluated. Users can keep recording their audio while pitching with slides. When the audio is evaluated from the server, the UI should present the content for users to see."

## Execution Flow (main)
```
1. Parse user description from Input
	→ If empty: ERROR "No feature description provided"
2. Extract key concepts from description
	→ Identify: actors, actions, data, constraints
3. For each unclear aspect:
	→ Mark with [NEEDS CLARIFICATION: specific question]
4. Fill User Scenarios & Testing section
	→ If no clear user flow: ERROR "Cannot determine user scenarios"
5. Generate Functional Requirements
	→ Each requirement must be testable
	→ Mark ambiguous requirements
6. Identify Key Entities (if data involved)
7. Run Review Checklist
	→ If any [NEEDS CLARIFICATION]: WARN "Spec has uncertainties"
	→ If implementation details found: ERROR "Remove tech details"
8. Return: SUCCESS (spec ready for planning)
```

---

## ⚡ Quick Guidelines
- ✅ Focus on WHAT users need and WHY
- ❌ Avoid HOW to implement (no tech stack, APIs, code structure)
- 👥 Written for business stakeholders, not developers

### Section Requirements
- **Mandatory sections**: Must be completed for every feature
- **Optional sections**: Include only when relevant to the feature
- When a section doesn't apply, remove it entirely (don't leave as "N/A")

---

## User Scenarios & Testing *(mandatory)*

### Primary User Story
As a user preparing a spoken slide presentation, I want to upload a PDF, specify my target audience, navigate it as slides, record my spoken narration while moving through slides, and have each recording segment evaluated by the server when I pause recording so I can receive audience-specific feedback inline while continuing my rehearsal.

### Acceptance Scenarios
1. Given an empty session, When a user uploads a PDF and selects their target audience, Then the app presents the PDF as slide thumbnails and a main slide view with next/previous controls.
2. Given the PDF is loaded and audience is selected, When the user starts audio recording, Then the app begins capturing microphone audio and shows a live recording indicator and elapsed time.
3. Given recording is active, When the user navigates slides, Then slide changes do not stop recording and the current slide index is recorded as metadata for the audio timeline.
4. Given recording is active, When the user pauses recording, Then the app uploads the most recent audio segment with audience context to the evaluation server and shows an uploading indicator.
5. Given the server returns evaluation, When the evaluation arrives, Then the UI displays the audience-specific evaluation results tied to the segment and slide(s) covered during that segment.
6. Given the user resumes recording after a pause, When they continue speaking, Then new audio is appended as a new segment and can be paused/uploaded independently.
7. Given a network or server error during upload, When the upload fails, Then the app retries with exponential backoff and provides a user-visible error and retry control.

### Edge Cases
- Upload large PDFs (50+ pages): the app should remain responsive; consider lazy-rendering slides.
- Microphone permission denied: the app should show clear instructions and disable recording controls.
- Intermittent connectivity during upload: the app should queue uploads and retry; user should be able to continue recording offline with local buffering until upload succeeds.
- Very long continuous recording: support splitting into segments (implicit when user pauses) to limit single-upload size.
- Different sample rates/codecs from client: No explicit restriction — accept whatever the browser records (common outputs: webm/opus in Chromium-based browsers, potentially ogg/opus in Firefox). Implementation should handle the browser-provided MIME type.
- Multiple pauses in rapid succession: ensure deduplication and correct segment ordering.

## Requirements *(mandatory)*

### Functional Requirements
- **FR-001**: System MUST allow users to upload a PDF from local disk and render it as slides with thumbnail navigation and main stage view.
- **FR-002**: System MUST provide slide navigation controls: next, previous, jump-to-slide, and thumbnail overview.
- **FR-003**: System MUST allow users to start, pause, resume, and stop audio recording using the browser microphone.
- **FR-004**: While recording, slide navigation MUST continue to work and the system MUST associate recording timestamps with the current slide index.
- **FR-005**: When the user pauses recording, the client MUST upload the most recent audio segment to the evaluation server and mark the segment as "pending evaluation" until a response is returned.
- **FR-006**: The client MUST present server evaluation results in the UI, linked to the segment and the slides covered during that segment.
- **FR-007**: System MUST allow users to continue recording new segments after uploads are initiated or completed.
- **FR-008**: System MUST show upload/evaluation progress and state (queued, uploading, failed, evaluated) for each segment.
- **FR-009**: System MUST handle network errors gracefully by retrying uploads with exponential backoff and allowing manual retry.
- **FR-010**: System SHOULD support offline recording with local buffering of segments until network returns. Offline persistence across browser restarts is NOT required at this time.
- **FR-011**: System MUST provide clear permission and error UI when microphone access is denied.
- **FR-012**: System SHOULD limit single upload size or segment length to a configurable limit to avoid server timeouts. No explicit limit is required at this time.
- **FR-013**: System MUST allow users to specify their pitch audience (e.g., "investors", "customers", "team") which will be included with uploaded audio segments for context-aware evaluation.

*Marked clarifications are intentionally left for product/PO decisions.*

### Key Entities *(include if feature involves data)*
- **Presentation**: Represents an uploaded PDF resource and its metadata (title, page count, thumbnail cache).
- **Slide**: Represents a single page in the Presentation, referenced by 0-based index.
- **RecordingSegment**: Represents a continuous audio recording between start/resume and pause/stop. Attributes: segmentId, startTime, endTime, slideRange (startSlide,endSlide), audience (string), localFileRef, uploadState (queued/uploading/failed/evaluated), serverEvaluation (nullable).
- **EvaluationResult**: Represents the server's evaluation of an audio segment: score(s), feedback text, timestamps, and any structured metrics.
- **AudienceContext**: Represents the target audience for the pitch (e.g., "investors", "customers", "team") that provides context for evaluation.

---

## Review & Acceptance Checklist

### Content Quality
- [x] No implementation details (languages, frameworks, APIs)
- [x] Focused on user value and business needs
- [x] Written for non-technical stakeholders
- [x] All mandatory sections completed

### Requirement Completeness
- [x] No [NEEDS CLARIFICATION] markers remain
- [ ] Requirements are testable and unambiguous
- [ ] Success criteria are measurable
- [ ] Scope is clearly bounded
- [x] Dependencies and assumptions identified

---

## Execution Status

- [x] User description parsed
- [x] Key concepts extracted
- [x] Ambiguities marked
- [x] User scenarios defined
- [x] Requirements generated
- [x] Entities identified
- [ ] Review checklist passed

---

## Resolved Integration Details (provided by product)

- Audio formats: No explicit restriction — accept whatever the browser records. Typical browser outputs include webm/opus (Chromium) or ogg/opus (Firefox). The client will upload the recorded blob with its recorded MIME type.

- Evaluation API URL: https://n8n.awesomejerry.space/webhook/commoon/upload-audio

Assumptions about request/response shape (implementation will adapt if server requires different keys):

- Request: multipart/form-data with fields:
	- `audio`: file blob (the recorded audio file)
	- `segmentId`: string (unique id for the segment)
	- `startSlide`: integer
	- `endSlide`: integer
	- `audience`: string (target audience context, e.g., "investors", "customers", "team")
	- `duration`: optional number (seconds)

- Response: JSON object containing at minimum:
	- `segmentId`: string (echoed back)
	- `score`: number
	- `feedback`: string
	- any additional structured metrics (optional)

- Offline persistence: Not required at this time (no persistence across browser restarts).

- Max segment length / upload size: No limit required at this time.

Notes: the request/response shapes above are inferred to allow development to proceed; if the real server differs, client adapters will be added to match the exact API contract.

---

## Next Steps
1. Product owner to answer clarifications about audio formats, server API, and offline persistence.
2. UX to provide wireframes showing recording controls and evaluation result presentation.
3. Engineering spike: prototype client-side recording, pause-upload flow, and a mock evaluation endpoint.
4. Once clarifications are answered, move spec to Ready for development and open implementation PR against `001-create-a-web`.
