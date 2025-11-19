import type { Question } from '../models/question';

interface QuestionChatBubbleProps {
  question: Question;
  showNumber?: boolean;
}

/**
 * QuestionChatBubble Component
 *
 * Displays an LLM-generated question as a left-aligned chat bubble
 */
export function QuestionChatBubble({ question, showNumber = true }: QuestionChatBubbleProps) {
  return (
    <div className="flex justify-start mb-4" role="article" aria-label="Question">
      <div className="max-w-[80%]">
        {/* Question bubble */}
        <div className="bg-blue-50 border border-blue-200 rounded-lg rounded-tl-none px-4 py-3 shadow-sm">
          {/* Question number and text */}
          <div className="flex items-start gap-2">
            {showNumber && (
              <span
                className="flex-shrink-0 w-6 h-6 rounded-full bg-blue-600 text-white text-xs font-semibold flex items-center justify-center mt-0.5"
                aria-label={`Question ${question.order}`}
              >
                {question.order}
              </span>
            )}
            <p className="text-gray-900 leading-relaxed">{question.text}</p>
          </div>

          {/* Optional context */}
          {question.context && (
            <div className="mt-2 pt-2 border-t border-blue-200">
              <p className="text-sm text-gray-600 italic">
                <span className="font-medium">Context:</span> {question.context}
              </p>
            </div>
          )}
        </div>

        {/* Timestamp */}
        <div className="mt-1 px-2">
          <span className="text-xs text-gray-400">
            {new Date(question.createdAt).toLocaleTimeString()}
          </span>
        </div>
      </div>
    </div>
  );
}
