# Tasks: Audio Recording Review Before Uploading

**Input**: Design documents from `/specs/003-audio-recording-review/`
**Prerequisites**: plan.md (required), research.md, data-model.md, contracts/

## Execution Flow (main)

```
1. Load plan.md from feature directory
   → If not found: ERROR "No implementation plan found"
   → Extract: tech stack, libraries, structure
2. Load optional design documents:
   → data-model.md: Extract entities → model tasks
   → contracts/: Each file → contract test task
   → research.md: Extract decisions → setup tasks
3. Generate tasks by category:
   → Setup: project init, dependencies, linting
   → Tests: contract tests, integration tests
   → Core: models, services, CLI commands
   → Integration: DB, middleware, logging
   → Polish: unit tests, performance, docs
4. Apply task rules:
   → Different files = mark [P] for parallel
   → Same file = sequential (no [P])
   → Tests before implementation (TDD)
5. Number tasks sequentially (T001, T002...)
6. Generate dependency graph
7. Create parallel execution examples
8. Validate task completeness:
   → All contracts have tests?
   → All entities have model tasks?
   → All endpoints implemented?
9. Return: SUCCESS (tasks ready for execution)
```

## Format: `[ID] [P?] Description`

- **[P]**: Can run in parallel (different files, no dependencies)
- Include exact file paths in descriptions

## Path Conventions

- **Web app**: `src/` for frontend, `server.js` for backend
- Paths adjusted based on plan.md structure (Option 2: Web application)

## Phase 3.1: Setup

- [x] T001 [P] Verify existing contract test for upload webhook in src/services/**tests**/uploader.contract.spec.ts

## Phase 3.2: Tests First (TDD) ⚠️ MUST COMPLETE BEFORE 3.3

**CRITICAL: These tests MUST be written and MUST FAIL before ANY implementation**

- [x] T002 [P] Contract test for upload webhook with review flow in src/services/**tests**/uploader.contract.spec.ts
- [x] T003 [P] Integration test: pause recording and review audio in tests/e2e/recording-review.spec.ts
- [x] T004 [P] Integration test: confirm upload after review in tests/e2e/recording-review.spec.ts
- [x] T005 [P] Integration test: delete recording after review in tests/e2e/recording-review.spec.ts

## Phase 3.3: Core Implementation (ONLY after tests are failing)

- [x] T006 [P] Extend Recording entity with review state in src/models/presentation.ts
- [x] T007 [P] Create AudioReview component in src/components/AudioReview.tsx
- [x] T008 Update recordingController with review state management in src/recording/recordingController.ts
- [x] T009 Update PresenterPage with review UI controls in src/pages/PresenterPage.tsx
- [x] T010 Add delete recording functionality to uploader service in src/services/uploader.ts

## Phase 3.4: Integration

- [x] T011 Add logging for review actions in src/recording/recordingController.ts

## Phase 3.5: Polish

- [x] T012 [P] Unit tests for AudioReview component in src/components/**tests**/AudioReview.spec.tsx
- [x] T013 [P] Unit tests for review state management in src/recording/**tests**/recordingController.spec.ts
- [x] T014 Update quickstart documentation validation
- [x] T015 Run manual testing per quickstart.md

## Dependencies

- Tests (T002-T005) before implementation (T006-T010)
- T006 before T008, T009 (model extension needed)
- T007 before T009 (component needed for UI)
- T008 before T011 (controller needed for logging)
- Implementation before polish (T012-T015)

## Parallel Example

```
# Launch T003-T005 together:
Task: "Integration test: pause recording and review audio in tests/e2e/recording-review.spec.ts"
Task: "Integration test: confirm upload after review in tests/e2e/recording-review.spec.ts"
Task: "Integration test: delete recording after review in tests/e2e/recording-review.spec.ts"
```

## Notes

- [P] tasks = different files, no dependencies
- Verify tests fail before implementing
- Commit after each task with precise messages
- Avoid: vague tasks, same file conflicts

## Task Generation Rules

_Applied during main() execution_

1. **From Contracts**:
   - Each contract file → contract test task [P]
   - Each endpoint → implementation task
2. **From Data Model**:
   - Each entity → model creation task [P]
   - Relationships → service layer tasks
3. **From User Stories**:

   - Each story → integration test [P]
   - Quickstart scenarios → validation tasks

4. **Ordering**:
   - Setup → Tests → Models → Services → Endpoints → Polish
   - Dependencies block parallel execution

## Validation Checklist

_GATE: Checked by main() before returning_

- [x] All contracts have corresponding tests
- [x] All entities have model tasks
- [x] All tests come before implementation
- [x] Parallel tasks truly independent
- [x] Each task specifies exact file path
- [x] No task modifies same file as another [P] task

_Constitution reference: v1.2.0 (last amended 2025-09-20) — See `/memory/constitution.md`_
