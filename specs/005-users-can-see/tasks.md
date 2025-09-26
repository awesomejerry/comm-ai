# Tasks: Display Evaluation Results as Chat

**Input**: Design documents from `/specs/005-users-can-see/`
**Prerequisites**: plan.md (required), research.md, data-model.md, contracts/, quickstart.md

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

- **Web app**: `web/src/` for components, `web/tests/` for tests
- Paths shown below assume web app structure per plan.md

## Phase 3.1: Setup

- [x] T001 Verify project dependencies and TypeScript configuration in web/

## Phase 3.2: Tests First (TDD) ⚠️ MUST COMPLETE BEFORE 3.3

**CRITICAL: These tests MUST be written and MUST FAIL before ANY implementation**

- [x] T002 [P] Contract test for evaluation result webhook response in web/tests/contract/evaluationWebhook.contract.spec.ts
- [x] T003 [P] Integration test for displaying evaluation as chat in web/tests/e2e/evaluationChat.spec.ts

## Phase 3.3: Core Implementation (ONLY after tests are failing)

- [x] T004 [P] EvaluationResult TypeScript interface in web/src/models/evaluation.ts
- [x] T005 [P] SRT parser utility in web/src/services/srtParser.ts
- [x] T006 [P] ChatBubble component in web/src/components/ChatBubble.tsx
- [x] T007 [P] EvaluationChat component in web/src/components/EvaluationChat.tsx
- [x] T008 Integrate EvaluationChat into segments list in web/src/pages/PresenterPage.tsx

## Phase 3.4: Integration

- [x] T009 Update uploader service to handle evaluation result parsing

## Phase 3.5: Polish

- [x] T010 [P] Unit tests for SRT parser in web/tests/unit/srtParser.spec.ts
- [x] T011 [P] Unit tests for ChatBubble component in web/tests/unit/ChatBubble.spec.ts
- [x] T012 Update component documentation and TypeScript types

## Dependencies

- Tests (T002-T003) before implementation (T004-T008)
- T004 blocks T007 (interface needed for component)
- T005 blocks T007 (parser needed for component)
- T006 blocks T007 (bubble needed for chat)
- T007 blocks T008 (component needed for integration)
- Implementation before polish (T010-T012)

## Parallel Example

```
# Launch T002-T003 together:
Task: "Contract test for evaluation result webhook response in web/tests/contract/evaluationWebhook.contract.spec.ts"
Task: "Integration test for displaying evaluation as chat in web/tests/e2e/evaluationChat.spec.ts"
```

## Notes

- [P] tasks = different files, no dependencies
- Verify tests fail before implementing
- Commit after each task following constitution
- Use existing stack: React, TypeScript, Tailwind CSS</content>
  <parameter name="filePath">/home/jerry/workspace/comm-ai/specs/005-users-can-see/tasks.md
