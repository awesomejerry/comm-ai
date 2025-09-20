# Quickstart: Developer run instructions

1. Install dependencies

```bash
cd /home/jerry/workspace/comm-ai
cd web/ui-presenter   # frontend project root
npm install
```

2. Start dev server

```bash
npm run dev
```

3. Run unit tests (TDD loop)

```bash
npm run test
```

Notes: unit tests use Vitest and the project is TypeScript-based.

4. Run Playwright e2e

```bash
npx playwright test
```

Notes:
- The app is frontend-only and posts audio segments to the provided webhook URL.
- Tests are written to fail initially (TDD). Implementations must make tests pass.
