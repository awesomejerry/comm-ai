/**
 * Question
 * Represents an LLM-generated question based on evaluation performance
 */
export interface Question {
  /** Unique question identifier */
  id: string;

  /** Question content (max 500 characters) */
  text: string;

  /** Display order (1-5) */
  order: number;

  /** Optional context or hint for the question */
  context?: string;

  /** Links to source evaluation */
  evaluationId: string;

  /** Question generation timestamp */
  createdAt: Date;
}

/**
 * Validation: Check if question is valid
 */
export function validateQuestion(question: Question): string[] {
  const errors: string[] = [];

  // Validate text
  if (!question.text || question.text.trim().length === 0) {
    errors.push('Question text must not be empty');
  }

  if (question.text.length > 500) {
    errors.push('Question text must be 500 characters or less');
  }

  // Validate order
  if (question.order < 1 || question.order > 5) {
    errors.push('Question order must be between 1 and 5');
  }

  return errors;
}

/**
 * Check if questions have unique orders within a session
 */
export function validateQuestionOrders(questions: Question[]): string[] {
  const errors: string[] = [];
  const orders = questions.map((q) => q.order);
  const uniqueOrders = new Set(orders);

  if (orders.length !== uniqueOrders.size) {
    errors.push('Question orders must be unique within a session');
  }

  return errors;
}
