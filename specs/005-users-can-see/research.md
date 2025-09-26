# Research: Display Evaluation Results as Chat

## Decision: Use ChatBubble Component Pattern

**Rationale**: Existing codebase uses React components with Tailwind CSS. Chat interfaces are common in web apps for displaying conversations. A reusable ChatBubble component can encapsulate message display logic.

**Alternatives Considered**:

- Plain list: Simpler but less intuitive for conversation-like display.
- Third-party library: Adds dependencies, prefer custom for consistency.

## Decision: SRT Transcript Parsing

**Rationale**: Input is SRT format (subtitles). Need to parse SRT to display as text messages. Simple regex parsing sufficient for basic SRT.

**Alternatives Considered**:

- Full SRT library: Overkill for display-only.
- Manual parsing: Chosen for simplicity.

## Decision: Read-Only Chat Interface

**Rationale**: Spec requires read-only display. No editing or replying needed, keeping implementation simple.

**Alternatives Considered**:

- Interactive chat: Not required, adds complexity.

## Decision: Integration with Segments List

**Rationale**: Existing "Segments List" in PresenterPage.full.tsx shows evaluation results as JSON. Replace or enhance with chat view when evaluation contains input/output.

**Alternatives Considered**:

- Separate page: Less integrated, user would need to navigate.
