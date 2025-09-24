# Comm-AI Constitution

## Core Principles

### I. Test-First (NON-NEGOTIABLE)
All new functionality MUST begin with failing tests. Tests include unit tests, contract tests for external boundaries, and integration tests that exercise user-visible flows. Tests are the primary specification for behavior: they MUST be written before implementation, MUST fail initially, and then guide development (Red → Green → Refactor).

Rationale: A test-first approach prevents regressions, documents expected behavior, and enables safe refactors and CI gating.

### II. Contract & Integration Safety
All interactions across service or module boundaries that affect correctness MUST be covered by explicit, versioned contract tests. Any client that POSTs to an external webhook or API MUST have a contract test asserting required fields, headers, and expected response shape. Mocks are allowed for unit tests; end-to-end tests SHOULD exercise the full flow using test servers or Playwright webServer routing where applicable.

Rationale: Consumer-driven contract testing reduces integration surprises and makes deployments safer.

### III. Modular, Library-First Design
Prefer small, well-documented modules or libraries with clear public interfaces. Code that is intended to be reused or easily tested SHOULD be extracted into a library (or package) with its own tests and lightweight README. Avoid large, tightly coupled files and organizational-only libraries that have no independent purpose.

Rationale: Modularity improves testability, reusability, and reviewability — all of which reduce long-term maintenance cost.

### IV. Observability & Robust Error Handling
Systems MUST emit structured logs and meaningful metrics for key flows (uploads, evaluations, recording lifecycles). Error cases MUST be surfaced to users and recorded for telemetry. Client uploads and network interactions MUST implement retry/backoff and provide clear states (queued, uploading, failed, evaluated) so users can understand progress.

Rationale: Observability is required to diagnose issues in production and to ensure a good user experience when network or platform failures occur.

### V. Simplicity, Incremental Change & Semantic Versioning
Favor the simplest solution that satisfies requirements (YAGNI). Deliver in small, reviewable PRs. Public or customer-facing interfaces (APIs, library public exports) MUST follow semantic versioning. Breaking changes MUST be accompanied by a migration plan and a major version bump.

Rationale: Small changes and clear versioning reduce risk and make rollbacks and support easier.

### VI. Spec-Driven Development
All new features and changes that affect user-visible behavior MUST follow a spec-driven workflow: create a specification using the `.specify` tooling (specify → plan → tasks → implement). The workflow enforces: (a) a written spec in `/specs/[###-feature]/spec.md`, (b) a stopping point in `/specs/[###-feature]/plan.md` that ends with readiness for task generation, (c) a `tasks.md` file containing failing tests and ordered implementation steps (tests first), and (d) implementation that makes the tests pass. Each phase MUST respect constitutional gates before progressing.

Rationale: A formal spec-driven flow ensures clarity of scope, repeatable planning, and enables test-first task generation. It ties together documentation, tests, and work items so reviewers can validate scope and safety before code is written.

### VII. Precise Commit Messages
All commit messages MUST be short, precise, and descriptive in one line. They MUST clearly state what was changed and why, following the format: `type: description`. Common types include `feat:`, `fix:`, `docs:`, `refactor:`, `test:`, `chore:`. Messages MUST NOT exceed 72 characters and MUST be written in imperative mood.

Rationale: Clear, concise commit messages improve code history readability, enable better changelog generation, and facilitate efficient code review and debugging.

## Security & Privacy Requirements
1. Sensitive data (microphone audio, evaluation results containing PII) MUST be transmitted over TLS. Storage of audio or evaluation results MUST be minimized and explicitly documented; default behavior is NOT to persist audio beyond the session unless the user opts in.
2. The UI MUST request and clearly explain microphone permissions before recording.
3. Third-party services used for evaluation MUST have documented data handling and retention policies; any transfer of user audio to external providers MUST be approved by product and legal where required.

Rationale: Recording audio is inherently sensitive; explicit user consent and clear handling rules are required to maintain trust and comply with privacy expectations.

## Development Workflow
1. Pull requests MUST include tests demonstrating behavior. CI MUST run unit, contract, and integration tests; a PR cannot be merged unless all CI gates pass and at least one reviewer approves.
2. Code review SHOULD focus on behavior, tests, and API surface. Complexity increases MUST include a short justification and a plan to reduce complexity later.
3. Release flow: merge to main → CI builds artifacts and runs full test suite → publish releases with CHANGELOG entries that document breaking changes and migration steps.

Rationale: A disciplined workflow enforces the constitution and keeps the project maintainable.

## Governance
1. Amendments: Propose changes via a PR against `/memory/constitution.md`. The PR MUST include: rationale, migration/compatibility plan, and any template updates. A change becomes effective after two maintainer approvals or one maintainer plus a scheduled governance meeting note.
2. Versioning policy: Use semantic versioning for the constitution itself. Bump MAJOR for redefinitions or removals of principles, MINOR for adding principles or materially expanding guidance, PATCH for wording clarifications and typos.
3. Compliance: Any PR that materially affects the constitution or governed areas MUST include updates to dependent templates and a short Sync Impact Report.

**Version**: 2.1.1 | **Ratified**: 2025-09-20 | **Last Amended**: 2025-09-20