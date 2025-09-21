import React, { useRef, useEffect, useState } from 'react';
import * as pdfjsLib from 'pdfjs-dist/legacy/build/pdf';
// Vite: import the worker as a URL so it is served/bundled by the dev server/build
// eslint-disable-next-line @typescript-eslint/ban-ts-comment
// @ts-ignore
import pdfWorkerUrl from 'pdfjs-dist/build/pdf.worker.min.js?url';

// Assign the worker URL provided by Vite (ensures bundler-served worker and matching version)
(pdfjsLib as any).GlobalWorkerOptions.workerSrc = pdfWorkerUrl;

export default function PdfViewer({
  file,
  onReady,
  onPageChange,
}: {
  file?: File;
  onReady?: (pageCount: number) => void;
  onPageChange?: (page: number) => void;
}) {
  const containerRef = useRef<HTMLDivElement | null>(null);
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const [doc, setDoc] = useState<any | null>(null);
  const [pageNum, setPageNum] = useState(1);

  // load PDF from file
  useEffect(() => {
    let cancelled = false;
    if (!file) {
      setDoc(null);
      return;
    }
    const reader = new FileReader();
    reader.onload = function () {
      const typed = new Uint8Array(this.result as ArrayBuffer);
      pdfjsLib.getDocument({ data: typed }).promise.then((loadedDoc: any) => {
        if (cancelled) return;
        setDoc(loadedDoc);
        setPageNum(1);
        onReady?.(loadedDoc.numPages);
      });
    };
    reader.readAsArrayBuffer(file);
    return () => {
      cancelled = true;
    };
  }, [file]);

  // render current page to canvas
  useEffect(() => {
    if (!doc) return;
    let cancelled = false;
    doc.getPage(pageNum).then((page: any) => {
      if (cancelled) return;
      const viewport = page.getViewport({ scale: 1 });
      const canvas = canvasRef.current;
      const container = containerRef.current;
      if (!canvas || !container) return;
      const containerWidth = container.clientWidth;
      const availableHeight = window.innerHeight * 0.8; // Use 80% of viewport height to leave space for other elements
      const scaleX = containerWidth / viewport.width;
      const scaleY = availableHeight / viewport.height;
      const scale = Math.min(scaleX, scaleY, 1.5); // cap at 1.5 to not enlarge too much
      const scaledViewport = page.getViewport({ scale });
      canvas.width = Math.floor(scaledViewport.width);
      canvas.height = Math.floor(scaledViewport.height);
      const ctx = canvas.getContext('2d')!;
      const renderContext = {
        canvasContext: ctx,
        viewport: scaledViewport,
      };
      page.render(renderContext);
    });
    onPageChange?.(pageNum);
    return () => {
      cancelled = true;
    };
  }, [doc, pageNum]);

  function prev() {
    setPageNum((p) => Math.max(1, p - 1));
  }
  function next() {
    if (!doc) return;
    setPageNum((p) => Math.min(doc.numPages, p + 1));
  }

  return (
    <div className="bg-white rounded-lg border border-gray-200 overflow-hidden">
      <div className="flex items-center justify-between p-4 bg-gray-50 border-b border-gray-200">
        <div className="flex items-center space-x-4">
          <button
            onClick={prev}
            disabled={pageNum <= 1}
            className="px-3 py-1 bg-white border border-gray-300 rounded-md text-sm font-medium text-gray-700 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent disabled:opacity-50 disabled:cursor-not-allowed"
            aria-label="Previous page"
          >
            ← Previous
          </button>
          <button
            onClick={next}
            disabled={!doc || pageNum >= doc.numPages}
            className="px-3 py-1 bg-white border border-gray-300 rounded-md text-sm font-medium text-gray-700 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent disabled:opacity-50 disabled:cursor-not-allowed"
            aria-label="Next page"
          >
            Next →
          </button>
        </div>
        <div className="text-sm text-gray-600 font-medium">
          Page {pageNum}
          {doc ? ` of ${doc.numPages}` : ''}
        </div>
      </div>
      <div ref={containerRef} className="p-4 bg-gray-100">
        <canvas
          ref={canvasRef}
          className="max-w-full h-auto mx-auto shadow-lg rounded border border-gray-300"
          aria-label={`PDF page ${pageNum}`}
        />
      </div>
    </div>
  );
}
