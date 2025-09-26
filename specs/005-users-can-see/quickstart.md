# Quickstart: Display Evaluation Results as Chat

## Integration Test Scenarios

### Scenario: Display Evaluation Result in Chat Format

**Given** a presenter has uploaded an audio segment and received evaluation
**When** viewing the segments list
**Then** the evaluated segment shows a chat interface with:

- Input message: SRT transcript displayed as user message
- Output message: AI text displayed as AI message
- Visual distinction between user and AI messages

### Scenario: Handle Missing Evaluation Data

**Given** a segment is in evaluated state but data is malformed
**When** displaying the chat
**Then** show error message instead of chat

### Scenario: Read-Only Interaction

**Given** the chat is displayed
**When** user attempts to interact (click, type)
**Then** no interaction is possible (read-only)
