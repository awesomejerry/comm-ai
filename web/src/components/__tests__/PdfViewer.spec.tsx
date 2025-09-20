import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen, fireEvent } from '@testing-library/react'
import PdfViewer from '../PdfViewer'

// Mock pdfjs-dist
vi.mock('pdfjs-dist/legacy/build/pdf', () => ({
  getDocument: vi.fn(() => ({
    promise: Promise.resolve({
      numPages: 3,
      getPage: vi.fn(() => Promise.resolve({
        getViewport: vi.fn(() => ({ width: 800, height: 600 })),
        render: vi.fn(() => ({
          promise: Promise.resolve()
        }))
      }))
    })
  })),
  GlobalWorkerOptions: {
    workerSrc: 'mock-worker-url'
  }
}))

// Mock the worker URL
vi.mock('pdfjs-dist/build/pdf.worker.min.js?url', () => ({
  default: 'mock-worker-url'
}))

describe('PdfViewer', () => {
  const mockOnReady = vi.fn()
  const mockOnPageChange = vi.fn()

  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('renders with prev/next buttons and page info', () => {
    render(<PdfViewer onReady={mockOnReady} onPageChange={mockOnPageChange} />)

    expect(screen.getByText('← Previous')).toBeInTheDocument()
    expect(screen.getByText('Next →')).toBeInTheDocument()
    expect(screen.getByText('Page 1')).toBeInTheDocument()
  })

  it('renders canvas element for PDF display', () => {
    render(<PdfViewer onReady={mockOnReady} onPageChange={mockOnPageChange} />)

    const canvas = document.querySelector('canvas')
    expect(canvas).toBeInTheDocument()
  })

  it('handles prev/next button clicks without crashing', () => {
    render(<PdfViewer onReady={mockOnReady} onPageChange={mockOnPageChange} />)

    const prevButton = screen.getByText('← Previous')
    const nextButton = screen.getByText('Next →')

    // These should not throw errors
    fireEvent.click(prevButton)
    fireEvent.click(nextButton)
  })

  it('displays correct page info when no document is loaded', () => {
    render(<PdfViewer onReady={mockOnReady} onPageChange={mockOnPageChange} />)

    expect(screen.getByText('Page 1')).toBeInTheDocument()
  })

  it('accepts file prop without crashing', () => {
    const file = new File(['mock pdf content'], 'test.pdf', { type: 'application/pdf' })

    expect(() => {
      render(<PdfViewer file={file} onReady={mockOnReady} onPageChange={mockOnPageChange} />)
    }).not.toThrow()
  })

  it('renders with proper container structure', () => {
    const { container } = render(<PdfViewer onReady={mockOnReady} onPageChange={mockOnPageChange} />)

    // Check for the main container div
    expect(container.firstChild).toBeInTheDocument()

    // Check for button container
    const buttons = container.querySelectorAll('button')
    expect(buttons).toHaveLength(2) // Prev and Next buttons
  })
})