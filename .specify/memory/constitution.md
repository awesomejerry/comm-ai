# comm-ai Constitution

This constitution captures the engineering principles, testing and release quality gates, and governance rules that guide development in this repository. It reflects decisions made during the implementation of the `ui-presenter` feature (PDF canvas viewer, recording controller, uploader, tests and E2E). Follow this document when proposing features, tests, and CI changes.

## Core Principles

I. Library-first and Test-first
- New features should start as small, focused modules or components with clear responsibility. Each module must be independently testable.
- Test-First (TDD) is required for behavioral changes: write the tests (unit or contract) that capture the requirement, see them fail, implement the minimal code to make them pass, then refactor.

II. Contract and Integration Safety
- Inter-service boundaries require contract tests. Any client that POSTs to an external webhook or API must have a contract test that asserts the request shape and required fields.
- Mocking is allowed for unit tests; E2E tests should exercise the whole flow with mocks or test servers where appropriate (Playwright webServer + request routing is preferred).

III. Observable and Debuggable
- Prefer structured outputs for debugging: tests and E2E should produce traces, screenshots, or structured logs on failures (Playwright traces/screenshots when enabled).
- Client code should expose enough events/metadata to be observed in tests (for example, segments include startSlide/endSlide and raw evaluation JSON).

IV. Minimal, Explicit Dependencies
- Prefer bundler-friendly imports and avoid runtime hacks. Example: use Vite's `?url` worker import for `pdfjs-dist` instead of path-based worker hacks.
- Keep third-party dependencies narrowly scoped and pinned where possible; prefer built-in Node APIs + small well-audited packages for test helpers.

V. Simplicity and YAGNI
- Start small, deliver the simplest implementation that satisfies tests and user requirements. Avoid premature optimization or heavy infra unless proven necessary.

## Technology Constraints & Stack (current)
- Frontend: Vite + React + TypeScript
- Styling: Tailwind CSS
- State: Jotai (used where local atomic state is needed)
- PDF: pdfjs-dist (import worker via bundler `?url` to avoid API/Worker mismatch)
- Recording: Browser MediaRecorder wrapped by a `RecordingController` (start/pause/stop semantics; emits segments)
- Upload/evaluation: client POST multipart/form-data to configured webhook (contract test required)
- Testing: Vitest for unit tests, Playwright for E2E

## Development Workflow & Quality Gates

Local development
- Use `npm run dev` to start the Vite dev server. Playwright tests can start the dev server automatically via the `webServer` config.

Pre-merge quality gates (CI)
- Typecheck: `npx tsc --noEmit` — must pass
- Unit tests: `npx vitest --run` — all unit tests (fast, isolated) must pass
- Contract tests: run as part of unit/test stage — any change touching external contracts must add/update contract tests
- E2E smoke: Playwright smoke tests (configured to start dev server) — run before merging long-lived branches or in nightly pipelines
- Linting & formatting: run lint and format checks where applicable

Failure handling
- Any failing test in unit/contract/E2E blocks the merge. Authors must add failing tests first for behavioral changes and fix code until tests pass.

## Security and Data Handling
- Do not record or exfiltrate secrets in tests (API keys, tokens). Use mocks for external APIs in unit tests. E2E may use test-only endpoints or request routing to avoid touching production services.
- Audio blobs and user data should not be committed to the repo. `.gitignore` excludes `uploads/` and `test-results/`.

## Observability & Debugging
- Playwright: enable traces/screenshots on failures in CI to aid debugging.
- Vitest: produce sufficient test setup logs; use small, focused tests.

## Governance
- Amendments: Changes to this constitution must be proposed via a spec PR under `/specs/` and include:
	- Motivation and rationale
	- Migration plan for existing code/tests (if required)
	- Tests demonstrating compliance
- Review: All PRs must have at least one reviewer and pass all configured quality gates before merge.

## Responsibilities
- Authors: write TDD tests (unit and contract) before implementing behavior; ensure local dev checks pass.
- Reviewers: verify tests adequately cover behavior, contract changes are explicit, and that worker/asset imports follow bundler-friendly patterns.

## Examples and Local Guidance
- Contract test example: `src/services/__tests__/uploader.contract.spec.ts` asserts multipart/form-data fields for the evaluation webhook.
- E2E example: `tests/e2e/recording.spec.ts` demonstrates Playwright routing of the webhook and a page load check.

## Versioning & Dates
- Version: 1.0.0 | Ratified: 2025-09-20 | Last Amended: 2025-09-20
