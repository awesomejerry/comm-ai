import React, { useState } from 'react';
import { useAtom } from 'jotai';
import PdfViewer from '../components/PdfViewer';
import { AudioReview } from '../components/AudioReview';
import { EvaluationChat } from '../components/EvaluationChat';
import { RecordingController } from '../recording/recordingController';
import { UploaderQueue } from '../services/uploaderQueue';
import type { RecordingState, Recording } from '../models/presentation';
import { useAuth } from '../components/AuthProvider';
import { useNavigate, Link } from 'react-router-dom';
import LogoutButton from '../components/LogoutButton';
import { presentationModeAtom, isRecordingActiveAtom } from '../models/presentMode';
import { PresentModeToggle } from '../components/PresentModeToggle';
import { PresentModeView } from '../components/PresentModeView';
import { TimestampTracker } from '../recording/timestampTracker';
import { RecordingPersistence, type PersistedRecording } from '../recording/recordingPersistence';

export default function PresenterPageFull() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [file, setFile] = useState<File | undefined>();
  const [pageCount, setPageCount] = useState(0);
  const [currentPage, setCurrentPage] = useState(1);
  const [segments, setSegments] = useState<any[]>([]);
  const [isRecording, setIsRecording] = useState(false);
  const [microphoneError, setMicrophoneError] = useState<string | null>(null);
  const [selectedAudience, setSelectedAudience] = useState<string>('');
  const [recordingState, setRecordingState] = useState<RecordingState>('recording');
  const [currentRecording, setCurrentRecording] = useState<Recording | null>(null);

  // Present mode state
  const [presentMode, setPresentMode] = useAtom(presentationModeAtom);
  const [, setIsRecordingActive] = useAtom(isRecordingActiveAtom);
  const [persistedRecordings, setPersistedRecordings] = useState<PersistedRecording[]>([]);
  const [uploadingRecordingIds, setUploadingRecordingIds] = useState<Set<string>>(new Set());
  const [showExitConfirmation, setShowExitConfirmation] = useState(false); // T034: Confirmation dialog state

  const rcRef = React.useRef<RecordingController | null>(null);
  const uploaderQueueRef = React.useRef<UploaderQueue | null>(null);
  const timestampTrackerRef = React.useRef<TimestampTracker | null>(null);
  const persistenceRef = React.useRef<RecordingPersistence>(new RecordingPersistence());

  // Initialize uploader queue
  React.useEffect(() => {
    uploaderQueueRef.current = new UploaderQueue(
      'https://n8n.awesomejerry.space/webhook/comm-ai/upload-pitch'
    );
  }, []);

  // Load persisted recordings and cleanup expired ones on mount (T022, T023)
  React.useEffect(() => {
    async function loadPersistedRecordings() {
      try {
        // Cleanup expired recordings first
        await persistenceRef.current.cleanupExpired();

        // Load remaining recordings
        const recordings = await persistenceRef.current.getAllRecordings();
        setPersistedRecordings(recordings);
      } catch (error) {
        console.error('Failed to load persisted recordings:', error);
      }
    }

    loadPersistedRecordings();
  }, []);

  // Auto-start recording when entering present mode
  React.useEffect(() => {
    if (presentMode === 'present' && !isRecording && file) {
      // Initialize timestamp tracker for present mode
      console.log('[PresentMode] Entering present mode, initializing recording');
      timestampTrackerRef.current = new TimestampTracker();
      startRec();
    }
  }, [presentMode, file]); // eslint-disable-line react-hooks/exhaustive-deps

  // Track slide navigation in present mode
  React.useEffect(() => {
    if (presentMode === 'present' && isRecording && timestampTrackerRef.current) {
      console.log(`[PresentMode] Tracking slide navigation: page ${currentPage}`);
      timestampTrackerRef.current.trackNavigation(currentPage);
    }
  }, [currentPage, presentMode, isRecording]);

  // Update global recording state
  React.useEffect(() => {
    setIsRecordingActive(isRecording);
  }, [isRecording, setIsRecordingActive]);

  // T037: Warn user before closing/refreshing when recording is active
  React.useEffect(() => {
    const handleBeforeUnload = (e: BeforeUnloadEvent) => {
      if (isRecording) {
        console.log('[PresentMode] beforeunload warning: active recording detected');
        e.preventDefault();
        e.returnValue = 'You have an active recording. Are you sure you want to leave?';
        return e.returnValue;
      }
    };

    window.addEventListener('beforeunload', handleBeforeUnload);
    return () => window.removeEventListener('beforeunload', handleBeforeUnload);
  }, [isRecording]);

  // T033: Handle mode toggle - immediate transition when no recording is active
  function handleModeToggle() {
    if (!isRecording) {
      const newMode = presentMode === 'practice' ? 'present' : 'practice';
      console.log(`[PresentMode] Toggling mode: ${presentMode} → ${newMode}`);
      setPresentMode(newMode);
    }
  }

  // T034: Handle exit from present mode with confirmation if recording active
  function handleExitPresentMode() {
    if (isRecording) {
      // Show confirmation dialog if recording is active
      console.log(
        '[PresentMode] Exit requested with active recording, showing confirmation dialog'
      );
      setShowExitConfirmation(true);
    } else {
      // T033: Immediate exit if no recording
      console.log('[PresentMode] Exiting present mode (no active recording)');
      setPresentMode('practice');
    }
  }

  // T035: Handle save recording option in confirmation dialog
  async function handleSaveAndExit() {
    console.log('[PresentMode] Save & Exit: pausing recording and saving to IndexedDB');
    setShowExitConfirmation(false);

    if (isRecording) {
      pauseRec();

      // T018: Save recording to IndexedDB with 7-day expiry
      if (currentRecording && timestampTrackerRef.current) {
        try {
          const timestampsJSON = JSON.stringify(timestampTrackerRef.current.toJSON());
          const recordingId = await persistenceRef.current.saveRecording(
            currentRecording.audioBlob,
            timestampsJSON
          );

          // Reload persisted recordings to show the new one
          const recordings = await persistenceRef.current.getAllRecordings();
          setPersistedRecordings(recordings);

          console.log('[PresentMode] Recording saved to IndexedDB:', recordingId);
        } catch (error) {
          console.error('[PresentMode] Failed to save recording:', error);
        }
      }
    }

    setPresentMode('practice');
  }

  // T035: Handle discard recording option in confirmation dialog
  function handleDiscardAndExit() {
    console.log('[PresentMode] Discard & Exit: deleting recording');
    setShowExitConfirmation(false);

    if (isRecording) {
      // Stop tracking timestamps when discarding
      if (presentMode === 'present' && timestampTrackerRef.current) {
        timestampTrackerRef.current.stopSession();
      }
      // Stop recording without saving
      rcRef.current?.deleteRecording();
      setIsRecording(false);
    }

    setPresentMode('practice');
  }

  // T034: Handle cancel in confirmation dialog
  function handleCancelExit() {
    console.log('[PresentMode] Exit cancelled, continuing recording');
    setShowExitConfirmation(false);
  }

  function onFile(e: React.ChangeEvent<HTMLInputElement>) {
    const f = e.target.files?.[0];
    if (f) setFile(f);
  }

  function startRec() {
    setMicrophoneError(null); // Clear any previous errors

    const rc = new RecordingController({
      onSegmentReady: async (seg) => {
        // Attach timestamp data if in present mode
        const segmentData = {
          ...seg,
          state: 'uploading',
          audience: selectedAudience,
          ...(presentMode === 'present' && timestampTrackerRef.current
            ? { timestamps: timestampTrackerRef.current.toJSON() }
            : {}),
        };

        setSegments((s) => [...s, segmentData]);

        // Add segment to upload queue with retry mechanism
        uploaderQueueRef.current?.addSegment({
          id: seg.id,
          blob: seg.blob,
          startSlide: seg.startSlide,
          endSlide: seg.endSlide,
          audience: selectedAudience,
          mode: presentMode, // T024: Include mode field
          timestamps:
            presentMode === 'present' && timestampTrackerRef.current
              ? JSON.stringify(timestampTrackerRef.current.toJSON())
              : undefined, // T025: Include timestamps as JSON string
          onComplete: (result) => {
            setSegments((s) =>
              s.map((x) => (x.id === seg.id ? { ...x, state: 'evaluated', evaluation: result } : x))
            );
          },
          onError: (error) => {
            setSegments((s) =>
              s.map((x) => (x.id === seg.id ? { ...x, state: 'failed', error: error.message } : x))
            );
          },
        });

        // Reset timestamp tracker for next segment
        if (presentMode === 'present') {
          timestampTrackerRef.current = new TimestampTracker();
        }
      },
      onError: (error) => {
        setMicrophoneError(error.message);
        setIsRecording(false);
        // Exit present mode on error
        if (presentMode === 'present') {
          setPresentMode('practice');
        }
      },
      onStateChange: (state) => {
        setRecordingState(state);
        if (rcRef.current) {
          setCurrentRecording(rcRef.current.getCurrentRecording());
        }
        if (state === 'paused' || state === 'reviewed') {
          setIsRecording(false);
        } else if (state === 'recording') {
          setIsRecording(true);
        }
      },
    });

    try {
      rc.start({ slideNumber: currentPage, mode: presentMode });
      rcRef.current = rc;
      setIsRecording(true);
    } catch (error) {
      console.error('Failed to start recording:', error);
      // Error handling is done in onError callback
    }
  }
  function pauseRec() {
    // Stop tracking timestamps when pausing
    if (presentMode === 'present' && timestampTrackerRef.current) {
      timestampTrackerRef.current.stopSession();
    }
    rcRef.current?.pause(currentPage);
    setIsRecording(false);
  }

  function confirmUpload() {
    rcRef.current?.confirmUpload(currentPage);
  }

  function deleteRecording() {
    rcRef.current?.deleteRecording();
  }

  function handlePlaybackComplete() {
    rcRef.current?.review();
  }

  // T020: Calculate recording duration in seconds
  function getRecordingDuration(blob: Blob): number {
    // Estimate duration based on blob size and bitrate (64 kbps = 8 KB/s)
    const durationSeconds = blob.size / ((64 * 1024) / 8);
    return Math.round(durationSeconds);
  }

  // T021: Format duration as MM:SS or HH:MM:SS
  function formatDuration(seconds: number): string {
    const hours = Math.floor(seconds / 3600);
    const mins = Math.floor((seconds % 3600) / 60);
    const secs = seconds % 60;

    if (hours > 0) {
      return `${hours}:${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
    }
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  }

  // T042: Check if recording is approaching 3-hour limit
  function isRecordingLong(blob: Blob): boolean {
    const durationSeconds = getRecordingDuration(blob);
    return durationSeconds > 9000; // > 2.5 hours (warn before 3-hour limit)
  }

  // T026-T030: Handle upload of persisted recording
  async function handleUploadPersistedRecording(recording: PersistedRecording) {
    console.log('[PresentMode] Uploading persisted recording:', recording.id);
    // Mark as uploading (T027: Upload progress)
    setUploadingRecordingIds((prev) => new Set(prev).add(recording.id));

    try {
      // Parse slide info from timestamps
      const timestamps = JSON.parse(recording.timestamps);
      const slideNumbers = timestamps.map((t: any) => t.slideNumber);
      const startSlide = Math.min(...slideNumbers);
      const endSlide = Math.max(...slideNumbers);

      console.log(`[PresentMode] Upload metadata: slides ${startSlide}-${endSlide}, mode=present`);

      // Upload using the existing queue system with mode and timestamps (T024, T025)
      uploaderQueueRef.current?.addSegment({
        id: recording.id,
        blob: recording.blob,
        startSlide,
        endSlide,
        audience: selectedAudience || 'General',
        mode: 'present', // T024: Include mode field
        timestamps: recording.timestamps, // T025: Include timestamps
        onComplete: async (result) => {
          console.log('[PresentMode] Upload successful, evaluation received:', result);
          // T028: Display evaluation results
          setSegments((s) => [
            ...s,
            {
              id: recording.id,
              startSlide,
              endSlide,
              state: 'evaluated',
              evaluation: result,
              audience: selectedAudience || 'General',
              mode: 'present',
            },
          ]);

          // T030: Delete from IndexedDB after successful upload
          try {
            await persistenceRef.current.deleteRecording(recording.id);
            const recordings = await persistenceRef.current.getAllRecordings();
            setPersistedRecordings(recordings);
            console.log('[PresentMode] Recording deleted from IndexedDB after successful upload');
          } catch (error) {
            console.error('[PresentMode] Failed to delete persisted recording:', error);
          }

          // Remove from uploading set
          setUploadingRecordingIds((prev) => {
            const next = new Set(prev);
            next.delete(recording.id);
            return next;
          });
        },
        onError: (error) => {
          // T029: Error handling and retry options
          console.error('[PresentMode] Upload failed:', error);
          alert(`Upload failed: ${error.message}. Please try again.`);

          // Remove from uploading set
          setUploadingRecordingIds((prev) => {
            const next = new Set(prev);
            next.delete(recording.id);
            return next;
          });
        },
      });
    } catch (error) {
      console.error('Failed to prepare upload:', error);
      alert(
        `Failed to upload recording: ${error instanceof Error ? error.message : 'Unknown error'}`
      );

      setUploadingRecordingIds((prev) => {
        const next = new Set(prev);
        next.delete(recording.id);
        return next;
      });
    }
  }

  // Handle delete of persisted recording
  async function handleDeletePersistedRecording(id: string) {
    try {
      await persistenceRef.current.deleteRecording(id);
      const recordings = await persistenceRef.current.getAllRecordings();
      setPersistedRecordings(recordings);
    } catch (error) {
      console.error('Failed to delete persisted recording:', error);
    }
  }

  // Render present mode view if in present mode
  if (presentMode === 'present' && file) {
    return (
      <>
        <PresentModeView
          currentSlide={currentPage}
          totalSlides={pageCount}
          isRecording={isRecording}
          onExit={handleExitPresentMode}
        >
          <PdfViewer
            file={file}
            onReady={setPageCount}
            onPageChange={setCurrentPage}
            controlsPosition="bottom"
          />
        </PresentModeView>

        {/* T034, T035: Confirmation dialog for exit with active recording */}
        {showExitConfirmation && (
          <div className="fixed inset-0 z-[60] flex items-center justify-center bg-black/70 backdrop-blur-sm">
            <div className="bg-white rounded-xl shadow-2xl max-w-md w-full mx-4 p-6">
              <div className="flex items-center gap-3 mb-4">
                <div className="flex-shrink-0 w-12 h-12 bg-amber-100 rounded-full flex items-center justify-center">
                  <svg className="w-6 h-6 text-amber-600" fill="currentColor" viewBox="0 0 20 20">
                    <path
                      fillRule="evenodd"
                      d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z"
                      clipRule="evenodd"
                    />
                  </svg>
                </div>
                <div>
                  <h3 className="text-lg font-semibold text-gray-900">Recording in Progress</h3>
                  <p className="text-sm text-gray-600">You have an active recording</p>
                </div>
              </div>

              <p className="text-gray-700 mb-6">
                What would you like to do with your current recording?
              </p>

              <div className="space-y-3">
                <button
                  onClick={handleSaveAndExit}
                  className="w-full bg-green-600 hover:bg-green-700 text-white font-medium py-3 px-4 rounded-lg transition-colors flex items-center justify-center gap-2"
                >
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M8 7H5a2 2 0 00-2 2v9a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2h-3m-1 4l-3 3m0 0l-3-3m3 3V4"
                    />
                  </svg>
                  Save & Exit
                </button>

                <button
                  onClick={handleDiscardAndExit}
                  className="w-full bg-red-600 hover:bg-red-700 text-white font-medium py-3 px-4 rounded-lg transition-colors flex items-center justify-center gap-2"
                >
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"
                    />
                  </svg>
                  Discard & Exit
                </button>

                <button
                  onClick={handleCancelExit}
                  className="w-full bg-gray-200 hover:bg-gray-300 text-gray-800 font-medium py-3 px-4 rounded-lg transition-colors"
                >
                  Continue Recording
                </button>
              </div>
            </div>
          </div>
        )}
      </>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 py-8 px-4">
      <div className="w-4/5 mx-auto">
        <header className="text-center mb-8">
          <div className="flex justify-between items-center">
            <div>
              <h1 className="text-3xl font-bold text-commAi-primary mb-2">Comm-AI</h1>
              <p className="text-gray-600">Professional Pitch Training Platform</p>
              <Link to="/learning-cards" className="text-blue-500 hover:text-blue-700 block mt-2">
                Learning Cards
              </Link>
            </div>
            <div className="flex items-center space-x-4">
              {/* Present Mode Toggle */}
              {file && (
                <PresentModeToggle
                  mode={presentMode}
                  isRecording={isRecording}
                  onToggle={handleModeToggle}
                />
              )}
              {/* Show logout if authenticated */}
              {user && (
                <div className="inline-block">
                  <span className="text-sm text-gray-700 mr-2">{user.email}</span>
                  <LogoutButton />
                </div>
              )}
            </div>
          </div>
          {isRecording && (
            <div className="mt-4 inline-flex items-center bg-red-50 px-4 py-2 rounded-full">
              <div className="w-3 h-3 bg-red-500 rounded-full animate-pulse mr-2"></div>
              <span className="text-red-700 font-medium">Recording Active</span>
            </div>
          )}
        </header>

        <main className="space-y-6">
          {/* PDF Upload Card */}
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
            <h2 className="text-xl font-semibold text-gray-800 mb-4">Upload Presentation</h2>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2" htmlFor="pdf-upload">
                Select PDF File
              </label>
              <input
                id="pdf-upload"
                type="file"
                accept="application/pdf"
                onChange={onFile}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-commAi-primary focus:border-commAi-primary"
              />
            </div>
          </div>

          {/* Main content grid */}
          <div className="grid grid-cols-1 lg:grid-cols-[auto,1fr] gap-6">
            {/* Controls and segments column */}
            <div className="space-y-6">
              <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
                <h2 className="text-xl font-semibold text-gray-800 mb-4">Recording Controls</h2>
                <div className="space-y-4">
                  <div>
                    <label
                      className="block text-sm font-medium text-gray-700 mb-2"
                      htmlFor="audience-input"
                    >
                      Target Audience
                    </label>
                    <input
                      id="audience-input"
                      type="text"
                      value={selectedAudience}
                      onChange={(e) => setSelectedAudience(e.target.value)}
                      placeholder="e.g., investors, customers"
                      list="audience-options"
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-commAi-primary focus:border-commAi-primary"
                    />
                    <datalist id="audience-options">
                      <option value="Investors" />
                      <option value="Customers" />
                      <option value="Team" />
                      <option value="General" />
                    </datalist>
                  </div>
                  <button
                    onClick={isRecording ? pauseRec : startRec}
                    className={`w-full py-3 px-4 rounded-lg font-medium transition-colors ${
                      isRecording
                        ? 'bg-red-600 hover:bg-red-700 text-white'
                        : 'bg-commAi-primary hover:bg-blue-700 text-white'
                    }`}
                  >
                    {isRecording ? 'Stop Recording' : 'Start Recording'}
                  </button>
                </div>
              </div>

              {/* Microphone Error */}
              {microphoneError && (
                <div className="bg-red-50 border border-red-200 rounded-lg p-4">
                  <div className="flex items-center">
                    <div className="flex-shrink-0">
                      <svg className="h-5 w-5 text-red-400" viewBox="0 0 20 20" fill="currentColor">
                        <path
                          fillRule="evenodd"
                          d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z"
                          clipRule="evenodd"
                        />
                      </svg>
                    </div>
                    <div className="ml-3">
                      <h3 className="text-sm font-medium text-red-800">
                        Microphone Access Required
                      </h3>
                      <div className="mt-2 text-sm text-red-700">
                        <p>{microphoneError}</p>
                        <p className="mt-1">Please allow microphone access and try again.</p>
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {/* Review Section */}
              {(recordingState === 'paused' || recordingState === 'reviewed') &&
                currentRecording && (
                  <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
                    <h2 className="text-xl font-semibold text-gray-800 mb-4">Review Recording</h2>
                    <AudioReview
                      audioBlob={currentRecording.audioBlob}
                      onPlaybackComplete={handlePlaybackComplete}
                    />
                    <div className="mt-4 flex space-x-3">
                      <button
                        onClick={confirmUpload}
                        className="flex-1 bg-green-600 hover:bg-green-700 text-white font-medium py-2 px-4 rounded-lg shadow-md transition-all focus:outline-none focus:ring-2 focus:ring-green-500 focus:ring-offset-2"
                      >
                        ✅ Confirm & Upload
                      </button>
                      <button
                        onClick={deleteRecording}
                        className="flex-1 bg-red-600 hover:bg-red-700 text-white font-medium py-2 px-4 rounded-lg shadow-md transition-all focus:outline-none focus:ring-2 focus:ring-red-500 focus:ring-offset-2"
                      >
                        🗑️ Delete Recording
                      </button>
                    </div>
                  </div>
                )}

              {/* T019: Upload interface for persisted recordings */}
              {persistedRecordings.length > 0 && (
                <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
                  <h2 className="text-xl font-semibold text-gray-800 mb-4">
                    Saved Present Mode Recordings
                  </h2>
                  <div className="space-y-3">
                    {persistedRecordings.map((recording) => {
                      const duration = getRecordingDuration(recording.blob);
                      const isShort = duration < 30; // T021: 30-second minimum duration warning
                      const isLong = isRecordingLong(recording.blob); // T042: Warn if approaching 3-hour limit

                      return (
                        <div
                          key={recording.id}
                          className="p-4 bg-gray-50 rounded-lg border border-gray-200"
                        >
                          <div className="flex items-start justify-between mb-2">
                            <div className="flex-1">
                              <div className="flex items-center gap-2 mb-1">
                                <span className="font-medium text-gray-900">
                                  Present Mode Recording
                                </span>
                                <span className="px-2 py-1 text-xs rounded-full bg-blue-100 text-blue-800">
                                  {formatDuration(duration)} {/* T020: Display duration */}
                                </span>
                              </div>
                              <p className="text-sm text-gray-500">
                                Saved: {new Date(recording.createdAt).toLocaleString()}
                              </p>
                              <p className="text-sm text-gray-500">
                                Expires: {new Date(recording.expiresAt).toLocaleDateString()}
                              </p>

                              {/* T021: Warning for short recordings */}
                              {isShort && (
                                <div className="mt-2 flex items-center gap-2 text-amber-700 bg-amber-50 px-3 py-2 rounded-md">
                                  <svg
                                    className="w-4 h-4 flex-shrink-0"
                                    fill="currentColor"
                                    viewBox="0 0 20 20"
                                  >
                                    <path
                                      fillRule="evenodd"
                                      d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z"
                                      clipRule="evenodd"
                                    />
                                  </svg>
                                  <span className="text-sm">
                                    Recording is under 30 seconds. Consider re-recording for better
                                    evaluation results.
                                  </span>
                                </div>
                              )}

                              {/* T042: Warning for long recordings (approaching 3-hour limit) */}
                              {isLong && (
                                <div className="mt-2 flex items-center gap-2 text-orange-700 bg-orange-50 px-3 py-2 rounded-md">
                                  <svg
                                    className="w-4 h-4 flex-shrink-0"
                                    fill="currentColor"
                                    viewBox="0 0 20 20"
                                  >
                                    <path
                                      fillRule="evenodd"
                                      d="M10 18a8 8 0 100-16 8 8 0 000 16zm1-12a1 1 0 10-2 0v4a1 1 0 00.293.707l2.828 2.829a1 1 0 101.415-1.415L11 9.586V6z"
                                      clipRule="evenodd"
                                    />
                                  </svg>
                                  <span className="text-sm">
                                    Recording exceeds 2.5 hours. Maximum supported duration is 3
                                    hours.
                                  </span>
                                </div>
                              )}
                            </div>
                          </div>

                          <div className="mt-3 flex gap-2">
                            <button
                              onClick={() => handleUploadPersistedRecording(recording)}
                              disabled={uploadingRecordingIds.has(recording.id)}
                              className={`flex-1 font-medium py-2 px-4 rounded-lg transition-colors ${
                                uploadingRecordingIds.has(recording.id)
                                  ? 'bg-gray-400 cursor-not-allowed text-white'
                                  : 'bg-green-600 hover:bg-green-700 text-white'
                              }`}
                            >
                              {uploadingRecordingIds.has(recording.id) ? (
                                <span className="flex items-center justify-center gap-2">
                                  <svg
                                    className="animate-spin h-4 w-4"
                                    fill="none"
                                    viewBox="0 0 24 24"
                                  >
                                    <circle
                                      className="opacity-25"
                                      cx="12"
                                      cy="12"
                                      r="10"
                                      stroke="currentColor"
                                      strokeWidth="4"
                                    />
                                    <path
                                      className="opacity-75"
                                      fill="currentColor"
                                      d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                                    />
                                  </svg>
                                  Uploading...
                                </span>
                              ) : (
                                '📤 Upload for Evaluation'
                              )}
                            </button>
                            <button
                              onClick={() => handleDeletePersistedRecording(recording.id)}
                              disabled={uploadingRecordingIds.has(recording.id)}
                              className="px-4 py-2 bg-red-100 hover:bg-red-200 text-red-700 font-medium rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                            >
                              🗑️
                            </button>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}

              {/* Segments List */}
              <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
                <h2 className="text-xl font-semibold text-gray-800 mb-4">Recording Segments</h2>
                {segments.length === 0 ? (
                  <div className="text-center py-8">
                    <div className="text-4xl mb-2">🎙️</div>
                    <p className="text-gray-500">No segments recorded yet</p>
                    <p className="text-sm text-gray-600 mt-1">
                      Start recording to create your first segment
                    </p>
                  </div>
                ) : (
                  <ul className="space-y-3" role="list">
                    {segments.map((s) => (
                      <li
                        key={s.id}
                        data-testid={`segment-${s.id}`}
                        className="p-4 bg-gray-50 rounded-lg border border-gray-200 hover:bg-gray-100 transition-colors"
                      >
                        <div className="flex items-start justify-between">
                          <div className="flex-1">
                            <div className="flex items-center space-x-2 mb-2">
                              <span className="font-medium text-gray-900">Segment {s.id}</span>
                              <span
                                className={`px-2 py-1 text-xs rounded-full font-medium whitespace-nowrap ${
                                  s.state === 'evaluated'
                                    ? 'bg-green-100 text-green-800'
                                    : s.state === 'failed'
                                      ? 'bg-red-100 text-red-800'
                                      : s.state === 'uploading'
                                        ? 'bg-blue-100 text-blue-800'
                                        : 'bg-yellow-100 text-yellow-800'
                                }`}
                              >
                                {s.state === 'evaluated'
                                  ? '✅ Evaluated'
                                  : s.state === 'failed'
                                    ? '❌ Failed'
                                    : s.state === 'uploading'
                                      ? '⏳ Uploading...'
                                      : '⏳ Pending'}
                              </span>
                            </div>
                            <span className="text-sm text-gray-500 block mb-2">
                              Slides {s.startSlide}-{s.endSlide}
                            </span>
                            {s.audience && (
                              <span className="text-sm text-blue-600 block mb-2">
                                Audience: {s.audience.charAt(0).toUpperCase() + s.audience.slice(1)}
                              </span>
                            )}
                            {s.error && (
                              <div className="flex items-center space-x-3 mb-3">
                                <div className="text-sm text-red-600 flex-1">{s.error}</div>
                                <button
                                  onClick={() => {
                                    // Find the segment and retry it
                                    const segment = uploaderQueueRef.current?.getSegmentById(s.id);
                                    if (segment) {
                                      uploaderQueueRef.current?.retryFailedSegments();
                                      setSegments((prev) =>
                                        prev.map((x) =>
                                          x.id === s.id
                                            ? { ...x, state: 'queued', error: undefined }
                                            : x
                                        )
                                      );
                                    }
                                  }}
                                  className="px-3 py-1.5 text-sm bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors font-medium shadow-sm"
                                >
                                  🔄 Retry
                                </button>
                              </div>
                            )}
                            {s.evaluation && (
                              <div className="mt-3">
                                <EvaluationChat
                                  evaluation={{
                                    id: s.evaluation.id,
                                    created_at: new Date().toISOString(),
                                    input: s.evaluation.input,
                                    output: s.evaluation.output,
                                    startSlide: null,
                                    endSlide: null,
                                    audience: null,
                                  }}
                                />
                              </div>
                            )}
                          </div>
                        </div>
                      </li>
                    ))}
                  </ul>
                )}
              </div>
            </div>

            {/* PDF Viewer - only show if file */}
            {file && (
              <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
                <h2 className="text-xl font-semibold text-gray-800 mb-4">Presentation Preview</h2>
                <PdfViewer file={file} onReady={setPageCount} onPageChange={setCurrentPage} />
              </div>
            )}
          </div>
        </main>
      </div>
    </div>
  );
}
