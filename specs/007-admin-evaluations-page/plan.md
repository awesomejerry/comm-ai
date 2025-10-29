# Implementation Plan: Admin Evaluations Dashboard

**Branch**: `007-admin-evaluations-page` | **Date**: 2025-10-28 | **Spec**: /specs/007-admin-evaluations-page/spec.md
**Input**: Feature specification from `/specs/007-admin-evaluations-page/spec.md`

**Note**: This template is filled in by the `/speckit.plan` command. See `.specify/templates/commands/plan.md` for the execution workflow.

## Summary

Create an admin-only dashboard page that displays all evaluation results from all users. The page is access-controlled, showing only to users with admin role. Administrators can view evaluation lists (sorted by newest first with client-side sorting), see detailed evaluation information including slide ranges and audience, and navigate through results using virtual scrolling. The system uses n8n webhooks to retrieve evaluation data (GET /comm-ai/evaluation returns `{ results: [...] }`) and verify admin role (GET /comm-ai/role returns `{ role: "admin" }`). The UI handles loading states, error states with retry, and gracefully displays malformed data with placeholders.

## Technical Context

**Language/Version**: TypeScript 5.x, Node.js (latest LTS), React 18
**Primary Dependencies**: React, Vite, Tailwind CSS, Supabase JS client (for auth context)
**Storage**: N/A (data retrieved via n8n webhooks)
**Testing**: Vitest (unit), Playwright (e2e), contract tests for n8n webhooks
**Target Platform**: Web (modern browsers)
**Project Type**: Web application (frontend-only, existing web/ directory)
**Performance Goals**: Load all evaluation results in <3 seconds, authorization checks <500ms
**Constraints**: Support up to 10,000 evaluation results with client-side virtual scrolling (n8n returns all results in single response)
**Scale/Scope**: Single admin dashboard page with 3 user stories, integrate with existing auth system

## Constitution Check

_GATE: Must pass before Phase 0 research. Re-check after Phase 1 design._

- [x] **Test-First (NON-NEGOTIABLE)**: Plan includes strategy for failing tests written before implementation
  - Contract tests for n8n webhooks (GET /comm-ai/evaluation, GET /comm-ai/role)
  - E2E tests for access control (admin can access, non-admin denied)
  - Unit tests for admin dashboard components, error handling, pagination logic
- [x] **Precise Commit Messages**: Commits will follow `type: description` format
- [x] **Spec-Driven Development**: Feature follows spec → plan → tasks → implement workflow
- [x] **Contract & Integration Safety**: External boundaries have contract tests
  - n8n webhook contract tests for evaluation retrieval and role verification
- [x] **Modular Design**: Design favors small modules with clear interfaces
  - AdminDashboard page component
  - EvaluationList component (list view with pagination)
  - EvaluationDetail component (detail view)
  - adminRoleService (role verification)
  - evaluationService (data retrieval)
  - Route guard component for admin-only access

## Project Structure

### Documentation (this feature)

```text
specs/007-admin-evaluations-page/
├── plan.md              # This file (/speckit.plan command output)
├── research.md          # Phase 0 output (/speckit.plan command)
├── data-model.md        # Phase 1 output (/speckit.plan command)
├── quickstart.md        # Phase 1 output (/speckit.plan command)
├── contracts/           # Phase 1 output (/speckit.plan command)
│   ├── n8n-evaluation-api.yaml
│   └── n8n-role-api.yaml
└── tasks.md             # Phase 2 output (/speckit.tasks command - NOT created by /speckit.plan)
```

### Source Code (repository root)

```text
web/
├── src/
│   ├── components/
│   │   ├── AdminRoute.tsx              # Route guard for admin-only pages
│   │   ├── EvaluationList.tsx          # List view with pagination
│   │   ├── EvaluationDetail.tsx        # Detail view modal/panel
│   │   └── __tests__/
│   │       ├── AdminRoute.test.tsx
│   │       ├── EvaluationList.test.tsx
│   │       └── EvaluationDetail.test.tsx
│   ├── models/
│   │   ├── user.ts                     # Update to include 'admin' role
│   │   ├── evaluation.ts               # Already exists
│   │   └── __tests__/
│   ├── pages/
│   │   ├── AdminDashboardPage.tsx      # Main admin dashboard page
│   │   └── __tests__/
│   │       └── AdminDashboardPage.test.tsx
│   └── services/
│       ├── adminRoleService.ts         # Calls GET /comm-ai/role
│       ├── evaluationService.ts        # Calls GET /comm-ai/evaluation
│       └── __tests__/
│           ├── adminRoleService.test.tsx
│           └── evaluationService.test.tsx
└── tests/
    ├── contract/
    │   ├── n8n-evaluation-api.spec.ts  # Contract test for evaluation webhook
    │   └── n8n-role-api.spec.ts        # Contract test for role webhook
    ├── e2e/
    │   └── admin-dashboard.spec.ts     # E2E test for admin access control
    ├── integration/
    └── unit/
```

**Structure Decision**: Use the existing `web/` directory structure. Add new admin dashboard page under `pages/`, new components for list/detail views under `components/`, and new services for n8n webhook integration under `services/`. Extend the existing User model to support 'admin' role. All tests follow the existing pattern with contract, e2e, and unit test directories.

## Complexity Tracking

> **Fill ONLY if Constitution Check has violations that must be justified**

No violations - all constitution principles are followed:

- Test-first approach planned with contract, E2E, and unit tests
- Modular design with separate services, components, and pages
- External boundaries covered by n8n webhook contract tests
- Spec-driven development workflow followed

---

## Phase 0: Research (COMPLETE)

**Status**: ✅ Complete

**Artifacts Generated**:

- `research.md` - All technical decisions documented with rationale

**Key Decisions**:

1. n8n webhook integration via dedicated service modules
2. AdminRoute component for role-based access control
3. Virtual scrolling with offset-based pagination
4. Exponential backoff retry with manual retry button
5. Content truncation at 200 characters in list view
6. Default sort: newest first (timestamp descending)
7. Malformed data displayed with placeholders

**No NEEDS CLARIFICATION items remaining** - all unknowns resolved.

---

## Phase 1: Design & Contracts (COMPLETE)

**Status**: ✅ Complete

**Artifacts Generated**:

- `data-model.md` - Entity definitions, relationships, validation rules
- `contracts/n8n-evaluation-api.yaml` - OpenAPI contract for evaluation webhook
- `contracts/n8n-role-api.yaml` - OpenAPI contract for role webhook
- `quickstart.md` - Developer setup and testing guide
- `.github/copilot-instructions.md` - Updated with new technologies

**Key Entities**:

1. **User** (extended) - Added 'admin' role support
2. **EvaluationResult** (extended) - Updated to match n8n response: id, created_at, input, output, startSlide, endSlide, audience
3. **AdminDashboardState** (new) - UI state model
4. **N8nEvaluationResponse** (new) - API response model: `{ results: EvaluationResult[] }`
5. **N8nRoleResponse** (new) - API response model: `{ role: 'user' | 'admin' }`

**API Contracts**:

1. GET /comm-ai/evaluation - Fetch all evaluations (returns `{ results: [...] }`)
2. GET /comm-ai/role?email=xxx - Verify user role (returns `{ role: "admin" }`)

**Agent Context**: Updated copilot-instructions.md with:

- TypeScript 5.x, Node.js, React 18
- React, Vite, Tailwind CSS, Supabase JS client
- n8n webhooks as data source

---

## Constitution Re-Check (Post-Design)

_Re-evaluation after Phase 1 design completion_

- [x] **Test-First (NON-NEGOTIABLE)**: ✅ PASS

  - Contract tests defined for both n8n webhooks
  - E2E test scenarios identified (access control, list view, detail view)
  - Unit test targets identified (services, components, utilities)
  - All tests to be written before implementation

- [x] **Precise Commit Messages**: ✅ PASS

  - Examples provided in quickstart.md
  - Format: `type: description` (feat:, fix:, test:, docs:, refactor:)

- [x] **Spec-Driven Development**: ✅ PASS

  - Followed: spec.md → clarify → plan.md → research.md → data-model.md → contracts/
  - Next: tasks.md → implementation

- [x] **Contract & Integration Safety**: ✅ PASS

  - OpenAPI contracts created for both n8n webhooks
  - Contract tests planned in web/tests/contract/
  - Service layer encapsulates external calls

- [x] **Modular Design**: ✅ PASS
  - Clear separation: services (API), components (UI), pages (routes)
  - Single responsibility: AdminRoute (access), EvaluationList (display), etc.
  - Well-defined interfaces in data-model.md

**Final Verdict**: ✅ All constitution principles satisfied

---

## Phase 2: Task Breakdown

**Status**: ⏳ Pending

**Next Command**: `/speckit.tasks`

This will generate `tasks.md` with granular implementation tasks organized by:

- Test writing (contract, E2E, unit)
- Component implementation
- Service implementation
- Integration and refinement

**Do not proceed to implementation until tasks.md is created and reviewed.**

---

## Summary

### Completed Artifacts

```
specs/007-admin-evaluations-page/
├── spec.md                           ✅ Feature specification
├── plan.md                           ✅ This file (implementation plan)
├── research.md                       ✅ Technical decisions & rationale
├── data-model.md                     ✅ Entity definitions & relationships
├── quickstart.md                     ✅ Developer setup guide
├── contracts/
│   ├── n8n-evaluation-api.yaml       ✅ Evaluation webhook contract
│   └── n8n-role-api.yaml             ✅ Role webhook contract
└── tasks.md                          ⏳ Pending /speckit.tasks command
```

### Technology Stack

- **Frontend**: TypeScript 5.x, React 18, Vite, Tailwind CSS
- **Auth**: Supabase Auth (existing from feature 006)
- **Data Source**: n8n webhooks (GET endpoints)
- **Testing**: Vitest (unit), Playwright (E2E), custom contract tests

### Key Integration Points

1. **Supabase Auth**: User authentication and email retrieval
2. **n8n Evaluation Webhook**: GET /comm-ai/evaluation (returns `{ results: [...] }` with all evaluations)
3. **n8n Role Webhook**: GET /comm-ai/role?email=xxx (returns `{ role: "admin" }` for admin verification)

### Performance Targets (from Success Criteria)

- Load all evaluation results in < 3 seconds (SC-001)
- Authorization checks in < 500ms (SC-005)
- Support up to 10,000 results with virtual scrolling (SC-004)

### Next Steps

1. Run `/speckit.tasks` to generate task breakdown
2. Review tasks.md and adjust if needed
3. Begin test-first implementation following tasks
4. Commit frequently with precise messages
