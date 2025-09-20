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
    // start with the current page as the startSlide
    rc.start(currentPage)
  }

  function pauseRec() {
    rcRef.current?.pause(currentPage)
  }

  return (
    <div className="p-6">
      <h1 className="text-2xl font-bold">Presenter</h1>
      <div className="mt-4">
        <label className="block">Choose PDF <input type="file" accept="application/pdf" onChange={onFile} /></label>
      </div>
      <div className="mt-4">
        <button onClick={startRec} className="mr-2 bg-green-500 text-white px-3 py-1 rounded">Start</button>
        <button onClick={pauseRec} className="bg-yellow-500 text-white px-3 py-1 rounded">Pause</button>
      </div>
      <div className="mt-6">
        <PdfViewer file={file} onReady={(n)=> { setPageCount(n); setCurrentPage(1) }} onPageChange={(p)=> setCurrentPage(p)} />
      </div>
      <div className="mt-6">
        <h2>Segments</h2>
        <ul>
          {segments.map(s => <li key={s.id}>{s.id} - {s.state} {s.evaluation ? JSON.stringify(s.evaluation) : ''}</li>)}
        </ul>
      </div>
    </div>
  )
}
