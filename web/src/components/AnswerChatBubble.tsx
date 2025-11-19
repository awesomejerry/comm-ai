import React, { useState, useRef, useEffect } from 'react';
import { AudioAnswer } from '../models/audioAnswer';
import { RatingDisplay } from './RatingDisplay';

interface AnswerChatBubbleProps {
  /** Audio answer to display */
  answer: AudioAnswer;

  /** Whether to show the question number badge */
  showNumber?: boolean;

  /** Question order number (if showing) */
  questionOrder?: number;

  /** Callback when user submits answer for rating */
  onSubmit?: () => void;

  /** Whether submission is in progress */
  isSubmitting?: boolean;
}

export const AnswerChatBubble: React.FC<AnswerChatBubbleProps> = ({
  answer,
  showNumber = true,
  questionOrder,
  onSubmit,
  isSubmitting = false,
}) => {
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [audioUrl, setAudioUrl] = useState<string | null>(null);

  const audioRef = useRef<HTMLAudioElement | null>(null);

  // Create audio URL from blob
  useEffect(() => {
    const url = URL.createObjectURL(answer.audioBlob);
    setAudioUrl(url);

    return () => {
      URL.revokeObjectURL(url);
    };
  }, [answer.audioBlob]);

  // Initialize audio element
  useEffect(() => {
    if (audioUrl && audioRef.current) {
      audioRef.current.src = audioUrl;
    }
  }, [audioUrl]);

  // Handle audio time updates
  useEffect(() => {
    const audio = audioRef.current;
    if (!audio) return;

    const handleTimeUpdate = () => {
      setCurrentTime(audio.currentTime);
    };

    const handleEnded = () => {
      setIsPlaying(false);
      setCurrentTime(0);
    };

    audio.addEventListener('timeupdate', handleTimeUpdate);
    audio.addEventListener('ended', handleEnded);

    return () => {
      audio.removeEventListener('timeupdate', handleTimeUpdate);
      audio.removeEventListener('ended', handleEnded);
    };
  }, []);

  /**
   * Toggle play/pause
   */
  const handlePlayPause = async () => {
    const audio = audioRef.current;
    if (!audio) return;

    if (isPlaying) {
      audio.pause();
      setIsPlaying(false);
    } else {
      try {
        await audio.play();
        setIsPlaying(true);
      } catch (error) {
        console.error('Failed to play audio:', error);
      }
    }
  };

  /**
   * Seek to specific time
   */
  const handleSeek = (event: React.ChangeEvent<HTMLInputElement>) => {
    const audio = audioRef.current;
    if (!audio) return;

    const newTime = parseFloat(event.target.value);
    audio.currentTime = newTime;
    setCurrentTime(newTime);
  };

  /**
   * Format duration as MM:SS
   */
  const formatTime = (seconds: number): string => {
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  /**
   * Get upload status display
   */
  const getUploadStatusDisplay = () => {
    switch (answer.uploadStatus) {
      case 'pending':
        return (
          <span className="text-xs text-gray-500 flex items-center">
            <svg className="w-3 h-3 mr-1" fill="currentColor" viewBox="0 0 20 20">
              <path
                fillRule="evenodd"
                d="M10 18a8 8 0 100-16 8 8 0 000 16zm1-12a1 1 0 10-2 0v4a1 1 0 00.293.707l2.828 2.829a1 1 0 101.415-1.415L11 9.586V6z"
                clipRule="evenodd"
              />
            </svg>
            Not submitted
          </span>
        );
      case 'uploading':
        return (
          <span className="text-xs text-blue-600 flex items-center">
            <svg className="w-3 h-3 mr-1 animate-spin" fill="currentColor" viewBox="0 0 20 20">
              <path
                fillRule="evenodd"
                d="M4 2a1 1 0 011 1v2.101a7.002 7.002 0 0111.601 2.566 1 1 0 11-1.885.666A5.002 5.002 0 005.999 7H9a1 1 0 010 2H4a1 1 0 01-1-1V3a1 1 0 011-1zm.008 9.057a1 1 0 011.276.61A5.002 5.002 0 0014.001 13H11a1 1 0 110-2h5a1 1 0 011 1v5a1 1 0 11-2 0v-2.101a7.002 7.002 0 01-11.601-2.566 1 1 0 01.61-1.276z"
                clipRule="evenodd"
              />
            </svg>
            Uploading...
          </span>
        );
      case 'uploaded':
        return (
          <span className="text-xs text-green-600 flex items-center">
            <svg className="w-3 h-3 mr-1" fill="currentColor" viewBox="0 0 20 20">
              <path
                fillRule="evenodd"
                d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z"
                clipRule="evenodd"
              />
            </svg>
            Submitted
          </span>
        );
      case 'error':
        return (
          <span className="text-xs text-red-600 flex items-center">
            <svg className="w-3 h-3 mr-1" fill="currentColor" viewBox="0 0 20 20">
              <path
                fillRule="evenodd"
                d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z"
                clipRule="evenodd"
              />
            </svg>
            Upload failed
          </span>
        );
    }
  };

  return (
    <div className="flex justify-end mb-4" role="article" aria-label="Answer">
      <div className="max-w-[80%] flex items-start gap-2">
        {/* Question number badge (optional) */}
        {showNumber && questionOrder !== undefined && (
          <div
            className="flex-shrink-0 w-7 h-7 rounded-full bg-green-600 text-white flex items-center justify-center text-sm font-semibold"
            aria-label={`Answer ${questionOrder}`}
          >
            {questionOrder}
          </div>
        )}

        {/* Answer content */}
        <div className="bg-green-50 border border-green-200 rounded-lg p-4 flex-1">
          {/* Audio player */}
          <div className="mb-2">
            <audio ref={audioRef} className="hidden" />

            {/* Play/pause button */}
            <div className="flex items-center gap-3">
              <button
                onClick={handlePlayPause}
                className="flex-shrink-0 w-10 h-10 rounded-full bg-green-600 hover:bg-green-700 active:bg-green-800 text-white flex items-center justify-center transition-colors"
                aria-label={isPlaying ? 'Pause' : 'Play'}
              >
                {isPlaying ? (
                  <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
                    <path
                      fillRule="evenodd"
                      d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zM7 8a1 1 0 012 0v4a1 1 0 11-2 0V8zm5-1a1 1 0 00-1 1v4a1 1 0 102 0V8a1 1 0 00-1-1z"
                      clipRule="evenodd"
                    />
                  </svg>
                ) : (
                  <svg className="w-5 h-5 ml-0.5" fill="currentColor" viewBox="0 0 20 20">
                    <path
                      fillRule="evenodd"
                      d="M10 18a8 8 0 100-16 8 8 0 000 16zM9.555 7.168A1 1 0 008 8v4a1 1 0 001.555.832l3-2a1 1 0 000-1.664l-3-2z"
                      clipRule="evenodd"
                    />
                  </svg>
                )}
              </button>

              {/* Time display */}
              <div className="flex-1 min-w-0">
                <input
                  type="range"
                  min="0"
                  max={answer.duration}
                  step="0.1"
                  value={currentTime}
                  onChange={handleSeek}
                  className="w-full h-2 bg-green-200 rounded-lg appearance-none cursor-pointer slider"
                  aria-label="Seek audio"
                />
                <div className="flex justify-between text-xs text-gray-600 mt-1">
                  <span>{formatTime(currentTime)}</span>
                  <span>{formatTime(answer.duration)}</span>
                </div>
              </div>
            </div>
          </div>

          {/* Upload status and actions */}
          <div className="flex items-center justify-between">
            {getUploadStatusDisplay()}

            {/* Timestamp */}
            <span className="text-xs text-gray-400">
              {answer.submittedAt.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
            </span>
          </div>

          {/* Submit button (only for pending status) */}
          {answer.uploadStatus === 'pending' && onSubmit && (
            <button
              onClick={onSubmit}
              disabled={isSubmitting}
              className="mt-3 w-full px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700 active:bg-green-800 disabled:bg-gray-300 disabled:cursor-not-allowed font-medium transition-colors flex items-center justify-center"
              aria-label="Submit answer for rating"
            >
              {isSubmitting ? (
                <>
                  <svg
                    className="w-4 h-4 mr-2 animate-spin"
                    fill="currentColor"
                    viewBox="0 0 20 20"
                  >
                    <path
                      fillRule="evenodd"
                      d="M4 2a1 1 0 011 1v2.101a7.002 7.002 0 0111.601 2.566 1 1 0 11-1.885.666A5.002 5.002 0 005.999 7H9a1 1 0 010 2H4a1 1 0 01-1-1V3a1 1 0 011-1zm.008 9.057a1 1 0 011.276.61A5.002 5.002 0 0014.001 13H11a1 1 0 110-2h5a1 1 0 011 1v5a1 1 0 11-2 0v-2.101a7.002 7.002 0 01-11.601-2.566 1 1 0 01.61-1.276z"
                      clipRule="evenodd"
                    />
                  </svg>
                  Submitting...
                </>
              ) : (
                <>
                  <svg className="w-4 h-4 mr-2" fill="currentColor" viewBox="0 0 20 20">
                    <path d="M10.894 2.553a1 1 0 00-1.788 0l-7 14a1 1 0 001.169 1.409l5-1.429A1 1 0 009 15.571V11a1 1 0 112 0v4.571a1 1 0 00.725.962l5 1.428a1 1 0 001.17-1.408l-7-14z" />
                  </svg>
                  Submit for Rating
                </>
              )}
            </button>
          )}

          {/* Error retry button (only for error status) */}
          {answer.uploadStatus === 'error' && onSubmit && (
            <button
              onClick={onSubmit}
              disabled={isSubmitting}
              className="mt-3 w-full px-4 py-2 bg-red-600 text-white rounded-md hover:bg-red-700 active:bg-red-800 disabled:bg-gray-300 disabled:cursor-not-allowed font-medium transition-colors flex items-center justify-center"
              aria-label="Retry submission"
            >
              {isSubmitting ? (
                <>
                  <svg
                    className="w-4 h-4 mr-2 animate-spin"
                    fill="currentColor"
                    viewBox="0 0 20 20"
                  >
                    <path
                      fillRule="evenodd"
                      d="M4 2a1 1 0 011 1v2.101a7.002 7.002 0 0111.601 2.566 1 1 0 11-1.885.666A5.002 5.002 0 005.999 7H9a1 1 0 010 2H4a1 1 0 01-1-1V3a1 1 0 011-1zm.008 9.057a1 1 0 011.276.61A5.002 5.002 0 0014.001 13H11a1 1 0 110-2h5a1 1 0 011 1v5a1 1 0 11-2 0v-2.101a7.002 7.002 0 01-11.601-2.566 1 1 0 01.61-1.276z"
                      clipRule="evenodd"
                    />
                  </svg>
                  Retrying...
                </>
              ) : (
                <>
                  <svg className="w-4 h-4 mr-2" fill="currentColor" viewBox="0 0 20 20">
                    <path
                      fillRule="evenodd"
                      d="M4 2a1 1 0 011 1v2.101a7.002 7.002 0 0111.601 2.566 1 1 0 11-1.885.666A5.002 5.002 0 005.999 7H9a1 1 0 010 2H4a1 1 0 01-1-1V3a1 1 0 011-1zm.008 9.057a1 1 0 011.276.61A5.002 5.002 0 0014.001 13H11a1 1 0 110-2h5a1 1 0 011 1v5a1 1 0 11-2 0v-2.101a7.002 7.002 0 01-11.601-2.566 1 1 0 01.61-1.276z"
                      clipRule="evenodd"
                    />
                  </svg>
                  Retry Submit
                </>
              )}
            </button>
          )}

          {/* Rating display (if available) */}
          {answer.rating && (
            <div className="mt-3 pt-3 border-t border-green-300">
              <RatingDisplay rating={answer.rating} />
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
