import React, { useRef, useEffect, useState } from 'react'
import * as pdfjsLib from 'pdfjs-dist/legacy/build/pdf'
// Vite: import the worker as a URL so it is served/bundled by the dev server/build
// eslint-disable-next-line @typescript-eslint/ban-ts-comment
// @ts-ignore
import pdfWorkerUrl from 'pdfjs-dist/build/pdf.worker.min.js?url'

// Assign the worker URL provided by Vite (ensures bundler-served worker and matching version)
(pdfjsLib as any).GlobalWorkerOptions.workerSrc = pdfWorkerUrl

export default function PdfViewer({
  file,
  onReady,
  onPageChange
}: {
  file?: File
  onReady?: (pageCount: number) => void
  onPageChange?: (page: number) => void
}) {
  const containerRef = useRef<HTMLDivElement | null>(null)
  const canvasRef = useRef<HTMLCanvasElement | null>(null)
  const [doc, setDoc] = useState<any | null>(null)
  const [pageNum, setPageNum] = useState(1)

  // load PDF from file
  useEffect(() => {
    let cancelled = false
    if (!file) {
      setDoc(null)
      return
    }
    const reader = new FileReader()
    reader.onload = function () {
      const typed = new Uint8Array(this.result as ArrayBuffer)
      pdfjsLib.getDocument({ data: typed }).promise.then((loadedDoc: any) => {
        if (cancelled) return
        setDoc(loadedDoc)
        setPageNum(1)
        onReady?.(loadedDoc.numPages)
      })
    }
    reader.readAsArrayBuffer(file)
    return () => { cancelled = true }
  }, [file])

  // render current page to canvas
  useEffect(() => {
    if (!doc) return
    let cancelled = false
    doc.getPage(pageNum).then((page: any) => {
      if (cancelled) return
      const viewport = page.getViewport({ scale: 1.5 })
      const canvas = canvasRef.current
      if (!canvas) return
      canvas.width = Math.floor(viewport.width)
      canvas.height = Math.floor(viewport.height)
      const ctx = canvas.getContext('2d')!
      const renderContext = {
        canvasContext: ctx,
        viewport
      }
      page.render(renderContext)
    })
    onPageChange?.(pageNum)
    return () => { cancelled = true }
  }, [doc, pageNum])

  function prev() {
    setPageNum(p => Math.max(1, p - 1))
  }
  function next() {
    if (!doc) return
    setPageNum(p => Math.min(doc.numPages, p + 1))
  }

  return (
    <div ref={containerRef}>
      <div className="flex items-center gap-2 mb-2">
        <button onClick={prev} className="px-2 py-1 bg-gray-200 rounded">Prev</button>
        <button onClick={next} className="px-2 py-1 bg-gray-200 rounded">Next</button>
        <div>Page {pageNum}{doc ? ` / ${doc.numPages}` : ''}</div>
      </div>
      <canvas ref={canvasRef} />
    </div>
  )
}
