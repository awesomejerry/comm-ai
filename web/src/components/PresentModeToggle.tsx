/**
 * PresentModeToggle
 *
 * Toggle button to switch between practice and present modes.
 * Disabled when recording is active to prevent mode changes during recording.
 */

import type { PresentationMode } from '../models/presentMode';

interface PresentModeToggleProps {
  mode: PresentationMode;
  onToggle: () => void;
  isRecording?: boolean;
}

export function PresentModeToggle({ mode, onToggle, isRecording = false }: PresentModeToggleProps) {
  const isPresentMode = mode === 'present';
  const label = isPresentMode ? 'Exit Present Mode' : 'Enter Present Mode';
  const ariaLabel = `Currently in ${mode} mode. Click to ${isPresentMode ? 'exit to practice' : 'enter present'} mode.${isRecording ? ' Disabled while recording.' : ''}`;

  return (
    <button
      onClick={onToggle}
      disabled={isRecording}
      aria-label={ariaLabel}
      aria-disabled={isRecording}
      className={`
        px-4 py-2 rounded-lg font-medium transition-all
        focus:outline-none focus:ring-2 focus:ring-offset-2
        ${
          isPresentMode
            ? 'bg-red-600 hover:bg-red-700 text-white focus:ring-red-500'
            : 'bg-blue-600 hover:bg-blue-700 text-white focus:ring-blue-500'
        }
        ${isRecording ? 'opacity-50 cursor-not-allowed' : 'hover:shadow-lg'}
        disabled:opacity-50 disabled:cursor-not-allowed
      `}
    >
      {isPresentMode ? (
        <span className="flex items-center gap-2">
          <svg
            className="w-5 h-5"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
            aria-hidden="true"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M6 18L18 6M6 6l12 12"
            />
          </svg>
          {label}
        </span>
      ) : (
        <span className="flex items-center gap-2">
          <svg
            className="w-5 h-5"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
            aria-hidden="true"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M14.752 11.168l-3.197-2.132A1 1 0 0010 9.87v4.263a1 1 0 001.555.832l3.197-2.132a1 1 0 000-1.664z"
            />
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
            />
          </svg>
          {label}
        </span>
      )}
    </button>
  );
}
