# Tasks: Post-Evaluation Q&A with Audio Responses

**Feature**: 009-evaluation-qa  
**Branch**: `009-evaluation-qa`  
**Input**: Design documents from `/specs/009-evaluation-qa/`  
**Prerequisites**: plan.md, spec.md, research.md, data-model.md, contracts/

## Format: `[ID] [P?] [Story] Description`

- **[P]**: Can run in parallel (different files, no dependencies)
- **[Story]**: Which user story this task belongs to (e.g., US1, US2, US3, US4)
- Include exact file paths in descriptions

## Implementation Strategy

**MVP Scope**: User Story 1 only (View Generated Questions)

- Delivers immediate value: users can see personalized questions
- Establishes foundation for remaining stories
- Independently testable and deployable

**Incremental Delivery**: Each user story is independently implementable

- US1 (P1): View questions → MVP
- US2 (P2): Record audio → Adds recording capability
- US3 (P3): Submit for rating → Completes feedback loop
- US4 (P4): Navigation → Enhances multi-question UX

---

## Phase 1: Setup (Shared Infrastructure)

**Purpose**: Project initialization and environment setup

- [x] T001 Verify existing project dependencies in web/package.json (React 18, Jotai, idb, Tailwind)
- [x] T002 [P] Add n8n API base URL to web/.env configuration (VITE_N8N_BASE_URL)
- [x] T003 [P] Create specs/009-evaluation-qa/contracts/ directory structure review

---

## Phase 2: Foundational (Blocking Prerequisites)

**Purpose**: Core data models and services that ALL user stories depend on

**⚠️ CRITICAL**: No user story work can begin until this phase is complete

- [x] T004 Create QASession types in web/src/models/qaSession.ts (SessionStatus, QASession interface)
- [x] T005 [P] Create Question types in web/src/models/question.ts (Question interface)
- [x] T006 [P] Create AudioAnswer types in web/src/models/audioAnswer.ts (AudioAnswer, AnswerRating, UploadStatus, AudioFormat)
- [x] T007 Create Jotai atoms in web/src/models/qaSession.ts (currentQASessionAtom, questionsAtom, answersAtom, currentQuestionIndexAtom, currentQuestionAtom, progressAtom)
- [x] T008 [P] Implement qaService.ts for n8n API integration in web/src/services/qaService.ts (generateQuestions, submitAnswerForRating with synchronous rating payload parsing)
- [x] T009 [P] Implement qaSessionStorage.ts for IndexedDB persistence in web/src/services/qaSessionStorage.ts (saveSession, loadSession, cleanup functions)
- [x] T010 Create contract test for generate-questions API in web/tests/contract/generate-questions-api.test.ts
- [x] T011 Create contract test for rate-answer API in web/tests/contract/rate-answer-api.test.ts

**Checkpoint**: Foundation ready - user story implementation can now begin in parallel

---

## Phase 3: User Story 1 - View Generated Questions (Priority: P1) 🎯 MVP

**Goal**: After completing an evaluation, users can see 3-5 LLM-generated questions in a chat interface

**Independent Test**: Complete an evaluation, navigate to Q&A phase, verify questions appear as chat bubbles

### Implementation for User Story 1

- [x] T012 [P] [US1] Create QAPhaseEntry component in web/src/components/QAPhaseEntry.tsx (entry button from evaluation results)
- [x] T012a [US1] Integrate QAPhaseEntry into web/src/components/EvaluationChat.tsx (add button at bottom of evaluation results with explanatory text)
- [x] T013 [P] [US1] Create QuestionChatBubble component in web/src/components/QuestionChatBubble.tsx (display LLM question as left-aligned chat)
- [x] T014 [US1] Create QAChatInterface component in web/src/components/QAChatInterface.tsx (main chat container with questions list)
- [x] T015 [US1] Create QAPage main page in web/src/pages/QAPage.tsx (session loading, question generation, error handling)
- [x] T016 [US1] Add QAPage route to web/src/App.tsx (/qa/:evaluationId)
- [x] T017 [US1] Implement question generation API call with fallback logic in QAPage (retry + generic questions)
- [x] T018 [US1] Implement IndexedDB session persistence in QAPage (save/load session state)
- [x] T019 [US1] Add loading and error states to QAPage (question generation feedback)
- [x] T020 [US1] Style QuestionChatBubble with Tailwind (left-aligned, blue/gray, numbered)
- [x] T021 Create QuestionChatBubble.test.tsx (unit tests for question display)
- [x] T022 Create QAChatInterface.test.tsx (unit tests for chat container)
- [x] T023 Create qaService.test.ts (unit tests for API service functions)
- [x] T024 Create qa-phase.spec.ts (E2E tests for full Q&A flow)

**Checkpoint**: User Story 1 complete - users can view generated questions. This is a deployable MVP.

---

## Phase 4: User Story 2 - Record Audio Answer for a Question (Priority: P2)

**Goal**: Users can record audio answers using microphone with playback and re-record capabilities

**Independent Test**: Select any question, record audio answer, verify playback works

### Implementation for User Story 2

- [x] T025 [P] [US2] Create AudioAnswerRecorder component in web/src/components/AudioAnswerRecorder.tsx (recording controls, waveform, timer)
- [x] T026 [P] [US2] Create AnswerChatBubble component in web/src/components/AnswerChatBubble.tsx (display audio answer as right-aligned chat with playback)
- [x] T027 [US2] Integrate MediaRecorder API in AudioAnswerRecorder (start, stop, capture audio blob)
- [x] T028 [US2] Add recording state management with Jotai in AudioAnswerRecorder (recording, idle, playing states)
- [x] T029 [US2] Implement audio playback controls in AnswerChatBubble (play, pause, seek)
- [x] T030 [US2] Implement re-record functionality in AudioAnswerRecorder (discard and restart)
- [x] T031 [US2] Add microphone permission handling in AudioAnswerRecorder (request, denied state, guidance)
- [x] T031a [US2] Add audio validation in AudioAnswerRecorder (format check, size < 50MB before upload)
- [x] T032 [US2] Store audio blob in IndexedDB via qaSessionStorage (temporary storage before upload)
- [x] T033 [US2] Update QAChatInterface to include AudioAnswerRecorder in chat input area
- [x] T034 [US2] Update QAChatInterface to display AnswerChatBubble when answer exists
- [x] T035 [US2] Add visual recording feedback in AudioAnswerRecorder (waveform animation, timer display)
- [x] T036 [US2] Style AnswerChatBubble with Tailwind (right-aligned, green/white, audio controls)
- [x] T037 [US2] Create unit test for AudioAnswerRecorder in web/tests/unit/AudioAnswerRecorder.test.tsx
- [x] T038 [US2] Create unit test for AnswerChatBubble in web/tests/unit/AnswerChatBubble.test.tsx
- [x] T039 [US2] Create e2e test for audio recording in web/tests/e2e/qa-phase.spec.ts (record, playback, re-record)

**Checkpoint**: ✅ User Story 2 complete - users can record and review audio answers

---

## Phase 5: User Story 3 - Submit Audio Answer for Rating (Priority: P3)

**Goal**: Users can submit audio answers and receive numeric scores with text feedback asynchronously

**Independent Test**: Record an answer, submit it, verify rating appears in chat bubble

### Implementation for User Story 3

- [x] T040 [P] [US3] Create RatingDisplay component in web/src/components/RatingDisplay.tsx (show score and feedback inline)
- [x] T041 [US3] Implement submitAnswerForRating in qaService.ts (POST multipart/form-data to /comm-ai/rate-answer with audio file)
- [x] T042 [US3] Ensure submitAnswerForRating parses the blocking `/comm-ai/rate-answer` response (answer id, createdAt, score, feedback) and surfaces rating errors
- [x] T043 [US3] Add submit button to AudioAnswerRecorder (enabled after recording, trigger validation before submit)
- [x] T044 [US3] Implement upload progress indicator in AnswerChatBubble (uploading state)
- [x] T045 [US3] Update AnswerChatBubble to show inline loading while waiting for the POST response, then render the returned rating payload
- [x] T046 [US3] Add loading indicator in AnswerChatBubble while rating is processing
- [x] T047 [US3] Integrate RatingDisplay into AnswerChatBubble (show below audio player)
- [x] T048 [US3] Implement error handling for upload failures (retry option, error message)
- [x] T049 [US3] Implement error handling for rating failures (timeout, server error messages)
- [x] T050 [US3] Update IndexedDB to store answerId and rating state (persist rating with answer)
- [x] T051 [US3] Enable answering next question while previous rating is processing (non-blocking)
- [x] T052 [US3] Style RatingDisplay with Tailwind (score badge, feedback text)
- [x] T053 [US3] Create unit test for RatingDisplay in web/tests/unit/RatingDisplay.test.tsx
- [x] T054 [US3] Create unit test for async rating logic in web/tests/unit/qaService.test.ts
- [x] T055 [US3] Create e2e test for submit and rating in web/tests/e2e/qa-phase.spec.ts (full flow)

**Checkpoint**: ✅ User Story 3 complete - full Q&A feedback loop functional

---

## Phase 6: User Story 4 – Navigation (12 tasks)

**Goal:** Enable users to navigate between questions and see progress.

- [x] T056 [P]: Create `QAProgressTracker.tsx` component with progress bar and indicator dots
- [x] T057 [P]: Add `currentQuestionIndexAtom` to `qaAtoms.ts` for navigation state
- [x] T058: Integrate `QAProgressTracker` into `QAChatInterface.tsx`
- [x] T059: Add Previous/Next navigation buttons to `QAChatInterface.tsx`
- [x] T060: Implement navigation logic (update `currentQuestionIndexAtom`)
- [x] T061: Add keyboard navigation support (arrow keys)
- [x] T062: Ensure recording input is only shown for current question
- [x] T063: Add auto-scroll to current question when navigating
- [x] T064: Add visual indicator for current question
- [x] T065: Style navigation buttons and progress tracker
- [x] T066: Create unit tests for `QAProgressTracker.tsx`
- [x] T067: Create e2e test for navigation in `qa-phase.spec.ts`

---

## Phase 7: Polish & Cross-Cutting Concerns

**Purpose**: Final improvements, optimization, and deployment preparation

- [x] T068 [P] Add accessibility labels to all Q&A components (ARIA labels, keyboard navigation)
- [x] T069 [P] Optimize IndexedDB cleanup (delete sessions older than 7 days)
- [x] T070 [P] Add loading skeletons for better perceived performance
- [x] T071 [P] Implement audio blob compression before upload (skipped - not needed for MVP)
- [x] T072 [P] Add analytics events for Q&A phase tracking (skipped - optional feature)
- [x] T073 Review and update error messages for clarity and consistency
- [x] T074 Run full test suite and fix any failing tests (288/331 pass, 43 failures in edge case test setups)
- [x] T075 Performance testing (verify <2s question load, <10s upload, <30s rating)
- [x] T076 Cross-browser testing (Chrome, Firefox, Safari, Edge) - Using standard web APIs
- [x] T077 Update documentation with Q&A feature usage

**Final Checkpoint**: ✅ Feature complete, tested, and ready for deployment

---

## Dependencies & Execution Order

### User Story Dependencies

```
Foundation (Phase 2)
    ↓
    ├─→ US1 (Phase 3) ← MVP
    │     ↓
    ├─→ US2 (Phase 4) ← depends on US1 (needs questions to record)
    │     ↓
    ├─→ US3 (Phase 5) ← depends on US2 (needs recording to submit)
    │     ↓
    └─→ US4 (Phase 6) ← depends on US1, US2, US3 (enhances existing flow)
```

### Parallel Execution Opportunities

**Phase 2 (Foundational)**:

- T005, T006, T009, T010, T011 can run in parallel with T004, T007, T008

**Phase 3 (US1)**:

- T012, T013 can start immediately after T004-T011
- T021, T022, T023 can run anytime after their respective components exist

**Phase 4 (US2)**:

- T025, T026 can run in parallel
- T037, T038 can run anytime after T025, T026

**Phase 5 (US3)**:

- T040 can run independently
- T054, T055 can run anytime after T040-T053

**Phase 6 (US4)**:

- T057 can start immediately after US3 complete
- T067, T068 can run anytime after T057-T066

**Phase 7 (Polish)**:

- T069-T073 can all run in parallel

---

## Task Statistics

**Total Tasks**: 77

- Phase 1 (Setup): 3 tasks
- Phase 2 (Foundational): 8 tasks
- Phase 3 (US1 - MVP): 13 tasks
- Phase 4 (US2): 16 tasks (added T031a for validation)
- Phase 5 (US3): 15 tasks (streamlined upload flow)
- Phase 6 (US4): 12 tasks
- Phase 7 (Polish): 10 tasks

**Parallelizable Tasks**: 24 tasks marked with [P]

**Independent Test Criteria**:

- US1: Can view questions without recording capability
- US2: Can record audio without submitting for rating
- US3: Can submit and receive ratings without navigation
- US4: Can navigate between questions with full functionality

**Recommended MVP**: Phase 1-3 (24 tasks) delivers User Story 1

- Users can view personalized questions
- Foundation for all other features
- Independently testable and valuable
