# Crossfade Timeline & Image Preloading Trigger Analysis

## Crossfade Lifecycle Overview

```
Track Timeline (180 seconds example):
0s ──────────┬───────────┬───────────┬───────────┬─────────── 180s
             │           │           │           │           │
             │           │           │           │           └─ Track ends
             │           │           │           └─ Crossfade starts (timeRunningOut)
             │           │           └─ Fallback preload (if immediate failed)
             │           └─ 90% complete (90s)
             └─ Track starts → IMMEDIATE PRELOAD NEXT TRACK
```

## New Aggressive Strategy: Immediate Preload

### Strategy Overview

**Preload next track immediately when current track starts**

**Rationale:**
- Users may click "next" at any moment (within first 10-30 seconds)
- Next track art should be ready for instant display
- Network latency unpredictable - better safe than sorry
- Bandwidth cost negligible compared to audio streaming
- Service Worker cache management handles cleanup automatically

### Timeline Comparison

```
Old Strategy (50% trigger):
Track A: ──────────────────────────┬─────────────────── (90s mark, preload Track B)
Track B:                           ──────────────────────
User skips: █ (at 30s) → Spinner! ❌

New Strategy (Immediate trigger):
Track A: ─────────────────────────────────────────────────── (preload Track B immediately)
Track B: ───────────────────────────────────────────────────
User skips: █ (at 30s) → Instant! ✅
```

### Network Latency Impact

| Connection | Image Size | Fetch Time | Track Position at Skip | Experience |
|-----------|------------|-------------|----------------------|------------|
| **Fast** | 200KB | 100ms | Any | ✅ Instant |
| **Average** | 200KB | 500ms | Any | ✅ Instant |
| **Slow** | 200KB | 2s | Any | ✅ Instant |
| **Very Slow** | 200KB | 5s | Any | ✅ Instant |

**All scenarios:** ✅ Images ready when user clicks next

### Current Crossfade Timing

Based on `crossfader.logic.ts`:

```typescript
// timeRunningOut() triggers when:
duration - currentTime <= fadeOut * 1.5

// Example: 180s track, 1s fade
// Crossfade triggers at: 180 - 1.5 = 178.5s
// Crossfade duration: 1s
// Track ends: 180s
// Buffer: 0.5s
```

### Crossfade Phases

From `AUDIO_SYSTEM_TECHNICAL_DOCUMENTATION.md`:

1. **Hijack Phase** (Synchronous)
   - Element renamed to 'crossFadeMediaElement'
   - Audio nodes registered in buses
   - Playback controls overridden

2. **Sustain Phase** (`xDuration.sustain * 1000`ms)
   - UI controls re-enabled
   - Crossfade state reset
   - Ready for next track

3. **Fade Phase** (`xDuration.fadeOut * 1000`ms)
   - Exponential ramp from current gain to 0.01
   - Duration: `xDuration.fadeOut` seconds

4. **Cleanup Phase** (After fade completion)
   - Audio nodes disconnected
   - Element removed from DOM
   - Resources freed

## Image Preloading Timing Analysis

### Preload Window Requirements

**Constraints:**
1. **Must complete before user clicks next** - Images ready for instant display
2. **Must complete before crossfade starts** - Images ready when needed
3. **Should handle network latency** - Slow connections need more time
4. **Should respect cache** - Cache hits are instant
5. **Should manage memory** - Don't overload cache

### Network Latency Estimates

| Connection Type | Image Size | Fetch Time | Images Needed | Total Time |
|---------------|------------|-------------|---------------|------------|
| **Fast (WiFi/5G)** | 200KB | 100ms | 4 (art + backdrop + logo + disc) | 400ms |
| **Average (4G)** | 200KB | 500ms | 4 | 2s |
| **Slow (3G)** | 200KB | 2s | 4 | 8s |
| **Very Slow** | 200KB | 5s | 4 | 20s |

### Recommended Preload Strategy: Immediate + Fallback

#### Primary Strategy: Immediate Preload on Track Start

**Trigger:** Immediately when track starts playing

**Pros:**
- ✅ Images always ready regardless of when user skips
- ✅ Maximum time for slow connections (entire track duration)
- ✅ Simple to implement
- ✅ Predictable behavior
- ✅ Cache hits are instant anyway

**Cons:**
- ⚠️ Preloads images that may never be displayed (if user doesn't skip)
- ⚠️ Slightly higher memory usage (2-4 additional images cached)
- ⚠️ More bandwidth usage (negligible: ~550KB per track)

**Example:**
```
180s track → Trigger at 0s (track start)
Preload time available: 180s
Network needs: 0.2s (fast) to 10s (slow)
Margin: ✅ Massive (always sufficient)

User skips at 30s: Images already cached! ✅
User skips at 90s: Images already cached! ✅
User skips at 150s: Images already cached! ✅
```

#### Fallback Strategy: Time Running Out

**Trigger:** When `timeRunningOut()` would trigger crossfade

**Purpose:** Safety net if immediate preload failed

**Example:**
```
180s track, 1s fade
Immediate preload fails at 0s (network error)
Fallback triggers at 178.5s
Second chance to load before crossfade
```

## Comparison: Immediate vs 50% Strategy

| Scenario | Immediate Strategy | 50% Strategy |
|----------|-----------------|----------------|
| **User skips at 10s** | ✅ Images ready | ❌ Not yet loaded |
| **User skips at 30s** | ✅ Images ready | ❌ Not yet loaded |
| **User skips at 90s** | ✅ Images ready | ✅ Just loaded |
| **User skips at 150s** | ✅ Images ready | ✅ Long loaded |
| **Slow connection** | ✅ Entire track duration | ⚠️ Only half track |
| **Fast connection** | ✅ Instant | ⚠️ Waits unnecessarily |
| **Cache hit** | ✅ Instant | ⚠️ Waits unnecessarily |

## Bandwidth & Memory Analysis

### Bandwidth Usage

**Per track:**
- Album art: ~200KB
- Backdrop: ~200KB
- Artist logo: ~50KB
- Disc art: ~100KB
- **Total: ~550KB per track**

**For 100 tracks in queue:**
- Immediate: ~55MB (all next track arts)
- 50% strategy: ~27.5MB (only when reached 50%)
- No strategy: ~0MB

**Comparison:**
- **Audio streaming:** ~100MB per hour (128kbps)
- **Image preloading:** ~0.55MB per track
- **Ratio:** Images = 0.55% of audio bandwidth

**Conclusion:** Image bandwidth cost negligible compared to audio streaming.

### Memory Usage

**Service Worker cache limits:**
- Chrome: ~6% of disk space
- Firefox: ~50MB per origin
- Safari: ~50MB per origin

**Cache capacity:**
```
550KB per track × 200 entries (SW max) = 80MB
```

**Real-world usage:**
```
Immediate: Preloads next track only = 400KB
Queue view: Preloads 5 ahead = 2MB
Backdrops: Preloads rotating set = 4-8MB
Total typical: ~6-10MB
```

**Conclusion:** Well within cache limits, SW manages eviction automatically.

## Integration with Existing Crossfade Lifecycle

### Updated Crossflow Timeline

```typescript
function shouldPreloadFallback(
    currentTime: number,
    duration: number,
    fadeOut: number,
    hasPreloaded: boolean
): boolean {
    // Only if not already preloaded
    if (hasPreloaded) return false;

    // Trigger when crossfade would start
    return duration - currentTime <= fadeOut * 3;
}
```

### Manual Trigger (User Actions)

```typescript
function onUserSkipToNext() {
    // User clicked next button
    // Preload immediately (already happening in crossflow)
    crossfadeImageIntegration.preloadForCrossfade(...);
}
```

## Integration with Existing Crossfade Lifecycle

### Updated Crossflow Timeline

```
0s ──────────┬───────────┬───────────┬───────────┬─────────── 180s
             │           │           │           │           │
             │           │           │           │           └─ Track ends
             │           │           │           └─ Crossfade starts (timeRunningOut)
             │           │           └─ Fallback preload (if immediate failed)
             │           └─ 90% complete (90s)
             └─ Track starts → IMMEDIATE PRELOAD NEXT TRACK
```

### Implementation Points

#### 1. Track Start Handler (Primary Trigger)

```typescript
function onTrackStart(currentTrack: TrackInfo, getNextTrack: () => TrackInfo | null) {
    // Reset preload state
    resetPreloadState();

    // Clear old image cache status for current track
    imagePreloader.clearStatusForUrls([
        currentTrack.imageUrl,
        currentTrack.backdropUrl
    ]);

    // IMMEDIATELY preload next track
    const nextTrack = getNextTrack();
    if (nextTrack && xDuration.enabled) {
        console.debug('[CrossfadePreload] Immediate preload:', nextTrack.itemId);
        executePreload(nextTrack, 'immediate');
    }
}
```

#### 2. Playback Time Update Handler (Fallback)

```typescript
function onPlaybackTimeUpdate(player: MediaElement, getNextTrack: () => TrackInfo | null) {
    const nextTrack = getNextTrack();
    if (!nextTrack) {
        return;
    }

    // Only use fallback - immediate already tried at track start
    if (shouldPreloadFallback(player)) {
        console.debug('[CrossfadePreload] Fallback trigger');
        executePreload(nextTrack, 'fallback');
    }
}
```

#### 3. Manual Skip Handler (User Action)

```typescript
async function onSkipToNext() {
    const nextTrack = getNextTrack();

    // Immediately preload (already in crossflow)
    await crossfadeImageIntegration.preloadForCrossfade({
        itemId: nextTrack.id,
        url: nextTrack.audioUrl,
        imageUrl: nextTrack.imageUrl,
        backdropUrl: nextTrack.backdropUrl,
        volume: 100,
        muted: false,
        timeoutMs: 10000
    });

    // Start crossfade
    startCrossfade();
}
```

## Network-Aware Adaptive Preloading (Advanced)

While immediate preloading works well, we can optimize further based on network conditions.

### Detect Network Speed

```typescript
class NetworkPreloadStrategy {
    private averageLatency: number = 0;
    private samples: number[] = [];

    recordLatency(latency: number) {
        this.samples.push(latency);
        if (this.samples.length > 5) {
            this.samples.shift();
        }
        this.averageLatency = this.samples.reduce((a, b) => a + b, 0) / this.samples.length;
    }

    shouldPreloadImmediately(): boolean {
        if (this.averageLatency < 500) {
            // Fast connection: immediate preload unnecessary (cache is fast enough)
            return false;
        } else if (this.averageLatency < 2000) {
            // Average connection: immediate preload is good
            return true;
        } else {
            // Slow connection: definitely preload immediately
            return true;
        }
    }
}
```

### Adaptive Immediate Preload

```typescript
function shouldPreloadImmediately(
    networkStrategy: NetworkPreloadStrategy
): boolean {
    return networkStrategy.shouldPreloadImmediately();
}
```

**Note:** For most cases, immediate preloading is simple and effective. Network-aware strategies add complexity for marginal benefit.

## Summary & Recommendations

### Recommended Strategy: Immediate Preload + Fallback

**Primary trigger:** Immediately when track starts
**Fallback trigger:** When `timeRunningOut()` would trigger crossfade

**Pros:**
- ✅ Images always ready regardless of skip timing
- ✅ Maximum reliability across all network conditions
- ✅ Simple to implement and understand
- ✅ Fallback ensures success even if immediate fails
- ✅ Excellent UX - instant display always
- ✅ Bandwidth cost negligible (0.55% of audio)

**Cons:**
- ⚠️ Slightly higher bandwidth usage (~550KB per track)
- ⚠️ Slightly higher memory usage (2-4 additional images cached)
- ⚠️ May preload images user never sees (if they don't skip)

**Tradeoff Assessment:**
- Bandwidth cost: **Negligible** (0.55% of audio)
- Memory impact: **Acceptable** (6-10MB typical)
- UX improvement: **Significant** (instant display vs spinners)
- Complexity: **Low** (simple implementation)

**Verdict:** Immediate preloading is the optimal balance.

### Implementation Priority

1. **Immediate (MVP):**
   - Immediate preload on track start
   - Fallback trigger at `timeRunningOut()`
   - Manual trigger on user actions
   - Cache status monitoring

2. **Short-term:**
   - Analytics tracking (cache hit/miss rates)
   - Performance monitoring
   - Network speed detection (optional)

3. **Long-term:**
   - Predictive preloading based on user behavior
   - Network Information API integration
   - Adaptive strategies for specific use cases

### Testing Scenarios

| Scenario | Immediate Strategy | 50% Strategy |
|----------|-------------------|---------------|
| **Fast connection** | ✅ Always ready | ⚠️ Wastes time waiting |
| **Slow connection** | ✅ Maximum time to load | ⚠️ Only half the time |
| **User skips at 10s** | ✅ Ready | ❌ Not loaded yet |
| **User skips at 30s** | ✅ Ready | ❌ Not loaded yet |
| **User skips at 90s** | ✅ Ready | ✅ Just loaded |
| **User skips at 150s** | ✅ Ready | ✅ Long loaded |
| **Cache hit** | ✅ Instant | ⚠️ Wastes time waiting |
| **Track < 30s** | ✅ Works | ⚠️ Very late trigger |

## Code Integration Points

### Files to Create

1. **`src/components/audioEngine/crossfadePreloadManager.ts`** ✅ Created
   - Immediate preload on track start
   - Fallback trigger near crossfade
   - Manual trigger on user actions
   - State management

### Files to Modify

1. **Playback Manager**
   - Call `handleTrackStart()` when track begins
   - Call `handlePlaybackTimeUpdate()` during playback
   - Call `handleManualSkip()` on next/previous actions

2. **`src/components/audioEngine/crossfader.logic.ts`**
   - Integrate with existing `timeRunningOut()`
   - Already compatible

3. **`src/utils/imagePreloader.ts`**
   - Analytics tracking (cache hit/miss rates)
   - Latency reporting (optional)

## Next Steps

1. ✅ Implement immediate preload on track start
2. ✅ Add fallback trigger for safety
3. ⏳ Add integration tests for various scenarios
4. ⏳ Add performance monitoring and analytics
5. ⏳ Consider network-aware strategies (optional enhancement)

## Conclusion

Immediate preloading provides the best user experience by ensuring next track images are always ready, regardless of when the user skips to the next track. The bandwidth and memory overhead are negligible compared to the significant UX improvement of instant image display.

**Key Benefits:**
- Instant display always (no spinners)
- Works on all network conditions
- Simple to implement and maintain
- Excellent tradeoff of resource usage vs UX

**Recommended:** Implement immediate preloading strategy as described in `crossfadePreloadManager.ts`.
