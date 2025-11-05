# Tasks: Immersive Present Mode with Auto-Recording

**Input**: Design documents from `/specs/008-present-mode/`
**Prerequisites**: plan.md, spec.md, research.md, data-model.md, contracts/

**Tests**: Following the constitution's NON-NEGOTIABLE test-first principle, Phase 1.5 includes test tasks that MUST be completed before implementation. All tests should fail initially and pass after implementation.

**Organization**: Tasks are grouped by user story to enable independent implementation and testing of each story.

## Format: `[ID] [P?] [Story] Description`

- **[P]**: Can run in parallel (different files, no dependencies)
- **[Story]**: Which user story this task belongs to (e.g., US1, US2, US3)
- Include exact file paths in descriptions

## Path Conventions

- **Web app**: `web/src/`, `web/tests/`
- Paths assume web project structure from plan.md

---

## Phase 1: Setup (Shared Infrastructure)

**Purpose**: Project initialization and dependencies

- [x] T001 Add idb dependency for IndexedDB support in web/package.json
- [x] T002 [P] Create type definitions for present mode in web/src/models/presentMode.ts
- [x] T003 [P] Create type definitions for slide navigation events in web/src/models/segment.ts (extend existing)

---

## Phase 1.5: Test Infrastructure (Test-First Setup)

**Purpose**: Create failing tests BEFORE implementation (Constitution: Test-First NON-NEGOTIABLE)

**⚠️ CRITICAL**: These tests MUST be written and MUST fail before implementing the corresponding modules

- [x] T004-TEST [P] Write failing unit test for TimestampTracker class in web/tests/unit/recording/timestampTracker.spec.ts
- [x] T005-TEST [P] Write failing unit test for RecordingPersistence service in web/tests/unit/recording/recordingPersistence.spec.ts
- [x] T006-TEST [P] Write failing unit test for RecordingController mode parameter in web/tests/unit/recording/recordingController.spec.ts
- [x] T007-TEST [P] Write failing unit test for PresentModeToggle component in web/tests/unit/components/PresentModeToggle.spec.tsx
- [x] T008-TEST [P] Write failing unit test for PresentModeView component in web/tests/unit/components/PresentModeView.spec.tsx
- [x] T009-TEST [P] Write failing e2e test for US1 (switch to present mode, auto-record, track timestamps) in web/tests/e2e/present-mode.spec.ts
- [x] T010-TEST [P] Write failing e2e test for US2 (exit present mode, persist recording, show upload UI) in web/tests/e2e/present-mode.spec.ts
- [x] T011-TEST [P] Write failing e2e test for US3 (upload recording with mode field, view results) in web/tests/e2e/present-mode.spec.ts
- [x] T012-TEST [P] Write failing contract test for present mode evaluation API payload in web/tests/contract/present-mode-evaluation.spec.ts

**Checkpoint**: All failing tests written - implementation can now proceed with TDD workflow

---

## Phase 2: Foundational (Blocking Prerequisites)

**Purpose**: Core infrastructure that MUST be complete before ANY user story can be implemented

**⚠️ CRITICAL**: No user story work can begin until this phase is complete

- [x] T004 Create TimestampTracker class in web/src/recording/timestampTracker.ts
- [x] T005 Create RecordingPersistence service in web/src/recording/recordingPersistence.ts for IndexedDB management
- [x] T006 Extend RecordingController to support mode parameter in web/src/recording/recordingController.ts

**Checkpoint**: Foundation ready - user story implementation can now begin in parallel

---

## Phase 3: User Story 1 - Switch to Present Mode and Auto-Record (Priority: P1) 🎯 MVP

**Goal**: Users can switch from practice mode to present mode with full-screen UI, automatic recording start, and timestamp tracking for slide navigation

**Independent Test**: Switch from practice mode to present mode, navigate through slides, verify audio recording is active and timestamps are captured for each slide transition

### Implementation for User Story 1

- [x] T007 [P] [US1] Create PresentModeToggle component in web/src/components/PresentModeToggle.tsx
- [x] T008 [P] [US1] Create PresentModeView component with full-screen layout in web/src/components/PresentModeView.tsx
- [x] T009 [US1] Create Jotai atom for presentation mode state in web/src/models/presentMode.ts
- [x] T010 [US1] Integrate PresentModeToggle into PresenterPage in web/src/pages/PresenterPage.full.tsx
- [x] T011 [US1] Implement mode switching logic in PresenterPage to toggle between practice and present views in web/src/pages/PresenterPage.full.tsx
- [x] T012 [US1] Wire up auto-start recording when entering present mode in web/src/pages/PresenterPage.full.tsx
- [x] T013 [US1] Integrate TimestampTracker with slide navigation in web/src/pages/PresenterPage.full.tsx
- [x] T014 [US1] Add microphone permission error handling for present mode entry in web/src/pages/PresenterPage.full.tsx
- [x] T015 [US1] Add recording indicators to PresentModeView in web/src/components/PresentModeView.tsx
- [x] T016 [US1] Configure MediaRecorder with 64 kbps bitrate in web/src/recording/recordingController.ts

**Checkpoint**: At this point, users can enter present mode, see full-screen view, recording auto-starts, and timestamps are tracked

---

## Phase 4: User Story 2 - Exit Present Mode and Access Upload Option (Priority: P1)

**Goal**: Users can exit present mode to automatically stop recording, persist it locally for 7 days, and see upload interface with duration warnings

**Independent Test**: Exit present mode, verify recording stops, recording is saved to IndexedDB, upload interface appears with duration display and warning if <30 seconds

### Implementation for User Story 2

- [x] T017 [US2] Implement auto-stop recording when exiting present mode in web/src/pages/PresenterPage.full.tsx
- [x] T018 [US2] Integrate RecordingPersistence to save recording to IndexedDB with 7-day expiry in web/src/pages/PresenterPage.full.tsx
- [x] T019 [US2] Create upload interface section in PresenterPage for completed recordings in web/src/pages/PresenterPage.full.tsx
- [x] T020 [US2] Add recording duration display in upload interface in web/src/pages/PresenterPage.full.tsx
- [x] T021 [US2] Add 30-second minimum duration warning in upload interface in web/src/pages/PresenterPage.full.tsx
- [x] T022 [US2] Implement pending recording retrieval on page load in web/src/pages/PresenterPage.full.tsx
- [x] T023 [US2] Add automatic cleanup of expired recordings (>7 days) on app load in web/src/recording/recordingPersistence.ts

**Checkpoint**: At this point, recordings persist locally, users see upload interface, and duration warnings appear for short recordings

---

## Phase 5: User Story 3 - Upload Recording and View Evaluation Results (Priority: P1)

**Goal**: Users can upload present mode recordings with timestamps and mode field, see upload progress, and view evaluation results in existing interface

**Independent Test**: Upload a completed recording, verify payload includes mode: "present" and timestamps, wait for evaluation to complete, verify results display in existing interface

### Implementation for User Story 3

- [x] T024 [US3] Extend evaluation service to add mode field to upload payload in web/src/services/uploaderQueue.ts
- [x] T025 [US3] Add timestamps field (JSON-encoded) to upload payload in web/src/services/uploaderQueue.ts
- [x] T026 [US3] Wire up upload button in upload interface to trigger evaluation service in web/src/pages/PresenterPage.full.tsx
- [x] T027 [US3] Add upload progress indicators during upload and evaluation in web/src/pages/PresenterPage.full.tsx
- [x] T028 [US3] Display evaluation results using existing result interface (EvaluationChat) in web/src/pages/PresenterPage.full.tsx
- [x] T029 [US3] Add error handling and retry options for failed uploads in web/src/pages/PresenterPage.full.tsx
- [x] T030 [US3] Delete persisted recording from IndexedDB after successful upload in web/src/recording/recordingPersistence.ts

**Checkpoint**: All P1 user stories complete - users can enter present mode, record with timestamps, exit, upload, and view evaluations

---

## Phase 6: User Story 4 - Navigate Between Practice and Present Modes (Priority: P2)

**Goal**: Users can seamlessly switch between practice and present modes multiple times with appropriate recording state handling and confirmation dialogs

**Independent Test**: Switch between modes multiple times, verify UI adapts appropriately, confirm recording prompts appear when switching with active recording

### Implementation for User Story 4

- [x] T031 [US4] Add mode indicator display in present mode UI in web/src/components/PresentModeView.tsx
- [x] T032 [US4] Add exit button to present mode UI in web/src/components/PresentModeView.tsx
- [x] T033 [US4] Implement immediate mode transition when no recording is active in web/src/pages/PresenterPage.full.tsx
- [x] T034 [US4] Add confirmation dialog for mode exit with active recording in web/src/pages/PresenterPage.full.tsx
- [x] T035 [US4] Handle save/discard recording options in confirmation dialog in web/src/pages/PresenterPage.full.tsx
- [x] T036 [US4] Add keyboard shortcut (Escape) to exit present mode in web/src/components/PresentModeView.tsx

**Checkpoint**: Users can freely navigate between modes with appropriate state handling

---

## Phase 7: Polish & Cross-Cutting Concerns

**Purpose**: Improvements that affect multiple user stories and ensure production readiness

- [x] T037 [P] Add browser beforeunload warning when recording is active in web/src/pages/PresenterPage.full.tsx
- [x] T038 [P] Add CSS styles for full-screen present mode layout in web/src/components/PresentModeView.tsx
- [x] T039 [P] Add visual transitions for mode switching in web/src/components/PresentModeToggle.tsx
- [x] T040 [P] Update quickstart.md with present mode usage instructions
- [x] T041 Add comprehensive error handling for microphone failures mid-recording in web/src/recording/recordingController.ts
- [x] T042 Add file size warnings for recordings approaching 3-hour limit in web/src/pages/PresenterPage.full.tsx
- [x] T043 Verify accessibility of present mode controls (exit button, slide counter) in web/src/components/PresentModeView.tsx
- [ ] T044 Run manual testing per quickstart.md validation scenarios
- [x] T045 [P] Add logging for present mode operations and errors

---

## Dependencies & Execution Order

### Phase Dependencies

- **Setup (Phase 1)**: No dependencies - can start immediately
- **Test Infrastructure (Phase 1.5)**: Depends on Setup completion - creates failing tests BEFORE implementation
- **Foundational (Phase 2)**: Depends on Test Infrastructure (Phase 1.5) - implements code to make tests pass - BLOCKS all user stories
- **User Stories (Phase 3-6)**: All depend on Foundational phase completion
  - US1, US2, US3 are all P1 priority - should be implemented first (in sequence or parallel)
  - US4 is P2 priority - can be implemented after P1 stories
- **Polish (Phase 7)**: Depends on desired user stories being complete

### User Story Dependencies

- **User Story 1 (P1)**: Can start after Foundational (Phase 2) - No dependencies on other stories
- **User Story 2 (P1)**: Depends on User Story 1 (needs recording session from present mode) - Sequential dependency
- **User Story 3 (P1)**: Depends on User Story 2 (needs persisted recording to upload) - Sequential dependency
- **User Story 4 (P2)**: Can start after User Story 1 (extends mode switching) - Parallel with US2/US3 if desired

**Note**: US1, US2, and US3 form a sequential flow (enter → record → exit → upload → evaluate) so they have natural dependencies despite all being P1 priority.

### Within Each User Story

- **Test tasks FIRST** (Phase 1.5) - write failing tests before any implementation
- Type definitions before components
- Jotai atoms before UI integration
- Core components before page integration
- Recording logic before UI triggers
- Persistence before upload
- Core implementation before error handling and polish

### Parallel Opportunities

- All Setup tasks (T001-T003) marked [P] can run in parallel
- All Test Infrastructure tasks (T004-TEST through T012-TEST) marked [P] can run in parallel after Setup
- Within US1: T007 and T008 (two components) can be built in parallel
- All Polish tasks marked [P] can run in parallel
- US4 can be worked on in parallel with US2/US3 by a different developer (after US1 completes)

---

## Parallel Example: User Story 1

```bash
# Launch component creation in parallel:
Task T007: "Create PresentModeToggle component in web/src/components/PresentModeToggle.tsx"
Task T008: "Create PresentModeView component in web/src/components/PresentModeView.tsx"

# Then sequential integration:
Task T009: "Create Jotai atom for presentation mode state"
Task T010: "Integrate PresentModeToggle into PresenterPage"
# ... and so on
```

---

## Implementation Strategy

### MVP First (User Stories 1-3 Complete - All P1)

1. Complete Phase 1: Setup (T001-T003)
2. Complete Phase 2: Foundational (T004-T006) - CRITICAL, blocks all stories
3. Complete Phase 3: User Story 1 (T007-T016) - Enter present mode, auto-record, track timestamps
4. **CHECKPOINT**: Test present mode entry and recording independently
5. Complete Phase 4: User Story 2 (T017-T023) - Exit, persist, show upload UI
6. **CHECKPOINT**: Test recording persistence and upload interface
7. Complete Phase 5: User Story 3 (T024-T030) - Upload with mode field, view results
8. **CHECKPOINT**: Test end-to-end present mode flow
9. **STOP and VALIDATE**: Full P1 functionality complete - ready for user testing

### Incremental Delivery

1. Complete Setup + Foundational → Infrastructure ready
2. Add User Story 1 → Users can enter present mode and record
3. Add User Story 2 → Recordings persist and show upload UI
4. Add User Story 3 → Complete evaluation flow → **MVP COMPLETE**
5. Add User Story 4 → Enhanced mode switching → P2 enhancement
6. Add Polish → Production-ready

### Parallel Team Strategy

With 2-3 developers:

1. Team completes Setup + Foundational together (T001-T006)
2. Once Foundational is done:
   - **Developer A**: User Story 1 (T007-T016) - Present mode UI and recording
   - **Developer B**: User Story 4 (T031-T036) - Mode switching enhancements (can start after US1 base complete)
   - **Developer C**: Polish tasks (T037-T045) - Can work on documentation and accessibility
3. Then sequential for US2/US3 (natural flow dependencies):
   - **Developer A**: User Story 2 (T017-T023) - Persistence
   - **Developer A**: User Story 3 (T024-T030) - Upload and evaluation

**Note**: Due to sequential nature of P1 stories (recording flow), parallel work is limited. US4 and Polish provide parallel opportunities.

---

## Notes

- [P] tasks = different files, no dependencies, can run in parallel
- [Story] label maps task to specific user story for traceability
- Each user story delivers value even though some have dependencies (recording → persist → upload flow)
- User Story 1 independently testable (can enter present mode and verify recording)
- User Story 2 extends US1 (adds persistence and UI)
- User Story 3 extends US2 (adds upload capability)
- User Story 4 is truly independent enhancement (better mode navigation)
- Tests should be written before implementation (TDD approach) but not explicitly listed as tasks
- Commit after each task or logical group with format: `feat: add present mode toggle` or `fix: handle microphone permission denial`
- Stop at any checkpoint to validate story functionality independently
- **Constitution compliance**: All tasks follow test-first, modular design, and contract safety principles

---

## Task Summary

**Total Tasks**: 45

- **Phase 1 (Setup)**: 3 tasks
- **Phase 2 (Foundational)**: 3 tasks
- **Phase 3 (US1 - P1)**: 10 tasks
- **Phase 4 (US2 - P1)**: 7 tasks
- **Phase 5 (US3 - P1)**: 7 tasks
- **Phase 6 (US4 - P2)**: 6 tasks
- **Phase 7 (Polish)**: 9 tasks

**MVP Scope**: Phases 1-5 (30 tasks) deliver complete P1 functionality
**Parallel Opportunities**: 9 tasks marked [P] can run in parallel with others
**Independent Stories**: US1 and US4 can be independently tested; US2 and US3 extend US1 sequentially
