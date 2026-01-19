# State Management Architecture

This document describes the dual-state system in Jellyfin Web: the legacy `playbackManager` event-based system and the modern `audioStore` (Zustand) reactive state.

## Two-State Problem

The application maintains two parallel state systems:

| System | Type | Location | Purpose |
|--------|------|----------|---------|
| `playbackManager` | Event emitter | `src/components/playback/` | Core playback logic, player plugins |
| `audioStore` | Zustand store | `src/store/` | Reactive UI state, React components |

**Why both?** This is a migration pattern - over time, more state should move to Zustand, but the legacy system still handles critical playback logic.

## State Ownership

### PlaybackManager Owns

- Current player instance (`htmlAudioPlayer`, `chromecastPlayer`, etc.)
- Queue management
- Playback methods (`play()`, `pause()`, `stop()`, `seek()`)
- Event triggering

### AudioStore Owns

- UI state derived from playback
- Volume/mute settings
- Current track metadata
- Progress (synced from events)

### Shared State (Dual-Write)

| State | PlaybackManager | AudioStore | Sync Direction |
|-------|-----------------|------------|----------------|
| `isPlaying` | Triggers events | Subscribes via events | PM → Store |
| `currentTime` | Emits `timeupdate` | Updates on event | PM → Store |
| `currentTrack` | Has full item object | Has simplified Track | PM → Store |
| `volume` | Reads from store | Authoritative source | Store → PM |
| `muted` | Reads from store | Authoritative source | Store → PM |

## Sync Protocol

### PlaybackManager → AudioStore

The `playbackManager` emits events that `audioStore` subscribes to:

**File:** `src/components/playback/playbackmanager.ts:826-854`

```typescript
// On playbackstart
Events.on(this, 'playbackstart', (e: any, player: Player) => {
    const state = player.getPlayerState();
    const item = state.NowPlayingItem;

    useAudioStore.getState().setCurrentTrack({
        id: item.Id,
        name: item.Name,
        artist: item.ArtistNames?.[0],
        album: item.Album,
        imageUrl: getImageUrl(item),
        runtimeTicks: item.RunTimeTicks,
    });

    useAudioStore.getState().setDuration(
        item.RunTimeTicks ? item.RunTimeTicks / 10000000 : 0
    );

    useAudioStore.getState().setIsPlaying(true);
});

// On playbackstop
Events.on(this, 'playbackstop', () => {
    useAudioStore.getState().setIsPlaying(false);
    useAudioStore.getState().setCurrentTrack(null);
    useAudioStore.getState().setCurrentTime(0);
});

// On timeupdate
Events.on(this, 'timeupdate', (e: any, player: Player) => {
    const time = player.getCurrentTime();
    useAudioStore.getState().setCurrentTime(time);
});

// On playerchange
Events.on(this, 'playerchange', (e: any, newPlayer: Player) => {
    useAudioStore.getState().setIsPlaying(!newPlayer.paused());
});
```

### AudioStore → PlaybackManager

AudioStore is the **authoritative source** for volume/mute. PlaybackManager reads from it:

**File:** `src/components/audioEngine/master.logic.ts:69-82`

```typescript
// AudioEngine reads volume from Zustand store
get volume() {
    return useAudioStore.getState().volume;
},
set volume(v: number) {
    useAudioStore.getState().setVolume(v);
},

get muted() {
    return useAudioStore.getState().muted;
},
set muted(v: boolean) {
    useAudioStore.getState().setMuted(v);
},
```

## State Flow Diagram

```
┌─────────────────────────────────────────────────────────────────┐
│                    PlaybackManager                               │
│  ┌──────────────┐    ┌──────────────┐    ┌──────────────────┐  │
│  │ Queue        │    │ Player       │    │ Event Emitter    │  │
│  │ Management   │───→│ Plugins      │───→│ (playbackstart,  │  │
│  └──────────────┘    └──────────────┘    │ playbackstop,    │  │
│                                          │ timeupdate, ...) │  │
│                                          └────────┬─────────┘  │
└──────────────────────────────────────────────────┼─────────────┘
                                                   │
                    ┌──────────────────────────────┼──────────────────────────────┐
                    │                              │                              │
                    ▼                              ▼                              │
        ┌─────────────────────┐       ┌─────────────────────┐                     │
        │   Event Listeners   │       │  Player Plugins     │                     │
        │   (Components)      │       │  (htmlAudioPlayer,  │                     │
        │                     │       │   chromecast, etc.) │                     │
        └──────────┬──────────┘       └──────────┬──────────┘                     │
                   │                             │                                 │
                   │    ┌────────────────────────┘                                 │
                   │    │                                                      │
                   ▼    ▼                                                      │
        ┌─────────────────────────────────────────┐                              │
        │           AudioStore (Zustand)          │                              │
        │  ┌───────────────────────────────────┐  │                              │
        │  │ Playback State                    │  │                              │
        │  │ • isPlaying: boolean              │←─┘                              │
        │  │ • currentTrack: Track | null      │                                 │
        │  │ • currentTime: number             │                                 │
        │  │ • duration: number                │                                 │
        │  ├───────────────────────────────────┤  │                              │
        │  │ Audio Engine State                │  │                              │
        │  │ • volume: number (100)            │──┼──────────────────────────────┘
        │  │ • muted: boolean (false)          │  │    Volume reads from store
        │  │ • makeupGain: number              │  │
        │  └───────────────────────────────────┘  │
        └──────────────────┬──────────────────────┘
                           │
                           ▼
              ┌────────────────────────┐
              │   React Components     │
              │   (NowPlayingBar,      │
              │    QueuePage, etc.)    │
              └────────────────────────┘
```

## Usage Patterns

### For React Components (Use AudioStore)

```typescript
import { useAudioStore } from 'store/audioStore';

function MyComponent() {
    // Selector pattern for performance
    const isPlaying = useAudioStore((state) => state.isPlaying);
    const currentTrack = useAudioStore((state) => state.currentTrack);

    // Or subscribe to changes
    useAudioStore.subscribe((state) => {
        console.log('Playback changed:', state.isPlaying);
    });

    return <div>{isPlaying ? 'Playing' : 'Paused'}</div>;
}
```

### For Playback Logic (Use PlaybackManager)

```typescript
import { playbackManager } from 'components/playback/playbackmanager';

// Methods on playbackManager
playbackManager.play();
playbackManager.pause();
playbackManager.stop();
playbackManager.seek(time);
playbackManager.setQueue(items);
playbackManager.nextTrack();
playbackManager.previousTrack();
```

### For Audio Engine (Read AudioStore, Write Events)

```typescript
import { useAudioStore } from 'store/audioStore';
import { playbackManager } from 'components/playback/playbackmanager';

// Read volume from store
const volume = useAudioStore.getState().volume;

// Trigger state changes through playbackManager events
Events.trigger(playbackManager, 'playbackstart', [player, streamInfo]);
```

## Anti-Patterns to Avoid

### ❌ Don't: Write to AudioStore from Playback Logic Without Events

```typescript
// BAD: Direct write bypasses event system
useAudioStore.getState().setIsPlaying(true);

// GOOD: Let playbackManager emit events
Events.trigger(playbackManager, 'playbackstart', [player, state]);
// AudioStore subscribes automatically
```

### ❌ Don't: Read Playback State from AudioStore for Core Logic

```typescript
// BAD: AudioStore may lag behind playbackManager
if (useAudioStore.getState().isPlaying) {
    // This may not reflect current playback state
}

// GOOD: Use playbackManager for authoritative state
if (!playbackManager.paused()) {
    // This is the source of truth
}
```

### ❌ Don't: Create Event Listeners Without Cleanup

```typescript
// BAD: Memory leak
Events.on(playbackManager, 'playbackstart', handler);

// GOOD: Always cleanup
useEffect(() => {
    Events.on(playbackManager, 'playbackstart', handler);
    return () => Events.off(playbackManager, 'playbackstart', handler);
}, []);
```

### ❌ Don't: Mix State Systems Inconsistently

```typescript
// BAD: Confusing dual writes
function play() {
    playbackManager.play();
    useAudioStore.getState().setIsPlaying(true); // Redundant!
}

// GOOD: Single source of truth
function play() {
    playbackManager.play(); // Events will update store
}
```

## Migration Path

The long-term goal is to migrate more functionality to Zustand:

### Phase 1 (Complete): Playback State
- ✅ `isPlaying`, `currentTrack`, `currentTime`, `duration` in store
- ✅ Components subscribe to store

### Phase 2 (In Progress): Queue State
- [ ] Move queue to Zustand
- [ ] Replace `playbackManager.setQueue()` with store actions

### Phase 3 (Planned): Player State
- [ ] Move player instances to store
- [ ] Replace `playbackManager.currentPlayer` with store selector

## Debugging State Issues

### Check Store vs PlaybackManager Sync

```typescript
// Log both states periodically
setInterval(() => {
    console.log('Store isPlaying:', useAudioStore.getState().isPlaying);
    console.log('PM paused:', playbackManager.paused());
}, 1000);
```

### Enable Event Logging

```typescript
// Add temporary listeners
Events.on(playbackManager, 'playbackstart', (e, player) => {
    console.log('playbackstart event fired');
    console.log('Store isPlaying after event:', useAudioStore.getState().isPlaying);
});
```

### Common Issues

| Symptom | Likely Cause | Fix |
|---------|--------------|-----|
| UI shows wrong playback state | Event not firing | Check event subscriptions |
| Volume changes don't affect audio | AudioEngine reading wrong source | Ensure AudioEngine reads store |
| Play state updates lag | Zustand selector issue | Check component selectors |
| State resets on player change | Missing `playerchange` handler | Add handler to sync state |

## Related Documentation

- [PLAYBACK_EVENTS.md](./PLAYBACK_EVENTS.md) - Complete event catalog
- [INITIALIZATION.md](./INITIALIZATION.md) - Startup sequence
- [CLAUDE.md](./CLAUDE.md) - React patterns and Zustand usage
