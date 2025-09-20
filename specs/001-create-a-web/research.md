# Phase 0 — Research: Slide-based presenter

Decision: Implement frontend-only web app using Vite + React + Jotai + TailwindCSS.

Rationale:
- Frontend-only reduces scope and avoids new backend components; the evaluation webhook is provided.
- Vite + React gives fast developer feedback and modern bundling.
- Jotai is lightweight for local app state and supports small, testable atoms.
- Tailwind enables rapid, consistent UI styling.
- Playwright supports robust cross-browser e2e testing for the main flows.

Alternatives considered:
- Full-stack app with a backend: rejected because product provided webhook and the feature can be implemented purely client-side.
- Redux or Zustand for state: Zustand is viable; Jotai chosen for minimalism and atom-based composition.

Risks and mitigation:
- Browser recording formats vary: client will upload the exact MIME type produced by the browser.
- Large PDFs: use lazy rendering and thumbnails to keep memory low.
