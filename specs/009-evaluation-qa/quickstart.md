# Quickstart: Post-Evaluation Q&A Feature

**Feature**: 009-evaluation-qa  
**Date**: 2025-11-10  
**For**: Developers implementing the Q&A feature

## Overview

This guide helps you implement the post-evaluation Q&A feature with chat-based UI, audio answer recording, and asynchronous rating display.

## Prerequisites

- Completed specs/008-present-mode (audio recording infrastructure)
- n8n server accessible at configured endpoint
- Microphone permissions handling implemented
- IndexedDB storage configured

## Quick Start

### 1. Set Up Environment

```bash
# Navigate to web directory
cd web/

# Install dependencies (if not already done)
npm install

# Verify existing dependencies are present:
# - react 18+
# - jotai (state management)
# - idb (IndexedDB wrapper)
# - react-router-dom (routing)
```

### 2. Create Data Models

**File: `web/src/models/qaSession.ts`**

```typescript
import { atom } from "jotai";

export type SessionStatus = "not-started" | "active" | "completed";
export type UploadStatus = "pending" | "uploading" | "uploaded" | "error";
export type AudioFormat = "webm" | "mp4";

export interface QASession {
  id: string;
  evaluationId: string;
  questions: Question[];
  answers: Map<string, AudioAnswer>;
  currentQuestionIndex: number;
  status: SessionStatus;
  createdAt: Date;
  updatedAt: Date;
}

export interface Question {
  id: string;
  text: string;
  order: number;
  context?: string;
  evaluationId: string;
  createdAt: Date;
}

export interface AudioAnswer {
  id: string;
  questionId: string;
  audioBlob: Blob;
  audioFormat: AudioFormat;
  duration: number;
  uploadStatus: UploadStatus;
  uploadUrl?: string;
  rating?: AnswerRating;
  submittedAt: Date;
  ratedAt?: Date;
}

export interface AnswerRating {
  score: number; // 0-100
  feedback: string; // max 300 chars
  ratedAt: Date;
}

// Jotai atoms
export const currentQASessionAtom = atom<QASession | null>(null);
export const questionsAtom = atom<Question[]>([]);
export const answersAtom = atom<Map<string, AudioAnswer>>(new Map());
export const currentQuestionIndexAtom = atom<number>(0);

// Derived atom: current question
export const currentQuestionAtom = atom((get) => {
  const questions = get(questionsAtom);
  const index = get(currentQuestionIndexAtom);
  return questions[index] || null;
});

// Derived atom: progress
export const progressAtom = atom((get) => {
  const questions = get(questionsAtom);
  const answers = get(answersAtom);
  return {
    answered: answers.size,
    total: questions.length,
  };
});
```

### 3. Create API Service

**File: `web/src/services/qaService.ts`**

```typescript
import { Question, AudioAnswer, AnswerRating } from "../models/qaSession";

const N8N_BASE_URL =
  import.meta.env.VITE_N8N_BASE_URL || "https://n8n.example.com";

export async function generateQuestions(
  evaluationId: string
): Promise<Question[]> {
  const response = await fetch(
    `${N8N_BASE_URL}/comm-ai/generate-questions?evaluationId=${evaluationId}`
  );

  if (!response.ok) {
    throw new Error(`Failed to generate questions: ${response.statusText}`);
  }

  const data = await response.json();
  return data.questions;
}

export async function submitAnswer(
  questionId: string,
  evaluationId: string,
  audioUrl: string,
  audioFormat: "webm" | "mp4",
  duration: number
): Promise<{ answerId: string; status: string }> {
  const response = await fetch(`${N8N_BASE_URL}/comm-ai/rate-answer`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      questionId,
      evaluationId,
      audioUrl,
      audioFormat,
      duration,
    }),
  });

  if (!response.ok) {
    throw new Error(`Failed to submit answer: ${response.statusText}`);
  }

  return response.json();
}

export async function getRating(
  answerId: string
): Promise<AnswerRating | null> {
  const response = await fetch(`${N8N_BASE_URL}/comm-ai/rating/${answerId}`);

  if (!response.ok) {
    if (response.status === 404) return null;
    throw new Error(`Failed to get rating: ${response.statusText}`);
  }

  const data = await response.json();

  if (data.status === "completed" && data.rating) {
    return {
      score: data.rating.score,
      feedback: data.rating.feedback,
      ratedAt: new Date(data.ratedAt),
    };
  }

  return null; // Still processing
}
```

### 4. Create Chat Components

**File: `web/src/components/QAChatInterface.tsx`**

```typescript
import React, { useEffect, useRef } from "react";
import { useAtom } from "jotai";
import {
  questionsAtom,
  answersAtom,
  currentQuestionIndexAtom,
} from "../models/qaSession";
import QuestionChatBubble from "./QuestionChatBubble";
import AnswerChatBubble from "./AnswerChatBubble";
import AudioAnswerRecorder from "./AudioAnswerRecorder";

export default function QAChatInterface() {
  const [questions] = useAtom(questionsAtom);
  const [answers] = useAtom(answersAtom);
  const [currentIndex] = useAtom(currentQuestionIndexAtom);
  const chatEndRef = useRef<HTMLDivElement>(null);

  // Auto-scroll to bottom when new messages appear
  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [questions.length, answers.size]);

  return (
    <div className="flex flex-col h-full">
      {/* Chat messages */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        {questions.slice(0, currentIndex + 1).map((question) => (
          <React.Fragment key={question.id}>
            {/* Question bubble */}
            <QuestionChatBubble question={question} />

            {/* Answer bubble (if exists) */}
            {answers.has(question.id) && (
              <AnswerChatBubble answer={answers.get(question.id)!} />
            )}
          </React.Fragment>
        ))}
        <div ref={chatEndRef} />
      </div>

      {/* Recording input area */}
      <div className="border-t p-4 bg-white">
        <AudioAnswerRecorder
          questionId={questions[currentIndex]?.id}
          disabled={
            !questions[currentIndex] || answers.has(questions[currentIndex]?.id)
          }
        />
      </div>
    </div>
  );
}
```

### 5. Create Q&A Page

**File: `web/src/pages/QAPage.tsx`**

```typescript
import React, { useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { useAtom } from "jotai";
import { currentQASessionAtom, questionsAtom } from "../models/qaSession";
import { generateQuestions } from "../services/qaService";
import QAChatInterface from "../components/QAChatInterface";
import QAProgressTracker from "../components/QAProgressTracker";

export default function QAPage() {
  const { evaluationId } = useParams<{ evaluationId: string }>();
  const navigate = useNavigate();
  const [session, setSession] = useAtom(currentQASessionAtom);
  const [questions, setQuestions] = useAtom(questionsAtom);
  const [loading, setLoading] = React.useState(true);
  const [error, setError] = React.useState<string | null>(null);

  useEffect(() => {
    if (!evaluationId) {
      navigate("/evaluations");
      return;
    }

    // Load or create Q&A session
    loadSession(evaluationId);
  }, [evaluationId]);

  async function loadSession(evalId: string) {
    try {
      setLoading(true);

      // Try to load existing session from IndexedDB first
      // (Implementation in qaSessionStorage.ts)

      // If no session exists, generate questions
      const generatedQuestions = await generateQuestions(evalId);
      setQuestions(generatedQuestions);

      // Create new session
      const newSession = {
        id: crypto.randomUUID(),
        evaluationId: evalId,
        questions: generatedQuestions,
        answers: new Map(),
        currentQuestionIndex: 0,
        status: "active" as const,
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      setSession(newSession);
      // Save to IndexedDB (implementation in qaSessionStorage.ts)
    } catch (err) {
      setError("Failed to load Q&A session. Please try again.");
      console.error(err);
    } finally {
      setLoading(false);
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-screen">
        Loading questions...
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex flex-col items-center justify-center h-screen">
        <p className="text-red-600 mb-4">{error}</p>
        <button
          onClick={() => navigate("/evaluations")}
          className="btn-primary"
        >
          Back to Evaluations
        </button>
      </div>
    );
  }

  return (
    <div className="flex flex-col h-screen">
      <header className="border-b p-4 bg-white">
        <h1 className="text-2xl font-bold">Q&A Session</h1>
        <QAProgressTracker />
      </header>

      <main className="flex-1 overflow-hidden">
        <QAChatInterface />
      </main>
    </div>
  );
}
```

### 6. Add Routing

**File: `web/src/App.tsx` (update)**

```typescript
import { Route } from "react-router-dom";
import QAPage from "./pages/QAPage";

// Add to existing routes:
<Route path="/qa/:evaluationId" element={<QAPage />} />;
```

### 7. Create Entry Point Component

**File: `web/src/components/QAPhaseEntry.tsx`**

```typescript
import { useNavigate } from "react-router-dom";

interface QAPhaseEntryProps {
  evaluationId: string;
  disabled?: boolean;
}

export function QAPhaseEntry({
  evaluationId,
  disabled = false,
}: QAPhaseEntryProps) {
  const navigate = useNavigate();

  const handleClick = () => {
    if (!disabled) {
      navigate(`/qa/${evaluationId}`);
    }
  };

  return (
    <button
      onClick={handleClick}
      disabled={disabled}
      className={`
        px-6 py-3 rounded-lg font-medium transition-colors
        ${
          disabled
            ? "bg-gray-300 text-gray-500 cursor-not-allowed"
            : "bg-blue-600 text-white hover:bg-blue-700 active:bg-blue-800"
        }
      `}
      aria-label="Start Q&A Phase"
    >
      Start Q&A Phase
    </button>
  );
}
```

**Integration: Add to `web/src/components/EvaluationChat.tsx`**

```typescript
import { QAPhaseEntry } from "./QAPhaseEntry";

// Add at the end of the evaluation results:
<div className="mt-4 pt-4 border-t border-gray-300">
  <p className="text-sm text-gray-600 mb-3">
    Ready for the next step? Practice answering questions about your
    presentation.
  </p>
  <QAPhaseEntry evaluationId={evaluation.id} />
</div>;
```

## Testing

### Unit Tests

```bash
# Run unit tests
npm test

# Watch mode
npm run test:watch

# Coverage
npm run test:coverage
```

**Example: `web/tests/unit/QAChatInterface.test.tsx`**

```typescript
import { render, screen } from "@testing-library/react";
import { Provider } from "jotai";
import QAChatInterface from "../../src/components/QAChatInterface";

test("renders questions and answers in chat format", () => {
  // Test implementation
});
```

### Contract Tests

**Example: `web/tests/contract/generate-questions-api.test.ts`**

```typescript
import { generateQuestions } from "../../src/services/qaService";

test("generates 3-5 questions for valid evaluation", async () => {
  const questions = await generateQuestions("test-eval-id");
  expect(questions.length).toBeGreaterThanOrEqual(3);
  expect(questions.length).toBeLessThanOrEqual(5);
});
```

### E2E Tests

```bash
# Run E2E tests
npm run playwright:test
```

**Example: `web/tests/e2e/qa-phase.spec.ts`**

```typescript
import { test, expect } from "@playwright/test";

test("complete Q&A workflow", async ({ page }) => {
  // 1. Navigate to completed evaluation
  // 2. Click "Start Q&A Session"
  // 3. Record answer for first question
  // 4. Submit and verify rating appears
  // 5. Navigate to next question
});
```

## Development Workflow

1. **Start dev server**: `npm run dev`
2. **Write failing test**: Create test in `tests/unit/`, `tests/contract/`, or `tests/e2e/`
3. **Implement feature**: Follow test-first approach
4. **Verify tests pass**: `npm test`
5. **Commit**: Use format `feat: add Q&A chat interface` or `test: add Q&A contract tests`

## Configuration

**Environment Variables** (`web/.env`):

```bash
VITE_N8N_BASE_URL=https://n8n.example.com
VITE_QA_MAX_RETRIES=3       # Max retries for failed uploads before surfacing error
```

## Common Issues

### Question Generation Fails

- Check n8n service availability
- Verify evaluationId is valid
- Falls back to generic questions (see FR-003)

### Audio Upload Fails

- Check file size < 50MB
- Verify format is webm or mp4
- Check network connectivity
- Retry logic handles transient failures

### Rating Never Appears

- Watch the devtools Network tab to confirm the POST `/comm-ai/rate-answer` call resolves (should finish <30s)
- Ensure the response payload includes `answer.id`, `score`, and `feedback`; missing data means n8n workflow failed
- Check n8n logs for long-running executions or workflow errors
- If the request hangs beyond 60 seconds, retry submission so the synchronous response can complete cleanly

## Next Steps

1. Review [data-model.md](./data-model.md) for detailed entity schemas
2. Review [contracts/](./contracts/) for API specifications
3. Read [research.md](./research.md) for design decisions
4. Run `/speckit.tasks` to generate implementation task breakdown

## Resources

- Existing chat component: `web/src/components/ChatBubble.tsx`
- Recording infrastructure: `specs/008-present-mode/`
- n8n API examples: `specs/007-admin-evaluations-page/contracts/`
- Jotai state management: https://jotai.org/
- MediaRecorder API: https://developer.mozilla.org/en-US/docs/Web/API/MediaRecorder
