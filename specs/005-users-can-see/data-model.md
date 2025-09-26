# Data Model: Display Evaluation Results as Chat

## Entities

### EvaluationResult

- **id**: string (segment id)
- **input**: string (SRT formatted transcript)
- **output**: string (AI generated text response)
- **timestamp**: Date (when evaluated)

## Relationships

None (direct properties)

## Validation Rules

- Input must be valid SRT format
- Output must be non-empty string
- Exactly one input/output pair per result

## State Transitions

- None (static display)
