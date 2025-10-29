# Quick Start: Admin Evaluations Dashboard

**Feature**: 007-admin-evaluations-page
**Date**: 2025-10-28

## Overview

This guide helps developers get started with implementing and testing the admin evaluations dashboard feature. It covers local development setup, running tests, and understanding the key components.

## Prerequisites

- Node.js (latest LTS) installed
- Access to the comm-ai repository
- Supabase project configured (from feature 006-users-can-log)
- n8n instance running with webhooks configured

## Initial Setup

### 1. Clone and Install Dependencies

```bash
# If not already cloned
git clone https://github.com/awesomejerry/comm-ai.git
cd comm-ai

# Checkout the feature branch
git checkout 007-admin-evaluations-page

# Install dependencies
cd web
npm install
```

### 2. Configure Environment Variables

Create or update `web/.env.local`:

```env
# Supabase (already configured from feature 006)
VITE_SUPABASE_URL=your_supabase_url
VITE_SUPABASE_ANON_KEY=your_supabase_anon_key

# n8n Webhooks (new for this feature)
VITE_N8N_BASE_URL=https://your-n8n-instance.com
VITE_N8N_EVALUATION_ENDPOINT=/comm-ai/evaluation
VITE_N8N_ROLE_ENDPOINT=/comm-ai/role
```

### 3. Configure n8n Webhooks

Ensure your n8n instance has the following webhooks configured:

**GET /comm-ai/evaluation**

- Returns: `{ results: EvaluationResult[] }`
- No query parameters required (returns all results)
- See: `contracts/n8n-evaluation-api.yaml` for full contract

**GET /comm-ai/role**

- Returns: `{ role: 'user' | 'admin' }`
- Accepts query param: `email` (user's email address)
- See: `contracts/n8n-role-api.yaml` for full contract

## Development Workflow

### 1. Run Development Server

```bash
cd web
npm run dev
```

Application will be available at `http://localhost:5173`

### 2. Create Test Admin User

For local development, you'll need a test admin user. Update the n8n role webhook to return `"role": "admin"` for your test email:

```json
{
  "email": "admin@test.com",
  "role": "admin"
}
```

### 3. Access Admin Dashboard

1. Navigate to `http://localhost:5173`
2. Log in with your admin test email
3. Navigate to `/admin/dashboard` (or via UI navigation if added)
4. Verify admin role check works and dashboard loads

## Testing

### Run All Tests

```bash
cd web

# Unit tests
npm run test

# E2E tests
npm run test:e2e

# Contract tests (if implemented separately)
npm run test:contract
```

### Test-First Development Flow

Following the constitution's test-first principle:

```bash
# 1. Write a failing test
# Example: web/tests/e2e/admin-dashboard.spec.ts

# 2. Run the test (should fail)
npm run test:e2e -- admin-dashboard.spec.ts

# 3. Implement the feature
# Example: web/src/pages/AdminDashboardPage.tsx

# 4. Run the test again (should pass)
npm run test:e2e -- admin-dashboard.spec.ts

# 5. Commit with precise message
git add .
git commit -m "feat: add admin dashboard page with access control"
```

### Test Coverage Targets

- **Unit Tests**: Services, utilities, components
  - `web/src/services/__tests__/adminRoleService.test.ts`
  - `web/src/services/__tests__/evaluationService.test.ts`
  - `web/src/components/__tests__/EvaluationList.test.tsx`
- **Contract Tests**: n8n webhook compliance
  - `web/tests/contract/n8n-evaluation-api.spec.ts`
  - `web/tests/contract/n8n-role-api.spec.ts`
- **E2E Tests**: User flows
  - `web/tests/e2e/admin-dashboard.spec.ts`

## Key Components

### Services

**adminRoleService.ts** - Role verification

```typescript
import { checkIsAdmin } from "@/services/adminRoleService";

const isAdmin = await checkIsAdmin("user@example.com");
// Returns: boolean
```

**evaluationService.ts** - Fetch evaluations

```typescript
import { fetchEvaluations } from "@/services/evaluationService";

const data = await fetchEvaluations();
// Returns: { results: EvaluationResult[] }
// Client-side sorting and virtual scrolling handle display
```

### Components

**AdminRoute.tsx** - Route guard

```tsx
import { AdminRoute } from "@/components/AdminRoute";

<AdminRoute>
  <AdminDashboardPage />
</AdminRoute>;
```

**EvaluationList.tsx** - List view with pagination

```tsx
import { EvaluationList } from "@/components/EvaluationList";

<EvaluationList
  evaluations={evaluations}
  onSelect={handleSelect}
  loading={loading}
  error={error}
  onRetry={handleRetry}
/>;
```

**EvaluationDetail.tsx** - Detail view modal

```tsx
import { EvaluationDetail } from "@/components/EvaluationDetail";

<EvaluationDetail evaluation={selectedEvaluation} onClose={handleClose} />;
```

### Pages

**AdminDashboardPage.tsx** - Main dashboard

```tsx
import { AdminDashboardPage } from "@/pages/AdminDashboardPage";

// Wrapped in AdminRoute for access control
<Route
  path="/admin/dashboard"
  element={
    <AdminRoute>
      <AdminDashboardPage />
    </AdminRoute>
  }
/>;
```

## Common Development Tasks

### Add a New Sort Option

1. Update `data-model.md` to include new sort field
2. Update `n8n-evaluation-api.yaml` contract
3. Update `AdminDashboardState` type
4. Update `EvaluationList` component
5. Add tests for new sort option

### Modify Pagination Size

1. Update `pageSize` default in `AdminDashboardState`
2. Update component to use new default
3. Verify performance with new page size
4. Update tests if needed

### Handle New Error Types

1. Add error type to service
2. Update error handling in component
3. Add user-visible error message
4. Add test for new error scenario

## Debugging

### Enable Debug Logging

Add to services for detailed logging:

```typescript
const DEBUG = import.meta.env.DEV;

if (DEBUG) {
  console.log("Fetching evaluations:", options);
}
```

### Common Issues

**Issue**: Admin role check fails

- **Solution**: Verify n8n role webhook returns correct response
- **Check**: `GET /comm-ai/role?email=your@email.com`

**Issue**: Evaluations not loading

- **Solution**: Verify n8n evaluation webhook is accessible
- **Check**: Network tab in browser dev tools

**Issue**: Access denied even with admin role

- **Solution**: Check AuthContext has user data
- **Check**: React DevTools -> Context

## Performance Testing

### Test Large Datasets

```bash
# Generate test data in n8n or database
# Adjust n8n webhook to return large result set

# Test with 1,000 results
# Verify: Loads in < 3 seconds (SC-001)

# Test with 10,000 results
# Verify: Pagination/virtual scrolling maintains performance (SC-004)
```

### Test Authorization Performance

```bash
# Test role check speed
# Verify: Completes in < 500ms (SC-005)
```

## Commit Message Examples

Following the constitution's precise commit format:

```bash
# Feature additions
git commit -m "feat: add admin dashboard page component"
git commit -m "feat: implement role verification service"
git commit -m "feat: add evaluation list with pagination"

# Bug fixes
git commit -m "fix: handle null evaluation data gracefully"
git commit -m "fix: correct sort order for timestamp descending"

# Tests
git commit -m "test: add contract tests for n8n webhooks"
git commit -m "test: add e2e tests for admin access control"

# Documentation
git commit -m "docs: update quickstart with n8n setup"

# Refactoring
git commit -m "refactor: extract pagination logic to custom hook"
```

## Next Steps

1. **Review Specification**: Read `spec.md` for complete requirements
2. **Review Data Model**: Read `data-model.md` for entity definitions
3. **Review Contracts**: Check `contracts/*.yaml` for API expectations
4. **Write Failing Tests**: Start with contract tests, then E2E, then unit
5. **Implement Features**: Follow test-first workflow
6. **Commit Frequently**: Use precise commit messages

## Resources

- **Specification**: `specs/007-admin-evaluations-page/spec.md`
- **Data Model**: `specs/007-admin-evaluations-page/data-model.md`
- **Research**: `specs/007-admin-evaluations-page/research.md`
- **Plan**: `specs/007-admin-evaluations-page/plan.md` (this file's sibling)
- **Contracts**: `specs/007-admin-evaluations-page/contracts/`

## Support

For questions or issues:

1. Check existing documentation in `specs/` directory
2. Review constitution: `.specify/memory/constitution.md`
3. Check related features: `specs/006-users-can-log/` (auth system)

## Constitution Compliance Checklist

Before committing:

- [ ] Tests written before implementation (test-first)
- [ ] Commit message follows `type: description` format
- [ ] Contract tests cover external boundaries (n8n webhooks)
- [ ] Code is modular with clear interfaces
- [ ] All tests passing (unit, contract, e2e)
