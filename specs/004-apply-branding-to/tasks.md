# Tasks: Apply Branding to the App and Revamp the User Interface

**Input:** Design documents from `/specs/004-apply-branding-to/`
**Prerequisites**: plan.md (required), research.md, data-model.md, quickstart.md

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

- **Web app**: `web/src/`, `web/tests/`
- Paths shown below assume web app structure - adjust based on plan.md

## Phase 3.1: Setup

- [x] T001 Configure Tailwind CSS with Comm-AI branding colors in web/tailwind.config.cjs
- [-] T002 Define branding constants in web/src/models/branding.ts (REMOVED - unused)

## Phase 3.2: Tests First (TDD) ⚠️ MUST COMPLETE BEFORE 3.3

**CRITICAL: These tests MUST be written and MUST FAIL before ANY implementation**

- [x] T003 [P] Visual regression test for main page branding in web/tests/e2e/test-visual-regression.spec.ts
- [x] T004 [P] Visual regression test for responsive design in web/tests/e2e/test-ui-responsiveness.spec.ts

## Phase 3.3: Core Implementation (ONLY after tests are failing)

- [x] T005 Update main styles with modern typography in web/src/styles.css
- [x] T006 Update PresenterPage component with new layout in web/src/pages/PresenterPage.tsx
- [x] T007 Update AudioReview component with branded design in web/src/components/AudioReview.tsx
- [x] T008 Update PdfViewer component with branded design in web/src/components/PdfViewer.tsx
- [-] T009 Add fallback handling for branding elements in web/src/components/BrandingFallback.tsx (REMOVED - unused)

## Phase 3.4: Integration

- [-] T010 Integrate responsive design utilities in web/src/components/ResponsiveLayout.tsx (REMOVED - unused)

## Phase 3.5: Polish

- [-] T011 [P] Unit tests for branding constants in web/src/models/**tests**/branding.spec.ts (REMOVED - unused)
- [x] T012 Update quickstart documentation in specs/004-apply-branding-to/quickstart.md
- [x] T013 Run visual regression tests to validate changes

## Dependencies

- Tests (T003-T004) before implementation (T005-T010)
- T001 blocks T005
- T002 blocks T005-T009
- Implementation before polish (T011-T013)

## Parallel Example

```
# Launch T003-T004 together:
Task: "Visual regression test for main page branding in web/tests/e2e/test-visual-regression.spec.ts"
Task: "Visual regression test for responsive design in web/tests/e2e/test-responsive-design.spec.ts"
```

## Notes

- [P] tasks = different files, no dependencies
- Verify tests fail before implementing
- Commit after each task
- Avoid: vague tasks, same file conflicts

## Task Generation Rules

_Applied during main() execution_

1. **From Contracts**:
   - No contracts available
2. **From Data Model**:
   - Branding Element → branding constants task
   - User Interface Component → component update tasks
3. **From User Stories**:

   - Acceptance scenarios → visual regression tests
   - Quickstart scenarios → validation tasks

4. **Ordering**:
   - Setup → Tests → Core → Integration → Polish
   - Dependencies block parallel execution

## Validation Checklist

_GATE: Checked by main() before returning_

- [x] All contracts have corresponding tests (N/A)
- [x] All entities have model tasks
- [x] All tests come before implementation
- [x] Parallel tasks truly independent
- [x] Each task specifies exact file path
- [x] No task modifies same file as another [P] task

## Post-Implementation Cleanup

After implementation, the following tasks were identified as creating unused files and were removed:

- **T002**: Branding constants were implemented directly in Tailwind config instead of separate constants file
- **T009**: Fallback component was not needed as branding works through Tailwind
- **T010**: Responsive utilities were not needed as responsive design was implemented directly in components
- **T011**: Unit tests for unused constants were removed

**Result**: Cleaner codebase with branding working through Tailwind configuration and direct component styling.

_Constitution reference: v2.1.1 (last amended 2025-09-20) — See `/memory/constitution.md`_
