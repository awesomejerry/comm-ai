# Tasks: Slide-based PDF presenter with audio recording & evaluation

**Input**: Design documents and artifacts from `/specs/001-create-a-web/`
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
   → Core: models, services, UI components
   → Integration: uploader, worker integration
   → Polish: UX, accessibility, docs
4. Apply task rules:
   → Different files = mark [P] for parallel
   → Same file = sequential (no [P])
   → Tests before implementation (TDD)
5. Number tasks sequentially (T001, T002...)
6. Generate dependency graph
7. Create parallel execution examples
8. Validate task completeness:
   → All contracts have tests?
   → All entities have models?
   → All endpoints implemented?
9. Return: SUCCESS (tasks ready for execution)
```

## Format: `[ID] [P?] Description` 
- **[P]**: Can run in parallel (different files, no dependencies)
- Include exact file paths in descriptions

---

## Phase 1: Setup (T001)
- [x] T001 - Setup project skeleton and tooling (sequential)
   - Create/modify: `/web/ui-presenter/package.json`, `/web/ui-presenter/vite.config.ts`, `/web/ui-presenter/tsconfig.json`
   - Add: `/web/ui-presenter/playwright.config.ts`, `/web/ui-presenter/vitest.config.ts`, Tailwind configs
   - Command: `npm install`
   - Notes: Vite + React + TypeScript scaffold created. Tailwind, Jotai, Vitest and Playwright added. Unit tests run successfully.

---

## Phase 2: Tests First (T002 - T007) ⚠️ MUST COMPLETE BEFORE IMPLEMENTATION
**CRITICAL: These tests SHOULD be written before implementation tasks where noted**

T002 [P] - Contract test: evaluation webhook schema
- [ ] T002 - Add contract test asserting multipart/form-data upload to webhook
   - Test file: `/web/ui-presenter/tests/contract/evaluation.contract.test.ts`
   - Assert: client POSTs multipart/form-data to `https://n8n.awesomejerry.space/webhook/commoon/upload-audio` with fields `audio`, `startSlide`, `endSlide`, `audience` and expects JSON `input`/`output`.
   - Notes: `contracts/evaluation-api.yaml` exists; contract test not implemented yet.

T003 [P] - Unit test: Presentation model (data model)
- [x] T003 - Presentation model unit tests
   - Test files: `/web/ui-presenter/src/models/presentation.spec.ts`, `/web/ui-presenter/src/models/segment.spec.ts`
   - Assert: pageCount >=1, slide index ranges, segment metadata correctness
   - Notes: Model tests present and passing under Vitest.

T004 - Implement models (make T003 pass)
- [x] T004 - Implement models
   - Files: `/web/ui-presenter/src/models/presentation.ts`, `/web/ui-presenter/src/models/segment.ts`
   - Notes: TypeScript models and validators implemented.

T005 [P] - Unit test: PDF rendering integration (component-level)
- [ ] T005 - Add PdfViewer unit test (jsdom)
   - Test file: `/web/ui-presenter/src/components/__tests__/PdfViewer.spec.tsx`
   - Assert: component attempts to render a canvas for a loaded PDF page (mock pdfjs-dist APIs)
   - Notes: PdfViewer exists but lacks a dedicated Vitest/jsdom test.

T006 - Implement PdfViewer component (make T005 pass)
- [x] T006 - Implement PdfViewer component
   - File: `/web/ui-presenter/src/components/PdfViewer.tsx`
   - Notes: Canvas-based viewer with Prev/Next and page callbacks implemented. Worker imported via Vite `?url`.

T007 [P] - Unit test: Recording controller behavior
- [x] T007 - Recording controller unit tests
   - Test file: `/web/ui-presenter/src/recording/__tests__/recordingController.spec.ts`
   - Assert: on pause -> controller emits blob and metadata (segmentId, startSlide, endSlide)
   - Notes: Recording controller tests were added and pass (MediaRecorder mocked).

---

## Phase 3: Core Implementation (T008 - T011)
T008 - Implement recording controller (make T007 pass)
- [x] T008 - Implement recording controller
   - File: `/web/ui-presenter/src/recording/recordingController.ts`
   - Notes: `RecordingController` supports start(startSlide?), pause(currentSlide) -> emits segment with startSlide and endSlide.

T009 - Contract integration: wire upload logic to call webhook (make T002 pass)
- [x] T009 - Implement uploader
   - File: `/web/ui-presenter/src/services/uploader.ts`
   - POST to: `https://n8n.awesomejerry.space/webhook/commoon/upload-audio` with `audio`, `startSlide`, `endSlide`, `audience`
   - Notes: Uploader implemented and unit-tested. Contract test (T002) still pending.

T010 [P] - Component integration test: Recording UI interactions
- [ ] T010 - Add PresenterPage component integration test
   - Test file: `/web/ui-presenter/src/pages/__tests__/PresenterPage.spec.tsx`
   - Simulate: upload PDF, start recording, navigate slides, pause, assert upload called
   - Notes: Presenter page exists and manual testing possible; integration test not added.

T011 - Implement Presenter page (make T010 pass)
- [x] T011 - Implement Presenter page
   - File: `/web/ui-presenter/src/pages/PresenterPage.tsx` (or `/src/pages/PresenterPage.full.tsx`)
   - Notes: Presenter page implemented, wired to PdfViewer, RecordingController, and uploader. Segments list and raw evaluation JSON display exist.

---

## Phase 4: Integration & E2E (T012 - T013)
T012 [P] - E2E test: Record-and-evaluate scenario (Playwright)
- [x] T012 - Playwright E2E test
   - Test file: `/web/ui-presenter/tests/e2e/recording.spec.ts`
   - Scenario: upload PDF, start recording, change slides, pause, assert UI shows evaluation (mocked webhook response)
   - Notes: Playwright E2E exists and was executed successfully. Playwright tests are run separately from Vitest.

T013 - Implement evaluation result UI (make T012 pass)
- [ ] T013 - Implement evaluation result UI (IN PROGRESS)
   - Files: `/web/ui-presenter/src/components/SegmentList.tsx`, `/web/ui-presenter/src/components/EvaluationBadge.tsx`
   - Notes: Segments list displays entries and evaluation JSON; formatting and badges need improvement.

---

## Phase 5: Robustness & Polish (T014 - T018)
T014 [P] - Robustness: retry & queueing behavior tests
- [ ] T014 - Add uploader retry & queue tests
   - Test file: `/web/ui-presenter/src/recording/__tests__/uploaderRetry.spec.ts`
   - Simulate: network failures and assert retry/backoff and manual retry

T015 - Implement retry & queue (make T014 pass)
- [ ] T015 - Implement uploaderQueue (in-memory + retry)
   - File: `/web/ui-presenter/src/services/uploaderQueue.ts`
   - Status: NOT STARTED

T016 [P] - Polish: UX, accessibility, Tailwind styling
- [ ] T016 - UX/accessibility/Tailwind polish
   - Update: `/web/ui-presenter/src/styles/*`, component classNames
   - Status: NOT STARTED

T017 [P] - Tests: Add Vitest unit coverage and Playwright smoke suite
- [ ] T017 - Add coverage & CI smoke suite (IN PROGRESS)
   - Update test scripts in `/web/ui-presenter/package.json`
   - Notes: Unit tests and Playwright E2E exist. CI integration and coverage collection remain to be configured.

T018 [P] - Documentation & Quickstart
- [x] T018 - Documentation & Quickstart
   - Update README and `specs/001-create-a-web/quickstart.md` with exact commands for local dev and CI steps.
   - Notes: Quickstart and spec artifacts have been added under `specs/001-create-a-web`.

---

## Execution notes & parallel groups
- Parallel group A [P]: T002, T005, T007 (tests for contracts, PDF rendering, recording controller) can be authored concurrently.
- Parallel group B [P]: T012, T017, T018 (E2E, CI/coverage, docs) can run after core features exist but are partially independent.

## Validation checklist
- [x] All core models implemented
- [x] RecordingController implemented and tested
- [x] PDF viewer implemented and wired into Presenter
- [x] Uploader implemented and unit-tested
- [ ] Contract test for webhook (T002) - MISSING
- [ ] Component-level PdfViewer test (T005) - MISSING
- [ ] Upload retry/queue tests & implementation (T014/T015) - MISSING

---

## Next recommended tasks
1. Add contract test for the evaluation webhook (T002) — ensures request shape guarantees.
2. Add PdfViewer unit test (T005) — completes TDD loop for the component.
3. Implement simple in-memory uploader queue with retry (T015) and tests (T014).

*** End of tasks

