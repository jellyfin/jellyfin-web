# Jellyfin Web (Modernized fork)

This repository is a personal/hobby fork of the upstream Jellyfin Web client.

The goal is to keep a working Jellyfin web UI while incrementally modernizing parts of the codebase (build tooling, React/TypeScript, state management, and audio playback). Some areas are intentionally experimental.

## Origin and fork history

- Upstream project: `jellyfin/jellyfin-web` (the official web client for Jellyfin).
- This fork started as a place to experiment with a more modern React/TypeScript setup and a music-focused playback pipeline.
- Over time it gained:
  - Vite as the build system (replacing legacy bundling)
  - React (currently 19) + TypeScript for new/migrated routes
  - Zustand for reactive UI state (alongside the legacy event-based `playbackManager`)
  - A Web Audio + Rust/WASM path for some audio processing
  - An ongoing UI migration away from MUI Joy/Material towards Radix primitives + `ui-primitives` + vanilla-extract

This fork is not affiliated with the Jellyfin project.

## What works / main features

- Jellyfin server compatibility via `@jellyfin/sdk` and `jellyfin-apiclient`.
- Modern dev workflow: Vite dev server, fast reloads, Vitest test runner.
- Playback UI work in progress:
  - React NowPlayingBar (modernized controls)
  - Queue-related pages/routes (still evolving)
- Audio pipeline work in progress:
  - Web Audio routing (gain stages, crossfade, limiter fallback)
  - Queue-aware audio preloading strategy for crossfade use cases

If you are looking for the standard, stable web client, use upstream.

## Experimental areas

These are active experiments and can change without much notice:

- Rust/WASM audio components (analysis, time-stretching, pitch shifting, limiter/worklet experiments)
- Music visualizer work (Butterchurn/WaveSurfer integrations)
- UI migration:
  - replacing MUI Joy/Material components with `src/ui-primitives/*` (Radix + vanilla-extract)
  - replacing legacy SCSS in selected areas

## Tech stack (from `package.json`)

- UI: React 19, Radix UI (`@radix-ui/react-*`), vanilla-extract (`@vanilla-extract/css`)
- Routing: TanStack Router (`@tanstack/react-router`) (some legacy routing remains)
- State/data: Zustand, TanStack Query
- Forms/validation: TanStack Form, Zod
- Tables/lists: TanStack Table, TanStack Virtual
- DnD/sorting: `@dnd-kit/*`, SortableJS
- i18n: i18next, react-i18next, browser language detector
- Media/players: HLS.js, flv.js, libass-wasm, libpgs
- Visualizers/graphics: Butterchurn, WaveSurfer, Three.js (+ react-three-fiber/drei)
- Utilities: axios, DOMPurify, blurhash, idb
- Tooling: Vite 7, TypeScript 5, Vitest 4, Storybook 8, ESLint 9, Stylelint 16, Prettier 3
- Jellyfin integration: `@jellyfin/sdk`, `jellyfin-apiclient`, `@jellyfin/ux-web`

## Planned work (direction, not a promise)

- Continue migrating MUI Joy/Material usage to `ui-primitives`.
- Continue migrating legacy JS/controllers to TypeScript.
- Reduce reliance on the legacy template/event patterns where it makes sense.
- Improve test coverage for the audio engine and state/store code.
- Clean up known rough edges documented in `docs/TECHNICAL_DEBT.md`.

## Project docs

- `AGENTS.md` - workflow notes used by coding agents
- `docs/ARCHITECTURE.md` - high-level architecture
- `docs/STATE_MANAGEMENT.md` - `playbackManager` + Zustand split
- `docs/WASM_AUDIO.md` - Rust/WASM modules
- `docs/TECHNICAL_DEBT.md` - known issues and constraints

## Development

Requirements:

- Node.js >= 20
- npm (see `package.json` engines)

Commands:

```bash
npm install
npm start                 # dev server at http://localhost:5173

npm run build:production  # production build (dist/)
npm run build:check       # TypeScript check

npm run lint              # ESLint + Stylelint
npm test                  # Vitest
```

### Dev Settings (local browser)

- Open `/dev` while running the Vite dev server to configure the Jellyfin server URL and proxy usage.
- If using the dev proxy, set `VITE_DEV_JELLYFIN_TARGET` in `.env.local` and restart `npm start`.
- If you see stale assets or proxy issues, use the **Reset Service Worker & Caches** action on `/dev`.

### MCP Dev Config

- Dev config is stored in `dev/dev-config.json` and exposed via `/__dev-config` in dev.
- MCP tools: `get_dev_config` and `set_dev_config` read/write the same config (no secrets).

### Dev Smoke Test Checklist

- Start dev server: `npm start`.
- (Proxy) Set `VITE_DEV_JELLYFIN_TARGET` in `.env.local` and restart.
- Open `/dev`, click **Reset Service Worker & Caches**.
- Enter server URL, enable proxy (if needed), click **Test Connection**.
- Go to `/login`, authenticate, confirm landing on `/home`.
- Navigate to a library view and verify items load.

## How development happens here

Development moves quickly and is often done with AI coding agents, with developers reviewing and steering the work.

- Issues and discussions are welcome (especially bug reports, regressions vs upstream, and notes about Jellyfin server versions).
- PRs are welcome, but expect the codebase to be in a migration state.

## License

GPL-2.0-or-later.

Jellyfin branding and assets belong to the Jellyfin project. This fork is maintained independently.
