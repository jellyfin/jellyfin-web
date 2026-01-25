---
name: jellyfin-playback-manager
description: Summarize how playbackManager orchestrates players, event firing, reporting, and crossfades so new playback flows stay unified.
---

## What I do

- Describe how playbackManager selects/changes players, binds fullscreen events, routes Web Audio crossfade timing (`timeRunningOut`, `cancelCrossfadeTimeouts`), and keeps `playerStore` in sync via `triggerPlayerChange`.
- Explain how it builds playback reports (`reportPlayback`, `addPlaylistToPlaybackReport`), normalizes server queries (`getItemsForPlayback`, `mergePlaybackQueries`), and guards remote playback (intros, device profiles, cross-origin checks).
- Highlight integrations: `playbackManagerBridge`, `mediaSessionSubscriber`, `mediaSegmentManager`, skip segments, remote players, and remote control APIs.

## When to use me

- Introducing a route/feature that starts playback, manipulates queue order, or talks to `playbackManager` hooks (`play`, `stop`, `queue`, `seek`).
- Wiring new player types, remote play targets, or cross-system controls that need to report stats via `ServerConnections.getApiClient`.
- Debugging playback issues where timing, crossfade transitions, or player change events matter (check logs around `timeRunningOut` and `Events.trigger`).

## Key rules

- Keep playback state in sync by updating `usePlayerStore`/`useMediaStore` whenever the current player changes.
- When fetching playlist items use `getItemsForPlayback`, add `Filters=IsNotFolder`, include `Chapters`/`Trickplay`, and respect `UNLIMITED_ITEMS` logic.
- Normalize MIME/container combos before hitting streaming endpoints, and handle cross-origin detection before toggling `EnableRemoteMedia`.
- Cancel crossfade timers (`cancelCrossfadeTimeouts`) before applying new tracks, and trigger `timeRunningOut` events as playback nears fade-out points.
