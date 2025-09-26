# Contract Test: Evaluation Webhook (inferred)

This contract test verifies that the evaluation webhook accepts multipart/form-data with an audio file and returns JSON with segmentId, score, and feedback.

Test steps (automated):

1. POST to https://n8n.awesomejerry.space/webhook/comm-ai/upload-pitch with multipart form-data including a small audio file and fields segmentId, startSlide, endSlide.
2. Expect HTTP 200 and Content-Type: application/json.
3. Validate JSON schema: segmentId (string), score (number), feedback (string).

Notes: For local TDD, mock this endpoint using a test server that returns the expected JSON.
