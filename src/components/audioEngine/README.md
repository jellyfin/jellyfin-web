# Audio Engine - Preload Strategy

This document describes the intelligent audio preloading system that optimizes playback startup time while ensuring seamless crossfades for queued content.

## Overview

The preload system uses a **dual-strategy approach** based on whether the next track is part of the current playback queue:

| Strategy         | When Used                             | Behavior                                              |
| ---------------- | ------------------------------------- | ----------------------------------------------------- |
| **Full Preload** | Next track is IN the queue            | Buffer entire file, preload all images, extract peaks |
| **Streaming**    | Next track is NOT in queue (external) | Fetch metadata only, skip images, skip peaks          |

## Strategies

### Full Preload (Queue Items)

For tracks that are part of the current playlist/queue:

- **Audio**: Uses `preload = 'auto'` and forces `.play()` to buffer the entire file
- **Images**: Preloads album art, backdrop, artist logo, and disc art
- **Peaks**: Extracts audio peaks for visualizer waveform display
- **Timeout**: 15s immediate / 10s fallback
- **Benefit**: Near-instant playback when crossfading

### Streaming Mode (Non-Queue Items)

For tracks that are not in the current queue (e.g., user clicked an external link):

- **Audio**: Uses `preload = 'metadata'` - only fetches headers
- **Images**: Skipped - not worth preloading for one-off plays
- **Peaks**: Skipped - visualizer can use placeholder or generate on-demand
- **Timeout**: 5s (capped from the 15s/10s values)
- **Benefit**: Faster startup for immediate playback

## Queue Detection

The system uses `queueStore` to determine if a track is in the current queue:

```typescript
function isInQueue(itemId: string): boolean {
  const queueStore = useQueueStore.getState();
  return queueStore.items.some(item => item.item.id === itemId);
}

function getPreloadStrategy(itemId: string | null): PreloadStrategy {
  if (!itemId) return "streaming";
  return isInQueue(itemId) ? "full" : "streaming";
}
```

## File Structure

```
src/components/audioEngine/
├── crossfadeController.ts        # Preload strategy implementation
├── crossfadePreloadManager.ts    # Queue-aware strategy selection
├── crossfadePreloadHandler.ts    # Event-driven preloading
└── crossfade-lifecycle.integration.test.ts
```

## Usage

### Preload Options

```typescript
type PreloadOptions = {
  itemId: string;
  url: string;
  crossOrigin?: string | null;
  volume: number;
  muted: boolean;
  normalizationGainDb?: number;
  timeoutMs: number;
  purpose: "crossfade" | "analysis";
  strategy?: "streaming" | "full"; // Auto-selected by manager
};
```

### Trigger Points

1. **Immediate**: When track starts playing
2. **Fallback**: When `timeRemaining <= fadeOutMs * 3`
3. **Manual**: When user manually skips tracks

## Performance Impact

| Metric            | Full Preload | Streaming                 |
| ----------------- | ------------ | ------------------------- |
| Initial load      | Slower       | Faster                    |
| Playback start    | Near-instant | Near-instant              |
| Network usage     | Higher       | Lower                     |
| Crossfade quality | Seamless     | Seamless (may have delay) |

## Debugging

Set `data-preload-strategy` attribute on preloaded audio elements:

```bash
# In browser console
document.querySelectorAll('audio[data-crossfade-preload="true"]')
  .forEach(el => console.log(el.dataset.preloadStrategy))
```

## Related Documentation

- [AGENTS.md](../AGENTS.md) - Audio preloading in development guidelines
- [PLAYBACK_EVENTS.md](../../../../docs/PLAYBACK_EVENTS.md) - Playback event timing
- [INITIALIZATION.md](../../../../docs/INITIALIZATION.md) - Preloader initialization
