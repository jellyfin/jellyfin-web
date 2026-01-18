# Image Preloader Integration Guide

## Overview

The image preloader system leverages Service Worker caching to ensure smooth image transitions during playback and queue navigation. This system consists of:

1. **ImagePreloader** (`src/utils/imagePreloader.ts`) - Core preloading engine
2. **Backdrop Integration** (`src/components/backdrop/backdrop.js`) - Automatic backdrop preloading
3. **Crossfade Integration** (`src/components/audioEngine/crossfadeImageIntegration.ts`) - Audio + Image coordination

## Architecture

```
Queue Change → Image Preloader → Service Worker (CacheFirst) → Browser Cache
                  ↓                                    ↓
              Fetch Request                    Serve from Cache
```

## Usage Examples

### 1. Queue Image Preloading

Preload album art/thumbnails for the next 5 tracks in the queue:

```typescript
import { imagePreloader, QueueItem } from 'utils/imagePreloader';

const queueItems: QueueItem[] = [
  { itemId: 'track-1', imageUrl: 'https://server.com/images/track1.jpg' },
  { itemId: 'track-2', imageUrl: 'https://server.com/images/track2.jpg' },
  // ... more tracks
];

await imagePreloader.init();
await imagePreloader.preloadQueueImages(queueItems);
```

### 2. Backdrop Image Preloading

The backdrop component automatically preloads rotating images when you call `setBackdropImages()`:

```javascript
import { setBackdropImages } from 'components/backdrop/backdrop';

const backdropUrls = [
  'https://server.com/backdrops/1.jpg',
  'https://server.com/backdrops/2.jpg',
  'https://server.com/backdrops/3.jpg'
];

// Automatically preloads all backdrop images and starts rotation
setBackdropImages(backdropUrls);
```

### 3. Crossfade Integration

Preload both audio and images for smooth track transitions:

```typescript
import { crossfadeImageIntegration } from 'components/audioEngine/crossfadeImageIntegration';

// Initialize once
await crossfadeImageIntegration.init();

// Preload for crossfade (audio + images)
await crossfadeImageIntegration.preloadForCrossfade({
  itemId: 'next-track-id',
  url: 'https://server.com/audio/track2.mp3',
  imageUrl: 'https://server.com/images/track2.jpg',
  backdropUrl: 'https://server.com/backdrops/track2.jpg',
  crossOrigin: 'anonymous',
  volume: 100,
  muted: false,
  normalizationGainDb: -3,
  timeoutMs: 15000
});

// Images are cached by Service Worker - swap is instant
updateNowPlayingImage(nextTrack.imageUrl);
```

## Service Worker Integration

The preloader works seamlessly with your existing Service Worker (`src/sw.js`):

```javascript
// Service Worker Configuration (already set up)
new CacheFirst({
  cacheName: 'jellyfin-images-v1',
  maxEntries: 200,
  maxAgeSeconds: 30 * 24 * 60 * 60 // 30 Days
});
```

**Key Benefits:**
- Automatic cache management (200 entries, 30 days)
- Offline access to cached images
- Network-first fallback for uncached images
- Expiration handling

## Integration Points

### Queue View Component

```typescript
useEffect(() => {
  if (queueItems.length > 0) {
    imagePreloader.preloadQueueImages(queueItems);
  }
}, [queueItems]);
```

### Playback Skip Handler

```typescript
async function onSkipToNext() {
  const nextTrack = getNextTrack();

  // Preload both audio and images for seamless transition
  await crossfadeImageIntegration.preloadForCrossfade({
    itemId: nextTrack.id,
    url: nextTrack.audioUrl,
    imageUrl: nextTrack.imageUrl,
    backdropUrl: nextTrack.backdropUrl,
    volume: 100,
    muted: false,
    timeoutMs: 10000
  });

  startCrossfade();
}
```

### Initial App Load

```typescript
// App initialization
async function initializeApp() {
  await imagePreloader.init();
  await crossfadeImageIntegration.init();

  // Preload current queue
  const currentQueue = getPlaybackQueue();
  imagePreloader.preloadQueueImages(currentQueue);
}
```

## Cache Status Monitoring

Check if an image is cached:

```typescript
import { imagePreloader } from 'utils/imagePreloader';

// Check status (memory)
const status = imagePreloader.getCacheStatus('https://server.com/image.jpg');
console.log(status); // 'unknown' | 'cached' | 'loading' | 'error'

// Check Service Worker cache directly
const isCached = await imagePreloader.checkCacheStatus('https://server.com/image.jpg');
console.log(isCached); // true | false
```

## Performance Considerations

### Preload Strategy

1. **Queue Images:** Next 5 tracks only (configurable)
2. **Backdrop Images:** All rotating backdrops
3. **Crossfade Images:** Next track's album art + backdrop

### Memory Management

```typescript
// Clear status tracking (not actual cache)
imagePreloader.clearCacheStatus();

// Clear specific URLs
imagePreloader.clearStatusForUrls(['url1', 'url2']);
```

### Network Optimization

The preloader uses `no-cors` mode for cache warming:
```typescript
fetch(url, { mode: 'no-cors' });
```
This triggers Service Worker caching without CORS restrictions.

## Error Handling

All preloading uses `Promise.allSettled()`, so individual failures don't block the system:

```typescript
// Preload continues even if some images fail
await imagePreloader.preloadQueueImages(queueItems);

// Each image's status is tracked
const status = imagePreloader.getCacheStatus(url);
if (status === 'error') {
  // Fallback to placeholder or retry
}
```

## Browser Compatibility

- **Service Workers:** Chrome 40+, Firefox 44+, Safari 11.1+
- **CacheFirst Strategy:** Requires Service Worker
- **Fallback:** Gracefully degrades if SW unavailable

## Troubleshooting

### Images Not Preloading

1. Check Service Worker is registered:
   ```javascript
   navigator.serviceWorker.getRegistration()
   ```

2. Verify cache name matches SW:
   ```javascript
   // Both should be 'jellyfin-images-v1'
   ```

3. Check network requests in DevTools:
   - Look for preloaded image requests
   - Verify `no-cors` mode is used

### Images Not Displaying

1. Check cache status:
   ```typescript
   console.log(imagePreloader.getCacheStatus(url));
   ```

2. Verify image URLs are correct format:
   ```javascript
   // Must match SW route pattern
   '/images/', '/thumbnails/', '/logos/', '/backdrop/'
   ```

3. Clear cache if needed:
   ```javascript
   // In Service Worker
   caches.delete('jellyfin-images-v1');
   ```

## Advanced: Custom Preload Timing

For custom timing control:

```typescript
class CustomPreloader {
  async preloadWithDelay(urls: string[], delayMs: number) {
    await new Promise(resolve => setTimeout(resolve, delayMs));
    await imagePreloader.preloadBackdropImages(urls);
  }

  async preloadWhenVisible(urls: string[]) {
    if (document.visibilityState === 'visible') {
      await imagePreloader.preloadBackdropImages(urls);
    }
  }
}
```

## Migration Guide

### From Manual Image Loading

**Before:**
```typescript
const img = new Image();
img.src = url; // Blocks UI until loaded
```

**After:**
```typescript
// Preload in background
imagePreloader.preloadImage(url);

// Display when needed (instant - from cache)
document.querySelector('img').src = url;
```

### From Audio-Only Preloading

**Before:**
```typescript
import { preloadNextTrack } from 'components/audioEngine/crossfadeController';

await preloadNextTrack({ itemId, url, volume, muted });
```

**After:**
```typescript
import { crossfadeImageIntegration } from 'components/audioEngine/crossfadeImageIntegration';

await crossfadeImageIntegration.preloadForCrossfade({
  itemId,
  url,
  imageUrl, // Now also preloads images!
  backdropUrl,
  volume,
  muted
});
```

## Summary

The image preloader system provides:

✅ **Smooth Transitions:** Zero network delay during track changes
✅ **Better UX:** No loading spinners, instant image swaps
✅ **Offline Support:** Cached images work offline
✅ **Performance:** Minimal overhead, leverages Service Worker
✅ **Automatic:** Backdrop rotation auto-preloads
✅ **Type-Safe:** Full TypeScript support

For questions or issues, refer to:
- `src/utils/imagePreloader.ts` - Core implementation
- `src/sw.js` - Service Worker configuration
- `src/components/backdrop/backdrop.js` - Backdrop integration
- `src/components/audioEngine/crossfadeImageIntegration.ts` - Audio/Image coordination
