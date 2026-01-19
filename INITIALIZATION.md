# Application Initialization

This document details the startup sequence, initialization order, and critical dependencies for the Jellyfin Web application.

## Entry Points

### Primary Entry: `src/index.jsx`

The application has one main entry point that orchestrates all initialization:

```bash
src/index.jsx
├── lib/legacy (polyfills)
├── ServerConnections (API client connection)
├── pluginManager (plugin system)
├── appRouter (routing)
├── audioEngine (Web Audio API)
├── keyboardNavigation
└── RootApp (React root)
```

### Secondary Entry Points

| Entry | Purpose | Location |
|-------|---------|----------|
| Stable App | Main user-facing app | `src/apps/stable/` |
| Dashboard | Admin interface | `src/apps/dashboard/` |
| Experimental | Beta features | `src/apps/experimental/` |
| Wizard | Setup flow | `src/apps/wizard/` |

## Initialization Sequence

### Phase 1: Core Infrastructure (Synchronous)

**File:** `src/index.jsx` lines 1-38

```javascript
// 1. Legacy polyfills first - required for older browsers
import "lib/legacy";

// 2. React initialization
import React from "react";
import { createRoot } from "react-dom/client";

// 3. API client connection - MUST be before anything else that uses it
import { ServerConnections } from "lib/jellyfin-apiclient";

// 4. Core systems (no dependencies on above)
import { appHost, safeAppHost } from "./components/apphost";
import { logger } from "./utils/logger";
import autoFocuser from "./components/autoFocuser";
import loading from "components/loading/loading";
```

**Rules:**
- `ServerConnections` must be imported before any module that uses it
- Polyfills (`lib/legacy`) must be first
- Logger available after import

### Phase 2: Plugin & Router System (Synchronous)

```javascript
// Plugin system initialization
import { pluginManager } from "./components/pluginManager";
import { getPlugins } from "./scripts/settings/webSettings";

// Router initialization
import { appRouter } from "./components/router/appRouter";
```

**Critical Dependency Chain:**
```
ServerConnections → pluginManager → appRouter
```

The `appRouter` depends on plugins being registered first.

### Phase 3: Feature Initializers (Async, in order)

**`src/index.jsx` defines the order:**

| Order | Initializer | Purpose | Async? |
|-------|-------------|---------|--------|
| 1 | `initializeAudioContextEarly()` | Web Audio API setup | Yes |
| 2 | `initializeCrossfadePreloader()` | Image preloading for crossfade | Yes |
| 3 | `setupAudioContextResume()` | Autoplay policy compliance | Yes |
| 4 | Various utility initializers | PWA, performance, bundle analysis | No |

### Detailed: initializeAudioContextEarly()

**Location:** `src/index.jsx:42-62`

```typescript
async function initializeAudioContextEarly() {
    // Lazy load the audio engine to avoid blocking main thread
    const { initializeMasterAudio } = await import("./components/audioEngine/master.logic");
    
    initializeMasterAudio(() => {
        // Cleanup callback on app unload
    });
}
```

**Purpose:** Prepare Web Audio API before user interaction for instant playback.

**Error Handling:** Non-fatal - logs warning if fails, playback still works (fallback to HTML5 audio).

### Detailed: initializeCrossfadePreloader()

**Location:** `src/index.jsx:64-92`

```typescript
async function initializeCrossfadePreloader() {
    const {
        initializeCrossfadePreloadHandler,
        destroyCrossfadePreloadHandler,
    } = await import("./components/audioEngine");
    
    // Start listening for playback events
    initializeCrossfadePreloadHandler();
    
    // Clean up on page unload
    window.addEventListener("beforeunload", () => {
        destroyCrossfadePreloadHandler();
    });
}
```

**Purpose:** Preload album art, backdrops, artist logos, and disc art during playback.

**Events Listened:**
- `playbackstart` - Preload next track images
- `playbackstop` - Cleanup
- `playerchange` - Handle player switches

### Detailed: setupAudioContextResume()

**Location:** `src/index.jsx:94-120+`

**Purpose:** Handle browser autoplay policies by resuming AudioContext on user interaction.

```typescript
function setupAudioContextResume() {
    const resumeAudioContext = async () => {
        // Attempt to resume AudioContext
    };
    
    // Listen for user interaction events
    document.addEventListener("click", resumeAudioContext, { once: true });
    document.addEventListener("keydown", resumeAudioContext, { once: true });
}
```

### Phase 4: React Mount

**Location:** `src/index.jsx` end

```typescript
// Create React root and mount
const root = createRoot(document.getElementById("root"));
root.render(<RootApp />);
```

## Audio Engine Initialization Details

### Master Audio Setup

**File:** `src/components/audioEngine/master.logic.ts`

```typescript
export function initializeMasterAudio(cleanup?: () => void): void {
    // 1. Create AudioContext (may be suspended)
    // 2. Create master gain node (user volume)
    // 3. Create limiter (prevent clipping)
    // 4. Set up audio node bus for crossfading
    // 5. Register cleanup handler
}
```

### Audio Chain Architecture

```
MediaElement
    ↓
MediaElementAudioSourceNode
    ↓
[DelayNode] (visualizer sync, optional)
    ↓
NormalizationGainNode (per-track leveling)
    ↓
CrossfadeGainNode (transition automation)
    ↓
MasterMixer (user volume)
    ↓
Limiter (DynamicsCompressor or WASM)
    ↓
AudioContext.destination (speakers)
```

## Crossfade Preload Handler

**File:** `src/components/audioEngine/crossfadePreloadHandler.ts`

```typescript
export function initializeCrossfadePreloadHandler(): void {
    // Subscribe to playback events
    Events.on(playbackManager, 'playbackstart', handleTrackStart);
    Events.on(playbackManager, 'playbackstop', handlePlaybackStop);
    Events.on(playbackManager, 'playerchange', handlePlayerChange);
}

export function destroyCrossfadePreloadHandler(): void {
    // Unsubscribe from all events
    Events.off(playbackManager, 'playbackstart');
    Events.off(playbackManager, 'playbackstop');
    Events.off(playbackManager, 'playerchange');
}
```

## Initialization Order Dependency Graph

```
START
    │
    ├─ lib/legacy (polyfills)
    │
    ├─ ServerConnections
    │     │
    │     └─ pluginManager
    │           │
    │           └─ appRouter
    │                 │
    │                 └─ (depends on plugins loaded)
    │
    ├─ initializeAudioContextEarly()
    │     └─ await import(audioEngine/master.logic)
    │           └─ initializeMasterAudio()
    │
    ├─ initializeCrossfadePreloadHandler()
    │     └─ await import(audioEngine)
    │           └─ initializeCrossfadePreloadHandler()
    │                 └─ Events.on(playbackManager, ...)
    │
    ├─ setupAudioContextResume()
    │     └─ document.addEventListener('click', ...)
    │
    ├─ Other utilities (PWA, performance, etc.)
    │
    └─ RootApp.mount()
          │
          └─ AppLayout
                │
                └─ Outlet (renders current route)
```

## Error Handling Strategy

### Non-Fatal Initialization Failures

These are logged but don't block app startup:

| Initializer | Fallback | Impact |
|-------------|----------|--------|
| `initializeAudioContextEarly()` | HTML5 audio only | No crossfading, basic playback works |
| `initializeCrossfadePreloadHandler()` | No image preloading | Images load on-demand, may show spinners |
| `setupAudioContextResume()` | AudioContext remains suspended | User must interact first |

### Fatal Initialization Failures

These block app startup:

| Initializer | Error | Resolution |
|-------------|-------|------------|
| `ServerConnections` | No API client | App unusable - check network/server |
| `pluginManager` | Plugin registration failed | Check plugin configs |
| `appRouter` | Route registration failed | Check route definitions |

## Cleanup on Unload

The application registers cleanup handlers for memory management:

```typescript
// Audio context
window.addEventListener("beforeunload", () => {
    destroyCrossfadePreloadHandler();
    // Audio context cleanup handled by initializeMasterAudio callback
});

// PWA caches
import { cleanupExpiredCache } from "./utils/randomSortCache";
// Called periodically, not on unload
```

## Testing Initialization

### Verify Initialization Order

```bash
# Enable debug logging
npm start

# Look for initialization messages in console:
# [index] Initializing audio context early
# [index] Audio context initialized early
# [index] Initializing crossfade preloader
# [index] Crossfade preloader initialized
```

### Mock Initialization for Testing

```typescript
// In tests, mock the async initializers
jest.mock('./components/audioEngine/master.logic', () => ({
    initializeMasterAudio: jest.fn(),
}));

jest.mock('./components/audioEngine', () => ({
    initializeCrossfadePreloadHandler: jest.fn(),
    destroyCrossfadePreloadHandler: jest.fn(),
}));
```

## Common Issues

### AudioContext State Issues

**Symptom:** Audio plays but crossfading doesn't work

**Cause:** AudioContext not properly initialized or resumed

**Debug:** Check console for `[audioEngine]` initialization messages

### Image Preloading Not Working

**Symptom:** Images show loading spinners during track transitions

**Cause:** `initializeCrossfadePreloadHandler()` not called or failed

**Debug:** Check for `[index] Crossfade preloader initialized` message

### Router Not Loading

**Symptom:** White screen, no routes render

**Cause:** Plugin registration failed, blocking appRouter

**Debug:** Check browser console for plugin errors before router initialization

## Adding New Initializers

To add a new initialization function:

1. **Create the function** in appropriate module
2. **Add to `src/index.jsx`** in Phase 3 section
3. **Follow the pattern:**
   ```typescript
   async function initializeNewFeature() {
       try {
           logger.debug("Initializing new feature", { component: "index" });
           const { feature } = await import("./path/to/module");
           feature.initialize();
           logger.debug("New feature initialized", { component: "index" });
       } catch (error) {
           logger.warn("Failed to initialize new feature", { component: "index" }, error);
       }
   }
   ```
4. **Add cleanup if needed** to the unload handler
5. **Document** in this file with order and purpose
