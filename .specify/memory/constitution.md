<!--
Sync Impact Report

- Version change: 2.1.1 → 2.1.2
- Modified principles: none
- Added sections: none
- Removed sections: none
- Templates requiring updates: none
- Follow-up TODOs: none

-->

# Comm-AI Constitution

## Core Principles

### Test-First (NON-NEGOTIABLE)

All new functionality MUST begin with failing tests

### Precise Commit Messages

Use one-line, descriptive commits following format `type: description` (feat:, fix:, docs:, refactor:, test:, chore:)

### Spec-Driven Development

Follow specification → plan → tasks → implement workflow

### Contract & Integration Safety

Cover all external boundaries with contract tests

### Modular Design

Prefer small, well-documented modules with clear interfaces

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

Constitution supersedes all other practices; Amendments require documentation, approval, migration plan

**Version**: 2.1.2 | **Ratified**: 2025-09-20 | **Last Amended**: 2025-10-11
