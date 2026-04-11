# Cucu Frontend E2E Tests

Framework di test automation per Cucu Frontend. I test vengono eseguiti **da remoto** su ambienti staging/production, non su localhost.

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

## Ambienti

I test possono essere eseguiti su diversi ambienti:

| Ambiente | Base URL | Script |
|----------|----------|--------|
| **Local** | `http://localhost:4000` | `npm run test:e2e:local` |
| **Staging** | `https://staging.cucu.app` | `npm run test:e2e:staging` |
| **Production** | `https://cucu.app` | `npm run test:e2e:prod` |

**Default:** `staging` (se `TEST_ENV` non specificato)

## Run Tests

```bash
# E2E su staging (default)
npm run test:e2e

# E2E su ambiente specifico
npm run test:e2e:local      # Localhost
npm run test:e2e:staging    # Staging
npm run test:e2e:prod       # Production

# E2E with UI
npm run test:e2e:ui

# E2E headed
npm run test:e2e:headed

# E2E debug
npm run test:e2e:debug

# All tests (unit + E2E)
npm run test:all
```

## Configurazione Ambienti

Per aggiungere o modificare ambienti, aggiorna `playwright.config.ts`:

```typescript
const BASE_URLS: Record<string, string> = {
  local: 'http://localhost:4000',
  staging: 'https://staging.cucu.app',
  production: 'https://cucu.app',
  // Aggiungi qui nuovi ambienti
};
```

## Prerequisiti per Remote Testing

1. **Cucu Frontend** deve essere deployato e accessibile all'URL configurato
2. **Test users** devono esistere nel database dell'ambiente remoto:
   - `admin@cucu.local` — Con permessi admin
   - `limited@cucu.local` — Con permessi limitati
   - `noperms@cucu.local` — Senza permessi
3. **Login** funzionale sull'ambiente remoto
4. **Permissions system** funzionante sull'ambiente remoto

## Documentazione

- `TEST_FRAMEWORK.md` — Guida completa al framework
- `TEST_WRITING_GUIDE.md` — Come scrivere test E2E
- `TESTING_BEST_PRACTICES.md` — Best practices
