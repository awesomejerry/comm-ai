# Quickstart: Audio Recording Review

## Overview

This feature adds review functionality to the audio recording system. Users can pause recording, listen to the audio, and choose to upload or delete before evaluation.

## Prerequisites

- Node.js and npm installed
- Project dependencies installed (`npm install`)
- Development server running (`npm run dev`)

## Testing the Feature

### Manual Testing Steps

1. **Start the application**: Open http://localhost:5173
2. **Navigate to presenter page**: Load a PDF presentation
3. **Start recording**: Click record button to begin audio capture
4. **Pause recording**: Click pause button during recording
5. **Review recording**: Use the new review controls to listen to the audio
6. **Confirm or delete**:
   - Click "Confirm Upload" to proceed with evaluation
   - Click "Delete Recording" to discard and restart

### Expected Behavior

- Recording pauses and shows review controls
- Audio playback works with play/pause/seek
- Upload proceeds to evaluation webhook on confirm
- Recording is discarded on delete
- UI provides clear feedback for all states

## Development

- **Unit tests**: `npm test` (includes new review component tests)
- **E2E tests**: `npx playwright test` (includes recording review flow)
- **Contract tests**: Verify upload webhook integration unchanged

## Key Files Modified

- `src/recording/recordingController.ts` - Added review state management
- `src/pages/PresenterPage.tsx` - Added review UI controls
- `src/components/AudioReview.tsx` - New component for playback
- `src/services/uploader.ts` - Extended with delete functionality

## Troubleshooting

- **No audio playback**: Check browser microphone permissions
- **Upload fails**: Verify network connection and webhook endpoint
- **UI not updating**: Check console for React state errors
