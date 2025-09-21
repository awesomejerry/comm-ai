import React, { useState } from 'react';
import PdfViewer from '../components/PdfViewer';
import { AudioReview } from '../components/AudioReview';
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
      'https://n8n.awesomejerry.space/webhook/commoon/upload-audio'
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
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 py-8 px-4 sm:px-6 lg:px-8">
      <div className="max-w-7xl mx-auto">
        <header className="text-center mb-8">
          <h1 className="text-4xl font-bold text-gray-900 mb-2">Presentation Recorder</h1>
          <p className="text-lg text-gray-600">
            Upload your PDF and record audio segments for each slide
          </p>
          {isRecording && (
            <div className="mt-4 flex items-center justify-center">
              <div className="w-4 h-4 bg-red-500 rounded-full animate-pulse mr-3"></div>
              <span className="text-red-600 font-semibold text-lg">🔴 Recording in Progress</span>
            </div>
          )}
        </header>

        <main className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Control Panel */}
          <aside className="lg:col-span-1 space-y-6">
            <section className="card">
              <h2 className="text-xl font-semibold mb-4 text-gray-800">Controls</h2>
              <div className="space-y-4">
                <div>
                  <label
                    className="block text-sm font-medium text-gray-700 mb-2"
                    htmlFor="pdf-upload"
                  >
                    Choose PDF Presentation
                  </label>
                  <input
                    id="pdf-upload"
                    type="file"
                    accept="application/pdf"
                    onChange={onFile}
                    className="input-field w-full file:mr-4 file:py-2 file:px-4 file:rounded-l-lg file:border-0 file:text-sm file:font-medium file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100"
                    aria-label="Upload PDF file"
                  />
                </div>
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
                    placeholder="e.g., investors, customers, team, or type custom..."
                    list="audience-options"
                    className="input-field w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    aria-label="Target Audience"
                  />
                  <datalist id="audience-options">
                    <option value="investors" />
                    <option value="customers" />
                    <option value="team" />
                    <option value="general" />
                  </datalist>
                </div>
                <div className="flex space-x-3">
                  <button
                    onClick={isRecording ? pauseRec : startRec}
                    className={`${
                      isRecording
                        ? 'bg-red-600 hover:bg-red-700 focus:ring-red-500'
                        : 'bg-blue-600 hover:bg-blue-700 focus:ring-blue-500'
                    } flex-1 text-white font-medium py-3 px-4 rounded-lg shadow-md transition-all focus:outline-none focus:ring-2 focus:ring-offset-2`}
                    aria-label={isRecording ? 'Stop recording' : 'Start recording'}
                  >
                    {isRecording ? '⏹️ Stop Recording' : '🎤 Start Recording'}
                  </button>
                  {isRecording && (
                    <div className="flex items-center bg-red-50 px-3 py-2 rounded-lg">
                      <div className="w-3 h-3 bg-red-500 rounded-full animate-pulse mr-2"></div>
                      <span className="text-sm text-red-700 font-medium">Recording...</span>
                    </div>
                  )}
                </div>

                {microphoneError && (
                  <div className="mt-4 p-4 bg-red-50 border border-red-200 rounded-lg">
                    <div className="flex items-center">
                      <div className="flex-shrink-0">
                        <svg
                          className="h-5 w-5 text-red-400"
                          viewBox="0 0 20 20"
                          fill="currentColor"
                        >
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
              </div>
            </section>

            {/* Review Section */}
            {(recordingState === 'paused' || recordingState === 'reviewed') && currentRecording && (
              <section className="card">
                <h2 className="text-xl font-semibold mb-4 text-gray-800">Review Recording</h2>
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
              </section>
            )}

            {/* Segments List */}
            <section className="card">
              <h2 className="text-xl font-semibold mb-4 text-gray-800">Recording Segments</h2>
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
                            <div className="mt-3 p-3 bg-white rounded-lg border border-gray-200">
                              <div className="font-medium text-gray-700 mb-2 flex items-center">
                                <span className="text-green-600 mr-2">📊</span>
                                Evaluation Result
                              </div>
                              <div className="space-y-2">
                                {s.evaluation.input && (
                                  <div>
                                    <div className="text-xs font-medium text-gray-500 uppercase tracking-wide">
                                      Input
                                    </div>
                                    <div className="text-sm text-gray-700 mt-1">
                                      {s.evaluation.input}
                                    </div>
                                  </div>
                                )}
                                {s.evaluation.output && (
                                  <div>
                                    <div className="text-xs font-medium text-gray-500 uppercase tracking-wide">
                                      Feedback
                                    </div>
                                    <div className="text-sm text-gray-700 mt-1 bg-gray-50 p-2 rounded border-l-4 border-blue-400">
                                      {s.evaluation.output}
                                    </div>
                                  </div>
                                )}
                                {!s.evaluation.input && !s.evaluation.output && (
                                  <div className="text-sm text-gray-600">
                                    <pre className="whitespace-pre-wrap text-xs">
                                      {JSON.stringify(s.evaluation, null, 2)}
                                    </pre>
                                  </div>
                                )}
                              </div>
                            </div>
                          )}
                        </div>
                      </div>
                    </li>
                  ))}
                </ul>
              )}
            </section>
          </aside>

          {/* PDF Viewer */}
          <section className="lg:col-span-2">
            <div className="card">
              <h2 className="text-xl font-semibold mb-4 text-gray-800">Presentation Viewer</h2>
              {file ? (
                <div className="bg-gray-50 rounded-lg p-4">
                  <PdfViewer
                    file={file}
                    onReady={(n) => {
                      setPageCount(n);
                      setCurrentPage(1);
                    }}
                    onPageChange={(p) => setCurrentPage(p)}
                  />
                </div>
              ) : (
                <div className="flex flex-col items-center justify-center h-96 bg-gray-50 rounded-lg border-2 border-dashed border-gray-300">
                  <div className="text-6xl mb-4">📄</div>
                  <p className="text-gray-700 text-lg font-medium">
                    Upload a PDF to view your presentation
                  </p>
                  <p className="text-gray-500 text-sm mt-1">Supported format: PDF files</p>
                </div>
              )}
            </div>
          </section>
        </main>
      </div>
    </div>
  );
}
