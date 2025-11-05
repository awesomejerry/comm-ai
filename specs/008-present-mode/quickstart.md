# Quickstart: Immersive Present Mode with Auto-Recording

## Overview

This feature adds an immersive "present mode" to the presentation application. Users can switch from practice mode to present mode via a toggle button. Present mode displays slides full-screen with minimal controls, automatically records audio with slide navigation timestamps, and provides an upload interface for evaluation after exiting.

## Prerequisites

- Node.js and npm installed
- Project dependencies installed (`npm install`)
- Development server running (`npm run dev`)
- Microphone access granted in browser
- Modern browser with MediaRecorder API support (Chrome, Firefox, Safari, Edge)

## Quick Start

### 1. Start the Application

```bash
cd web
npm run dev
```

Open http://localhost:5173 in your browser.

### 2. Load a Presentation

1. Navigate to the presenter page
2. Upload a PDF file
3. Slides will be displayed in practice mode (default)

### 3. Enter Present Mode

1. Click the "Enter Present Mode" toggle button
2. Browser may request microphone permission (grant it)
3. Slides switch to full-screen layout with minimal controls
4. Recording automatically starts

### 4. Present Your Slides

1. Navigate through slides using arrow keys or navigation controls
2. Each slide transition is timestamped automatically
3. Recording indicator shows active recording status
4. Exit button visible in top-right corner

### 5. Exit Present Mode

**Option 1: Normal Exit (No Active Recording)**

1. Click "Exit Present Mode" button (or press Escape)
2. Returns to practice mode layout immediately

**Option 2: Exit with Active Recording**

1. Click "Exit Present Mode" button (or press Escape)
2. Confirmation dialog appears with three options:
   - **Save & Exit**: Saves recording to IndexedDB for later upload, returns to practice mode
   - **Discard & Exit**: Deletes recording, returns to practice mode
   - **Continue Recording**: Stays in present mode
3. Recording indicator shows active status during decision
4. Browser beforeunload warning prevents accidental tab close

### 6. Review and Upload Persisted Recordings

After saving a recording on exit:

1. **Upload Section** appears in practice mode showing:
   - Recording duration (e.g., "25:34" or "1:42:15" for long recordings)
   - Save timestamp and expiry date (7 days from creation)
   - **Warning (if <30s)**: "Recording is under 30 seconds. Consider re-recording for better evaluation results."
   - **Warning (if >2.5h)**: "Recording exceeds 2.5 hours. Maximum supported duration is 3 hours."
2. Click "Upload for Evaluation" button
   - Button disables during upload
   - Loading spinner shows progress
3. After successful upload:
   - Recording removed from IndexedDB
   - Evaluation results appear in existing interface with "Present" badge
4. **Auto-Cleanup**: Expired recordings (>7 days) automatically deleted on app load

## Testing the Feature

### Manual Testing Steps

1. **Mode switching**:

   - Toggle to present mode → verify full-screen layout, recording starts
   - Toggle to practice mode with no recording → immediate exit
   - Toggle to practice mode with active recording → confirmation dialog appears

2. **Auto-recording**:
   - Enter present mode → verify red recording indicator visible
   - Check microphone permission prompt on first use
3. **Timestamp tracking**:

   - Navigate slides in present mode
   - Exit and upload → check evaluation shows slide-by-slide timestamps

4. **Exit confirmation**:

   - Start recording in present mode
   - Click exit → verify dialog shows Save/Discard/Continue options
   - Test each option:
     - Save & Exit → recording persists in IndexedDB
     - Discard & Exit → recording deleted
     - Continue Recording → stays in present mode

5. **Browser close protection**:

   - Start recording in present mode
   - Try to close browser tab → verify beforeunload warning appears
   - Exit present mode → try to close tab → no warning

6. **Persistence**:
   - Save a recording
   - Refresh page → verify recording appears in upload section with duration, save date, expiry date
7. **Upload**:
   - Click "Upload for Evaluation" → verify button disables, spinner shows
   - After success → recording removed from list, evaluation appears with "Present" badge
8. **7-day expiry**:

   - Mock an old recording in IndexedDB (createdAt > 7 days ago)
   - Refresh page → verify old recording auto-deleted

9. **Warnings**:

   - Create recording <30 seconds → verify amber warning shows "under 30 seconds"
   - Create recording >2.5 hours → verify orange warning shows "exceeds 2.5 hours"

10. **Error handling**:
    - Disconnect microphone mid-recording → verify error message
    - Deny microphone permission → verify graceful error handling

### Expected Behavior

- Full-screen mode activates with minimal UI (exit button, slide counter, recording indicator)
- Recording indicator (red dot + "Recording...") visible during present mode
- Slide transitions captured with accurate timestamps (<100ms)
- Exit with active recording shows confirmation dialog (Save & Exit / Discard & Exit / Continue Recording)
- Browser beforeunload warning prevents data loss during active recording
- Recording persists in IndexedDB for 7 days after saving
- Upload includes mode: "present" and timestamps JSON in payload
- Evaluation results display in existing interface with "Present" badge
- Expired recordings (>7 days) automatically deleted on app load
- Duration warnings for <30s (amber) and >2.5h (orange) recordings
- Graceful error handling for microphone failures mid-recording

## Development

### Running Tests

```bash
# Unit tests
npm test

# E2E tests
npx playwright test

# Contract tests
npm run test:contract

# Coverage
npm run test:coverage
```

### Key Files to Modify

**New Files**:

- `src/components/PresentModeToggle.tsx` - Mode switcher button
- `src/components/PresentModeView.tsx` - Full-screen UI
- `src/models/presentMode.ts` - Type definitions
- `src/recording/timestampTracker.ts` - Timestamp tracking
- `src/recording/recordingPersistence.ts` - IndexedDB management
- `tests/e2e/present-mode.spec.ts` - E2E tests
- `tests/contract/present-mode-evaluation.spec.ts` - Contract tests

**Modified Files**:

- `src/pages/PresenterPage.full.tsx` - Integrate present mode UI
- `src/recording/recordingController.ts` - Add mode parameter
- `src/services/evaluationService.ts` - Add mode field to payload

### Development Workflow

1. Write failing test for present mode feature
2. Implement minimum code to pass test
3. Refactor if needed
4. Run full test suite
5. Commit with format: `feat: add present mode toggle`

## Troubleshooting

### Microphone Permission Denied

- **Symptom**: Error message when entering present mode
- **Solution**: Grant microphone permission in browser settings
- **Browser Settings**:
  - Chrome: chrome://settings/content/microphone
  - Firefox: about:preferences#privacy
  - Safari: Preferences > Websites > Microphone

### Recording Not Persisting

- **Symptom**: Recording disappears on page refresh
- **Solution**: Check browser IndexedDB support
- **Debug**: Open DevTools > Application > IndexedDB > check `recordings` store

### Upload Failing

- **Symptom**: Error message after clicking upload
- **Solution**: Verify API endpoint reachable
- **Debug**: Check Network tab for upload-pitch request, verify mode field present

### Full-Screen Not Working

- **Symptom**: Present mode doesn't fill screen
- **Solution**: Check CSS full-screen styles applied
- **Debug**: Inspect element, verify `position: fixed` and `z-index` set correctly

### Timestamps Not Captured

- **Symptom**: Evaluation missing timestamp data
- **Solution**: Verify TimestampTracker listening to slide changes
- **Debug**: Console log timestamps array before upload

## API Integration

### Payload Format

The evaluation API receives a FormData payload with these fields:

```javascript
{
  audio: <Blob>,           // 64 kbps audio file
  startSlide: 1,           // First slide presented
  endSlide: 12,            // Last slide presented
  audience: "investors",   // Target audience
  mode: "present",         // NEW: Indicates present mode
  timestamps: '[...]'      // NEW: JSON array of navigation events
}
```

### Response Format

Same as existing practice mode:

```json
{
  "input": "Transcribed audio...",
  "output": "Evaluation feedback..."
}
```

## Storage Management

### IndexedDB Structure

**Database**: `comm-ai-recordings`
**Object Store**: `recordings`

**Record Structure**:

```javascript
{
  id: "rec-abc123",
  audioBlob: <Blob>,
  timestamps: [{slideIndex: 1, timestamp: 0, transitionType: "jump"}, ...],
  duration: 120.5,
  createdAt: 1699123456789,
  expiryDate: 1699728256789, // createdAt + 7 days
  uploadStatus: "pending",
  metadata: {
    startSlide: 1,
    endSlide: 12,
    audience: "investors",
    mode: "present"
  }
}
```

### Cleanup Process

- Runs automatically on app load
- Deletes recordings where `Date.now() > expiryDate`
- Also deletes after successful upload (immediate cleanup)
- Manual cleanup option available in UI (future enhancement)

## Performance Considerations

- **Mode switch**: <1 second transition
- **Timestamp capture**: <100ms accuracy
- **Recording start**: <1 second (microphone access)
- **Upload**: Depends on file size and network (10-min recording ≈ 5MB)
- **Storage cleanup**: <100ms for typical number of recordings

## Next Steps

After implementing this feature:

1. Monitor user feedback on present mode UX
2. Consider adding keyboard shortcuts for mode switching
3. Explore presenter notes overlay in present mode
4. Add analytics for timestamp-based engagement metrics
5. Implement manual recording cleanup UI
