---
description: "Task list for admin evaluations dashboard feature implementation"
---

# Tasks: Admin Evaluations Dashboard

**Feature Branch**: `007-admin-evaluations-page`  
**Input**: Design documents from `/specs/007-admin-evaluations-page/`  
**Prerequisites**: plan.md, spec.md, research.md, data-model.md, contracts/

**Organization**: Tasks are grouped by user story to enable independent implementation and testing of each story.

## Format: `[ID] [P?] [Story] Description`

- **[P]**: Can run in parallel (different files, no dependencies)
- **[Story]**: Which user story this task belongs to (e.g., US1, US2, US3)
- Include exact file paths in descriptions

---

## Phase 1: Setup (Shared Infrastructure)

**Purpose**: Project initialization and environment configuration

- [x] T001 Update User model to support admin role in `web/src/models/user.ts`
- [x] T002 [P] Create n8n environment variables configuration in `web/.env.local`
- [x] T003 [P] Update TypeScript configuration if needed for new dependencies in `web/tsconfig.json`

---

## Phase 2: Foundational (Blocking Prerequisites)

**Purpose**: Core infrastructure that MUST be complete before ANY user story can be implemented

**⚠️ CRITICAL**: No user story work can begin until this phase is complete

- [x] T004 Create adminRoleService for role verification in `web/src/services/adminRoleService.ts`
- [x] T005 Create evaluationService for fetching evaluations in `web/src/services/evaluationService.ts`
- [x] T006 [P] Create contract test for n8n evaluation API in `web/tests/contract/n8n-evaluation-api.spec.ts`
- [x] T007 [P] Create contract test for n8n role API in `web/tests/contract/n8n-role-api.spec.ts`
- [x] T008 [P] Create unit tests for adminRoleService in `web/src/services/__tests__/adminRoleService.test.ts`
- [x] T009 [P] Create unit tests for evaluationService in `web/src/services/__tests__/evaluationService.test.ts`

**Checkpoint**: Foundation ready - user story implementation can now begin in parallel

---

## Phase 3: User Story 2 - Access Control for Admin-Only Page (Priority: P1) 🎯 MVP

**Goal**: Implement route-level protection so only authenticated admin users can access the evaluations dashboard

**Independent Test**: Can be tested by attempting to access the admin route as a regular user (should be denied) and as an admin user (should be granted access)

### Tests for User Story 2

> **NOTE: Write these tests FIRST, ensure they FAIL before implementation**

- [x] T010 [P] [US2] Create E2E test for admin access control in `web/tests/e2e/admin-access-control.spec.ts`
- [x] T011 [P] [US2] Create unit tests for AdminRoute component in `web/src/components/__tests__/AdminRoute.test.tsx`

### Implementation for User Story 2

- [x] T012 [US2] Implement AdminRoute guard component in `web/src/components/AdminRoute.tsx`
- [x] T013 [US2] Add unauthorized access page component in `web/src/pages/UnauthorizedPage.tsx`
- [x] T014 [US2] Add admin route to router configuration in `web/src/App.tsx`
- [x] T015 [US2] Add loading and error states to AdminRoute component

**Checkpoint**: At this point, route protection should be fully functional - non-admin users redirected, admin users allowed access

---

## Phase 4: User Story 1 - Admin Views All Evaluation Results (Priority: P1)

**Goal**: Display all evaluation results from all users in a paginated list with sorting capabilities

**Independent Test**: Can be tested by logging in as an admin user, navigating to the dashboard, and verifying all evaluations are displayed with proper sorting and pagination

### Tests for User Story 1

- [x] T016 [P] [US1] Create E2E test for admin dashboard page in `web/tests/e2e/admin-dashboard.spec.ts`
- [x] T017 [P] [US1] Create unit tests for AdminDashboardPage in `web/src/pages/__tests__/AdminDashboardPage.test.tsx`
- [x] T018 [P] [US1] Create unit tests for EvaluationList component in `web/src/components/__tests__/EvaluationList.test.tsx`

### Implementation for User Story 1

- [x] T019 [P] [US1] Create AdminDashboardState interface in `web/src/models/adminDashboard.ts`
- [x] T020 [US1] Implement AdminDashboardPage component in `web/src/pages/AdminDashboardPage.tsx`
- [x] T021 [US1] Implement EvaluationList component with virtual scrolling in `web/src/components/EvaluationList.tsx`
- [x] T022 [US1] Add client-side sorting logic (by created_at) in `web/src/components/EvaluationList.tsx`
- [x] T023 [US1] Add content truncation (200 characters) to list items in `web/src/components/EvaluationList.tsx`
- [x] T024 [US1] Add loading state UI to AdminDashboardPage in `web/src/pages/AdminDashboardPage.tsx`
- [x] T025 [US1] Add error state UI with retry button to AdminDashboardPage in `web/src/pages/AdminDashboardPage.tsx`
- [x] T026 [US1] Add empty state UI (no evaluations) to AdminDashboardPage in `web/src/pages/AdminDashboardPage.tsx`
- [x] T027 [US1] Add malformed data handling with placeholders to EvaluationList in `web/src/components/EvaluationList.tsx`
- [x] T028 [US1] Integrate virtual scrolling library (@tanstack/react-virtual) in `web/src/components/EvaluationList.tsx`

**Checkpoint**: At this point, admin dashboard should display all evaluations with sorting, virtual scrolling, and proper error/loading/empty states

---

## Phase 5: User Story 3 - Admin Views Evaluation Details (Priority: P2)

**Goal**: Allow admins to click on an evaluation to see full details in a modal/panel

**Independent Test**: Can be tested by logging in as admin, clicking any evaluation in the list, and verifying full details appear with close functionality

### Tests for User Story 3

- [x] T029 [P] [US3] Create unit tests for EvaluationDetail component in `web/src/components/__tests__/EvaluationDetail.test.tsx`
- [x] T030 [P] [US3] Create E2E test for evaluation detail view in `web/tests/e2e/admin-dashboard.spec.ts`

### Implementation for User Story 3

- [x] T031 [P] [US3] Implement EvaluationDetail modal/panel component in `web/src/components/EvaluationDetail.tsx`
- [x] T032 [US3] Add click handler to EvaluationList items to open detail view in `web/src/components/EvaluationList.tsx`
- [x] T033 [US3] Add close/back navigation to EvaluationDetail component in `web/src/components/EvaluationDetail.tsx`
- [x] T034 [US3] Display full input/output content in EvaluationDetail in `web/src/components/EvaluationDetail.tsx`
- [x] T035 [US3] Display metadata (id, created_at, startSlide, endSlide, audience) in EvaluationDetail in `web/src/components/EvaluationDetail.tsx`

**Checkpoint**: All user stories should now be independently functional - admin can access dashboard, view list, and see details

---

## Phase 6: Polish & Cross-Cutting Concerns

**Purpose**: Final refinements, performance optimization, and documentation

- [x] T036 [P] Add Tailwind CSS styling to all new components
- [x] T037 [P] Optimize virtual scrolling performance for 10,000+ items
- [x] T038 [P] Add accessibility attributes (ARIA labels, keyboard navigation) to interactive elements
- [x] T039 [P] Update README.md with admin dashboard documentation in `web/README.md`
- [x] T040 [P] Add inline code documentation (JSDoc) to service functions
- [x] T041 Verify all error messages are user-friendly and actionable
- [x] T042 Test performance targets: <3s load time, <500ms auth checks
- [x] T043 Run full E2E test suite and verify all scenarios pass
- [x] T044 Run type checking with `npx tsc --noEmit` and fix any type errors
- [N/A] T045 Run linting with `npm run lint` and fix any issues (ESLint not configured in project)

---

## Dependencies & Execution Strategy

### User Story Completion Order

```
Phase 1 (Setup) → Phase 2 (Foundation)
    ↓
Phase 3 (US2: Access Control) ← BLOCKING for all admin pages
    ↓
Phase 4 (US1: View All Evaluations) ← Core functionality
    ↓
Phase 5 (US3: Detail View) ← Enhancement
    ↓
Phase 6 (Polish) ← Final touches
```

### Parallel Execution Opportunities

**Within Phase 2 (Foundational):**

- T006, T007, T008, T009 can all run in parallel (different contract/test files)

**Within Phase 3 (US2):**

- T010, T011 can run in parallel (different test files)

**Within Phase 4 (US1):**

- T016, T017, T018 can run in parallel (different test files)
- T019 can run in parallel with tests
- After T020 (AdminDashboardPage) is created, T024, T025, T026 can be done in parallel

**Within Phase 5 (US3):**

- T029, T030 can run in parallel (different test files)
- T031 can run in parallel with tests

**Within Phase 6 (Polish):**

- T036, T037, T038, T039, T040 can all run in parallel (different concerns)

### MVP Scope (Minimum Viable Product)

**Recommended MVP**: Phases 1-4 only (User Stories 2 + 1)

This delivers:

- ✅ Admin access control (US2)
- ✅ View all evaluation results (US1)
- ✅ Sorting and pagination
- ✅ Error/loading/empty states

**Post-MVP Enhancement**: Phase 5 (User Story 3)

- Detail view for individual evaluations

**Final Polish**: Phase 6

- Styling, performance optimization, accessibility

### Independent Testing per Story

**User Story 2 (Access Control):**

```bash
# Test admin can access
npm run test:e2e -- admin-access-control.spec.ts

# Verify: Admin user sees dashboard, non-admin redirected
```

**User Story 1 (View All):**

```bash
# Test evaluation list display
npm run test:e2e -- admin-dashboard.spec.ts

# Verify: All evaluations displayed, sorting works, pagination works
```

**User Story 3 (Detail View):**

```bash
# Test detail view
npm run test:e2e -- admin-dashboard.spec.ts --grep "detail view"

# Verify: Clicking evaluation shows full details
```

---

## Implementation Notes

### Service Layer (Phase 2)

**adminRoleService.ts** must implement:

```typescript
export async function checkIsAdmin(email: string): Promise<boolean>;
// Calls GET /comm-ai/role?email={email}
// Returns true if response.role === 'admin'
```

**evaluationService.ts** must implement:

```typescript
export async function fetchEvaluations(): Promise<EvaluationResult[]>;
// Calls GET /comm-ai/evaluation
// Returns response.results array
// Includes retry logic with exponential backoff
```

### Route Guard (Phase 3)

**AdminRoute.tsx** must:

1. Check user authentication via AuthContext
2. Call `checkIsAdmin(user.email)`
3. Show loading state during check
4. Render children if admin
5. Redirect to UnauthorizedPage if not admin
6. Show error state with retry if role check fails

### Dashboard Page (Phase 4)

**AdminDashboardPage.tsx** must:

1. Fetch evaluations on mount via `fetchEvaluations()`
2. Handle loading, error, and empty states
3. Pass data to EvaluationList component
4. Default sort: newest first (created_at desc)

**EvaluationList.tsx** must:

1. Implement virtual scrolling with @tanstack/react-virtual
2. Support client-side sorting by created_at (newest/oldest)
3. Truncate content at 200 characters with "..."
4. Handle malformed data with placeholders: "[Data unavailable]"
5. Display: id, created_at, input (truncated), output (truncated), startSlide, endSlide, audience
6. Display "N/A" for user field (not available in current data model)

### Detail View (Phase 5)

**EvaluationDetail.tsx** must:

1. Show full input/output content (no truncation)
2. Display all metadata fields
3. Provide close/back button
4. Handle modal or side panel UX pattern

---

## Task Statistics

- **Total Tasks**: 45
- **Setup Tasks**: 3 (Phase 1)
- **Foundational Tasks**: 6 (Phase 2)
- **User Story 2 Tasks**: 6 (Phase 3)
- **User Story 1 Tasks**: 13 (Phase 4)
- **User Story 3 Tasks**: 7 (Phase 5)
- **Polish Tasks**: 10 (Phase 6)
- **Parallelizable Tasks**: 18 (marked with [P])

## Estimated Effort

- **Phase 1-2**: 2-3 hours (setup + foundation)
- **Phase 3**: 2-3 hours (access control)
- **Phase 4**: 4-6 hours (main dashboard)
- **Phase 5**: 2-3 hours (detail view)
- **Phase 6**: 2-3 hours (polish)

**Total Estimated Effort**: 12-18 hours

**MVP Delivery** (Phases 1-4): 8-12 hours
