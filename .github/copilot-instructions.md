# comm-ai Development Guidelines

Auto-generated from feature plans. Last updated: 2025-09-20

Maintainers: TODO - Add maintainer information

Note for the generator: the following sections are intended to be populated by
the `.specify` tooling (e.g., scripts that aggregate `plan.md` files). Keep the
`<!-- MANUAL ADDITIONS START -->` / `<!-- MANUAL ADDITIONS END -->` markers
intact so manual edits are preserved across automated regenerations.

## Active Technologies
- N/A (display-only feature) (005-users-can-see)

- TypeScript 5.x, Node.js + React 18, Vite, Tailwind CSS, pdf.js (004-apply-branding-to)
- N/A (UI/branding changes only) (004-apply-branding-to)

- TypeScript 5.x
- Node.js
- React 18
- Vite
- Tailwind CSS
- Playwright
- Vitest
- pdf.js

## Project Structure

```
web/
  src/
    components/
    models/
    pages/
    services/
    recording/
  tests/
    contract/
    e2e/
    integration/
    unit/
  public/
specs/
  [feature]/
    plan.md
    spec.md
    research.md
    data-model.md
    contracts/
    tasks.md
```

## Commands

- `npm install` - Install dependencies
- `npm run dev` - Start development server
- `npm run build` - Build for production
- `npm test` - Run unit tests
- `npm run test:e2e` - Run end-to-end tests
- `npx playwright test` - Run Playwright tests
- `npx tsc --noEmit` - Type check TypeScript

## Code Style

: Follow standard conventions

## Recent Changes
- 005-users-can-see: Added TypeScript 5.x, Node.js + React 18, Vite, Tailwind CSS, pdf.js

- 004-apply-branding-to: Applied Comm-AI branding with custom color scheme and modern responsive UI
- 003-audio-recording-review: Added audio review functionality before uploading recordings

<!-- MANUAL ADDITIONS START -->

## Constitution Compliance

**IMPORTANT**: Always read and follow the project constitution at `.specify/memory/constitution.md` before making any changes or commits.

### Key Constitution Requirements:

- **Test-First**: All new functionality MUST begin with failing tests
- **Precise Commit Messages**: Use one-line, descriptive commits following format `type: description` (feat:, fix:, docs:, refactor:, test:, chore:)
- **Spec-Driven Development**: Follow specification → plan → tasks → implement workflow
- **Contract & Integration Safety**: Cover all external boundaries with contract tests
- **Modular Design**: Prefer small, well-documented modules with clear interfaces

### Commit Message Standards:

- Format: `type: description` (max 72 characters)
- Types: `feat:`, `fix:`, `docs:`, `refactor:`, `test:`, `chore:`
- Imperative mood, clear and descriptive
- Example: `feat: add audio recording review before uploading`

**VIOLATION**: Any commit that doesn't follow constitution principles may be rejected.

<!-- MANUAL ADDITIONS END -->

<!-- Generator guidance
- DATE should be ISO format YYYY-MM-DD
- Active Technologies: list major frameworks and runtimes (short names)
- Project Structure: include top-level folders and any multi-repo layout
- Commands: only include commands a developer can run locally or in CI
- Code Style: reference lint/format configs (eslint/prettier/ruff) if present
-->
