# Implementation Plan: Immersive Present Mode with Auto-Recording

**Branch**: `008-present-mode` | **Date**: 2025-11-04 | **Spec**: [spec.md](./spec.md)
**Input**: Feature specification from `/specs/008-present-mode/spec.md`

**Note**: This template is filled in by the `/speckit.plan` command. See `.specify/templates/commands/plan.md` for the execution workflow.

## Summary

Add immersive present mode to the existing presentation application. Users can switch from practice mode to present mode via a toggle button. Present mode displays slides in full-screen with minimal controls (exit button and slide counter), automatically starts recording audio with timestamp tracking for slide navigation, and automatically stops recording on exit. Recordings persist locally for 7 days with an upload interface to send to the existing evaluation API using a modified payload (includes `mode: "present"` field and timestamp data). Uses existing tech stack: TypeScript, React, Vite, Tailwind CSS, MediaRecorder API.

## Technical Context

**Language/Version**: TypeScript 5.x, Node.js (latest LTS)  
**Primary Dependencies**: React 18, Vite, Tailwind CSS, pdf.js, Jotai (state management), MediaRecorder API  
**Storage**: Browser local storage / IndexedDB for pending recordings (7-day retention)  
**Testing**: Vitest (unit), Playwright (e2e), contract tests for API integration  
**Target Platform**: Modern web browsers (Chrome, Firefox, Safari, Edge)  
**Project Type**: web (single-page application)  
**Performance Goals**: <1s mode switch, <100ms timestamp capture accuracy, <100ms UI responsiveness  
**Constraints**: Browser MediaRecorder API support, microphone permissions, 64 kbps audio bitrate, 3-hour max recording  
**Scale/Scope**: Single user session, local recordings, existing PDF presenter integration

## Constitution Check

_GATE: Must pass before Phase 0 research. Re-check after Phase 1 design._

- [x] **Test-First (NON-NEGOTIABLE)**: Plan includes strategy for failing tests written before implementation (unit tests for mode switching, timestamp tracking, recording persistence; e2e tests for full workflow)
- [x] **Precise Commit Messages**: Commits will follow `type: description` format (feat: add present mode toggle, test: add present mode e2e tests, etc.)
- [x] **Spec-Driven Development**: Feature follows spec → plan → tasks → implement workflow (currently in plan phase)
- [x] **Contract & Integration Safety**: External boundaries have contract tests (evaluation API payload with mode field, existing contract tests extended)
- [x] **Modular Design**: Design favors small modules with clear interfaces (PresentModeController, TimestampTracker, RecordingPersistence modules; extends existing RecordingController)

## Project Structure

### Documentation (this feature)

```text
specs/008-present-mode/
├── plan.md              # This file (/speckit.plan command output)
├── research.md          # Phase 0 output (/speckit.plan command)
├── data-model.md        # Phase 1 output (/speckit.plan command)
├── quickstart.md        # Phase 1 output (/speckit.plan command)
├── contracts/           # Phase 1 output (/speckit.plan command)
│   └── present-mode-evaluation-api.yaml
└── tasks.md             # Phase 2 output (/speckit.tasks command - NOT created by /speckit.plan)
```

### Source Code (repository root)

```text
web/
├── src/
│   ├── components/
│   │   ├── PresentModeToggle.tsx        # NEW: Mode switcher button
│   │   └── PresentModeView.tsx          # NEW: Full-screen present mode UI
│   ├── models/
│   │   └── presentMode.ts               # NEW: Present mode state types
│   ├── pages/
│   │   └── PresenterPage.full.tsx       # MODIFIED: Integrate present mode
│   ├── recording/
│   │   ├── recordingController.ts       # MODIFIED: Auto-start/stop for present mode
│   │   ├── timestampTracker.ts          # NEW: Slide navigation timestamp tracking
│   │   └── recordingPersistence.ts      # NEW: 7-day local storage management
│   └── services/
│       └── evaluationService.ts         # MODIFIED: Add mode field to payload
└── tests/
    ├── contract/
    │   └── present-mode-evaluation.spec.ts  # NEW: Verify API payload with mode field
    ├── e2e/
    │   └── present-mode.spec.ts         # NEW: Full present mode workflow
    └── unit/
        ├── components/
        │   ├── PresentModeToggle.spec.tsx
        │   └── PresentModeView.spec.tsx
        └── recording/
            ├── timestampTracker.spec.ts
            └── recordingPersistence.spec.ts
```

**Structure Decision**: Web application structure (Option 2 from template). This feature extends the existing `web/` directory with new components for present mode UI, new recording modules for timestamp tracking and persistence, and modifications to existing recording and upload services to support the present mode workflow.

## Complexity Tracking

> **Fill ONLY if Constitution Check has violations that must be justified**

No violations - all constitution checks pass.
