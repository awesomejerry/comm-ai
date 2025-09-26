import React, { useState } from 'react';
import PdfViewer from '../components/PdfViewer';
import { AudioReview } from '../components/AudioReview';
import { EvaluationChat } from '../components/EvaluationChat';
import { RecordingController } from '../recording/recordingController';
import { UploaderQueue } from '../services/uploaderQueue';
import type { RecordingState, Recording } from '../models/presentation';

export default function PresenterPageFull() {
  const [file, setFile] = useState<File | undefined>();
  const [pageCount, setPageCount] = useState(0);
  const [currentPage, setCurrentPage] = useState(1);
  const [segments, setSegments] = useState<any[]>([]);
  const [isRecording, setIsRecording] = useState(false);
  const [microphoneError, setMicrophoneError] = useState<string | null>(null);
  const [selectedAudience, setSelectedAudience] = useState<string>('');
  const [recordingState, setRecordingState] = useState<RecordingState>('recording');
  const [currentRecording, setCurrentRecording] = useState<Recording | null>(null);

  const rcRef = React.useRef<RecordingController | null>(null);
  const uploaderQueueRef = React.useRef<UploaderQueue | null>(null);

  // Initialize uploader queue
  React.useEffect(() => {
    uploaderQueueRef.current = new UploaderQueue(
      'https://n8n.awesomejerry.space/webhook/comm-ai/upload-pitch'
    );
  }, []);

  function onFile(e: React.ChangeEvent<HTMLInputElement>) {
    const f = e.target.files?.[0];
    if (f) setFile(f);
  }

  function startRec() {
    setMicrophoneError(null); // Clear any previous errors

    const rc = new RecordingController({
      onSegmentReady: async (seg) => {
        setSegments((s) => [...s, { ...seg, state: 'uploading', audience: selectedAudience }]);

        // Add segment to upload queue with retry mechanism
        uploaderQueueRef.current?.addSegment({
          id: seg.id,
          blob: seg.blob,
          startSlide: seg.startSlide,
          endSlide: seg.endSlide,
          audience: selectedAudience,
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
      },
      onError: (error) => {
        setMicrophoneError(error.message);
        setIsRecording(false);
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
      rc.start(currentPage);
      rcRef.current = rc;
      setIsRecording(true);
    } catch (error) {
      console.error('Failed to start recording:', error);
      // Error handling is done in onError callback
    }
  }
  function pauseRec() {
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

  return (
    <div className="min-h-screen bg-gray-50 py-8 px-4">
      <div className="w-4/5 mx-auto">
        <header className="text-center mb-8">
          <h1 className="text-3xl font-bold text-commAi-primary mb-2">Comm-AI</h1>
          <p className="text-gray-600">Professional Pitch Training Platform</p>
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
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-commAi-primary focus:border-commAi-primary"
                    />
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
                                    id: s.id,
                                    input: s.evaluation.input,
                                    output: s.evaluation.output,
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
