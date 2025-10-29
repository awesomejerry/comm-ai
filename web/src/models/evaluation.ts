/**
 * Represents the result of an evaluation process containing input and output data.
 */
export interface EvaluationResult {
  id: string;
  created_at: string; // ISO 8601 datetime
  input: string | null; // SRT formatted transcript
  output: string | null; // AI generated text response
  startSlide: string | null; // Starting slide number
  endSlide: string | null; // Ending slide number
  audience: string | null; // Target audience (e.g., "team")
}
