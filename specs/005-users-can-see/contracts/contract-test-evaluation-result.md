# Contract Test: Evaluation Result Webhook Response

## Test Case: Valid Evaluation Result Response

**Given** the webhook returns a response for evaluation completion
**When** the response is received
**Then** it must match the schema:

- input is a non-empty string (SRT transcript)
- output is a non-empty string (AI text response)

## Test Case: Invalid Response Format

**Given** the webhook returns malformed data
**When** parsing the response
**Then** it should throw validation error

## Test Case: Missing Required Fields

**Given** the webhook response lacks required fields
**When** validating the response
**Then** it should reject with clear error message
