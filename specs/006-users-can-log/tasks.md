---
description: "Task list for 'Users can log in through their email' (Supabase Auth)"
---

# Tasks: Users can log in through their email

**Input**: Design documents from `/specs/006-users-can-log/`
**Prerequisites**: plan.md (required), spec.md (required for user stories), research.md, data-model.md, contracts/

**Organization**: Tasks are grouped by user story to enable independent implementation and testing of each story.

## Format: `[ID] [P?] [Story] Description`

- **[P]**: Can run in parallel (different files, no dependencies)
- **[Story]**: Which user story this task belongs to (e.g., US1, US2)
- Include exact file paths in descriptions

---

## Phase 1: Setup (Shared Infrastructure)

**Purpose**: Project initialization and basic structure

- [x] T001 [P] Create/verify project structure in `web/` per plan.md
- [x] T002 [P] Install Supabase JS client, Vite, React, Tailwind CSS in `web/`
- [x] T003 [P] Configure environment variables for Supabase in `web/.env`

---

## Phase 2: Foundational (Blocking Prerequisites)

**Purpose**: Core infrastructure that MUST be complete before ANY user story can be implemented

- [x] T004 [P] Configure Supabase Auth for magic link in Supabase dashboard
- [x] T005 [P] Add Supabase client setup in `web/src/services/supabaseClient.ts`
- [x] T006 [P] Add base User model in `web/src/models/user.ts` (per data-model.md)
- [x] T007 [P] Add base auth API contract in `web/src/services/authApiContract.ts` (per contracts/auth-api.yaml)

# --- Integration of Authentication to Existing App ---

- [x] T007A [P] Integrate authentication state/context provider at app root in `web/src/App.tsx` (wrap with AuthProvider or equivalent, ensure App is used in `main.tsx`, and React Router is set up to render login and main app separately)
- [x] T007B [P] Ensure all protected routes/components check authentication state in `web/src/pages/` and `web/src/components/` (requires React Router for route-based protection)
- [x] T007C [P] Add logout functionality and UI in `web/src/components/` (e.g., `LogoutButton.tsx`)

**Checkpoint**: Foundation ready - user story implementation can now begin in parallel

---

## Phase 3: User Story 1 - Passwordless Email Login (Priority: P1) 🎯 MVP

**Goal**: User can log in with a magic link sent to their email (passwordless)

**Independent Test**: Enter a registered email, receive a login link, click the link, and verify access to the application.

### Tests for User Story 1 (Test-First)

- [x] T008 [P] [US1] Contract test: valid email triggers magic link (mock Supabase `/otp`)
- [x] T009 [P] [US1] Contract test: invalid/unregistered email returns generic message
- [x] T010 [P] [US1] E2E: User receives login link, clicks, is logged in (Playwright)
- [x] T011 [P] [US1] E2E: Expired/invalid link shows error (Playwright)
- [x] T012 [P] [US1] E2E: Rate limiting triggers error (Playwright)

### Implementation for User Story 1

- [x] T013 [P] [US1] Create login form UI in `web/src/components/LoginForm.tsx`
- [x] T014 [P] [US1] Implement email magic link request logic in `web/src/services/authService.ts`
- [x] T015 [P] [US1] Show generic message for all email delivery outcomes in `LoginForm.tsx` (UI must display: "Check your email for the login link. If you don't see it, check your spam folder or try again.", per FR-007)
- [x] T016 [P] [US1] Handle magic link redirect and session (Supabase handles automatically via AuthProvider)
- [x] T017 [P] [US1] Integrate Supabase session check in `web/src/services/authService.ts`
- [x] T018 [P] [US1] Add rate limiting feedback (generic error) in `LoginForm.tsx`

**Checkpoint**: User Story 1 should be fully functional and testable independently

---

## Phase 4: User Story 2 - Email Verification (Priority: P2)

**Goal**: New users must verify their email before gaining full access

**Independent Test**: Register a new account, receive a verification email, and confirm the account before login is allowed.

### Tests for User Story 2 (Test-First)

- [ ] T019 [P] [US2] Contract test: verification email sent on registration (mock Supabase)
- [ ] T020 [P] [US2] E2E: Unverified user blocked from login, prompted to verify (Playwright)
- [ ] T021 [P] [US2] E2E: Verified user can log in (Playwright)
- [ ] T022 [P] [US2] E2E: Expired/invalid verification link shows error (Playwright)

### Implementation for User Story 2

- [ ] T023 [P] [US2] Add email verification status to User model in `web/src/models/user.ts`
- [ ] T024 [P] [US2] Show prompt to verify email if unverified in `LoginForm.tsx`
- [ ] T025 [P] [US2] Block access for unverified users in `web/src/services/authService.ts`
- [ ] T026 [P] [US2] Handle verification email resend in `LoginForm.tsx`

**Checkpoint**: User Stories 1 AND 2 should both work independently

---

## Phase 5: User Story 3 - Re-login and Device Management (Priority: P3)

**Goal**: Returning user can request a new login link from any device; only the most recent link is valid.

**Independent Test**: Request multiple login links, verify only the latest works.

### Tests for User Story 3 (Test-First)

- [ ] T027 [P] [US3] Contract test: multiple login links, only latest valid (mock Supabase)
- [ ] T028 [P] [US3] E2E: User requests multiple links, only latest works (Playwright)
- [ ] T029 [P] [US3] E2E: Login from new device with valid link (Playwright)

### Implementation for User Story 3

- [ ] T030 [P] [US3] Invalidate previous login links on new request in `web/src/services/authService.ts`
- [ ] T031 [P] [US3] Allow login from new device with valid link (Supabase handles via AuthProvider)
- [ ] T032 [P] [US3] Ensure only latest login link is valid (Supabase config or logic)

**Checkpoint**: All user stories should now be independently functional

---

## Phase 6: Polish & Cross-Cutting Concerns

**Purpose**: Improvements that affect multiple user stories

- [ ] T033 [P] Update documentation in `/specs/006-users-can-log/quickstart.md` and `web/README.md`
- [ ] T034 [P] Code cleanup and refactoring in `web/src/`
- [ ] T035 [P] Security review and hardening for auth flows (include: TLS enforcement, session expiration, token invalidation, privacy review)
- [ ] T036 [P] Run quickstart.md validation steps

# Performance & Measurable Outcomes

- [ ] T037 [P] Add monitoring for login link delivery time (<1min) in `web/src/services/authService.ts`
- [ ] T038 [P] Add monitoring for verification email delivery time (<2min) in `web/src/services/authService.ts`
- [ ] T039 [P] Add test: block >0.1% login link requests due to rate limiting (simulate abuse in tests/e2e/)

# Security & Privacy (Clarified)

- [ ] T040 [P] Ensure all auth/session traffic uses TLS (document in `web/README.md`)
- [ ] T041 [P] Add session expiration and invalidation logic in `web/src/services/authService.ts`

# UI/UX (Clarified Generic Message)

- [ ] T042 [P] Specify and implement generic error/success message text in `web/src/components/LoginForm.tsx` (UI must display: "Check your email for the login link. If you don't see it, check your spam folder or try again.", per FR-007)

# Entity/Token Mapping (Clarified)

- [ ] T043 [P] Document in `web/src/services/authService.ts` how Supabase manages Login Link Token and Verification Token (reference data-model.md and spec.md Key Entities)
