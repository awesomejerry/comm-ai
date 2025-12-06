# Data Model: Q&A Learning Cards Page

**Date**: 2025-12-06

## Entities

### Question

- **id**: string (unique identifier)
- **text**: string (question content, required, non-empty)

### Answer

- **id**: string (unique identifier, matches question id)
- **text**: string (answer content, required, non-empty)
- **evidence**: string (ground truth information supporting the answer, required)

### Q&A Session

- **currentIndex**: number (current question index, 0-based)
- **revealed**: boolean (whether current answer is revealed)
- **questionIds**: array of string (list of question ids in order)

## Relationships

- Question has one Answer (1:1)
- Q&A Session references multiple Questions

## Validation Rules

- Question.text: not empty, max 1000 characters
- Answer.text: not empty, max 2000 characters
- Answer.evidence: not empty, max 2000 characters
- Q&A Session.currentIndex: >=0, < questionIds.length
- questionIds: array of valid question ids, 20-50 items

## State Transitions

- Initial: currentIndex=0, revealed=false
- Reveal: revealed=true
- Next: currentIndex++, revealed=false
- Previous: currentIndex--, revealed=false
- Restart: currentIndex=0, revealed=false
