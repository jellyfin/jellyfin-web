# Jellyfin Web Client – 6-Agent Team Charter

**Project:** Premium Jellyfin web client (React 19 + TS + TanStack + Radix + WASM)
**Team Size:** 6 specialized agents with clear ownership boundaries
**Branch:** `music-visualizer` (working) → `master` (PRs)

---

## **Global Team Contract**

### Shared Principles
- **Jellyfin API Correctness First**: Treat the Jellyfin API as eventually consistent; handle missing fields defensively.
- **Latest Browsers Only**: Chromium/Firefox/Safari current. Use platform APIs (WebCodecs, WebAudio, Media Session, Picture-in-Picture, OffscreenCanvas). No legacy polyfills.
- **Strong Typing**: No `any` unless isolated behind a typed boundary with `@ts-ignore` comment explaining why.
- **Accessibility**: All Radix primitives used correctly; keyboard nav, focus, aria labels non-negotiable.
- **Purposeful Motion**: Motion via `motion` library only; animations must improve comprehension or feedback, never decorative.
- **No Regressions**: When touching risky logic (API mapping, playback, large lists), add tests or checks.

### Shared Architecture Defaults
- **Server State** (TanStack Query): API responses, pagination, search results
- **UI/App State** (Zustand): UI toggles, local preferences, playback UI state
- **Request Layer**: Single typed Jellyfin client module (`src/lib/api/*`)
- **Domain Mapping**: `src/store/domain/*` maps Jellyfin DTOs → app domain types
- **Playback Subsystem**: Strict boundaries via `PlaybackController`; UI never calls WebAudio/WebCodecs directly

---

## **Agent Lineup**

### **Agent 1: Jellyfin API + Data Contracts**
**Primary Responsibility**: Typed Jellyfin client, DTO→domain mapping, Query hooks
**Files**: `src/lib/api/*`, `src/store/domain/*`, `src/hooks/api/*`, `src/types/*`
**Handoff Triggers**: Modifying DTO types, changing API endpoint, affecting Query cache strategy

### **Agent 2: Playback Engine + WASM**
**Primary Responsibility**: Audio/video playback, WebAudio graph, WASM bindings, timing
**Files**: `src/controllers/playback/*`, `src/audio-driver/*`, `src/audio-wasm/*`, `src/components/playback/*`
**Handoff Triggers**: PlaybackController API changes, audio graph design, WASM memory model

### **Agent 3: UI Systems (Radix + Motion)**
**Primary Responsibility**: Component library, design tokens, motion recipes, a11y
**Files**: `src/ui-primitives/*`, `src/stories/*`, `src/styles/*`, `src/components/themeProvider/*`
**Handoff Triggers**: New Radix component additions, token changes, motion patterns

### **Agent 4: State + Performance**
**Primary Responsibility**: Router structure, Zustand design, rendering perf, instrumentation
**Files**: `src/routes/*`, `src/store/*`, `src/perf/*`, `src/index.tsx`
**Handoff Triggers**: Major state restructuring, router layout changes, perf regressions

### **Agent 5: Library Views (Browse/Search/Metadata)**
**Primary Responsibility**: Library UX, search, playlists, metadata editing, mobile responsiveness
**Files**: `src/components/{library,search,playlisteditor,metadataEditor}/*`
**Handoff Triggers**: New filtering/sorting logic, large-list perf, metadata edit flows

### **Agent 6: Tooling + CI**
**Primary Responsibility**: TS config strictness, linting, tests, contract fixtures, CI workflows
**Files**: `vite.config.ts`, `eslint.config.mjs`, `.github/workflows/*`, `tests/*`
**Handoff Triggers**: New linting rules, test framework changes, TS strictness increases

---

## **Quality Gates (All Agents)**

### Local Checks (Before Commit)
```bash
npm run lint              # ESLint + stylelint (0 warnings)
npm run type-check       # tsc --noEmit strict mode
npm run test             # vitest (watch mode optional)
npm run format:check     # Prettier verification
```

### CI Gates (Required for PR)
```bash
npm run lint              # Full linting suite
npm run type-check       # Full TS typecheck
npm run test             # Full test suite
npm run build:check      # Vite build validation
npm run escheck          # ES version compatibility
```

### Performance Tracking
- Bundle size: note any changes > 5KB in PR
- LCP (Largest Contentful Paint): document if route-level changes made
- Large lists: use TanStack Virtual for 50+ items
- Render passes: use React Profiler in dev; note if >3 passes for non-search

---

## **Handoff Protocol**

### When You Touch Code Outside Your Area
Add to PR description under `## 🔀 Cross-Team Handoff`:
```markdown
- **File:** src/store/playback.ts
- **Why:** PlaybackController now emits progress % instead of absolute time
- **Ownership:** Agent 2 should verify UI consumers updated
- **Link:** Issue/PR reference
```

### Code Ownership (CODEOWNERS)
```
src/lib/api/**                          @agent-1
src/store/domain/**                     @agent-1
src/hooks/api/**                        @agent-1
src/types/**                            @agent-1

src/controllers/playback/**             @agent-2
src/audio-driver/**                     @agent-2
src/audio-wasm/**                       @agent-2

src/ui-primitives/**                    @agent-3
src/components/themeProvider/**         @agent-3
src/stories/**                          @agent-3
src/styles/**                           @agent-3

src/routes/**                           @agent-4
src/store/**                            @agent-4
src/index.tsx                           @agent-4
src/perf/**                             @agent-4

src/components/library/**               @agent-5
src/components/search/**                @agent-5
src/components/playlisteditor/**        @agent-5
src/components/metadataEditor/**        @agent-5

vite.config.ts                          @agent-6
eslint.config.mjs                       @agent-6
.github/workflows/**                    @agent-6
tests/**                                @agent-6
```

---

## **Key Shared Documents**

- **Query Cookbook** (`docs/query-cookbook.md`): How to add endpoints safely (Agent 1)
- **Playback Invariants** (`docs/playback-invariants.md`): Timing bounds, memory limits (Agent 2)
- **UX Patterns Catalog** (Storybook + `docs/ux-patterns.md`): Motion, a11y, interactions (Agent 3)
- **Refactor Playbook** (`docs/refactor-playbook.md`): TS refactor guidance, component boundaries (Agent 4)
- **Testing Guide** (`docs/testing-guide.md`): Unit, contract, critical UI tests (Agent 6)

---

## **Tech Stack Reference**

| Layer | Tech | Purpose |
|-------|------|---------|
| **UI Primitives** | Radix UI 1.x + Radix Icons | Accessible components + theming |
| **Animations** | Motion 12 | Purposeful transitions + state feedback |
| **Server State** | TanStack Query 5 | API data caching, pagination, sync |
| **Client State** | Zustand 5 | UI state, preferences, playback UI |
| **Routing** | TanStack Router 1.x | File-based routes + loaders |
| **Data Tables** | TanStack Table 8 | Sortable, filterable collections |
| **Virtualization** | TanStack Virtual 3 | Large list performance |
| **Build** | Vite 7 + Vanilla Extract | Modern DX + CSS-in-TS |
| **Testing** | Vitest 4 + Testing Library | Unit + interaction tests |
| **Audio/Video** | WebAudio API + Rust WASM | Playback engine + analysis |
| **API Client** | Jellyfin SDK 0.13 + Axios | Typed Jellyfin requests |
| **i18n** | i18next 25 | Localization (public/locales/*) |

---

## **Running Locally**

```bash
# Install & start dev server
npm install
npm run serve              # Vite dev server http://localhost:5173

# Full test suite
npm run test:coverage      # With coverage report

# Storybook (UI primitives)
npm run storybook          # http://localhost:6006

# Build for production
npm run build:production
npm run build:es-check     # Verify ES compatibility

# Lint all
npm run lint               # ESLint + stylelint

# Type check
npm run type-check
```

---

## **Git Workflow**

1. **Branch**: Always branch from `master`
2. **Commit**: Follow conventional commits (feat/fix/refactor/docs/perf/test)
3. **Pre-commit Hook** (via Husky): lint:changed + test:related
4. **PR**: Require all CI checks pass + CODEOWNERS approval
5. **Merge**: Squash or rebase (no merge commits)

---

## **Contact & Escalation**

- **Q: "How do I add a new Jellyfin API endpoint?"** → Ask Agent 1 (Query Cookbook)
- **Q: "Playback latency issue?"** → Ask Agent 2 (Playback Invariants)
- **Q: "New UI component or motion?"** → Ask Agent 3 (Storybook, UX Patterns)
- **Q: "Routing or state structure?"** → Ask Agent 4 (Router structure, Zustand slices)
- **Q: "Large list performance?"** → Ask Agent 5 (Virtual + Query prefetch)
- **Q: "Test or lint setup?"** → Ask Agent 6 (Testing Guide, ESLint rules)

---

**Last updated:** 2026-01-26
**Version:** 1.0 (Team Onboarding)
