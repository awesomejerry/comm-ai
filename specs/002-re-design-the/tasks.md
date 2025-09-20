# Tasks: UI Redesign

**Input**: Design documents from `/specs/002-re-design-the/`
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
   → All entities have models?
   → All endpoints implemented?
9. Return: SUCCESS (tasks ready for execution)
```

## Format: `[ID] [P?] Description`
- **[P]**: Can run in parallel (different files, no dependencies)
- Include exact file paths in descriptions

## Path Conventions
- **Web app**: `web/src/` for frontend code
- Paths shown below assume web application structure from plan.md

## Phase 3.1: Setup
- [x] T001 Verify existing project setup and dependencies per quickstart.md
- [x] T002 [P] Configure accessibility testing tools (axe-core, lighthouse)

## Phase 3.2: Tests First (TDD) ⚠️ MUST COMPLETE BEFORE 3.3
**CRITICAL: These tests MUST be written and MUST FAIL before ANY implementation**
- [x] T003 [P] Contract test for upload audio webhook in web/tests/contract/test-upload-webhook.spec.ts
- [x] T004 [P] Integration test for UI responsiveness in web/tests/integration/test-ui-responsiveness.spec.ts
- [x] T005 [P] Accessibility test for main page in web/tests/integration/test-accessibility.spec.ts
- [x] T006 [P] Visual regression test for redesigned components in web/tests/integration/test-visual-regression.spec.ts

## Phase 3.3: Core Implementation (ONLY after tests are failing)
- [x] T007 Update global styles and Tailwind configuration in web/src/styles.css and web/tailwind.config.cjs
- [x] T008 Redesign PresenterPage layout and structure in web/src/pages/PresenterPage.full.tsx
- [x] T009 [P] Style file upload input component in web/src/pages/PresenterPage.full.tsx
- [x] T010 [P] Style recording control buttons in web/src/pages/PresenterPage.full.tsx
- [x] T011 [P] Improve PdfViewer component styling in web/src/components/PdfViewer.tsx
- [x] T012 [P] Style segments list display in web/src/pages/PresenterPage.full.tsx
- [x] T013 Add responsive design classes throughout the application
- [x] T014 Implement accessibility improvements (ARIA labels, keyboard navigation)

## Phase 3.4: Integration
- [x] T015 Ensure existing recording functionality integrates with new UI
- [x] T016 Verify PDF viewing integration with redesigned layout

## Phase 3.5: Polish
- [x] T017 [P] Unit tests for new styling utilities in web/tests/unit/test-styling.spec.ts
- [x] T018 Performance optimization for UI rendering
- [x] T019 [P] Update quickstart.md with UI changes
- [x] T020 Run accessibility audit and fix issues
- [x] T021 Execute visual regression tests

## Dependencies
- Tests (T003-T006) before implementation (T007-T014)
- T007 blocks T008-T014 (global styles first)
- T008 blocks T009-T012 (page layout first)
- Implementation before polish (T017-T021)

## Parallel Example
```
# Launch T003-T006 together:
Task: "Contract test for upload audio webhook in web/tests/contract/test-upload-webhook.spec.ts"
Task: "Integration test for UI responsiveness in web/tests/integration/test-ui-responsiveness.spec.ts"
Task: "Accessibility test for main page in web/tests/integration/test-accessibility.spec.ts"
Task: "Visual regression test for redesigned components in web/tests/integration/test-visual-regression.spec.ts"
```

## Notes
- [P] tasks = different files, no dependencies
- Verify tests fail before implementing
- Commit after each task
- Avoid: vague tasks, same file conflicts
- Focus on visual improvements while preserving all existing functionality

## Task Generation Rules
*Applied during main() execution*

1. **From Contracts**:
   - Each contract file → contract test task [P]
   - Each endpoint → implementation task
   
2. **From Data Model**:
   - Each entity → model creation task [P] (none new for UI redesign)
   - Relationships → service layer tasks (existing maintained)
   
3. **From User Stories**:
   - Each story → integration test [P]
   - Quickstart scenarios → validation tasks

4. **Ordering**:
   - Setup → Tests → Models → Services → Endpoints → Polish
   - Dependencies block parallel execution

## Validation Checklist
*GATE: Checked by main() before returning*

- [x] All contracts have corresponding tests
- [x] All entities have model tasks (existing maintained)
- [x] All tests come before implementation
- [x] Parallel tasks truly independent
- [x] Each task specifies exact file path
- [x] No task modifies same file as another [P] task

*Constitution reference: v1.1.0 (last amended 2025-09-20) — See `/memory/constitution.md`*