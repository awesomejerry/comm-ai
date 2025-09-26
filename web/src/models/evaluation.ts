/**
 * Represents the result of an evaluation process containing input and output data.
 */
export interface EvaluationResult {
  id: string;
  input: string; // SRT formatted transcript
  output: string; // AI generated text response
  timestamp?: Date;
}
