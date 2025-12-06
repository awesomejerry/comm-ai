# Implementation Plan: Q&A Learning Cards Page

**Branch**: `010-learning-cards-qa` | **Date**: 2025-12-06 | **Spec**: specs/010-learning-cards-qa/spec.md
**Input**: Feature specification from `/specs/[###-feature-name]/spec.md`

**Note**: This template is filled in by the `/speckit.plan` command. See `.specify/templates/commands/plan.md` for the execution workflow.

## Summary

Users can access a Q&A page with learning cards displaying questions first, allowing reveal of answers for self-checking. Technical approach uses React components with local storage for progress and n8n API for Q&A data retrieval.

## Technical Context

**Language/Version**: TypeScript 5.x  
**Primary Dependencies**: React 18, Vite, Tailwind CSS, Supabase JS client  
**Storage**: Browser local storage for user progress, n8n API for Q&A data  
**Testing**: Vitest for unit tests, Playwright for e2e  
**Target Platform**: Web browsers (desktop and mobile)
**Project Type**: Web application (frontend-only)  
**Performance Goals**: Page loads under 2 seconds, users complete 10 Q&As in under 5 minutes  
**Constraints**: Responsive design for desktop and mobile, no specific accessibility beyond basic  
**Scale/Scope**: 20-50 Q&As available, client-side persistence

## Constitution Check

_GATE: Must pass before Phase 0 research. Re-check after Phase 1 design._

- [x] **Test-First (NON-NEGOTIABLE)**: Plan includes strategy for failing tests written before implementation
- [x] **Precise Commit Messages**: Commits will follow `type: description` format
- [x] **Spec-Driven Development**: Feature follows spec → plan → tasks → implement workflow
- [x] **Contract & Integration Safety**: External boundaries have contract tests
- [x] **Modular Design**: Design favors small modules with clear interfaces

## Project Structure

### Documentation (this feature)

```text
specs/010-learning-cards-qa/
├── plan.md              # This file (/speckit.plan command output)
├── research.md          # Phase 0 output (/speckit.plan command)
├── data-model.md        # Phase 1 output (/speckit.plan command)
├── quickstart.md        # Phase 1 output (/speckit.plan command)
├── contracts/           # Phase 1 output (/speckit.plan command)
└── tasks.md             # Phase 2 output (/speckit.tasks command - NOT created by /speckit.plan)
```

### Source Code (repository root)

```text
web/
├── src/
│   ├── components/
│   ├── models/
│   ├── pages/
│   ├── recording/
│   ├── services/
│   ├── test/
│   └── types/
├── tests/
│   ├── contract/
│   ├── e2e/
│   ├── integration/
│   └── unit/
└── ...
```

**Structure Decision**: Selected frontend-only web application structure under web/ directory, leveraging existing project layout for components, pages, and services.

## Complexity Tracking

> **Fill ONLY if Constitution Check has violations that must be justified**

| Violation                  | Why Needed         | Simpler Alternative Rejected Because |
| -------------------------- | ------------------ | ------------------------------------ |
| [e.g., 4th project]        | [current need]     | [why 3 projects insufficient]        |
| [e.g., Repository pattern] | [specific problem] | [why direct DB access insufficient]  |
