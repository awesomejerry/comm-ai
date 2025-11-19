# Feature Specification: Post-Evaluation Q&A with Audio Responses

**Feature Branch**: `009-evaluation-qa`  
**Created**: 2025-11-10  
**Status**: Draft  
**Input**: User description: "I want to add a "Q&A" feature to my app. After the evaluation is done. Users can proceed to the "Q&A" phase. In this phase, users can see LLM-generated questions based on the evaluation. For each question, users can record their answer through audio and send to server for rating."

## Clarifications

### Session 2025-11-10

- Q: Audio Recording Privacy & Access Control → A: Recordings are public or shareable (prototype/simple approach)
- Q: Number of Questions per Q&A Session → A: 3-5 questions
- Q: Rating/Feedback Display Format → A: Numeric score with brief text feedback
- Q: Accepted Audio Formats → A: WebM and MP4/M4A (browser-native formats)
- Q: LLM Question Generation Service Failure Handling → A: Show error message and allow retry, with fallback to generic questions

## User Scenarios & Testing _(mandatory)_

### User Story 1 - View Generated Questions (Priority: P1)

After completing an evaluation, the user is presented with LLM-generated questions that are relevant to their evaluation performance. The user can see all questions at once and understand what will be asked before proceeding to answer.

**Why this priority**: This is the entry point to the Q&A feature. Without the ability to view questions, no other part of the feature can function. It delivers immediate value by showing users personalized follow-up questions.

**Independent Test**: Can be fully tested by completing an evaluation and verifying that relevant questions appear on the Q&A screen. Delivers value by showing users what areas will be explored further.

**Acceptance Scenarios**:

1. **Given** user has completed an evaluation, **When** user navigates to Q&A phase, **Then** system displays a list of LLM-generated questions based on the evaluation
2. **Given** user is viewing the Q&A phase, **When** questions are loaded, **Then** each question is clearly visible and numbered
3. **Given** no questions are generated, **When** user enters Q&A phase, **Then** system displays appropriate message indicating no questions available

---

### User Story 2 - Record Audio Answer for a Question (Priority: P2)

For each question displayed, the user can record an audio answer using their device's microphone. The user can start recording, see recording feedback, stop recording, and review their audio before submitting.

**Why this priority**: This enables the core interaction of the Q&A feature. Users need to be able to record their responses to demonstrate their knowledge.

**Independent Test**: Can be fully tested by selecting any question and successfully recording an audio response. Delivers value by allowing users to provide spoken answers.

**Acceptance Scenarios**:

1. **Given** user is viewing a question, **When** user initiates audio recording, **Then** system captures audio from microphone and shows recording indicator
2. **Given** user is recording an answer, **When** user stops recording, **Then** system saves the audio and displays playback controls
3. **Given** user has recorded an audio answer, **When** user plays it back, **Then** system plays the recorded audio correctly
4. **Given** user is unsatisfied with their recording, **When** user chooses to re-record, **Then** system discards previous recording and allows new recording
5. **Given** user denies microphone permission, **When** user attempts to record, **Then** system displays clear message about microphone access requirement

---

### User Story 3 - Submit Audio Answer for Rating (Priority: P3)

After recording and reviewing their audio answer, the user can submit it to the server for automated rating. The user receives feedback on their answer quality.

**Why this priority**: This completes the feedback loop by providing assessment of user responses. It's P3 because recording and viewing questions provide value independently.

**Independent Test**: Can be fully tested by recording an answer, submitting it, and verifying that it's sent to the server and a rating is returned. Delivers value by providing performance feedback.

**Acceptance Scenarios**:

1. **Given** user has recorded an audio answer, **When** user submits the answer, **Then** system uploads audio to server and shows upload progress
2. **Given** audio is uploaded successfully, **When** server processes the answer within the POST call, **Then** system displays the returned rating payload (id, created_at, score, feedback, optional text) for the answer immediately
3. **Given** upload fails due to network issue, **When** user attempts to submit, **Then** system shows error message and offers retry option
4. **Given** user has submitted an answer, **When** rating is received, **Then** system displays the rating alongside the question

---

### User Story 4 - Navigate Between Multiple Questions (Priority: P4)

When multiple questions are available, users can navigate between them, track which questions have been answered, and see their progress through the Q&A session.

**Why this priority**: This improves usability for multi-question sessions but isn't essential for the core functionality.

**Independent Test**: Can be fully tested by generating multiple questions and verifying navigation between them works. Delivers value by improving organization of multi-question sessions.

**Acceptance Scenarios**:

1. **Given** multiple questions exist, **When** user answers one question, **Then** system indicates which questions are answered vs. pending
2. **Given** user is viewing a question, **When** user navigates to next/previous question, **Then** system shows the selected question without losing recording progress
3. **Given** user has answered all questions, **When** user reviews Q&A session, **Then** system displays completion status

---

### Edge Cases

- What happens when user's audio recording is too short (e.g., < 1 second)? → System accepts recordings of any duration
- What happens when user's audio recording exceeds maximum duration? → System allows unlimited duration recordings
- What happens when LLM fails to generate questions for an evaluation? → System displays error, allows retry, and falls back to generic questions
- What happens when user closes browser during recording? → Recording is lost (browser limitation)
- What happens when network connection is lost during audio upload? → System displays error and offers retry option
- What happens when server returns an error during rating? → System displays error message with retry option
- How does system handle unsupported audio formats? → System only accepts WebM and MP4/M4A (browser-native formats)
- What happens when user denies microphone permissions permanently? → System displays clear guidance on granting permissions
- What happens if user tries to submit without recording an answer? → System prevents submission until audio is recorded

## Requirements _(mandatory)_

### Functional Requirements

- **FR-001**: System MUST display Q&A phase entry point after evaluation completion (implemented as button in EvaluationChat component)
- **FR-002**: System MUST retrieve LLM-generated questions based on completed evaluation context
- **FR-003**: System MUST handle LLM service failures by displaying error message, allowing retry, and falling back to generic questions if needed
- **FR-004**: System MUST display all generated questions in a clear, organized format
- **FR-005**: System MUST generate 3-5 questions per Q&A session
- **FR-006**: Users MUST be able to record audio responses using their device microphone
- **FR-007**: System MUST provide visual feedback during audio recording (e.g., recording indicator, timer)
- **FR-008**: System MUST allow users to stop recording at any time
- **FR-009**: System MUST provide playback controls for recorded audio before submission
- **FR-010**: Users MUST be able to re-record their answer before submitting
- **FR-011**: System MUST validate audio recordings are in supported formats (WebM or MP4/M4A) and under 50MB before allowing submission
- **FR-012**: System MUST accept audio recordings in WebM or MP4/M4A formats (browser-native formats)
- **FR-013**: System MUST upload recorded audio to server for processing
- **FR-014**: System MUST display upload progress during audio submission
- **FR-015**: System MUST display rating or feedback received from server for each submitted answer
- **FR-016**: System MUST handle network failures during upload with appropriate error messages and retry options
- **FR-017**: System MUST track which questions have been answered and which are pending
- **FR-018**: System MUST persist Q&A session state so users can return to incomplete sessions
- **FR-019**: System MUST allow unlimited audio duration for recordings to maximize user flexibility
- **FR-020**: System MUST handle microphone permission denial gracefully with clear user guidance
- **FR-021**: System MUST accept audio recordings of any duration, including very short responses
- **FR-022**: Audio recordings MAY be publicly accessible or shareable for prototype simplicity (no access restrictions required)

### Key Entities

- **Q&A Session**: Represents a post-evaluation question and answer session, linked to a specific evaluation, contains multiple questions and their answers, tracks completion status
- **Generated Question**: An LLM-created question based on evaluation performance, includes question text, question number/order, may include context or hints
- **Audio Answer**: User's recorded response to a question, includes audio data, recording duration, submission timestamp, associated rating/feedback
- **Answer Rating**: Evaluation of user's audio answer, includes the persisted answer id, server-provided `created_at` timestamp (converted to Date in the UI), numeric score (0-100), optional concluding `text`, and brief feedback provided by server-side processing

## Success Criteria _(mandatory)_

### Measurable Outcomes

- **SC-001**: Users can complete the flow from viewing a question to recording and submitting an answer in under 90 seconds per question
- **SC-002**: System successfully generates relevant questions for 95% of completed evaluations
- **SC-003**: Audio recording success rate exceeds 98% when microphone permissions are granted
- **SC-004**: Audio upload completes within 10 seconds for recordings up to 5 minutes on typical network connections
- **SC-005**: Users receive ratings for submitted answers within 30 seconds of upload completion
- **SC-006**: 90% of users successfully record and submit at least one answer in their first Q&A session
- **SC-007**: System maintains Q&A session state across browser refreshes with no data loss
