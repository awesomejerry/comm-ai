# Feature Specification: Q&A Learning Cards Page

## Description

Users can access a dedicated Q&A page, distinct from the existing evaluation Q&A feature. On this page, users view a series of Q&As in a learning cards style, displaying the question first and providing an option to reveal the answer for self-checking.

## Clarifications

### Session 2025-12-06

- Q: What is the expected number of Q&As available in the system? → A: 20-50
- Q: How are Q&As stored and loaded? → A: Retrieved from an external service/API (n8n API)
- Q: What happens after completing all Q&As? → A: Show completion message and allow restart
- Q: Are there specific accessibility requirements? → A: No specific requirements
- Q: How is user progress persisted? → A: Stored in browser local storage

## User Scenarios & Testing

### Primary User Flow

1. User logs in and navigates to the Q&A page.
2. The page displays the first question in a card format.
3. The answer is hidden.
4. User clicks "Reveal Answer" to show the answer.
5. User can navigate to the next question or previous.

### Edge Cases

- No more questions: Show completion message and allow restart.
- Single question: Navigation disabled appropriately.

## Functional Requirements

1. Q&A page accessible from main navigation.
2. Questions displayed one at a time in card format.
3. Answers hidden by default with reveal button.
4. Navigation controls for previous/next questions.
5. Responsive design for desktop and mobile.
6. Questions and answers are pre-loaded.
7. Option to restart the Q&A session after completion.
8. User progress is saved locally and restored on return.
9. Regenerate button to clear current Q&As and generate new set via n8n API.

## Success Criteria

- Users complete a set of 10 Q&As in under 5 minutes on average.
- User feedback survey shows satisfaction above 4/5.

## Key Entities

- Question: Contains the question text.
- Answer: Contains the answer text.
- Q&A Session: Tracks user's progress through the cards.

## Assumptions

- Questions and answers are retrieved from n8n API and managed by admins.
- Users are authenticated.
- The feature is for learning, not assessment.
- Expected number of Q&As available: 20-50.
- No specific accessibility requirements beyond basic responsive design.
- User progress is persisted in browser local storage.

## Dependencies

- User authentication system.
- n8n API for retrieving Q&As.
