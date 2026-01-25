# Jellyfin Web Agent Guide

Modernized Jellyfin Web client with premium audio playback, React/TypeScript/Vite architecture, and WASM processing.

## Build/Serve Commands
Run from repo root `/Users/carlos/Documents/jellyfin-web`.

### Development
```bash
npm install          # Install dependencies
npm start            # Vite dev server (http://localhost:5173)
```

### Quality Checks
```bash
npm run lint         # ESLint + Stylelint
npm run lint:fix     # Auto-fix linting issues
npm run format       # Prettier formatting
npm run build:check  # TypeScript validation
```

### Testing
```bash
npm test                    # Full Vitest run
npm run test:watch          # Watch mode
npm run test:coverage       # Generate coverage report (70%+ required)
npm run test:coverage:watch # Interactive coverage with UI
npx vitest run path/to/test.tsx     # Single test file
npx vitest run -t "test name"       # Run matching tests
```
**Single test focus:** Use `npx vitest run path/to/Component.test.tsx` for targeted testing.

**Coverage Requirements:** 70%+ coverage for lines, functions, branches, and statements. PRs are blocked if thresholds are not met.

## Code Style Guidelines

### TypeScript
- Target `es2022` / `strict` mode. Never disable strict rules without `TODO` + GitHub issue.
- Use `import type { ... }` for pure types. Explicit return types on exported functions.
- Avoid `any`. Use proper typing or `unknown`.
- Prefer guard clauses (`if (!value) return;`) and coalesce with `??`/`||`.

### React
- Functional components with hooks only. No class components.
- No `document.querySelector`, `innerHTML`, or direct DOM manipulation.
- Use `ui-primitives`, Joy UI, or Radix primitives.
- Layout/spacing from `vars` (no hard-coded pixels).

### Imports
- No barrel exports. Import directly from concrete file paths.
- Group: 1) external packages, 2) workspace aliases, 3) relative paths.
- Alphabetical within each block.
- Use workspace aliases (`components/`, `apps/`, `styles/`).

### Naming Conventions
- Components/pages/routes: `PascalCase.tsx`
- Hooks/utilities: `camelCase.ts`
- Tests: `ComponentName.test.tsx`
- No barrel exports (direct imports only)

### Styling
- Styles are vanilla-extract (`*.css.ts`).
- **CRITICAL**: Use named imports and re-export:
  ```typescript
  // ✅ CORRECT
  import { componentContainer } from './Component.css';
  export { componentContainer };

  // ❌ WRONG - Namespace imports cause runtime errors
  import * as styles from './Component.css';
  ```
- Prefer `Box`, `Flex` from `ui-primitives` over raw `div`.

### State Management
- **Zustand** (`src/store/*.ts`) for global state - discrete slices
- **useState** for local component state
- Access stores through typed selectors or custom hooks
- No global variables or singletons outside Zustand

### Error Handling
- Use shared `logger`: `logger.warn('msg', { component: 'X' })`
- Wrap async in `try/catch`, log, show user feedback
- Never bury errors
- API calls through typed helpers (`@jellyfin/sdk`)

### Forms
- Use TanStack Form with Zod schemas
- Never use manual validation or querySelector

### File Structure
```
src/
├── components/
│   ├── audioEngine/    # WASM audio processing
│   ├── playback/       # playbackManager
│   ├── visualizer/     # WaveformCell, WaveSurfer
│   └── forms/          # Form components
├── apps/
│   ├── stable/routes/lazyRoutes/
│   │   ├── QueueTable.tsx  # TanStack Table example
│   │   └── QueuePage.tsx   # Queue view
│   └── dashboard/routes/users/
│       └── add.tsx         # Modernized user form
├── store/              # Zustand stores
├── hooks/              # Custom hooks
└── mcp-servers/        # MCP debugging tools
```

## TanStack Libraries
| Library | Purpose |
|---------|---------|
| @tanstack/react-table | Data tables (QueueTable) |
| @tanstack/react-virtual | Virtualization for large lists |
| @tanstack/react-query | Data fetching (extensive) |
| @tanstack/react-form | Form state management |
| @tanstack/react-router | Route management |
| @dnd-kit/* | Drag-and-drop (QueueTable reordering) |

## MCP Integration
- **Plugin:** `vite-plugin-mcp` enables MCP server for development tooling.
- **Endpoint:** Serves at `/sse` when dev server runs.
- **Tools:** Server connection debugging tools in `src/mcp-servers/components/`:
  - `get_server_connection_status()` - Current connection info
  - `get_available_servers()` - Discovered servers
  - `get_server_store_state()` - Zustand store state
  - `test_server_connectivity(address)` - Test connections
  - `clear_server_store()` - Reset store for debugging

## Cursor Rules
Follow `.cursorrules` for premium-audio focus, TanStack Router/Table/Query/Form usage, prohibition on `querySelector`, and `vars` token guidance. No `.github/copilot-instructions.md`; treat `.cursorrules` as the sole centralized rule set.

## Common Tasks

### Adding a New Route
1. Create component in `src/apps/stable/routes/lazyRoutes/`
2. Register in `src/apps/stable/routes/asyncRoutes/user.ts`
3. Add navigation in `src/components/router/appRouter.js`

### Modifying Playback
1. Core logic: `src/components/playback/playbackmanager.ts`
2. Audio routing: `src/components/audioEngine/master.logic.ts`
3. State sync: Events → `audioStore` → React

## Linting
Run `npm run build:check` before committing. Common issues:
- `strict-boolean-expressions`: Use explicit checks
- `no-explicit-any`: Add proper types
```

## File Structure
```
src/
├── components/
│   ├── audioEngine/    # WASM audio processing
│   ├── playback/       # playbackManager
│   ├── visualizer/     # WaveformCell, WaveSurfer
│   └── forms/          # NEW: Form components
├── apps/
│   ├── stable/routes/lazyRoutes/
│   │   ├── QueueTable.tsx  # TanStack Table example
│   │   └── QueuePage.tsx   # Queue view
│   └── dashboard/routes/users/
│       └── add.tsx         # Modernized user form
├── store/              # Zustand stores
├── hooks/              # Custom hooks
└── mcp-servers/        # MCP debugging tools
```

## Important Paths
```
src/components/audioEngine/   # WASM audio, crossfade
src/components/playback/      # playbackManager (core)
src/components/nowPlayingBar/ # React controls
src/store/audioStore.ts       # Zustand state
src/plugins/htmlAudioPlayer/  # Audio player
src/apps/stable/routes/       # React routes
```

## Common Tasks

### Adding a New Route
1. Create component in `src/apps/stable/routes/lazyRoutes/`
2. Register in `src/apps/stable/routes/asyncRoutes/user.ts`
3. Add navigation in `src/components/router/appRouter.js`

### Modifying Playback
1. Core logic: `src/components/playback/playbackmanager.ts`
2. Audio routing: `src/components/audioEngine/master.logic.ts`
3. State sync: Events → `audioStore` → React

## Dependencies for New Features
```bash
npm install @tanstack/react-table @tanstack/react-virtual @tanstack/react-query @tanstack/react-form @dnd-kit/core @dnd-kit/sortable @dnd-kit/utilities zod
```

## Linting
Run `npm run build:check` before committing. Common issues:
- `strict-boolean-expressions`: Use explicit checks
- `no-explicit-any`: Add proper types
