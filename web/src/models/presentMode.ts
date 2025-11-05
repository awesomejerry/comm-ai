/**
 * Present Mode Type Definitions
 *
 * Defines the types and state management for presentation mode switching.
 * Users can toggle between "practice" and "present" modes.
 */

import { atom } from 'jotai';

/**
 * Presentation mode options
 * - practice: Standard interface with full controls
 * - present: Full-screen with minimal controls (exit button, slide counter)
 */
export type PresentationMode = 'practice' | 'present';

/**
 * Jotai atom for managing the current presentation mode state
 * Default: practice mode
 */
export const presentationModeAtom = atom<PresentationMode>('practice');

/**
 * Jotai atom for tracking if recording is currently active
 * Used to prevent mode switching during active recording
 */
export const isRecordingActiveAtom = atom<boolean>(false);

/**
 * Present mode UI state
 */
export interface PresentModeState {
  mode: PresentationMode;
  isRecording: boolean;
  hasActiveRecording: boolean;
}
