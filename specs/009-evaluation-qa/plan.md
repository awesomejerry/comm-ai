# Implementation Plan: Post-Evaluation Q&A with Audio Responses

**Branch**: `009-evaluation-qa` | **Date**: 2025-11-10 | **Spec**: [spec.md](./spec.md)
**Input**: Feature specification from `/specs/009-evaluation-qa/spec.md`

**Note**: This template is filled in by the `/speckit.plan` command. See `.specify/templates/commands/plan.md` for the execution workflow.

## Summary

After completing an evaluation, users can proceed to a Q&A phase where they view LLM-generated questions (3-5 questions), record audio answers for each question, and receive numeric scores with text feedback. The UI presents questions as chat messages from the LLM and answers as user input in a chat interface. Audio submissions are sent to n8n, which now returns the rating payload (answer id, createdAt, score, feedback) in the same response so feedback appears immediately.

## Technical Context

**Language/Version**: TypeScript 5.x, Node.js (latest LTS)  
**Primary Dependencies**: React 18, Vite, Tailwind CSS, Jotai (state management), MediaRecorder API, Supabase JS client  
**Storage**: Browser IndexedDB for pending Q&A session state, recordings stored temporarily until submission  
**Testing**: Vitest (unit), Playwright (e2e), contract tests for n8n API integration  
**Target Platform**: Modern web browsers (Chrome, Firefox, Safari, Edge)  
**Project Type**: web (single-page application)  
**Performance Goals**: <2s question loading, <10s audio upload for 5-minute recordings, <30s rating response  
**Constraints**: Browser MediaRecorder API support, microphone permissions, WebM/MP4 audio formats, unlimited recording duration, 3-5 questions per session  
**Scale/Scope**: Single user session, synchronous rating display, chat-based UI, n8n webhook integration for /comm-ai/generate-questions and /comm-ai/rate-answer

## Constitution Check

_GATE: Must pass before Phase 0 research. Re-check after Phase 1 design._

- [x] **Test-First (NON-NEGOTIABLE)**: Plan includes strategy for failing tests written before implementation (unit tests for chat rendering, audio recording, async rating display; e2e tests for full Q&A workflow; contract tests for n8n API integration)
- [x] **Precise Commit Messages**: Commits will follow `type: description` format (feat: add Q&A chat interface, test: add n8n API contract tests, etc.)
- [x] **Spec-Driven Development**: Feature follows spec → plan → tasks → implement workflow (currently in plan phase after spec and clarification)
- [x] **Contract & Integration Safety**: External boundaries have contract tests (n8n /comm-ai/generate-questions and /comm-ai/rate-answer endpoints with contract tests)
- [x] **Modular Design**: Design favors small modules with clear interfaces (QASessionController, ChatRenderer, AudioAnswerRecorder, AsyncRatingDisplay modules; reuses existing RecordingController)

## Project Structure

### Documentation (this feature)

```text
specs/009-evaluation-qa/
├── plan.md              # This file (/speckit.plan command output)
├── research.md          # Phase 0 output (/speckit.plan command)
├── data-model.md        # Phase 1 output (/speckit.plan command)
├── quickstart.md        # Phase 1 output (/speckit.plan command)
├── contracts/           # Phase 1 output (/speckit.plan command)
│   ├── generate-questions-api.yaml
│   └── rate-answer-api.yaml
└── tasks.md             # Phase 2 output (/speckit.tasks command - NOT created by /speckit.plan)
```

### Source Code (repository root)

```text
web/
├── src/
│   ├── components/
│   │   ├── QAPhaseEntry.tsx            # NEW: Button to enter Q&A phase (integrated into EvaluationChat)
│   │   ├── EvaluationChat.tsx          # MODIFIED: Added QAPhaseEntry button at bottom of evaluation results
│   │   ├── QAChatInterface.tsx         # NEW: Chat UI for questions and answers
│   │   ├── QuestionChatBubble.tsx      # NEW: Display LLM question as chat message
│   │   ├── AnswerChatBubble.tsx        # NEW: Display user audio answer with playback
│   │   ├── AudioAnswerRecorder.tsx     # NEW: Audio recording controls for answers (reuses RecordingController)
│   │   ├── RatingDisplay.tsx           # NEW: Show numeric score + text feedback in chat
│   │   └── QAProgressTracker.tsx       # NEW: Show which questions answered/pending
│   ├── models/
│   │   ├── qaSession.ts                # NEW: Q&A session state types
│   │   ├── question.ts                 # NEW: Question entity types
│   │   └── audioAnswer.ts              # NEW: Audio answer and rating types
│   ├── pages/
│   │   └── QAPage.tsx                  # NEW: Main Q&A phase page
│   ├── services/
│   │   ├── qaService.ts                # NEW: n8n API integration for questions and ratings
│   │   └── qaSessionStorage.ts         # NEW: IndexedDB persistence for Q&A session state
│   └── recording/
│       └── (reuse existing recording modules)
└── tests/
    ├── contract/
    │   ├── generate-questions-api.test.ts  # NEW: Contract test for question generation
    │   └── rate-answer-api.test.ts         # NEW: Contract test for answer rating
    ├── e2e/
    │   └── qa-phase.spec.ts                # NEW: End-to-end Q&A workflow
    └── unit/
        ├── QAChatInterface.test.tsx         # NEW: Chat UI unit tests
        ├── AudioAnswerRecorder.test.tsx     # NEW: Recording component tests
        └── qaService.test.ts                # NEW: Service layer tests
```

**Structure Decision**: Web application structure (Option 2) using existing web/ directory. All Q&A feature code lives in web/src with new components, models, services, and page. Reuses existing recording infrastructure from specs/008-present-mode. Tests follow existing pattern: contract/ for API boundaries, e2e/ for user workflows, unit/ for component logic.

## Complexity Tracking

> **Fill ONLY if Constitution Check has violations that must be justified**

| Violation                  | Why Needed         | Simpler Alternative Rejected Because |
| -------------------------- | ------------------ | ------------------------------------ |
| [e.g., 4th project]        | [current need]     | [why 3 projects insufficient]        |
| [e.g., Repository pattern] | [specific problem] | [why direct DB access insufficient]  |
