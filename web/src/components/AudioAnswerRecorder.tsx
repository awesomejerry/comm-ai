import React, { useState, useRef, useEffect } from 'react';
import type { AudioFormat } from '../models/audioAnswer';

interface AudioAnswerRecorderProps {
  /** Question ID being answered */
  questionId: string;

  /** Callback when recording completes successfully */
  onRecordingComplete: (audioBlob: Blob, duration: number, format: AudioFormat) => void;

  /** Callback when recording is cancelled */
  onCancel?: () => void;

  /** Optional maximum recording duration in seconds (default: unlimited) */
  maxDuration?: number;

  /** Whether recording is disabled */
  disabled?: boolean;
}

export const AudioAnswerRecorder: React.FC<AudioAnswerRecorderProps> = ({
  questionId,
  onRecordingComplete,
  onCancel,
  maxDuration,
  disabled = false,
}) => {
  const [isRecording, setIsRecording] = useState(false);
  const [isPaused, setIsPaused] = useState(false);
  const [duration, setDuration] = useState(0);
  const [error, setError] = useState<string | null>(null);
  const [permissionDenied, setPermissionDenied] = useState(false);

  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const chunksRef = useRef<Blob[]>([]);
  const timerRef = useRef<NodeJS.Timeout | null>(null);
  const isCancellingRef = useRef(false);
  const startTimeRef = useRef<number>(0);
  const pausedDurationRef = useRef<number>(0);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (timerRef.current) {
        clearInterval(timerRef.current);
      }
      if (mediaRecorderRef.current && mediaRecorderRef.current.state !== 'inactive') {
        mediaRecorderRef.current.stop();
      }
    };
  }, []);

  // Auto-stop at max duration
  useEffect(() => {
    if (maxDuration && duration >= maxDuration && isRecording && !isPaused) {
      handleStop();
    }
  }, [duration, maxDuration, isRecording, isPaused]);

  /**
   * Request microphone permission and start recording
   */
  const handleStart = async () => {
    try {
      setError(null);
      setPermissionDenied(false);

      // Request microphone access
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });

      // Determine supported format (prefer WebM, fallback to MP4)
      const mimeTypes = ['audio/webm;codecs=opus', 'audio/webm', 'audio/mp4', 'audio/mpeg'];

      const supportedMimeType = mimeTypes.find((type) => MediaRecorder.isTypeSupported(type));

      if (!supportedMimeType) {
        throw new Error('No supported audio format found');
      }

      // Create MediaRecorder
      const mediaRecorder = new MediaRecorder(stream, {
        mimeType: supportedMimeType,
      });

      mediaRecorderRef.current = mediaRecorder;
      chunksRef.current = [];

      // Handle data available event
      mediaRecorder.ondataavailable = (event) => {
        if (event.data.size > 0) {
          chunksRef.current.push(event.data);
        }
      };

      // Handle recording stop event
      mediaRecorder.onstop = () => {
        const wasCancelled = isCancellingRef.current;
        isCancellingRef.current = false;
        const audioBlob = new Blob(chunksRef.current, { type: supportedMimeType });
        const format = supportedMimeType.startsWith('audio/webm') ? 'webm' : 'mp4';
        const totalDuration =
          (Date.now() - startTimeRef.current - pausedDurationRef.current) / 1000;

        // Stop all tracks
        stream.getTracks().forEach((track) => track.stop());

        if (!wasCancelled) {
          onRecordingComplete(audioBlob, totalDuration, format);
        }

        // Reset state
        setIsRecording(false);
        setIsPaused(false);
        setDuration(0);
        pausedDurationRef.current = 0;
        chunksRef.current = [];
      };
      // Handle errors
      mediaRecorder.onerror = (event) => {
        console.error('MediaRecorder error:', event);
        setError('Recording error occurred. Please try again.');
        setIsRecording(false);
      };

      // Start recording
      mediaRecorder.start();
      setIsRecording(true);
      startTimeRef.current = Date.now();

      // Start duration timer
      timerRef.current = setInterval(() => {
        if (!isPaused) {
          const elapsed = (Date.now() - startTimeRef.current - pausedDurationRef.current) / 1000;
          setDuration(Math.floor(elapsed));
        }
      }, 1000);
    } catch (err) {
      console.error('Failed to start recording:', err);

      const errorName = err instanceof Error ? err.name : undefined;

      if (errorName === 'NotAllowedError') {
        setPermissionDenied(true);
        setError('Microphone access denied. Please grant permission and try again.');
      } else if (err instanceof Error) {
        setError(err.message);
      } else {
        setError('Failed to start recording. Please check your microphone.');
      }
    }
  };

  /**
   * Pause recording
   */
  const handlePause = () => {
    if (mediaRecorderRef.current && mediaRecorderRef.current.state === 'recording') {
      mediaRecorderRef.current.pause();
      setIsPaused(true);
      pausedDurationRef.current += Date.now() - startTimeRef.current;
    }
  };

  /**
   * Resume recording
   */
  const handleResume = () => {
    if (mediaRecorderRef.current && mediaRecorderRef.current.state === 'paused') {
      mediaRecorderRef.current.resume();
      setIsPaused(false);
      startTimeRef.current = Date.now();
    }
  };

  /**
   * Stop recording and save
   */
  const handleStop = () => {
    if (mediaRecorderRef.current && mediaRecorderRef.current.state !== 'inactive') {
      isCancellingRef.current = false;
      if (timerRef.current) {
        clearInterval(timerRef.current);
        timerRef.current = null;
      }
      mediaRecorderRef.current.stop();
    }
  };

  /**
   * Cancel recording and discard
   */
  const handleCancelRecording = () => {
    if (timerRef.current) {
      clearInterval(timerRef.current);
      timerRef.current = null;
    }

    if (mediaRecorderRef.current && mediaRecorderRef.current.state !== 'inactive') {
      isCancellingRef.current = true;
      // Stop recording without calling completion callback
      const stream = mediaRecorderRef.current.stream;
      mediaRecorderRef.current.stop();
      stream.getTracks().forEach((track) => track.stop());
    }

    // Reset state
    setIsRecording(false);
    setIsPaused(false);
    setDuration(0);
    chunksRef.current = [];
    pausedDurationRef.current = 0;

    // Call cancel callback
    if (onCancel) {
      onCancel();
    }
  };

  /**
   * Format duration as MM:SS
   */
  const formatDuration = (seconds: number): string => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  return (
    <div className="audio-answer-recorder p-4 border border-gray-300 rounded-lg bg-white">
      {/* Error Display */}
      {error && (
        <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-md" role="alert">
          <div className="flex items-start">
            <svg
              className="w-5 h-5 text-red-400 mr-2 flex-shrink-0"
              fill="currentColor"
              viewBox="0 0 20 20"
            >
              <path
                fillRule="evenodd"
                d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z"
                clipRule="evenodd"
              />
            </svg>
            <p className="text-sm text-red-700">{error}</p>
          </div>
          {permissionDenied && (
            <button
              onClick={() =>
                window.open('https://support.google.com/chrome/answer/2693767', '_blank')
              }
              className="mt-2 text-sm text-red-600 underline hover:text-red-800"
            >
              Learn how to enable microphone access
            </button>
          )}
        </div>
      )}

      {/* Recording Status */}
      {isRecording && (
        <div className="mb-4 flex items-center justify-between">
          <div className="flex items-center">
            <div
              className={`w-3 h-3 rounded-full mr-2 ${isPaused ? 'bg-yellow-500' : 'bg-red-500 animate-pulse'}`}
            />
            <span className="text-sm font-medium text-gray-700">
              {isPaused ? 'Paused' : 'Recording'}
            </span>
          </div>
          <span className="text-2xl font-mono font-bold text-gray-900">
            {formatDuration(duration)}
          </span>
        </div>
      )}

      {maxDuration && isRecording && (
        <div className="mb-4">
          <div className="w-full bg-gray-200 rounded-full h-2">
            <div
              className="bg-blue-600 h-2 rounded-full transition-all duration-1000"
              style={{ width: `${(duration / maxDuration) * 100}%` }}
            />
          </div>
          <p className="text-xs text-gray-500 mt-1 text-right">
            {formatDuration(maxDuration - duration)} remaining
          </p>
        </div>
      )}

      {/* Control Buttons */}
      <div className="flex gap-2">
        {!isRecording ? (
          <button
            onClick={handleStart}
            disabled={disabled}
            className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 active:bg-blue-800 disabled:bg-gray-300 disabled:cursor-not-allowed font-medium transition-colors"
            aria-label="Start recording"
          >
            <svg className="w-5 h-5 inline mr-2" fill="currentColor" viewBox="0 0 20 20">
              <path
                fillRule="evenodd"
                d="M7 4a3 3 0 016 0v4a3 3 0 11-6 0V4zm4 10.93A7.001 7.001 0 0017 8a1 1 0 10-2 0A5 5 0 015 8a1 1 0 00-2 0 7.001 7.001 0 006 6.93V17H6a1 1 0 100 2h8a1 1 0 100-2h-3v-2.07z"
                clipRule="evenodd"
              />
            </svg>
            Start Recording
          </button>
        ) : (
          <>
            {isPaused ? (
              <button
                onClick={handleResume}
                className="flex-1 px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700 active:bg-green-800 font-medium transition-colors"
                aria-label="Resume recording"
              >
                Resume
              </button>
            ) : (
              <button
                onClick={handlePause}
                className="flex-1 px-4 py-2 bg-yellow-600 text-white rounded-md hover:bg-yellow-700 active:bg-yellow-800 font-medium transition-colors"
                aria-label="Pause recording"
              >
                Pause
              </button>
            )}

            <button
              onClick={handleStop}
              className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 active:bg-blue-800 font-medium transition-colors"
              aria-label="Stop recording"
            >
              Stop & Save
            </button>

            <button
              onClick={handleCancelRecording}
              className="px-4 py-2 bg-gray-200 text-gray-700 rounded-md hover:bg-gray-300 active:bg-gray-400 font-medium transition-colors"
              aria-label="Cancel recording"
            >
              Cancel
            </button>
          </>
        )}
      </div>

      {/* Instructions */}
      {!isRecording && !error && (
        <p className="mt-3 text-xs text-gray-500 text-center">
          Click "Start Recording" to begin. You can pause/resume at any time.
          {maxDuration && ` Maximum duration: ${formatDuration(maxDuration)}.`}
        </p>
      )}
    </div>
  );
};
