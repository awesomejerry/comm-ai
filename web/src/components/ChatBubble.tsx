import React from 'react';

export type MessageType = 'user' | 'ai';

interface ChatBubbleProps {
  message: string;
  type: MessageType;
  className?: string;
}

/**
 * ChatBubble component for displaying chat messages in a conversation interface.
 * Renders messages with distinct styling for user and AI messages.
 */
export const ChatBubble: React.FC<ChatBubbleProps> = ({ message, type, className = '' }) => {
  const isUser = type === 'user';

  return (
    <div className={`flex mb-4 ${isUser ? 'justify-start' : 'justify-end'} ${className}`}>
      <div
        className={`max-w-xs lg:max-w-md px-4 py-2 rounded-lg shadow-sm ${
          isUser
            ? 'bg-blue-500 text-white rounded-bl-none'
            : 'bg-green-500 text-white rounded-br-none'
        }`}
        data-testid={`${type}-message`}
      >
        <div className="flex items-center mb-1">
          {isUser ? (
            <svg className="w-4 h-4 mr-2" fill="currentColor" viewBox="0 0 20 20">
              <path
                fillRule="evenodd"
                d="M10 9a3 3 0 100-6 3 3 0 000 6zm-7 9a7 7 0 1114 0H3z"
                clipRule="evenodd"
              />
            </svg>
          ) : (
            <svg className="w-4 h-4 mr-2" fill="currentColor" viewBox="0 0 20 20">
              <path
                fillRule="evenodd"
                d="M3 4a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1zm0 4a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1zm0 4a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1z"
                clipRule="evenodd"
              />
            </svg>
          )}
          <span className="text-xs font-medium">{isUser ? 'You' : 'AI Assistant'}</span>
        </div>
        <p className="text-sm leading-relaxed">{message}</p>
      </div>
    </div>
  );
};
