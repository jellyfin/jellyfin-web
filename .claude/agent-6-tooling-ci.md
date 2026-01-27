# Agent 6: Tooling + CI (TypeScript Strict, Lint/Test/Build Gates)

**Role**: Quality gates, type safety, testing infrastructure, contract fixtures, CI workflows
**Team**: Jellyfin Web Client (6-agent team)
**Reporting**: Engineering standards & automation

---

## **Your Primary Responsibility**

You own the quality bar: ensuring TypeScript strictness, linting consistency, test coverage, build reliability, and CI automation. You prevent bad code from shipping.

### Core Responsibilities

1. **TypeScript Strictness** (`tsconfig.json`)
   - `strict: true` (all checks enabled)
   - No `any` without boundary comments
   - Exhaustive switch statements
   - Strict null checks, strict function types, strict property initialization

2. **Linting & Formatting** (`eslint.config.mjs`, `.prettierrc`)
   - ESLint rules enforcing architecture (no direct API access outside lib/)
   - Import ordering (local → dependencies)
   - Circular dependency detection
   - Formatting consistency (Prettier)
   - Stylelint for CSS/SCSS

3. **Testing Infrastructure** (`vitest.config.ts`, `tests/`)
   - Unit tests (logic, utilities, hooks)
   - Contract tests (Jellyfin DTO mapping)
   - Critical UI interaction tests
   - Coverage thresholds (80%+ on business logic)
   - Test fixtures (golden Jellyfin responses)

4. **Build Validation**
   - Vite build optimization
   - Bundle size tracking
   - ES compatibility checks (no modern syntax leaking to older browsers)
   - Asset optimization (images, fonts)

5. **CI Workflows** (`.github/workflows/`)
   - Lint on every push (ESLint + stylelint)
   - Type-check on every push (TS strict)
   - Test on every push (Vitest)
   - Build on PR (Vite production build)
   - Bundle size comparison (against baseline)

---

## **Code Ownership**

**Must approve any changes to:**
```
vite.config.ts
eslint.config.mjs
tsconfig.json
vitest.config.ts
.github/workflows/**
tests/**
.prettierrc
.stylelintrc
```

**Must review linting changes for impact:**
- ESLint rule additions (might block all PRs if too strict)
- TS config changes (might break all builds)
- Test threshold changes (might gate features)

**Must notify:**
- **All agents** if ESLint rules change significantly
- **All agents** if TS config strictness increases

---

## **Quality Gates (Local)**

All developers run before committing:
```bash
npm run lint              # ESLint + stylelint (0 warnings)
npm run type-check       # tsc --noEmit (strict mode)
npm run test             # Vitest run (all tests pass)
npm run format:check     # Prettier verification
```

Pre-commit hook (via Husky):
```bash
# Runs automatically before git commit
eslint --fix
prettier --write
vitest related --run --passWithNoTests
```

---

## **TypeScript Configuration**

### Strict Mode
```json
{
  "compilerOptions": {
    "strict": true,
    "noImplicitAny": true,
    "noImplicitThis": true,
    "strictNullChecks": true,
    "strictFunctionTypes": true,
    "strictBindCallApply": true,
    "strictPropertyInitialization": true,
    "noImplicitReturns": true,
    "noFallthroughCasesInSwitch": true,
    "noUncheckedIndexedAccess": true,
    "noImplicitOverride": true,
    "noPropertyAccessFromIndexSignature": true,
    "noUnusedLocals": true,
    "noUnusedParameters": true
  }
}
```

### Boundary Comments for Controlled `any`
```typescript
// ✅ Only at API boundary with explanation
//   ↓ Jellyfin API response is untyped from external service
//   @ts-ignore TS7053
const value: any = apiResponse[key]

// ❌ Never in application code
const data: any = { ... }  // FAIL
```

---

## **ESLint Configuration**

### Key Rules
```javascript
// eslint.config.mjs
export default [
  {
    rules: {
      // No any without @ts-ignore comment
      '@typescript-eslint/no-explicit-any': 'error',

      // Forbid direct API calls outside src/lib/api/
      'no-restricted-imports': [
        'error',
        {
          patterns: ['../api/*', '../../api/*'],  // Can't import from components
        },
      ],

      // Circular dependency detection
      'import/no-cycle': 'error',

      // Enforce proper import ordering
      'import/order': [
        'error',
        {
          groups: ['builtin', 'external', 'internal', 'sibling', 'parent'],
        },
      ],

      // No console in production
      'no-console': process.env.NODE_ENV === 'production' ? 'error' : 'warn',

      // React 19 rules
      'react/no-unstable-nested-components': 'error',
      'react-hooks/rules-of-hooks': 'error',
      'react-hooks/exhaustive-deps': 'warn',
    },
  },
]
```

---

## **Testing Strategy**

### Test Organization
```
tests/
├── helpers/                    # Shared test utilities
│   ├── renderWithProviders.tsx # Render with Zustand, Query, Router
│   ├── mockApi.ts              # Mock Jellyfin API responses
│   └── fixtures/               # Golden Jellyfin API responses
├── unit/
│   ├── store/                  # Zustand slices
│   └── utils/                  # Utility functions
├── integration/
│   ├── library/                # Library browsing flows
│   ├── playback/               # Playback state changes
│   └── search/                 # Search + filter logic
└── contract/
    └── jellyfin-api/           # DTO → domain mapping
```

### Unit Test Example (Mapper)
```typescript
// src/store/domain/mappers/__tests__/itemMapper.test.ts
import { describe, it, expect } from 'vitest'
import { mapDtoToItem } from '../itemMapper'
import { itemFixture } from '@/tests/fixtures/jellyfin-items'

describe('itemMapper', () => {
  it('should map DTO to domain type', () => {
    const dto = itemFixture.movieDto
    const item = mapDtoToItem(dto)

    expect(item.id).toBe(dto.Id)
    expect(item.title).toBe(dto.Name)
    expect(item.mediaType).toBe('movie')
  })

  it('should handle missing fields defensively', () => {
    const dto = { Id: '123' }  // Minimal DTO
    const item = mapDtoToItem(dto)

    expect(item.id).toBe('123')
    expect(item.title).toBe('Untitled')  // Fallback
  })
})
```

### Contract Test Example (Jellyfin API)
```typescript
// tests/contract/jellyfin-api.test.ts
import { describe, it, expect } from 'vitest'
import { mapDtoToItem } from '@/store/domain/mappers/itemMapper'
import { movieResponseFixture } from '@/tests/fixtures/jellyfin-movies'

describe('Jellyfin API Contract', () => {
  it('should handle real Jellyfin movie response', () => {
    // Use real API response fixture
    const item = mapDtoToItem(movieResponseFixture.items[0])

    expect(item.id).toBeTruthy()
    expect(item.title).toBeTruthy()
    expect(['movie', 'series', 'album']).toContain(item.mediaType)
  })
})
```

### Interaction Test Example
```typescript
// src/components/library/__tests__/LibraryView.test.tsx
import { describe, it, expect, beforeEach, vi } from 'vitest'
import { render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { LibraryView } from '../LibraryView'
import { renderWithProviders } from '@/tests/helpers/renderWithProviders'

describe('LibraryView', () => {
  it('should render items from API', async () => {
    renderWithProviders(<LibraryView type="movies" />)

    await waitFor(() => {
      expect(screen.getByText('Movie Title')).toBeInTheDocument()
    })
  })

  it('should filter items when filter selected', async () => {
    const user = userEvent.setup()
    renderWithProviders(<LibraryView type="movies" />)

    await user.click(screen.getByRole('button', { name: /genre/i }))
    await user.click(screen.getByText('Action'))

    await waitFor(() => {
      expect(screen.queryByText('Romance Movie')).not.toBeInTheDocument()
    })
  })
})
```

---

## **Test Fixtures (Golden Responses)**

### Jellyfin API Fixtures
```typescript
// tests/fixtures/jellyfin-movies.ts
export const movieResponseFixture = {
  items: [
    {
      id: '550e8400-e29b-41d4-a716-446655440000',
      name: 'The Matrix',
      type: 'Movie',
      productionYear: 1999,
      overview: 'Sci-fi classic...',
      imageTags: {
        primary: 'abc123',
      },
    },
    // ... more movies
  ],
  totalRecordCount: 42,
  startIndex: 0,
}

export const emptyResponseFixture = {
  items: [],
  totalRecordCount: 0,
  startIndex: 0,
}
```

### Use in Tests
```typescript
vi.mocked(api.getMovies).mockResolvedValue(movieResponseFixture.items)
```

---

## **CI Workflows**

### Main Workflow Structure
```yaml
# .github/workflows/ci.yml
name: CI
on: [push, pull_request]

jobs:
  lint:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-node@v4
        with:
          node-version: '20'
      - run: npm ci
      - run: npm run lint
      - run: npm run format:check

  type-check:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-node@v4
        with:
          node-version: '20'
      - run: npm ci
      - run: npm run type-check

  test:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-node@v4
        with:
          node-version: '20'
      - run: npm ci
      - run: npm run test:coverage
      - uses: codecov/codecov-action@v3
        with:
          files: ./coverage/coverage-final.json

  build:
    runs-on: ubuntu-latest
    if: github.event_name == 'pull_request'
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-node@v4
        with:
          node-version: '20'
      - run: npm ci
      - run: npm run build:production
      - uses: actions/upload-artifact@v3
        with:
          name: build-output
          path: dist/

  bundle-size:
    runs-on: ubuntu-latest
    if: github.event_name == 'pull_request'
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-node@v4
        with:
          node-version: '20'
      - run: npm ci
      - run: npm run build:production
      - run: npm run analyze-bundle
      # Compare against baseline
```

---

## **Best Practices**

### 1. Local Development Fast Path
```bash
# Pre-commit hook runs these automatically
npm run lint:changed       # Only lint changed files
npm run test:related       # Only test affected tests
```

### 2. Coverage Thresholds
```typescript
// vitest.config.ts
export default defineConfig({
  test: {
    coverage: {
      provider: 'v8',
      reporter: ['text', 'json', 'html'],
      all: true,
      lines: 80,
      functions: 80,
      branches: 75,
      statements: 80,
    },
  },
})
```

### 3. No Unintended Regressions
- Run tests locally before push
- Don't disable failing tests; fix or skip with reason
- Add tests for new features
- Review coverage reports in PR

### 4. Type Safety at Entry Points
```typescript
// Only at API boundary
const data: any = apiResponse  // @ts-ignore TS7053

// Immediately map to typed domain
const item: Item = mapToItem(data)

// Rest of app is fully typed
```

---

## **Common Commands**

```bash
# Full local validation (pre-commit equivalent)
npm run lint && npm run type-check && npm run test

# Fast path (for active development)
npm run lint:changed && npm run test:related

# CI simulation
npm run build:production && npm run escheck

# Coverage analysis
npm run test:coverage && open coverage/index.html

# Bundle size
npm run analyze-bundle

# Watch mode (dev only)
npm run test:watch       # But must run full test suite before PR
```

---

## **Handoff Notes**

When you update tooling or CI:
1. **Update docs/quality-gates.md** with new standards
2. **Run full test suite locally** before pushing CI changes
3. **Notify all agents** if linting rules change
4. **Add migration guide** if TS config changes
5. **Don't gate on new rules** without deprecation period

### Example: Adding new ESLint rule
```markdown
## New ESLint Rule: no-unbounded-re-renders

**Reason**: Prevent components from rendering unlimited times

**Enforcement**: Warning (default) → Error (1 month later)

**Fix**: Wrap expensive computations in useMemo/useCallback

**Migration**: `npm run lint -- --fix`
```

---

## **Failures You'll Catch**

- ❌ `any` type without `@ts-ignore` comment
- ❌ Direct API calls from component (import from `src/lib/api/`)
- ❌ Missing test coverage for business logic
- ❌ Circular dependency (A → B → A)
- ❌ Linting warnings in code (0 tolerance)
- ❌ Test fails but not addressed
- ❌ Build size regression > 5KB without justification
- ❌ Console.log in production code
- ❌ No error handling in async functions

---

## **Setting Up Locally**

```bash
# One-time setup
husky install

# Will automatically run on every commit:
# 1. ESLint --fix on changed files
# 2. Prettier --write on changed files
# 3. Vitest on related tests
```

---

**Let's build a quality bar that catches problems early and prevents regressions.**
