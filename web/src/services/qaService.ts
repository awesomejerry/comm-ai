import type { Question } from '../models/question';
import type { AudioAnswer, AnswerRating } from '../models/audioAnswer';

// ============================================================================
// API Response Types
// ============================================================================

interface QuestionResponse {
  id: string;
  text: string;
  order: number;
  context?: string | null;
  evaluationId: string;
  createdAt: string;
}

interface QuestionListResponse {
  questions: QuestionResponse[];
  metadata: {
    evaluationId: string;
    questionCount: number;
    generatedBy: 'llm' | 'fallback';
    generatedAt: string;
  };
}

interface RateAnswerResponse {
  id: string;
  created_at: string;
  questionId: string;
  score: number | string;
  feedback: string;
  text?: string | null;
}

interface ErrorResponse {
  error: {
    code: string;
    message: string;
    timestamp: string;
  };
}

// ============================================================================
// Service Configuration
// ============================================================================

const N8N_BASE_URL = import.meta.env.VITE_N8N_BASE_URL || 'https://n8n.awesomejerry.space';
const GENERATE_QUESTIONS_ENDPOINT = '/webhook/comm-ai/generate-questions';
const RATE_ANSWER_ENDPOINT = '/webhook/comm-ai/rate-answer';
// Mock mode for demo purposes
const MOCK_MODE = import.meta.env.VITE_MOCK_QA_API === 'true' || false;

// Retry configuration
const MAX_RETRIES = 3;
const RETRY_DELAY_MS = Number(import.meta.env.VITE_QA_RETRY_DELAY_MS ?? 250);

// ============================================================================
// Mock Data for Demo
// ============================================================================

const MOCK_QUESTIONS: QuestionResponse[] = [
  {
    id: 'q1',
    text: 'Can you explain the main concept of your presentation in your own words?',
    order: 1,
    context: 'This question tests your understanding of the core topic.',
    evaluationId: 'demo',
    createdAt: new Date().toISOString(),
  },
  {
    id: 'q2',
    text: 'What challenges did you encounter while preparing this material?',
    order: 2,
    context: 'Reflect on your preparation process.',
    evaluationId: 'demo',
    createdAt: new Date().toISOString(),
  },
  {
    id: 'q3',
    text: 'How would you apply these concepts in a real-world scenario?',
    order: 3,
    context: 'Demonstrate practical application of the knowledge.',
    evaluationId: 'demo',
    createdAt: new Date().toISOString(),
  },
  {
    id: 'q4',
    text: 'What was the most important takeaway from your presentation?',
    order: 4,
    evaluationId: 'demo',
    createdAt: new Date().toISOString(),
  },
];

interface RatedAnswerResult {
  answerId: string;
  rating: AnswerRating;
}

const MOCK_SCORES = [75, 82, 88, 91, 85];
const MOCK_FEEDBACKS = [
  'Good explanation with clear examples. Try to be more concise.',
  'Excellent understanding demonstrated. Well structured answer.',
  'Strong response. Consider adding more real-world applications.',
  'Very thorough answer. Great use of technical terminology.',
  'Good effort. Could benefit from more specific details.',
];

const FALLBACK_QUESTIONS = [
  {
    text: 'What were the main points you presented and why were they important?',
    context: 'Summarize key ideas from your presentation.',
  },
  {
    text: 'Which parts of your delivery could be improved for clarity?',
    context: 'Reflect briefly on pacing, emphasis, or visuals.',
  },
  {
    text: 'What did the audience learn that they can apply immediately?',
    context: 'Tie your content back to specific, practical outcomes.',
  },
];

// ============================================================================
// Helper Functions
// ============================================================================

/**
 * Exponential backoff delay
 */
class InvalidQuestionResponseError extends Error {}

function getRetryDelay(attempt: number): number {
  return RETRY_DELAY_MS * Math.pow(2, attempt);
}

/**
 * Convert API question to internal Question type
 */
function convertToQuestion(apiQuestion: QuestionResponse): Question {
  return {
    id: apiQuestion.id,
    text: apiQuestion.text,
    order: apiQuestion.order,
    context: apiQuestion.context ?? undefined,
    evaluationId: apiQuestion.evaluationId,
    createdAt: new Date(apiQuestion.createdAt),
  };
}

function buildFallbackQuestions(evaluationId: string): Question[] {
  const timestamp = new Date();
  return FALLBACK_QUESTIONS.map((template, index) => ({
    id: `${evaluationId}-fallback-${index + 1}`,
    text: template.text,
    order: index + 1,
    context: template.context,
    evaluationId,
    createdAt: timestamp,
  }));
}

async function parseErrorMessage(response: Response): Promise<string> {
  if (typeof response.json === 'function') {
    try {
      const errorData = (await response.json()) as Partial<ErrorResponse>;
      const maybeMessage = errorData?.error?.message;
      if (maybeMessage) {
        return maybeMessage;
      }
    } catch (parseError) {
      console.warn('Failed to parse error response:', parseError);
    }
  }
  return `Request failed with status ${response.status}`;
}

/**
 * Fetch with retry logic
 */
async function fetchWithRetry(
  url: string,
  options: RequestInit,
  maxAttempts = MAX_RETRIES
): Promise<Response> {
  for (let attempt = 0; attempt < maxAttempts; attempt++) {
    try {
      const response = await fetch(url, options);

      // Return immediately on success, client error, or last attempt
      if (
        response.ok ||
        (response.status >= 400 && response.status < 500) ||
        attempt === maxAttempts - 1
      ) {
        return response;
      }

      // Retry on server error (5xx) or network error
      await new Promise((resolve) => setTimeout(resolve, getRetryDelay(attempt)));
    } catch (error) {
      if (attempt === maxAttempts - 1) {
        throw error;
      }
      await new Promise((resolve) => setTimeout(resolve, getRetryDelay(attempt)));
    }
  }

  throw new Error('Max retries exceeded');
}

// ============================================================================
// Public API Functions
// ============================================================================

/**
 * Generate questions for an evaluation
 *
 * @param evaluationId - UUID of the completed evaluation
 * @returns Array of generated questions
 * @throws Error if request fails after retries
 */
export async function generateQuestions(evaluationId: string): Promise<Question[]> {
  // MOCK MODE: Return mock questions for demo
  if (MOCK_MODE) {
    console.log('[MOCK] Generating questions for evaluation:', evaluationId);
    await new Promise((resolve) => setTimeout(resolve, 800)); // Simulate network delay

    // Return 3-4 questions randomly
    const questionCount = 3 + Math.floor(Math.random() * 2); // 3 or 4 questions
    const selectedQuestions = MOCK_QUESTIONS.slice(0, questionCount).map((q) => ({
      ...q,
      evaluationId,
    }));

    return selectedQuestions.map(convertToQuestion);
  }

  // REAL MODE: Call actual API
  const url = `${N8N_BASE_URL}${GENERATE_QUESTIONS_ENDPOINT}?evaluationId=${evaluationId}`;

  try {
    const response = await fetchWithRetry(url, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
      },
    });

    if (response.status === 404) {
      console.warn('Questions not found for evaluation, falling back to defaults.');
      return buildFallbackQuestions(evaluationId);
    }

    if (!response.ok) {
      if (response.status >= 500) {
        console.warn('Server error while generating questions, using fallback set.');
        return buildFallbackQuestions(evaluationId);
      }

      const message = await parseErrorMessage(response);
      throw new InvalidQuestionResponseError(message);
    }

    const data: QuestionListResponse = await response.json();

    if (!Array.isArray(data.questions)) {
      throw new InvalidQuestionResponseError('Invalid question payload');
    }

    if (data.questions.length < 3 || data.questions.length > 5) {
      throw new InvalidQuestionResponseError('Invalid question count');
    }

    return data.questions.map(convertToQuestion);
  } catch (error) {
    if (error instanceof InvalidQuestionResponseError) {
      throw error;
    }

    console.error('Error generating questions:', error);
    return buildFallbackQuestions(evaluationId);
  }
}

/**
 * Submit audio answer for rating
 *
 * @param answer - AudioAnswer to submit
 * @param evaluationId - UUID of the source evaluation
 * @returns Server-assigned answer ID
 * @throws Error if upload fails
 */
export async function submitAnswerForRating(
  answer: AudioAnswer,
  evaluationId: string
): Promise<RatedAnswerResult> {
  // MOCK MODE: Simulate submission for demo
  if (MOCK_MODE) {
    console.log('[MOCK] Submitting answer for rating:', answer.questionId);
    await new Promise((resolve) => setTimeout(resolve, 750)); // Simulate upload + processing delay

    const answerId = `answer-${Date.now()}-${Math.random().toString(36).slice(2, 11)}`;
    const index = Math.floor(Math.random() * MOCK_SCORES.length);

    const rating: AnswerRating = {
      score: MOCK_SCORES[index],
      feedback: MOCK_FEEDBACKS[index],
      ratedAt: new Date(),
    };

    console.log('[MOCK] Answer rated with score:', rating.score);
    return { answerId, rating };
  }

  // REAL MODE: Call actual API
  const url = `${N8N_BASE_URL}${RATE_ANSWER_ENDPOINT}`;

  try {
    // Create multipart form data
    const formData = new FormData();
    formData.append('questionId', answer.questionId);
    formData.append('evaluationId', evaluationId);
    formData.append('audioFile', answer.audioBlob, `answer.${answer.audioFormat}`);
    formData.append('audioFormat', answer.audioFormat);
    formData.append('duration', answer.duration.toString());

    const response = await fetchWithRetry(url, {
      method: 'POST',
      body: formData,
      // Don't set Content-Type - browser will set it with boundary for multipart
    });

    if (!response.ok) {
      const errorData: ErrorResponse = await response.json();
      throw new Error(errorData.error.message || 'Failed to submit answer');
    }

    const data: RateAnswerResponse = await response.json();

    const numericScore = Number(data.score);
    if (Number.isNaN(numericScore)) {
      throw new Error('Invalid score returned from rating service');
    }

    const rating: AnswerRating = {
      score: numericScore,
      feedback: data.feedback,
      ratedAt: new Date(data.created_at),
    };

    return {
      answerId: data.id,
      rating,
    };
  } catch (error) {
    console.error('Error submitting answer:', error);
    throw new Error(
      error instanceof Error ? error.message : 'Failed to submit answer. Please try again.'
    );
  }
}
