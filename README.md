# Jellyfin Web Modernized

An advanced, high-performance evolution of the Jellyfin Web client, focused on superior audio fidelity, premium music experience, and a streamlined developer experience.

---

## Project Overview

This is a **fork of the official Jellyfin Web client** that has undergone a foundational architectural overhaul. While maintaining full compatibility with the Jellyfin media server ecosystem, this project introduces substantial improvements to deliver a premium media playback experience—particularly for music enthusiasts.

### Why This Fork Exists

The official Jellyfin Web client is excellent for general use, but this fork focuses on:

1. **Audio Excellence** — Studio-quality crossfading, loudness normalization, and distortion-free playback via WebAssembly audio processing
2. **Modern Architecture** — React 18, Zustand state management, Vite build system, TypeScript throughout
3. **Visual Experience** — Integrated Butterchurn (Milkdrop) visualizers, smooth animations via Framer Motion, and Magic Move shared-element transitions
4. **Developer Experience** — Near-instant HMR, comprehensive linting, and a modular codebase ready for continued modernization

---

## Key Features

### Audio Engine

*   **Wasm-Powered Limiter** — A custom Rust/WebAssembly limiter prevents clipping and distortion even at high volumes
*   **Advanced Crossfading** — Configurable crossfade with intelligent track preloading for gapless transitions
*   **Predictive Preloading** — Next track audio, album art, backdrops, and artist logos are preloaded before needed
*   **Track Normalization** — Per-track and album-level gain normalization (when ReplayGain data is available)

### Music Experience

*   **React NowPlayingBar** — Modern playback controls with animated transitions and responsive design
*   **Fullscreen Player** — Immersive `/nowplaying` view with visualizer integration and technical stream info
*   **Queue Management** — Functional `/queue` page with real-time queue data, item removal, and track jumping
*   **Butterchurn Visualizers** — Milkdrop-style presets that respond to audio in real-time

### Build & Performance

*   **Vite Build System** — Sub-second HMR, optimized production builds with intelligent code splitting
*   **Manual Chunking** — Vendor libraries split into cacheable chunks (MUI, Three.js, media libraries, etc.)
*   **60%+ Bundle Reduction** — Main chunk reduced from 1.4MB to under 400KB through tree-shaking and lazy loading

---

## Tech Stack

| Category | Technologies |
|----------|--------------|
| **UI Framework** | React 18, React Router 6, MUI 6, Framer Motion |
| **State Management** | Zustand 5 with subscribeWithSelector |
| **Audio Processing** | Web Audio API, Rust/WASM (limiter, biquad filters) |
| **Visualizers** | Butterchurn (Milkdrop), WaveSurfer.js, Three.js |
| **Build System** | Vite 7, TypeScript 5, Vitest |
| **Media Formats** | HLS.js, FLV.js, libass-wasm (subtitles), PDFJS, EPUB.js |
| **API Client** | @jellyfin/sdk, jellyfin-apiclient |

---

## Quick Start

### Requirements

*   [Node.js](https://nodejs.org/) >= 20.0.0
*   npm >= 9.6.4

### Development

```sh
# Clone and install
git clone https://github.com/your-fork/jellyfin-web.git
cd jellyfin-web
npm install

# Start dev server (http://localhost:5173)
npm start
```

### Production Build

```sh
npm run build:production
# Output: dist/
```

### Quality Checks

```sh
npm run build:check  # TypeScript
npm run lint         # ESLint + Stylelint
npm test             # Vitest
```

---

## Project Structure

```
├── src
│   ├── apps/               # App entry points (Stable, Dashboard, Wizard)
│   ├── components/
│   │   ├── audioEngine/    # Crossfade, WASM limiter, audio routing
│   │   ├── nowPlayingBar/  # React playback controls
│   │   ├── visualizer/     # Butterchurn, WaveSurfer integration
│   │   ├── playback/       # Core playbackManager
│   │   └── router/         # App routing
│   ├── store/              # Zustand stores (audioStore)
│   ├── plugins/            # Player plugins (htmlAudioPlayer, htmlVideoPlayer)
│   └── styles/             # SCSS themes and base styles
├── rust-audio/             # Rust source for WASM audio effects
└── vite.config.ts          # Build configuration
```

---

## Architecture Notes

### Audio Signal Flow

```
MediaElement → GainNode (normalization) → GainNode (crossfade) → MixerNode → Limiter → Destination
                                                    ↓
                                              BiquadFilter (optional EQ)
```

### State Management

The `audioStore` (Zustand) serves as the single source of truth for playback state:
- `currentTrack`, `isPlaying`, `currentTime`, `duration`
- `volume`, `muted`, `makeupGain`

The `playbackManager` emits events that sync to the store, and React components subscribe reactively.

---

## Branches

| Branch | Purpose |
|--------|---------|
| `master` | Stable baseline |
| `music-visualizer` | Active development with all modern features |
| `mitigation-phase-1-security` | Security fixes and dependency updates |

---

## Contributing

We welcome contributions aligned with modernizing the Jellyfin experience. Priority areas:

1. **TypeScript Migration** — Converting legacy controllers to typed React components
2. **Audio Engine** — WASM DSP improvements, additional audio effects
3. **Testing** — Expanding Vitest coverage for core logic

Before submitting a PR:
```sh
npm run lint        # Must pass
npm run build:check # Must pass
npm test            # Must pass
```

---

## License

**GPL-2.0-or-later**

Original branding and assets are property of the Jellyfin Project.
This fork is maintained independently and is not officially affiliated with Jellyfin.
