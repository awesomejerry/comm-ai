# Data Model: Admin Evaluations Dashboard

**Feature**: 007-admin-evaluations-page
**Date**: 2025-10-28
**Status**: Complete

## Overview

This document defines the data entities, their attributes, relationships, and validation rules for the admin evaluations dashboard feature. The model extends existing entities (User, EvaluationResult) and introduces new view models for the dashboard.

## Entities

### User (Extended)

**Description**: Represents an individual user of the system. Extended to support admin role distinction.

**Attributes**:

| Attribute          | Type              | Required | Validation                | Description                    |
| ------------------ | ----------------- | -------- | ------------------------- | ------------------------------ |
| id                 | string            | Yes      | Non-empty UUID            | Unique identifier              |
| email              | string            | Yes      | Valid email format        | User's email address           |
| created_at         | string            | Yes      | ISO 8601 datetime         | Account creation timestamp     |
| email_confirmed_at | string \| null    | No       | ISO 8601 datetime or null | Email verification timestamp   |
| last_sign_in_at    | string \| null    | No       | ISO 8601 datetime or null | Last login timestamp           |
| role               | 'user' \| 'admin' | Yes      | Must be 'user' or 'admin' | User's role for access control |

**Changes from Existing Model**:

```typescript
// BEFORE (from web/src/models/user.ts)
export interface User {
  id: string;
  email: string;
  created_at: string;
  email_confirmed_at?: string | null;
  last_sign_in_at?: string | null;
  role: "user"; // Fixed to 'user' only
}

// AFTER (updated for this feature)
export interface User {
  id: string;
  email: string;
  created_at: string;
  email_confirmed_at?: string | null;
  last_sign_in_at?: string | null;
  role: "user" | "admin"; // Now supports both roles
}
```

**Validation Rules**:

- `id`: Must be a valid UUID format
- `email`: Must match email regex pattern
- `role`: Must be exactly 'user' or 'admin' (no other values allowed)

**Relationships**:

- One User → Many EvaluationResults (user_id foreign key)

---

### EvaluationResult (Extended)

**Description**: Represents the result of an evaluation process containing input and output data. Extended to include slide range and audience information from n8n webhook.

**Attributes**:

| Attribute  | Type           | Required | Validation        | Description                      |
| ---------- | -------------- | -------- | ----------------- | -------------------------------- |
| id         | string         | Yes      | Non-empty UUID    | Unique evaluation identifier     |
| created_at | string         | Yes      | ISO 8601 datetime | Evaluation creation timestamp    |
| input      | string \| null | No       | String or null    | SRT formatted transcript         |
| output     | string \| null | No       | String or null    | AI generated evaluation response |
| startSlide | string \| null | No       | String or null    | Starting slide number            |
| endSlide   | string \| null | No       | String or null    | Ending slide number              |
| audience   | string \| null | No       | "team" or null    | Target audience for presentation |

**Changes from Existing Model**:

```typescript
// BEFORE (from web/src/models/evaluation.ts)
export interface EvaluationResult {
  id: string;
  input: string;
  output: string;
  timestamp?: Date;
}

// AFTER (updated for this feature to match n8n webhook response)
export interface EvaluationResult {
  id: string;
  created_at: string;
  input: string | null;
  output: string | null;
  startSlide: string | null;
  endSlide: string | null;
  audience: string | null;
}
```

**Note**: The n8n webhook returns evaluations without user association fields. User information must be tracked separately or evaluations are considered system-wide.

**Validation Rules**:

- `id`: Must be a valid UUID
- `created_at`: Must be valid ISO 8601 datetime string
- `input`: May be null if malformed (display as "[Data unavailable]")
- `output`: May be null if malformed (display as "[Data unavailable]")
- `startSlide`: Optional slide range start
- `endSlide`: Optional slide range end
- `audience`: Must be "team" or null if present

**Relationships**:

- Evaluations are retrieved as a collection without explicit user foreign keys in this view

---

### AdminDashboardState (New - UI State Model)

**Description**: Represents the current state of the admin dashboard view including filters, pagination, and loaded data.

**Attributes**:

| Attribute          | Type                     | Required | Default     | Description                                   |
| ------------------ | ------------------------ | -------- | ----------- | --------------------------------------------- |
| evaluations        | EvaluationResult[]       | Yes      | []          | Currently loaded evaluation results           |
| totalCount         | number                   | Yes      | 0           | Total number of evaluations available         |
| loading            | boolean                  | Yes      | false       | Whether data is currently loading             |
| error              | Error \| null            | Yes      | null        | Current error state if any                    |
| page               | number                   | Yes      | 0           | Current page/offset for pagination            |
| pageSize           | number                   | Yes      | 50          | Number of items per page                      |
| sortBy             | 'timestamp' \| 'user'    | Yes      | 'timestamp' | Sort field                                    |
| sortOrder          | 'asc' \| 'desc'          | Yes      | 'desc'      | Sort direction                                |
| selectedEvaluation | EvaluationResult \| null | Yes      | null        | Currently selected evaluation for detail view |

**TypeScript Definition**:

```typescript
export interface AdminDashboardState {
  evaluations: EvaluationResult[];
  totalCount: number;
  loading: boolean;
  error: Error | null;
  page: number;
  pageSize: number;
  sortBy: "timestamp" | "user";
  sortOrder: "asc" | "desc";
  selectedEvaluation: EvaluationResult | null;
}
```

**Validation Rules**:

- `page`: Must be >= 0
- `pageSize`: Must be > 0 (typically 25, 50, or 100)
- `sortBy`: Must be exactly 'created_at' or other sortable field
- `sortOrder`: Must be exactly 'asc' or 'desc'

**State Transitions**:

1. **Initial State**: All defaults, loading = false, error = null
2. **Loading State**: loading = true, error = null
3. **Success State**: loading = false, error = null, evaluations populated
4. **Error State**: loading = false, error = Error object
5. **Retry**: Transition from Error State back to Loading State

---

## API Response Models

### N8nEvaluationResponse (New)

**Description**: Response format from n8n webhook GET /comm-ai/evaluation

**Attributes**:

| Attribute | Type               | Required | Description                 |
| --------- | ------------------ | -------- | --------------------------- |
| results   | EvaluationResult[] | Yes      | Array of evaluation results |

**TypeScript Definition**:

```typescript
export interface N8nEvaluationResponse {
  results: EvaluationResult[];
}
```

**Example**:

```json
{
  "results": [
    {
      "id": "uuid-1",
      "created_at": "2025-10-28T10:00:00Z",
      "input": "00:00:01,000 --> 00:00:03,000\nHello world",
      "output": "Greeting detected",
      "startSlide": "1",
      "endSlide": "2",
      "audience": "team"
    }
  ]
}
```

---

### N8nRoleResponse (New)

**Description**: Response format from n8n webhook GET /comm-ai/role

**Attributes**:

| Attribute | Type              | Required | Description |
| --------- | ----------------- | -------- | ----------- |
| role      | 'user' \| 'admin' | Yes      | User's role |

**TypeScript Definition**:

```typescript
export interface N8nRoleResponse {
  role: "user" | "admin";
}
```

**Example**:

```json
{
  "role": "admin"
}
```

---

## Validation Rules Summary

### Input Validation

1. **Email Validation**:

   ```typescript
   const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
   function isValidEmail(email: string): boolean {
     return emailRegex.test(email);
   }
   ```

2. **UUID Validation**:

   ```typescript
   const uuidRegex =
     /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
   function isValidUUID(id: string): boolean {
     return uuidRegex.test(id);
   }
   ```

3. **Role Validation**:
   ```typescript
   function isValidRole(role: string): role is "user" | "admin" {
     return role === "user" || role === "admin";
   }
   ```

### Data Integrity Rules

1. **Malformed Data Handling**:

   - If `input` or `output` is missing/null, display as "[Data unavailable]"
   - Evaluation entry is still displayed in list
   - All other fields shown normally

2. **Deleted User Handling**:

   - Evaluation retains `user_id` and `user_email` even if user deleted
   - Display email as-is (may show as deleted user in UI)

3. **Pagination Bounds**:

   - `page * pageSize` should not exceed `totalCount`
   - If it does, show empty state or last valid page

4. **Sort Consistency**:
   - Default: `sortBy='timestamp', sortOrder='desc'` (newest first)
   - User can change to: `sortBy='user'` (alphabetical by email)
   - User can toggle `sortOrder` between 'asc' and 'desc'

---

## Relationships Diagram

```
┌─────────────────┐
│      User       │
│─────────────────│
│ id (PK)         │
│ email           │
│ role            │◄─────┐
│ ...             │      │
└─────────────────┘      │
                         │ user_id (FK)
                         │
                         │
┌─────────────────────┐  │
│  EvaluationResult   │  │
│─────────────────────│  │
│ id (PK)             │  │
│ input               │  │
│ output              │  │
│ timestamp           │  │
│ user_id             │──┘
│ user_email          │
└─────────────────────┘
        ▲
        │
        │ loads/displays
        │
┌─────────────────────────┐
│ AdminDashboardState     │
│─────────────────────────│
│ evaluations[]           │
│ selectedEvaluation      │
│ sortBy, sortOrder       │
│ page, pageSize          │
│ loading, error          │
└─────────────────────────┘
```

---

## State Lifecycle

### Loading Evaluations Flow

```
1. Initial Mount
   ↓
2. AdminDashboardState = { loading: true, error: null, ... }
   ↓
3. Call evaluationService.fetchEvaluations({ page, pageSize, sortBy, sortOrder })
   ↓
4a. SUCCESS → AdminDashboardState = {
     loading: false,
     evaluations: data.evaluations,
     totalCount: data.total
   }
   ↓
   Display list

4b. ERROR → AdminDashboardState = {
     loading: false,
     error: Error object
   }
   ↓
   Display error UI with retry button
```

### Role Verification Flow

```
1. User navigates to /admin/dashboard
   ↓
2. AdminRoute component mounts
   ↓
3. Check AuthContext for authenticated user
   ↓
4a. NOT AUTHENTICATED → Redirect to /login
   ↓
4b. AUTHENTICATED → Call adminRoleService.checkIsAdmin(user.email)
   ↓
5a. ROLE = 'admin' → Render AdminDashboardPage
   ↓
5b. ROLE = 'user' → Redirect to /unauthorized
   ↓
5c. ERROR → Display error state with retry
```

---

## Migration Notes

### Updating User Model

The `User` interface in `web/src/models/user.ts` needs to be updated to support the `'admin'` role:

**Change Required**:

```diff
  export interface User {
    id: string;
    email: string;
    created_at: string;
    email_confirmed_at?: string | null;
    last_sign_in_at?: string | null;
-   role: 'user';
+   role: 'user' | 'admin';
  }
```

**Impact**:

- Existing code that checks `user.role === 'user'` will continue to work
- New code can check `user.role === 'admin'`
- Type safety ensures only 'user' or 'admin' values are allowed

**Migration Strategy**:

- Update model first
- Update existing uses if any type errors arise
- Add new admin-specific logic

---

## Summary

**New Entities**:

- `AdminDashboardState` (UI state model)
- `N8nEvaluationResponse` (API response)
- `N8nRoleResponse` (API response)

**Modified Entities**:

- `User` (extended to support 'admin' role)

**Unchanged Entities**:

- `EvaluationResult` (no changes needed)

**Key Relationships**:

- User (1) → EvaluationResult (many)
- AdminDashboardState → EvaluationResult (display/selection)

**Validation Focus**:

- Role must be 'user' or 'admin' only
- Email format validation
- UUID format validation
- Pagination bounds checking
- Malformed data graceful handling
