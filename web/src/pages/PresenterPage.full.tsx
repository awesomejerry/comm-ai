import React, { useState } from 'react'
import PdfViewer from '../components/PdfViewer'
import { RecordingController } from '../recording/recordingController'
import { uploadSegmentToWebhook } from '../services/uploader'

export default function PresenterPageFull() {
  const [file, setFile] = useState<File | undefined>()
  const [pageCount, setPageCount] = useState(0)
  const [currentPage, setCurrentPage] = useState(1)
  const [segments, setSegments] = useState<any[]>([])

  const rcRef = React.useRef<RecordingController | null>(null)

  function onFile(e: React.ChangeEvent<HTMLInputElement>) {
    const f = e.target.files?.[0]
    if (f) setFile(f)
  }

  function startRec() {
    const rc = new RecordingController({ onSegmentReady: async (seg) => {
      setSegments(s => [...s, { ...seg, state: 'queued' }])
      try {
        const res = await uploadSegmentToWebhook('https://n8n.awesomejerry.space/webhook/commoon/upload-audio', { id: seg.id, blob: seg.blob, startSlide: seg.startSlide, endSlide: seg.endSlide })
        setSegments(s => s.map(x => x.id === seg.id ? { ...x, state: 'evaluated', evaluation: res } : x))
      } catch (err) {
        setSegments(s => s.map(x => x.id === seg.id ? { ...x, state: 'failed' } : x))
      }
    }})
    rcRef.current = rc
    rc.start(currentPage)
  }

  function pauseRec() {
    rcRef.current?.pause(currentPage)
  }

  return (
    <div className="min-h-screen bg-gray-50 py-8 px-4 sm:px-6 lg:px-8">
      <div className="max-w-7xl mx-auto">
        <header className="text-center mb-8">
          <h1 className="text-4xl font-bold text-gray-900 mb-2">Presentation Recorder</h1>
          <p className="text-lg text-gray-600">Upload your PDF and record audio segments for each slide</p>
        </header>

        <main className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Control Panel */}
          <aside className="lg:col-span-1">
            <section className="card mb-6">
              <h2 className="text-xl font-semibold mb-4">Controls</h2>
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Choose PDF Presentation</label>
                  <input
                    type="file"
                    accept="application/pdf"
                    onChange={onFile}
                    className="input-field w-full"
                    aria-label="Upload PDF file"
                  />
                </div>
                <div className="flex space-x-3">
                  <button onClick={startRec} className="btn-primary flex-1" aria-label="Start recording">
                    Start Recording
                  </button>
                  <button onClick={pauseRec} className="btn-secondary flex-1" aria-label="Pause recording">
                    Pause
                  </button>
                </div>
              </div>
            </section>

            {/* Segments List */}
            <section className="card">
              <h2 className="text-xl font-semibold mb-4">Recording Segments</h2>
              {segments.length === 0 ? (
                <p className="text-gray-700">No segments recorded yet</p>
              ) : (
                <ul className="space-y-2" role="list">
                  {segments.map(s => (
                    <li key={s.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                      <div>
                        <span className="font-medium">Segment {s.id}</span>
                        <span className="text-sm text-gray-500 ml-2">Slides {s.startSlide}-{s.endSlide}</span>
                      </div>
                      <span className={`px-2 py-1 text-xs rounded-full ${
                        s.state === 'evaluated' ? 'bg-green-100 text-green-800' :
                        s.state === 'failed' ? 'bg-red-100 text-red-800' :
                        'bg-yellow-100 text-yellow-800'
                      }`}>
                        {s.state}
                      </span>
                    </li>
                  ))}
                </ul>
              )}
            </section>
          </aside>

          {/* PDF Viewer */}
          <section className="lg:col-span-2">
            <div className="card">
              <h2 className="text-xl font-semibold mb-4">Presentation Viewer</h2>
              {file ? (
                <PdfViewer
                  file={file}
                  onReady={(n) => { setPageCount(n); setCurrentPage(1) }}
                  onPageChange={(p) => setCurrentPage(p)}
                />
              ) : (
                <div className="flex items-center justify-center h-96 bg-gray-100 rounded-lg">
                  <p className="text-gray-700">Upload a PDF to view your presentation</p>
                </div>
              )}
            </div>
          </section>
        </main>
      </div>
    </div>
  )
}
