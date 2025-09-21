# comm-ai Development Guidelines

Auto-generated from feature plans. Last updated: 2025-09-20

Maintainers: TODO - Add maintainer information

Note for the generator: the following sections are intended to be populated by
the `.specify` tooling (e.g., scripts that aggregate `plan.md` files). Keep the
`<!-- MANUAL ADDITIONS START -->` / `<!-- MANUAL ADDITIONS END -->` markers
intact so manual edits are preserved across automated regenerations.

## Active Technologies

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

- TypeScript: Use strict mode, explicit types, avoid any
- React: Functional components with hooks, proper TypeScript interfaces
- Naming: camelCase for variables/functions, PascalCase for components/types
- Imports: Group by external libraries, then internal modules

## Recent Changes

- 001-create-a-web: Created web application with PDF presenter, audio recording, and evaluation webhook integration
- 002-re-design-the: Complete UI redesign for professional, user-friendly interface
- 003-audio-recording-review: Audio recording review before uploading feature

<!-- MANUAL ADDITIONS START -->
<!-- MANUAL ADDITIONS END -->

<!-- Generator guidance
- DATE should be ISO format YYYY-MM-DD
- Active Technologies: list major frameworks and runtimes (short names)
- Project Structure: include top-level folders and any multi-repo layout
- Commands: only include commands a developer can run locally or in CI
- Code Style: reference lint/format configs (eslint/prettier/ruff) if present
-->
