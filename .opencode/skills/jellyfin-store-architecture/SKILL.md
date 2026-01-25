---
name: jellyfin-store-architecture
description: Outline how Zustand stores (audio, queue, playback, server) and query helpers shape Jellyfin's global state.
---

## What I do

- Map the major stores (`audioStore`, `queueStore`, `playbackStore`, `controlsStore`, `serverStore`, etc.) to their roles and the conventions around slices/actions.
- Explain how we layer TanStack Query data (via `queryKeys` helpers, `useFetchItems`, etc.) on top of live store state for rooms like queues and playback.
- Highlight caching habits: small selectors, derived getters, and persistence (e.g., `persist` middleware for FX defaults).

## When to use me

- Adding or extending a global state slice while keeping new fields typed, namespaced, and exposed through hooks like `useAudioStore`.
- Coordinating queue/playback updates through `audioStore.playbackStarted`, `queueStore.items`, or `playbackManager` events.
- Building derived state that needs to stay consistent across components without reintroducing duplicate logic.

## Key rules

- Prefer typed actions/selectors over `any`; always guard optional values before using them.
- Use the helpers in `src/lib/queryKeys.ts` and pass camelCased options to `getItems` calls for consistent cache keys.
- Keep stores focused: use `audioStore` for audio pipeline state, `queueStore` for queued items, `controlsStore` for UI toggles, and split other concerns out rather than bundling everything in one file.
