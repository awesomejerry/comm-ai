import React from 'react';
import { ChatBubble } from './ChatBubble';
import { parseSrtToText, isValidSrt } from '../services/srtParser';
import type { EvaluationResult } from '../models/evaluation';

interface EvaluationChatProps {
  evaluation: EvaluationResult;
  className?: string;
}

/**
 * EvaluationChat component for displaying evaluation results as a chat conversation.
 * Shows user input (transcript) and AI output in a chat bubble format.
 * Handles error states for missing or corrupted evaluation data.
 */
export const EvaluationChat: React.FC<EvaluationChatProps> = ({ evaluation, className = '' }) => {
  if (!evaluation.input || !evaluation.output) {
    return (
      <div
        className={`bg-red-50 rounded-lg p-4 border border-red-200 ${className}`}
        data-testid="evaluation-error"
      >
        <p className="text-red-700">Evaluation data is unavailable or corrupted.</p>
      </div>
    );
  }

  // Parse the input SRT to plain text
  const inputText = isValidSrt(evaluation.input)
    ? parseSrtToText(evaluation.input)
    : evaluation.input; // fallback if not SRT

  return (
    <div
      className={`bg-gray-50 rounded-lg p-4 border border-gray-200 ${className}`}
      data-testid="evaluation-chat"
    >
      <h4 className="text-sm font-medium text-gray-700 mb-3">Evaluation Chat</h4>
      <div className="space-y-2">
        <ChatBubble message={inputText} type="user" />
        <ChatBubble message={evaluation.output} type="ai" />
      </div>
    </div>
  );
};
