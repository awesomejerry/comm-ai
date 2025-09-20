import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen, fireEvent } from '@testing-library/react'
import PresenterPageFull from '../../pages/PresenterPage.full'

// Mock the uploader
vi.mock('../../services/uploader', () => ({
  uploadSegmentToWebhook: vi.fn(() => Promise.resolve({ input: 'test', output: 'evaluation' }))
}))

// Mock the uploader queue
vi.mock('../../services/uploaderQueue', () => ({
  UploaderQueue: vi.fn().mockImplementation(() => ({
    addSegment: vi.fn()
  }))
}))

// Mock the recording controller
vi.mock('../../recording/recordingController', () => ({
  RecordingController: vi.fn().mockImplementation(({ onSegmentReady }) => ({
    start: vi.fn((startSlide) => {
      // Simulate creating a segment after starting
      setTimeout(() => {
        if (onSegmentReady) {
          onSegmentReady({
            id: 'seg1',
            startSlide: startSlide,
            endSlide: startSlide,
            blob: new Blob(['test'], { type: 'audio/webm' })
          })
        }
      }, 100)
      return Promise.resolve()
    }),
    pause: vi.fn((endSlide) => {
      // Simulate creating a segment when pausing
      if (onSegmentReady) {
        onSegmentReady({
          id: 'seg1',
          startSlide: 1,
          endSlide: endSlide,
          blob: new Blob(['test'], { type: 'audio/webm' })
        })
      }
    }),
    onSegmentReady: undefined
  }))
}))

// Mock pdfjs-dist to avoid complex setup
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

vi.mock('pdfjs-dist/build/pdf.worker.min.js?url', () => ({
  default: 'mock-worker-url'
}))

describe('PresenterPage Integration', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('renders the main UI components', () => {
    render(<PresenterPageFull />)

    expect(screen.getByText('Presentation Recorder')).toBeInTheDocument()
    expect(screen.getByText('Choose PDF Presentation')).toBeInTheDocument()
    expect(screen.getByText('🎤 Start Recording')).toBeInTheDocument()
    expect(screen.getByText('Recording Segments')).toBeInTheDocument()
    expect(screen.getByText('Presentation Viewer')).toBeInTheDocument()
  })

  it('shows upload prompt when no PDF is selected', () => {
    render(<PresenterPageFull />)

    expect(screen.getByText('Upload a PDF to view your presentation')).toBeInTheDocument()
  })

  it('handles PDF file upload', () => {
    render(<PresenterPageFull />)

    const fileInput = screen.getByLabelText('Upload PDF file')
    const file = new File(['mock pdf content'], 'presentation.pdf', { type: 'application/pdf' })

    fireEvent.change(fileInput, { target: { files: [file] } })

    // The component should handle the file upload
    expect(fileInput).toBeInTheDocument()
  })

  it('starts recording when start button is clicked', () => {
    render(<PresenterPageFull />)

    const startButton = screen.getByRole('button', { name: 'Start recording' })
    fireEvent.click(startButton)

    expect(screen.getByText('Recording...')).toBeInTheDocument()
  })

  it('stops recording when stop button is clicked', () => {
    render(<PresenterPageFull />)

    // Start recording first
    const startButton = screen.getByRole('button', { name: 'Start recording' })
    fireEvent.click(startButton)

    // Then stop recording
    const stopButton = screen.getByRole('button', { name: 'Stop recording' })
    fireEvent.click(stopButton)

    // The recording indicator should be gone
    expect(screen.queryByText('Recording...')).not.toBeInTheDocument()
  })

  it('shows no segments initially', () => {
    render(<PresenterPageFull />)

    expect(screen.getByText('No segments recorded yet')).toBeInTheDocument()
  })

  it('displays proper accessibility labels', () => {
    render(<PresenterPageFull />)

    const fileInput = screen.getByLabelText('Upload PDF file')
    expect(fileInput).toHaveAttribute('type', 'file')
    expect(fileInput).toHaveAttribute('accept', 'application/pdf')
  })

  it('renders audience selection input field', () => {
    render(<PresenterPageFull />)

    const audienceInput = screen.getByLabelText('Target Audience')
    expect(audienceInput).toBeInTheDocument()
    expect(audienceInput.tagName).toBe('INPUT')
    expect(audienceInput).toHaveAttribute('type', 'text')
    expect(audienceInput).toHaveAttribute('list', 'audience-options')
  })

  it('displays audience suggestions in datalist', () => {
    render(<PresenterPageFull />)

    const datalist = document.getElementById('audience-options')
    expect(datalist).toBeInTheDocument()
    expect(datalist?.tagName).toBe('DATALIST')

    const options = datalist?.querySelectorAll('option')
    expect(options).toHaveLength(4)
    expect(options?.[0]).toHaveAttribute('value', 'investors')
    expect(options?.[1]).toHaveAttribute('value', 'customers')
    expect(options?.[2]).toHaveAttribute('value', 'team')
    expect(options?.[3]).toHaveAttribute('value', 'general')
  })

  it('allows typing custom audience and stores input', () => {
    render(<PresenterPageFull />)

    const audienceInput = screen.getByLabelText('Target Audience') as HTMLInputElement

    // Type custom audience
    fireEvent.change(audienceInput, { target: { value: 'executives' } })

    expect(audienceInput.value).toBe('executives')
  })

  it('allows selecting from datalist suggestions', () => {
    render(<PresenterPageFull />)

    const audienceInput = screen.getByLabelText('Target Audience') as HTMLInputElement

    // Select from datalist
    fireEvent.change(audienceInput, { target: { value: 'investors' } })

    expect(audienceInput.value).toBe('investors')
  })

  it('shows selected audience in recording segments', () => {
    render(<PresenterPageFull />)

    // Select audience first
    const audienceInput = screen.getByLabelText('Target Audience') as HTMLInputElement
    fireEvent.change(audienceInput, { target: { value: 'customers' } })

    // Start and stop recording to create a segment
    const startButton = screen.getByRole('button', { name: 'Start recording' })
    fireEvent.click(startButton)

    const stopButton = screen.getByRole('button', { name: 'Stop recording' })
    fireEvent.click(stopButton)

    // Check that the segment shows the selected audience
    expect(screen.getByText('Audience: Customers')).toBeInTheDocument()
  })

  it('shows custom typed audience in recording segments', () => {
    render(<PresenterPageFull />)

    // Type custom audience
    const audienceInput = screen.getByLabelText('Target Audience') as HTMLInputElement
    fireEvent.change(audienceInput, { target: { value: 'board members' } })

    // Start and stop recording to create a segment
    const startButton = screen.getByRole('button', { name: 'Start recording' })
    fireEvent.click(startButton)

    const stopButton = screen.getByRole('button', { name: 'Stop recording' })
    fireEvent.click(stopButton)

    // Check that the segment shows the custom audience
    expect(screen.getByText('Audience: Board members')).toBeInTheDocument()
  })
})