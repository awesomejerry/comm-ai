# Research: Admin Evaluations Dashboard

**Feature**: 007-admin-evaluations-page
**Date**: 2025-10-28
**Status**: Complete

## Overview

This document consolidates research findings for implementing an admin-only dashboard that displays evaluation results from all users. The research covers n8n webhook integration, role-based access control patterns, pagination strategies, and error handling best practices.

## Decisions & Rationale

### Decision 1: n8n Webhook Integration Pattern

**Decision**: Use dedicated service modules (`adminRoleService.ts`, `evaluationService.ts`) to encapsulate n8n webhook calls.

**Rationale**:

- Separation of concerns: Services handle API communication, components handle UI
- Testability: Services can be easily mocked in component tests
- Reusability: Role checking and evaluation fetching can be used across multiple components
- Error handling: Centralized error handling and retry logic in service layer

**Alternatives Considered**:

- **Direct fetch calls in components**: Rejected because it couples components to API implementation and makes testing harder
- **Generic API service with config**: Rejected because these are simple GET endpoints that don't warrant a full abstraction layer

**Implementation Notes**:

```typescript
// adminRoleService.ts - Check if user is admin
export async function checkIsAdmin(email: string): Promise<boolean>;

// evaluationService.ts - Fetch evaluations
export async function fetchEvaluations(): Promise<N8nEvaluationResponse>;
// Returns: { results: EvaluationResult[] }
```

### Decision 2: Role-Based Access Control Implementation

**Decision**: Implement route-level protection with `AdminRoute` component wrapper that checks user role before rendering protected content.

**Rationale**:

- Security in depth: Route guard prevents unauthorized access at navigation level
- User experience: Immediate redirect for non-admin users, no flash of unauthorized content
- Consistency: Single source of truth for admin access logic
- Follows React patterns: Higher-order component pattern familiar to React developers

**Alternatives Considered**:

- **Page-level role check**: Rejected because it allows brief flash of unauthorized content during role verification
- **Server-side only**: Rejected because we're using client-side routing and n8n webhooks
- **Redux/Context-based permission**: Rejected as overkill for single admin role check

**Implementation Notes**:

```typescript
// AdminRoute.tsx - Wraps admin-only routes
<AdminRoute>
  <AdminDashboardPage />
</AdminRoute>

// Behavior:
// 1. Check if user is authenticated (from AuthContext)
// 2. Call GET /comm-ai/role with user email
// 3. If admin: render children
// 4. If not admin: redirect to unauthorized page
// 5. If error: show error state with retry
```

### Decision 3: Client-Side Sorting and Pagination

**Decision**: Implement client-side sorting and virtual scrolling since n8n webhook returns all results without pagination parameters.

**Rationale**:

- n8n API limitation: The webhook returns all results in a single `results` array without pagination support
- Performance: Virtual scrolling handles large datasets efficiently (up to 10,000 items)
- User experience: Immediate sort/filter without additional API calls
- Simplicity: Single API call loads all data, then client manages display

**Alternatives Considered**:

- **Server-side pagination**: Rejected because n8n webhook doesn't support limit/offset parameters
- **Multiple API calls**: Rejected as unnecessary complexity when webhook returns complete dataset
- **Traditional page buttons**: Rejected because virtual scrolling provides better UX

**Implementation Notes**:

```typescript
// Fetch all evaluations once
const response = await fetch("/comm-ai/evaluation");
const { results } = await response.json();

// Client-side sort by created_at
const sorted = results.sort(
  (a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
);

// Virtual scroller manages rendering
import { useVirtualizer } from "@tanstack/react-virtual";
```

### Decision 4: Error Handling & Retry Pattern

**Decision**: Implement exponential backoff retry with user-visible error messages and manual retry button.

**Rationale**:

- Resilience: Transient network errors don't require full page reload
- User control: Users can retry immediately or wait for auto-retry
- Transparency: Clear error messages explain what went wrong
- Best practice: Exponential backoff prevents overwhelming failing services

**Alternatives Considered**:

- **Automatic retry only (no user button)**: Rejected because users want immediate control
- **No auto-retry (manual only)**: Rejected because transient errors should self-heal
- **Redirect to error page**: Rejected because it's too disruptive for temporary issues

**Implementation Notes**:

```typescript
// Service layer implements retry logic
async function fetchWithRetry(url: string, maxRetries = 3) {
  for (let i = 0; i < maxRetries; i++) {
    try {
      return await fetch(url);
    } catch (error) {
      if (i === maxRetries - 1) throw error;
      await sleep(Math.pow(2, i) * 1000); // Exponential backoff
    }
  }
}

// Component shows error UI with retry button
<ErrorMessage
  message="Failed to load evaluations"
  onRetry={() => refetchEvaluations()}
/>;
```

### Decision 5: Content Truncation in List View

**Decision**: Truncate input/output content at 200 characters with "..." indicator in list view, full content in detail view.

**Rationale**:

- Performance: Reduces DOM size and rendering time for large lists
- Readability: Users can scan list quickly without scrolling through long content
- Progressive disclosure: Detail view provides full content when needed
- Industry standard: Common pattern in email clients, admin panels, etc.

**Alternatives Considered**:

- **Show full content always**: Rejected because it degrades performance and UX with large datasets
- **Show only metadata (no content preview)**: Rejected because users want to see content preview for quick scanning
- **Configurable truncation length**: Rejected as unnecessary complexity for MVP

**Implementation Notes**:

```typescript
// Utility function
export function truncateText(text: string, maxLength = 200): string {
  if (text.length <= maxLength) return text;
  return text.substring(0, maxLength) + "...";
}

// Use in EvaluationList component
<div className="text-sm text-gray-600">{truncateText(evaluation.input)}</div>;
```

### Decision 6: Default Sort Order

**Decision**: Sort evaluations by created_at descending (newest first) by default.

**Rationale**:

- User expectation: Admins typically want to see most recent activity first
- Monitoring use case: Recent evaluations are most relevant for system monitoring
- Consistency: Matches common patterns in admin dashboards and activity feeds
- Clarified in spec: Confirmed during clarification session
- Field name: n8n webhook uses `created_at` field for timestamps

**Alternatives Considered**: All rejected during clarification

- Oldest first: Less useful for monitoring
- Alphabetical: No user field in n8n response
- No default sort: Creates unpredictable UX

**Implementation Notes**:

```typescript
// Sort by created_at descending (newest first)
const sorted = evaluations.sort(
  (a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
);
```

### Decision 7: Malformed Data Handling

**Decision**: Display entries with placeholder text (e.g., "[Data unavailable]") for missing/corrupted fields while showing valid fields normally.

**Rationale**:

- Transparency: Admins can see that data exists but is malformed
- Debugging: Helps identify system issues
- Completeness: Maintains accurate count of evaluations
- Graceful degradation: System remains functional despite data issues
- Clarified in spec: Confirmed during clarification session

**Alternatives Considered**: All rejected during clarification

- Skip/hide malformed entries: Loses information about system health
- Show only valid fields: May confuse users about missing data
- Error indicator only: Doesn't show what data IS available

**Implementation Notes**:

```typescript
// Utility function for safe field access
export function getFieldOrPlaceholder(
  value: string | null | undefined,
  placeholder = "[Data unavailable]"
): string {
  return value ?? placeholder;
}

// Use in components
<div>{getFieldOrPlaceholder(evaluation.input)}</div>;
```

## Technology Best Practices

### React 18 Best Practices for Admin Dashboards

**Concurrent Rendering**:

- Use `useTransition` for non-urgent updates (sorting, filtering)
- Suspense boundaries for loading states
- Error boundaries for graceful error handling

**Performance Optimization**:

- Memoize expensive computations with `useMemo`
- Memoize callback functions with `useCallback`
- Virtual scrolling for large lists
- Lazy load detail view component

**State Management**:

- Use React Query or SWR for server state (evaluations data)
- Local state for UI concerns (selected item, sort order)
- Context for user/auth state (already implemented)

### TypeScript Patterns

**Type Safety for API Responses**:

```typescript
// Define response types matching n8n webhook contracts
interface N8nEvaluationResponse {
  evaluations: EvaluationResult[];
  total: number;
}

interface N8nRoleResponse {
  email: string;
  role: "user" | "admin";
}
```

**Error Types**:

```typescript
// Discriminated unions for error states
type FetchState<T> =
  | { status: "idle" }
  | { status: "loading" }
  | { status: "success"; data: T }
  | { status: "error"; error: Error };
```

### Testing Strategy

**Contract Tests**:

- Verify n8n webhook responses match expected schema
- Test both success and error responses
- Validate required fields and types

**E2E Tests**:

- Admin user can access dashboard
- Non-admin user redirected
- Unauthenticated user redirected to login
- Evaluation list displays correctly
- Detail view opens and closes
- Error states display with retry

**Unit Tests**:

- Service functions handle API calls correctly
- Components render different states (loading, error, success)
- Route guard logic works correctly
- Utility functions (truncate, placeholder) work correctly

## Open Questions Resolved

All questions from Technical Context have been resolved:

1. ✅ **n8n Webhook Integration**: Service layer pattern with dedicated modules
2. ✅ **Role Verification**: GET /comm-ai/role with email parameter
3. ✅ **Pagination Approach**: Virtual scrolling with offset-based batching
4. ✅ **Error Handling**: Exponential backoff + manual retry button
5. ✅ **Content Truncation**: 200 characters in list, full in detail
6. ✅ **Default Sort**: Newest first (timestamp descending)
7. ✅ **Malformed Data**: Display with placeholders for missing fields

## References

- React Virtual: https://tanstack.com/virtual/latest
- React Query: https://tanstack.com/query/latest
- Supabase Auth Context: Already implemented in feature 006
- n8n Webhook Documentation: (assumes standard REST GET endpoints)

## Next Steps

Proceed to Phase 1:

- Create `data-model.md` (entities and relationships)
- Create contract definitions in `contracts/` directory
- Create `quickstart.md` (developer setup guide)
- Update agent context files
