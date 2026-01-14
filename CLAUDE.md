# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Repository Overview

This is a fork of Jellyfin Web (the official web client for Jellyfin media server) with a custom **music visualizer** feature on the `music-visualizer` branch. The `master` branch tracks the official upstream Jellyfin repository.

### Branch Strategy
- **music-visualizer**: Main development branch with custom visualizer features
- **master**: Mirrors official Jellyfin upstream
- When merging master into music-visualizer, prefer master's changes for conflicts (keeping upstream compatibility)

## Build & Development Commands

```bash
npm install              # Install dependencies
npm start                # Start webpack dev server with hot reload
npm run build:development  # Build with sourcemaps
npm run build:production   # Production build (minified)
npm run build:check        # TypeScript type checking only (tsc --noEmit)
```

## Testing & Quality

```bash
npm test                  # Run Vitest tests (single run)
npm run test:watch        # Run tests in watch mode
npm run lint              # ESLint
npm run stylelint         # StyleLint for CSS/SCSS
npm run build:es-check    # Verify ES5 browser compatibility
```

Test files use `.test.ts` suffix and are co-located with source files.

## Architecture

### Multi-App Structure
The codebase uses a [Bulletproof React](https://github.com/alan2207/bulletproof-react/blob/master/docs/project-structure.md) inspired architecture with four apps under `src/apps/`:
- **stable**: Classic/main user interface
- **experimental**: New experimental features
- **dashboard**: Admin dashboard
- **wizard**: Setup wizard

New code should go in the appropriate app directory unless it's shared/common.

### Key Directories
- `src/components/` - React components and higher-order components
- `src/hooks/` - Custom React hooks
- `src/utils/` - Utility functions
- `src/lib/` - Reusable libraries (globalize, navdrawer, scroller)
- `src/plugins/` - Dynamically loaded client plugins
- `src/strings/` - Translation files (only modify `en-us.json`)

### Legacy Code (Avoid Adding New Files)
- `src/controllers/` - Deprecated page controllers (❌)
- `src/scripts/` - Legacy utilities (🐉 "here be dragons")

### Custom Features (music-visualizer branch)

**Audio Engine** (`src/components/audioEngine/`):
- `master.logic.ts` - Web Audio API master output with AudioContext, mixer gain node, and brick-wall limiter. Handles normalization gain and volume control.
- `crossfader.logic.ts` - Gapless crossfade between tracks. Hijacks media elements during transitions, manages fade curves, and coordinates cleanup of audio nodes.

**Music Visualizer** (`src/components/visualizer/`):
- `Butterchurn.tsx` - MilkDrop-style visualizer using butterchurn library (auto-advances presets on track change)
- `FrequencyAnalyzer.tsx` - Frequency spectrum analyzer
- `WaveSurfer.ts` - Waveform visualization with delay buffer sync
- `visualizers.logic.ts` - Visualizer settings and state persistence

**Sit Back Mode** (`src/components/sitbackMode/`):
- `sitback.logic.ts` - Enhanced Now Playing queue experience (`#/queue` route):
  - Song info display on track transitions
  - Auto-scroll to active playlist item
  - Mouse idle detection (hides cursor, reduces UI clutter)
  - CSS class transitions for visual effects (`transition`, `songEnd`, `mouseIdle`)

## Code Style

### Formatting
- 4-space indentation (2 for JSON/YAML)
- Single quotes for strings, single quotes for JSX attributes
- No trailing commas
- LF line endings

### Import Rules (Tree-Shaking)
Use direct file imports, not barrel imports:
```typescript
// ✓ Correct
import Button from '@mui/material/Button';
import { UserApi } from '@jellyfin/sdk/lib/generated-client/api/user-api';

// ✗ Wrong - breaks tree-shaking
import { Button } from '@mui/material';
import { UserApi } from '@jellyfin/sdk/lib/generated-client/api';
```

### React Guidelines
- No inline function bindings in JSX (`jsx-no-bind`)
- No array index as React keys
- Exhaustive deps in useEffect/useCallback/useMemo (warning)

### TypeScript
- Strict mode enabled
- camelCase/PascalCase naming (UPPER_CASE for constants)
- Type imports allowed from barrel files

## Key Dependencies
- **React 18** with React Router 6
- **Material-UI 6** for components
- **TanStack React Query 5** for data fetching
- **@jellyfin/sdk** for Jellyfin API
- **Butterchurn** for MilkDrop visualizations
- **WaveSurfer.js** for waveform display
- **date-fns** for date formatting

## Browser Support
Targets ES5-compatible browsers including legacy Chrome versions (27, 38, 47, 53, 56, 63), Edge 18, Firefox ESR, and modern browser versions. The `build:es-check` script verifies compatibility.

## Global Variables
These globals are available in source files: `$`, `jQuery`, `ApiClient`, `Events`, `Hls`, `LibraryMenu`, `tizen`, `webOS`, and build-time variables like `__COMMIT_SHA__`, `__JF_BUILD_VERSION__`.
