# Research: Post-Evaluation Q&A with Audio Responses

**Feature**: 009-evaluation-qa  
**Date**: 2025-11-10  
**Status**: Complete

## Overview

This document consolidates research findings for implementing a post-evaluation Q&A feature with chat-based UI, audio answer recording, and synchronous rating display.

## Key Research Areas

### 1. Chat UI Patterns for Q&A

**Decision**: Use chat bubble pattern with LLM questions on left, user audio answers on right

**Rationale**:

- Familiar mental model from messaging apps (WhatsApp, iMessage, ChatGPT)
- Clear visual distinction between questions (system) and answers (user)
- Natural chronological flow from top to bottom
- Supports inline audio playback and rating display
- Existing ChatBubble.tsx component provides foundation

**Alternatives Considered**:

- Traditional form layout with question/answer pairs → Rejected: Less engaging, doesn't convey conversation flow
- Card-based grid layout → Rejected: Doesn't support sequential flow well
- Split-panel design (questions left, answers right) → Rejected: Reduces focus, harder on mobile

**Implementation Notes**:

- Reuse existing ChatBubble component architecture
- LLM questions: left-aligned, distinct color (blue/gray)
- User answers: right-aligned, distinct color (green/white)
- Rating displays inline below user answer bubble
- Auto-scroll to latest question/answer

### 2. Audio Recording in Chat Context

**Decision**: Inline recording controls within chat input area, similar to voice messaging apps

**Rationale**:

- Users familiar with voice message pattern from WhatsApp, Telegram
- Keeps recording UI contextual to current question
- Shows waveform/timer during recording
- Preview playback before sending
- Reuses existing RecordingController from present mode (spec 008)

**Alternatives Considered**:

- Modal dialog for recording → Rejected: Breaks chat flow, adds friction
- Separate recording page → Rejected: Loses question context
- Always-on microphone with push-to-talk → Rejected: Privacy concerns, accidental recordings

**Implementation Notes**:

- Record button in chat input area
- Expand to show waveform/timer during recording
- Stop button to finish recording
- Play/re-record options before submit
- Leverage MediaRecorder API (existing implementation)
- Support WebM and MP4/M4A formats (browser-native)

### 3. Rating Display

**Decision**: Inline rating display that waits for the POST response while showing an in-place loading indicator

**Rationale**:

- Users see the answer bubble remain in context while scoring completes on the server
- Spinner/"rating in progress" affordance communicates the synchronous wait
- Completed rating (id, createdAt, score, feedback) remains attached to the answer bubble
- Simplifies architecture by eliminating client-side polling/webhooks

**Alternatives Considered**:

- Separate ratings panel → Rejected: Loses context, requires navigation
- Notification/toast for rating → Rejected: Easy to miss, no persistent display
- Background webhook update → Rejected: Adds infra complexity for minimal gain

**Implementation Notes**:

- Submit shows immediate "sending..." state and temporarily disables re-submit
- Answer bubble shows spinner/skeleton until the POST resolves
- Update bubble in-place with returned score + feedback (id, createdAt, score, feedback)
- Persist rating state in IndexedDB once available
- Handle timeout/server errors by surfacing retry CTA in the same bubble

### 4. n8n API Integration Patterns

**Decision**: RESTful integration with evaluation ID for context, synchronous scoring responses returned in the POST body

**Rationale**:

- n8n webhooks support standard REST patterns and can block until scoring completes (sub-30s)
- Evaluation ID from previous phase provides context for question generation
- Single response avoids background timers and simplifies persistence logic
- Matches existing n8n integration patterns in spec 007 while removing extra endpoints

**Alternatives Considered**:

- WebSocket for real-time updates → Rejected: Adds complexity, n8n doesn't natively support
- Server-sent events → Rejected: Browser compatibility concerns, overkill for this use case
- Long polling → Rejected: More complex than simple polling, minimal benefit

**API Contracts**:

**GET /comm-ai/generate-questions**

- Query param: `evaluationId` (from completed evaluation)
- Returns: Array of 3-5 question objects
- Each question: `{ id, text, order, context? }`
- Error handling: Fallback to generic questions if LLM fails

**POST /comm-ai/rate-answer**

- Body: multipart form data `{ questionId, evaluationId, audioFile, audioFormat, duration }`
- Returns: `{ answer: { id, createdAt, score, feedback } }`
- Processing: Request blocks until rating is ready (target <30s)
- Error handling: Retry logic with exponential backoff on 5xx before surfacing error

### 5. Session State Persistence

**Decision**: IndexedDB for Q&A session state, temporary audio blobs until upload

**Rationale**:

- Browser refresh shouldn't lose progress (FR-018 requirement)
- IndexedDB supports structured data and binary blobs
- Already used in present mode (spec 008) for recording persistence
- Synchronous LocalStorage too limited for audio data

**Alternatives Considered**:

- LocalStorage → Rejected: Size limits, no binary blob support
- In-memory only → Rejected: Violates persistence requirement
- Server-side session → Rejected: Requires authentication, adds latency

**Schema**:

```typescript
QASession {
  id: string // evaluation ID
  evaluationId: string
  questions: Question[]
  answers: Map<questionId, AudioAnswer>
  currentQuestionIndex: number
  status: 'active' | 'completed'
  createdAt: Date
  updatedAt: Date
}

AudioAnswer {
  questionId: string
  audioBlob: Blob
  audioFormat: string
  duration: number
  uploadStatus: 'pending' | 'uploading' | 'uploaded' | 'error'
  rating?: { score: number, feedback: string }
  submittedAt: Date
}
```

### 6. Question Navigation and Progress Tracking

**Decision**: Linear flow with next/previous navigation, visual progress indicator

**Rationale**:

- Chat UI naturally supports linear, chronological flow
- Visual indicator shows completion status at glance
- Allows jumping back to review/re-record earlier answers
- Matches user story P4 requirements

**Implementation Notes**:

- Progress bar or indicator: "Question 2 of 5"
- Visual distinction for answered vs. unanswered questions
- Next/previous buttons or swipe gestures
- Auto-advance option after submission
- Scroll to question in chat on navigation

## Technology Decisions Summary

| Technology                  | Purpose             | Justification                     |
| --------------------------- | ------------------- | --------------------------------- |
| React 18 + TypeScript       | UI Framework        | Existing stack, type safety       |
| Jotai                       | State Management    | Lightweight, already in use       |
| MediaRecorder API           | Audio Recording     | Browser-native, no external deps  |
| IndexedDB (via idb library) | Session Persistence | Structured data + blobs support   |
| Tailwind CSS                | Styling             | Existing stack, rapid development |
| Vitest + Playwright         | Testing             | Existing test infrastructure      |
| n8n Webhooks                | Backend Integration | Existing integration pattern      |

## Risk Mitigation

1. **LLM Service Failure**: Fallback to generic questions (FR-003)
2. **Audio Upload Failure**: Retry logic with error messaging (FR-016)
3. **Rating Timeout**: Detect long-running POST (>30s), show inline timeout message, allow retry
4. **Browser Compatibility**: Graceful degradation, clear unsupported browser message
5. **Microphone Permissions**: Clear guidance when denied (FR-020)

## Performance Considerations

- Lazy load questions (only fetch when entering Q&A phase)
- Compress audio before upload (browser native compression)
- Surface upload/progress status while waiting for synchronous scoring response (spinner + message)
- Limit stored sessions to most recent 10 (cleanup old sessions)
- Virtual scrolling for long chat histories (if >20 messages)

## Accessibility Notes

- ARIA labels for audio recording controls
- Keyboard navigation for chat interface
- Screen reader announcements for rating updates
- High contrast mode support
- Focus management during recording

## References

- Existing chat UI: `web/src/components/ChatBubble.tsx`
- Recording infrastructure: specs/008-present-mode
- n8n API patterns: specs/007-admin-evaluations-page/contracts
- State management: Jotai atoms in `web/src/models/`
