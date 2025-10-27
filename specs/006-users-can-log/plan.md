# Implementation Plan: Users can log in through their email

**Branch**: `006-users-can-log` | **Date**: 2025-10-11 | **Spec**: /specs/006-users-can-log/spec.md
**Input**: Feature specification from `/specs/006-users-can-log/spec.md`

**Note**: This template is filled in by the `/speckit.plan` command. See `.specify/templates/commands/plan.md` for the execution workflow.

## Summary

Enable passwordless authentication for end-users via email using Supabase's magic link (email OTP) feature. Users enter their email, receive a secure login link, and gain access by clicking it. The system uses Supabase Auth for email-based sign-in, with custom email templates and rate limiting for abuse prevention. No password or social login is supported. Only end-users are in scope.

## Technical Context

**Language/Version**: TypeScript 5.x, Node.js (latest LTS), React 18
**Primary Dependencies**: Supabase JS client, Supabase Auth, React, Vite, Tailwind CSS
**Storage**: Supabase Postgres (managed by Supabase)
**Testing**: Vitest, Playwright, Supabase test utilities (NEEDS CLARIFICATION: integration test approach for Supabase Auth)
**Target Platform**: Web (modern browsers)

### Source Code (repository root)

## Project Structure

```
web/
  src/
    components/
    models/
    pages/
    services/
    recording/
  tests/
    contract/
    e2e/
    integration/
    unit/
```

**Structure Decision**: Use the existing `web/` directory for all frontend code, with authentication logic in `web/src/services/` and UI in `web/src/components/`. Tests are organized under `web/tests/` by type. No backend code is required; all authentication is handled by Supabase Auth.
not include Option labels.
-->

ios/ or android/

## Complexity Tracking

_Fill ONLY if Constitution Check has violations that must be justified_

| Violation                  | Why Needed         | Simpler Alternative Rejected Because |
| -------------------------- | ------------------ | ------------------------------------ |
| [e.g., 4th project]        | [current need]     | [why 3 projects insufficient]        |
| [e.g., Repository pattern] | [specific problem] | [why direct DB access insufficient]  |
