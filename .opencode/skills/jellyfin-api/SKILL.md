---
name: jellyfin-api
description: Capture how Jellyfin API calls flow through `@jellyfin/sdk`, `getItems`, and TanStack Query so requests stay typed and predictable.
---

## What I do

- Outline the preferred HTTP clients (`ServerConnections.getApiClient`, `@jellyfin/sdk`, and shared helpers in `utils/jellyfin-apiclient`) and how endpoints like `getItems`, `Sessions/Playing`, and `Playback/Progress` are invoked.
- Summarize the `queryKeys` helpers and `@tanstack/react-query` conventions we use for caching server data and invalidation.
- Highlight how errors and logging should be handled via `logger.error` with contextual metadata, and how we wrap API calls in `try/catch` blocks before surfacing user-facing alerts.

## When to use me

- Building or updating data fetching hooks/routes (`useItemsQuery`, `useUser`, etc.) that rely on `getItems` and typed query key helpers.
- Reporting playback/session state (`reportPlayback`, `GetItemPlayState`) or handling playback retries when the server returns errors.
- Integrating with `ServerConnections` to switch clients, guard cross-origin URLs, or fetch device profiles for audio/video streams.

## Key rules

- Always call `getItems` with camelCased options (`includeTypes`, `recursive`, etc.) and the shared `ItemsQueryOptions` helpers so caches stay consistent.
- Pair every API call with `logger.error`/`warn` so issues include `{ component, context }` metadata.
- Keep query invalidations scoped: use `queryKeys.items(parentId, options)` and let `react-query` manage background refreshes instead of manual `setState` churn.
- When dealing with playback-related endpoints include metadata (e.g., `progressEventName`, `Method`) before sending the request so reports stay auditable.
