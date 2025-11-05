# Feature Specification: Immersive Present Mode with Auto-Recording

**Feature Branch**: `008-present-mode`  
**Created**: 2025-11-04  
**Status**: Draft  
**Input**: User description: "Users can switch to 'present' mode from current mode ('practice') to immersively present the slides with audio. Once started, it automatically starts recording and keep tracks of timestamps when navigating through slides. Once finished or exit 'present' mode, it automatically stops recording and shows a button to upload recordings and timetamps for evaluation. Once click the button, it uses existing API to evaluate with slightly different payload and once evaluation is done from API. Use existing interface to show the result."

## Clarifications

### Session 2025-11-04

- Q: What is the minimum recording duration required for evaluation? → A: 30 seconds
- Q: What visual characteristics define the immersive present mode interface? → A: Full-screen with minimal controls - Slides fill the screen, UI controls hidden or minimal (exit button, slide counter)
- Q: How long should the system retain unuploaded recordings in local storage? → A: 7 days
- Q: What audio quality should recordings use? → A: Medium quality - 64 kbps
- Q: What specific field or indicator distinguishes present mode evaluations from practice mode in the API payload? → A: mode: "present" field

## User Scenarios & Testing _(mandatory)_

### User Story 1 - Switch to Present Mode and Auto-Record (Priority: P1)

A user working in "practice" mode switches to "present" mode to deliver their presentation immersively. The system automatically begins recording audio and tracking slide navigation timestamps as soon as present mode is activated.

**Why this priority**: This is the core functionality that enables users to perform real presentations with automatic recording, eliminating manual recording controls and providing the foundation for evaluation.

**Independent Test**: Can be fully tested by switching from practice mode to present mode, navigating through slides, and verifying that audio is being recorded and timestamps are captured for each slide transition.

**Acceptance Scenarios**:

1. **Given** a user in practice mode viewing their slides, **When** they activate present mode, **Then** the system switches to a full-screen view with minimal controls (exit button and slide counter) and immediately begins recording audio.
2. **Given** present mode is active and recording, **When** the user navigates to a different slide, **Then** the system captures the timestamp of the navigation event.
3. **Given** present mode is active, **When** the user views the interface, **Then** recording indicators confirm that audio recording and timestamp tracking are active.
4. **Given** a user attempts to switch to present mode, **When** microphone access is denied or unavailable, **Then** the system displays an error message and prevents entering present mode.

---

### User Story 2 - Exit Present Mode and Access Upload Option (Priority: P1)

When a user finishes their presentation or exits present mode, the system automatically stops recording and displays an option to upload the recording with timestamps for evaluation.

**Why this priority**: This completes the presentation workflow and provides the critical bridge to the evaluation process, ensuring users can seamlessly move from presenting to receiving feedback.

**Independent Test**: Can be fully tested by exiting present mode and verifying that recording stops, a confirmation/upload interface appears, and the user can choose to upload or discard the recording.

**Acceptance Scenarios**:

1. **Given** present mode is active with an ongoing recording, **When** the user exits present mode, **Then** audio recording stops automatically and the system preserves the recording and timestamps.
2. **Given** present mode has been exited with a completed recording, **When** the user views the interface, **Then** they see a clear button or option to upload the recording for evaluation.
3. **Given** a completed recording is available, **When** the user chooses not to upload immediately, **Then** they can navigate away and the recording remains accessible for later upload.
4. **Given** a user exits present mode after recording for less than 30 seconds, **When** they view the upload interface, **Then** the system indicates the recording is too short for meaningful evaluation.

---

### User Story 3 - Upload Recording and View Evaluation Results (Priority: P1)

After completing a presentation, the user uploads their recording with timestamps using the existing evaluation API (with a modified payload). Once the evaluation completes, the system displays results using the existing result interface.

**Why this priority**: This delivers the end-to-end value proposition - users receive feedback on their actual presentation performance, making present mode valuable beyond just recording.

**Independent Test**: Can be fully tested by uploading a completed recording, waiting for API evaluation to complete, and verifying that results are displayed using the existing evaluation result interface.

**Acceptance Scenarios**:

1. **Given** a completed recording with timestamps, **When** the user clicks the upload button, **Then** the system sends the audio file and timestamp data to the evaluation API with a payload containing a mode field set to "present".
2. **Given** the upload is in progress, **When** the user views the interface, **Then** they see a loading or progress indicator showing the upload and evaluation status.
3. **Given** the evaluation API completes processing, **When** results are returned, **Then** the system displays the evaluation using the existing result interface (from feature 005-users-can-see).
4. **Given** the upload or evaluation fails, **When** an error occurs, **Then** the user sees a clear error message and option to retry the upload.

---

### User Story 4 - Navigate Between Practice and Present Modes (Priority: P2)

Users can seamlessly switch between practice mode and present mode to rehearse or present as needed, with clear mode indicators showing which mode is active.

**Why this priority**: This enhances usability by allowing users to transition between rehearsal and actual presentation contexts, though the core recording/evaluation flow (P1) can function independently.

**Independent Test**: Can be fully tested by switching between modes multiple times and verifying that the interface, controls, and recording behavior adapt appropriately to each mode.

**Acceptance Scenarios**:

1. **Given** a user in practice mode, **When** they view the interface, **Then** they see a clear control to enter present mode.
2. **Given** a user in present mode, **When** they view the interface, **Then** they see a clear indicator of present mode status and option to exit.
3. **Given** a user switches from present mode back to practice mode, **When** no recording is in progress, **Then** the transition occurs immediately without recording-related prompts.
4. **Given** a user in present mode with an active recording, **When** they attempt to exit to practice mode, **Then** the system confirms whether to save or discard the current recording before proceeding.

### Edge Cases

- What happens when audio recording fails mid-presentation (e.g., microphone disconnection)? The system detects the failure, displays a prominent error notification, and prompts the user to either stop present mode or attempt to resume recording.
- How does the system handle extremely long presentations (e.g., 2+ hours)? The system supports recordings up to a reasonable limit (e.g., 3 hours), with file size warnings for uploads approaching limits.
- What happens if the user navigates away from the page while recording is active? The system displays a browser confirmation dialog warning about potential loss of the recording in progress.
- How are timestamps captured if the user rapidly switches between slides? Each slide transition captures a timestamp; rapid transitions create multiple timestamp entries corresponding to each navigation event.
- What happens if the evaluation API is unavailable or times out? The system retries upload attempts with exponential backoff, and allows the user to save the recording locally or retry later.
- How does the system handle scenarios where the user exits present mode but never completes the upload? The recording is stored locally for 7 days, after which it is automatically deleted. The system provides access to pending recordings on subsequent sessions within this retention period.
- What if the user has poor network connectivity during upload? The system shows upload progress and handles retries gracefully, allowing the user to pause and resume uploads when connection is restored.

## Requirements _(mandatory)_

### Functional Requirements

- **FR-001**: System MUST provide a mode switcher that allows users to transition from practice mode to present mode, initiating a full-screen presentation interface with minimal controls (exit button and slide counter).
- **FR-002**: System MUST automatically start audio recording when present mode is activated, without requiring manual recording controls from the user.
- **FR-003**: System MUST capture and store timestamps for each slide navigation event during present mode recording, associating each timestamp with the corresponding slide identifier.
- **FR-004**: System MUST display clear visual indicators when present mode is active and when audio recording is in progress.
- **FR-005**: System MUST automatically stop audio recording when the user exits present mode or completes their presentation.
- **FR-006**: System MUST present an upload interface with a clear button or control after a recording is completed, allowing the user to initiate evaluation.
- **FR-007**: System MUST send recording audio and timestamp data to the existing evaluation API with a payload that includes a mode field set to "present" to distinguish present mode evaluations from practice mode evaluations.
- **FR-008**: System MUST display evaluation results using the existing result interface (from feature 005-users-can-see) when the evaluation API returns results.
- **FR-009**: System MUST handle microphone permission denial by preventing entry to present mode and displaying an appropriate error message to the user.
- **FR-010**: System MUST persist completed recordings and their timestamps locally until the user uploads or explicitly discards them, with automatic deletion after 7 days of retention.
- **FR-011**: System MUST show upload progress and evaluation status indicators during the upload and processing phases.
- **FR-012**: System MUST handle upload failures and API errors gracefully with retry options and clear error messaging.
- **FR-013**: System MUST warn users before allowing navigation away from the page when an active recording is in progress.
- **FR-014**: System MUST support recordings up to a maximum duration of 3 hours, with appropriate warnings for file size limits.
- **FR-015**: System MUST maintain recording integrity and timestamp accuracy even during rapid slide navigation.
- **FR-016**: System MUST enforce a minimum recording duration of 30 seconds and display a warning message when users attempt to upload recordings shorter than this threshold.
- **FR-017**: System MUST record audio at 64 kbps bitrate to ensure clear speech quality while maintaining reasonable file sizes for upload.

### Key Entities

- **Presentation Mode**: Represents the current state of the application - either "practice" (standard interface) or "present" (full-screen with minimal controls showing only exit button and slide counter) - determining interface layout, recording behavior, and available controls.
- **Recording Session**: Represents an audio recording session containing the audio data, associated timestamps, slide identifiers, start time, end time, and upload status.
- **Slide Navigation Event**: Represents a single instance of the user moving to a different slide, containing a timestamp, source slide identifier, and destination slide identifier.
- **Present Mode Evaluation Request**: Represents the payload sent to the evaluation API for present mode recordings, containing audio file, timestamp data, slide sequence information, and a mode field set to "present" to distinguish it from practice mode requests.

## Success Criteria _(mandatory)_

### Measurable Outcomes

- **SC-001**: Users can switch from practice mode to present mode and have audio recording begin automatically within 1 second of mode activation.
- **SC-002**: The system captures slide navigation timestamps with accuracy within 100 milliseconds of the actual navigation event.
- **SC-003**: 95% of completed recordings are successfully uploaded and evaluated without requiring manual intervention or retries.
- **SC-004**: Users complete the full workflow (enter present mode → present → exit → upload → view results) on their first attempt 90% of the time without requiring help or support.
- **SC-005**: Upload and evaluation completion time remains under 30 seconds for recordings up to 10 minutes in length under normal network conditions.
- **SC-006**: The system handles recordings up to 3 hours in duration without data loss, corruption, or performance degradation.
- **SC-007**: Zero recordings are lost due to page navigation or browser closure when the user is properly warned and confirms their action.

## Assumptions

- The existing evaluation API (from feature 001-create-a-web) can accept an extended payload that includes timestamp data and a mode field set to "present" for present mode evaluations.
- The existing result interface (from feature 005-users-can-see) can display present mode evaluation results without modification, or requires only minor adaptations.
- Browser support for Web Audio API or MediaRecorder API is available for audio recording functionality.
- Users have granted or will grant microphone permissions when entering present mode.
- The practice mode interface already exists and is the default state of the application.
- Slide navigation events can be detected through existing application architecture (e.g., router events, component lifecycle, or state management).
- Present mode will use the same slide content and structure as practice mode but with a full-screen layout displaying only minimal controls (exit button and slide counter).
- Recording storage before upload will use browser local storage, IndexedDB, or similar client-side storage mechanisms.
- The evaluation API returns results in a compatible format that works with the existing result display interface.
- Network retry logic will use standard patterns (exponential backoff with jitter) for handling upload failures.
- Recordings will be stored in a standard audio format (e.g., WebM, MP3, or WAV) at 64 kbps bitrate, supported by the evaluation API.
- Maximum recording duration of 3 hours is sufficient for typical presentation use cases.
