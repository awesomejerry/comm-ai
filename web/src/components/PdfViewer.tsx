import React, { useRef, useEffect, useState } from 'react';
import * as pdfjsLib from 'pdfjs-dist/legacy/build/pdf.mjs';
import pdfjsWorker from 'pdfjs-dist/build/pdf.worker.min.mjs?url';

// Configure the worker using the local worker file from pdfjs-dist
// Vite will handle bundling this correctly with the ?url import
pdfjsLib.GlobalWorkerOptions.workerSrc = pdfjsWorker;

export default function PdfViewer({
  file,
  onReady,
  onPageChange,
  controlsPosition = 'top',
}: {
  file?: File;
  onReady?: (pageCount: number) => void;
  onPageChange?: (page: number) => void;
  controlsPosition?: 'top' | 'bottom';
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
    
    // Small delay to ensure container is properly sized, especially in full-screen mode
    const timer = setTimeout(() => {
      doc.getPage(pageNum).then((page: any) => {
        if (cancelled) return;
        const viewport = page.getViewport({ scale: 1 });
        const canvas = canvasRef.current;
        const container = containerRef.current;
        if (!canvas || !container) return;
        
        // Get actual container dimensions
        const containerWidth = container.clientWidth;
        const containerHeight = container.clientHeight;
        
        // Calculate scale to fit the container
        const scaleX = containerWidth / viewport.width;
        const scaleY = containerHeight / viewport.height;
        const scale = Math.min(scaleX, scaleY, 2.0); // cap at 2.0 to prevent excessive enlargement
        
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
    }, 50); // 50ms delay to let container resize
    
    onPageChange?.(pageNum);
    return () => {
      cancelled = true;
      clearTimeout(timer);
    };
  }, [doc, pageNum]);

  // Handle keyboard navigation (arrow keys)
  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'ArrowLeft') {
        prev();
      } else if (event.key === 'ArrowRight') {
        next();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [doc, pageNum]); // Include dependencies so prev/next have current values

  function prev() {
    setPageNum((p) => Math.max(1, p - 1));
  }
  function next() {
    if (!doc) return;
    setPageNum((p) => Math.min(doc.numPages, p + 1));
  }

  const controls = (
    <div className={`flex items-center justify-between p-4 ${
      controlsPosition === 'bottom' 
        ? 'bg-transparent' 
        : 'bg-gray-50 border-b border-gray-200'
    }`}>
      <div className="flex items-center space-x-4">
        <button
          onClick={prev}
          disabled={pageNum <= 1}
          className={`px-3 py-1 border rounded-md text-sm font-medium focus:outline-none focus:ring-2 focus:ring-commAi-primary focus:border-transparent disabled:opacity-50 disabled:cursor-not-allowed ${
            controlsPosition === 'bottom'
              ? 'bg-white/10 border-white/20 text-white hover:bg-white/20 backdrop-blur-sm'
              : 'bg-white border-gray-300 text-gray-700 hover:bg-gray-50'
          }`}
          aria-label="Previous page"
        >
          ← Previous
        </button>
        <button
          onClick={next}
          disabled={!doc || pageNum >= doc.numPages}
          className={`px-3 py-1 border rounded-md text-sm font-medium focus:outline-none focus:ring-2 focus:ring-commAi-primary focus:border-transparent disabled:opacity-50 disabled:cursor-not-allowed ${
            controlsPosition === 'bottom'
              ? 'bg-white/10 border-white/20 text-white hover:bg-white/20 backdrop-blur-sm'
              : 'bg-white border-gray-300 text-gray-700 hover:bg-gray-50'
          }`}
          aria-label="Next page"
        >
          Next →
        </button>
      </div>
      <div className={`text-sm font-medium ${
        controlsPosition === 'bottom' ? 'text-white' : 'text-gray-600'
      }`}>
        Page {pageNum}
        {doc ? ` of ${doc.numPages}` : ''}
      </div>
    </div>
  );

  return (
    <div className={`rounded-lg overflow-hidden w-full h-full flex flex-col relative ${
      controlsPosition === 'bottom' 
        ? 'bg-transparent border-0' 
        : 'bg-white border border-gray-200'
    }`}>
      {controlsPosition === 'top' && controls}
      <div ref={containerRef} className={`flex-1 p-4 flex items-center justify-center overflow-hidden ${
        controlsPosition === 'bottom' ? 'bg-transparent' : 'bg-gray-100'
      }`}>
        <canvas
          ref={canvasRef}
          className={`max-w-full max-h-full h-auto mx-auto shadow-lg rounded ${
            controlsPosition === 'bottom' ? 'border-0' : 'border border-gray-300'
          }`}
          aria-label={`PDF page ${pageNum}`}
        />
      </div>
      {controlsPosition === 'bottom' && (
        <div className="absolute bottom-0 left-0 right-0 z-10 bg-gradient-to-t from-black/50 to-transparent pb-2">
          {controls}
        </div>
      )}
    </div>
  );
}
