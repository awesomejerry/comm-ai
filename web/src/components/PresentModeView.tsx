/**
 * PresentModeView
 *
 * Full-screen presentation view with minimal controls.
 * Displays slides with exit button, slide counter, and recording indicator.
 */

import { useEffect } from 'react';

interface PresentModeViewProps {
  currentSlide: number;
  totalSlides: number;
  isRecording: boolean;
  onExit: () => void;
  children: React.ReactNode;
}

export function PresentModeView({
  currentSlide,
  totalSlides,
  isRecording,
  onExit,
  children,
}: PresentModeViewProps) {
  // Handle Escape key to exit
  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        onExit();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [onExit]);

  return (
    <div
      className="fixed inset-0 w-screen h-screen bg-black z-50 flex flex-col"
      data-testid="present-mode-view"
      role="application"
      aria-label="Present mode - Full screen presentation"
      tabIndex={0}
    >
      {/* Top bar with minimal controls */}
      <div className="absolute top-0 left-0 right-0 z-10 flex items-center justify-between p-4 bg-gradient-to-b from-black/50 to-transparent">
        {/* Recording indicator */}
        {isRecording && (
          <div
            className="flex items-center gap-2 text-white bg-red-600 px-3 py-1.5 rounded-full"
            role="status"
            aria-live="polite"
            aria-label="Recording in progress"
          >
            <span className="w-2 h-2 bg-white rounded-full animate-pulse" aria-hidden="true"></span>
            <span className="text-sm font-medium">Recording</span>
          </div>
        )}
        {!isRecording && <div></div>}

        {/* Exit button */}
        <button
          onClick={onExit}
          aria-label="Exit present mode and return to practice mode"
          className="flex items-center gap-2 bg-white/10 hover:bg-white/20 text-white px-4 py-2 rounded-lg backdrop-blur-sm transition-colors focus:outline-none focus:ring-2 focus:ring-white/50"
        >
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
          Exit
        </button>
      </div>

      {/* Slide content - full screen */}
      <div className="flex-1 flex items-center justify-center overflow-hidden w-full h-full">
        {children}
      </div>

      {/* Bottom bar with slide counter */}
      <div className="absolute bottom-0 left-0 right-0 z-10 flex items-center justify-center p-4 bg-gradient-to-t from-black/50 to-transparent">
        <div
          className="text-white bg-black/30 px-4 py-2 rounded-lg backdrop-blur-sm"
          role="status"
          aria-live="polite"
          aria-label={`Slide ${currentSlide} of ${totalSlides}`}
        >
          <span className="text-sm font-medium">
            {currentSlide} / {totalSlides}
          </span>
        </div>
      </div>
    </div>
  );
}
