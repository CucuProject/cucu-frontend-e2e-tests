# Cucu Frontend E2E Tests

Framework di test automation per Cucu Frontend.

## Stack

- **Playwright** — E2E testing framework
- **Vitest** — Test runner per unit/integration tests
- **@testing-library/dom** — Semantic DOM assertions

## Struttura

```
tests/
├── e2e/
│   ├── helpers/        # Auth, utilities
│   ├── pages/          # Page Object Models
│   └── specs/          # E2E test files
├── integration/        # Integration tests
└── unit/              # Unit tests
```

## Setup

```bash
npm install
npx playwright install
```

## Run Tests

```bash
# E2E tests
npm run test:e2e

# E2E with UI
npm run test:e2e:ui

# E2E headed
npm run test:e2e:headed

# E2E debug
npm run test:e2e:debug

# All tests (unit + E2E)
npm run test:all
```

## Documentazione

- `TEST_FRAMEWORK.md` — Guida completa al framework
- `TEST_WRITING_GUIDE.md` — Come scrivere test E2E
- `TESTING_BEST_PRACTICES.md` — Best practices
