# Bundle Chunk Strategy

This document details the code splitting strategy used in the Vite build configuration to optimize bundle size and caching.

## Chunk Overview

The build system splits code into cacheable chunks based on feature usage. This reduces initial load time by only downloading code needed for the current view.

### Chunk Map

| Chunk | Contents | Trigger | Approx Size |
|-------|----------|---------|-------------|
| `main` | Core app, React, routing | Always | ~400KB |
| `vendor-framework` | React ecosystem | Always | ~300KB |
| `vendor-mui` | Material UI | MUI components | ~200KB |
| `vendor-graphics` | Three.js, React Three | Visualizers, 3D | ~500KB |
| `vendor-visualizers` | Butterchurn | Visualizer page | ~400KB |
| `vendor-media` | HLS, FLV, WaveSurfer | Video/audio players | ~150KB |
| `vendor-docs` | PDF, EPUB, Archive | Document viewing | ~600KB |
| `vendor-subtitles` | libass-wasm, libpgs | Subtitle rendering | ~300KB |
| `vendor-utils` | Lodash, date-fns, DOMPurify | Utility functions | ~100KB |
| `vendor-jellyfin` | Jellyfin SDK, API client | API calls | ~200KB |
| `vendor-ui-libs` | Swiper, jstree, sortablejs | UI components | ~150KB |
| `vendor-corejs` | Polyfills | Legacy browsers | ~50KB |
| `vendor` | Other dependencies | Miscellaneous | ~100KB |

## Manual Chunk Configuration

**File:** `vite.config.ts:275-333`

The `manualChunks` function routes dependencies to specific chunks:

```typescript
manualChunks(id) {
    if (id.includes("node_modules")) {
        // MUI → vendor-mui
        if (id.includes("@mui")) return "vendor-mui";

        // 3D/Graphics → vendor-graphics
        if (
            id.includes("three") ||
            id.includes("@react-three")
        )
            return "vendor-graphics";

        // Visualizers → vendor-visualizers
        if (id.includes("butterchurn"))
            return "vendor-visualizers";

        // Media Players → vendor-media
        if (
            id.includes("hls.js") ||
            id.includes("flv.js") ||
            id.includes("wavesurfer.js")
        )
            return "vendor-media";

        // Documents → vendor-docs
        if (
            id.includes("epubjs") ||
            id.includes("pdfjs-dist") ||
            id.includes("libarchive.js")
        )
            return "vendor-docs";

        // Subtitles → vendor-subtitles
        if (
            id.includes("@jellyfin/libass-wasm") ||
            id.includes("libpgs")
        )
            return "vendor-subtitles";

        // Utilities → vendor-utils
        if (
            id.includes("lodash-es") ||
            id.includes("date-fns") ||
            id.includes("dompurify") ||
            id.includes("markdown-it")
        )
            return "vendor-utils";

        // Framework → vendor-framework
        if (
            id.includes("react") ||
            id.includes("react-dom") ||
            id.includes("react-router-dom") ||
            id.includes("@tanstack/react-query") ||
            id.includes("zustand") ||
            id.includes("framer-motion")
        )
            return "vendor-framework";

        // CoreJS polyfills → vendor-corejs
        if (id.includes("core-js")) return "vendor-corejs";

        // Jellyfin API → vendor-jellyfin
        if (
            id.includes("@jellyfin/sdk") ||
            id.includes("jellyfin-apiclient")
        )
            return "vendor-jellyfin";

        // UI Libraries → vendor-ui-libs
        if (
            id.includes("swiper") ||
            id.includes("jstree") ||
            id.includes("sortablejs") ||
            id.includes("headroom.js")
        )
            return "vendor-ui-libs";

        // Default: vendor
        return "vendor";
    }
}
```

## Chunk Loading Patterns

### Critical Path (Always Loaded)

```bash
main.js          # Core app logic
vendor-framework # React, router, state
```

Loaded on every page view. Must be kept small.

### Feature-Based Loading

```bash
# When viewing visualizer
main.js
vendor-framework
vendor-visualizers  # Lazy loaded
vendor-graphics     # Lazy loaded

# When watching video
main.js
vendor-framework
vendor-media        # Lazy loaded
vendor-subtitles    # Lazy loaded (if subtitles enabled)

# When reading PDF/EPUB
main.js
vendor-framework
vendor-docs         # Lazy loaded
```

### Audio Engine Lazy Loading

**File:** `src/components/audioEngine/index.ts`

The audio engine uses a hybrid approach:

```typescript
// CRITICAL: Bundled in main chunk (always needed)
export { masterAudioOutput, initializeMasterAudio } from './master.logic';
export { xDuration, getCrossfadeDuration } from './crossfader.logic';

// LAZY: Loaded on demand (advanced features)
export const loadAudioWorklets = () => import('./audioWorklets');
export const loadCrossfadeController = () => import('./crossfadeController');
export const loadAudioCapabilities = () => import('./audioCapabilities');
```

**Loading strategy:**

```typescript
// Basic playback - no extra chunks
import { initializeMasterAudio } from 'components/audioEngine';

// Advanced audio features - lazy load
const { loadAudioWorklets } = await import('components/audioEngine');
await loadAudioWorklets();
```

## Theme Chunking

**File:** `vite.config.ts:134-143`

Themes are built as separate entry points:

```typescript
const themeEntries = globSync("src/themes/**/*.scss").reduce(
    (acc, file) => {
        const relativePath = path.relative("src", file);
        const entryName = relativePath.replace(/\.scss$/, "");
        acc[entryName] = path.resolve(__dirname, file);
        return acc;
    },
    {} as Record<string, string>,
);
```

**Output:** `themes/dark/theme.css`, `themes/light/theme.css`, etc.

## Static Asset Handling

**File:** `vite.config.ts:444-472`

Large library files are copied to `libraries/` directory:

```typescript
const Assets = [
    "libarchive.js/dist/worker-bundle.js",
    "libarchive.js/dist/libarchive.wasm",
    "@jellyfin/libass-wasm/dist/js/default.woff2",
    "@jellyfin/libass-wasm/dist/js/subtitles-octopus-worker.js",
    "@jellyfin/libass-wasm/dist/js/subtitles-octopus-worker.wasm",
    "@jellyfin/libass-wasm/dist/js/subtitles-octopus-worker-legacy.js",
    "pdfjs-dist/build/pdf.worker.mjs",
    "libpgs/dist/libpgs.worker.js",
];
```

These are served directly (not bundled) for better caching.

## Adding New Dependencies

To add a new package and route it to the appropriate chunk:

### 1. Identify the chunk

| Package Type | Chunk |
|--------------|-------|
| React ecosystem | `vendor-framework` |
| MUI | `vendor-mui` |
| 3D/Graphics | `vendor-graphics` |
| Visualizers | `vendor-visualizers` |
| Media players | `vendor-media` |
| Documents | `vendor-docs` |
| Subtitles | `vendor-subtitles` |
| Utilities | `vendor-utils` |
| Jellyfin API | `vendor-jellyfin` |
| UI libraries | `vendor-ui-libs` |
| Polyfills | `vendor-corejs` |

### 2. Update vite.config.ts

Add condition to `manualChunks`:

```typescript
if (id.includes("my-new-package")) return "vendor-my-chunk";
```

### 3. Verify in build output

```bash
npm run build:production
# Check that package appears in expected chunk
```

## Bundle Size Budgets

| Chunk Type | Budget |
|------------|--------|
| `main` | < 500KB |
| `vendor-*` | < 600KB each |
| Total initial | < 3MB |

## Performance Impact

### Without Chunking

```
Initial load: ~4MB (everything bundled)
```

### With Chunking

```
Initial load: ~800KB (main + framework)
+ Lazy loaded on demand (100-600KB per feature)
```

### Cache Strategy

- `main` and `vendor-framework`: Updated on app deploy
- `vendor-*`: Cached until package version changes
- Static assets (`libraries/`): Long-term cache

## Debugging Chunks

### Analyze Bundle

```bash
npm run build:production
# Use Chrome DevTools > Network to see chunk loading
```

### Check Chunk Contents

```bash
# List all chunks
ls -la dist/assets/

# Check what's in a chunk (basic)
head -c 1000 dist/assets/vendor-mui-*.js
```

### Verbose Build Output

```bash
npx vite build --profile
# Generates a chrome://tracing file for analysis
```

## Common Issues

### Issue: Package in Wrong Chunk

**Symptom:** Large chunk size, unexpected bundle composition

**Cause:** Package matches multiple conditions in `manualChunks`

**Fix:** Adjust condition order (first match wins)

```typescript
// More specific before general
if (id.includes("butterchurn")) return "vendor-visualizers"; // Specific
if (id.includes("three")) return "vendor-graphics"; // General
```

### Issue: Chunk Dependencies Not Loading

**Symptom:** Feature works in dev but fails in production

**Cause:** Missing dependency in chunk's import graph

**Fix:** Check dynamic import statements ensure full paths

```typescript
// BAD: May not resolve correctly
const module = await import('./myModule');

// GOOD: Use full path with Vite
const module = await import('components/myModule');
```

### Issue: Duplicate Code in Chunks

**Symptom:** Same function appears in multiple chunks

**Cause:** Dynamic imports creating separate copies

**Fix:** Use explicit `manualChunks` for shared code, or use shared utility chunks

## Related Documentation

- [CLAUDE.md](./CLAUDE.md) - Lazy loading patterns
- [BUILD_CACHING.md](./BUILD_CACHING.md) - Build caching strategy
- [BUNDLE_OPTIMIZATION.md](./BUNDLE_OPTIMIZATION.md) - Optimization techniques
