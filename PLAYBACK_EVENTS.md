# Playback Events Catalog

This document provides a comprehensive catalog of all events used in the Jellyfin Web playback system. Events are emitted by `playbackManager`, individual player plugins, and related components.

## Event Sources

### 1. PlaybackManager Events
**Source:** `src/components/playback/playbackmanager.ts`
**Scope:** Global playback state changes

### 2. Player Plugin Events
**Source:** Individual plugins (`htmlAudioPlayer`, `htmlVideoPlayer`, `chromecastPlayer`, etc.)
**Scope:** Per-player playback state

### 3. SyncPlay Events
**Source:** `src/plugins/syncPlay/`
**Scope:** Multi-client synchronization

---

## Core Playback Events

### `playbackstart`

**Source:** `playbackManager` | Player Plugins
**When Fired:**
- User clicks play
- Auto-advance to next track
- Track starts after crossfade

**Payload:**
```typescript
// From playbackManager
Events.trigger(playbackManager, 'playbackstart', [player, streamInfo]);

// From player plugins
Events.trigger(player, 'playbackstart', [state]);

// Payload types
interface PlaybackStartPayload {
    player: Player;           // Active player instance
    streamInfo?: {
        itemId: string;
        mediaType: string;
        url: string;
    };
}
```

**Subscribers:**
- `crossfadePreloadHandler.ts:174` - Preload next track images
- `QueuePage.tsx:73` - Update queue UI
- `libraryMenu.js:258` - Update playback indicators
- `themeMediaPlayer.js:135` - Start theme music
- `nowPlayingBar.ts:787` - Sync UI state

---

### `playbackstop`

**Source:** `playbackManager` | Player Plugins
**When Fired:**
- User clicks stop
- Track ends
- Track skipped
- Player changed
- Error occurs

**Payload:**
```typescript
// From playbackManager
Events.trigger(playbackManager, 'playbackstop', [stopInfo]);

// Payload type
interface PlaybackStopInfo {
    mode: 'stopped' | 'ended' | 'error' | 'transition';
    itemId?: string;
    nextItemId?: string;
    reason?: string;
}
```

**Subscribers:**
- `crossfadePreloadHandler.ts:175` - Cleanup preloaded images
- `QueuePage.tsx:74` - Update queue UI
- `libraryMenu.js:259` - Update playback indicators
- `screensavermanager.js:24` - Start screensaver timer
- `emby-itemscontainer/ItemsContainer.tsx:365` - Update play indicators

---

### `timeupdate`

**Source:** Player Plugins
**When Fired:** Every ~250ms during playback (HTMLMediaElement `timeupdate` event)

**Payload:**
```typescript
Events.trigger(player, 'timeupdate', [state]);

interface TimeUpdatePayload {
    currentTime: number;      // Current position in seconds
    duration: number;         // Total duration in seconds
    percent: number;          // Progress 0-100
    buffered: number;         // Buffered amount
}
```

**Subscribers:**
- `nowPlayingBar.ts:795` - Update progress bar
- `playerstats/playerstats.js:480` - Track statistics
- `lyrics.js:160` - Sync lyrics
- `chromecastPlayer/plugin.js:581` - Report progress

---

### `volumechange`

**Source:** Player Plugins
**When Fired:** User changes volume or toggles mute

**Payload:**
```typescript
Events.trigger(player, 'volumechange', [state]);

interface VolumeChangePayload {
    volume: number;           // Volume 0-100
    muted: boolean;           // Mute state
}
```

**Subscribers:**
- `nowPlayingBar.ts:792` - Update volume UI
- `volumeosd.js:146` - Show volume OSD

---

### `playerchange`

**Source:** `playbackManager` | SyncPlay
**When Fired:**
- Playback switches between players (e.g., htmlAudioPlayer → chromecastPlayer)
- SyncPlay session starts/stops

**Payload:**
```typescript
// From playbackManager
Events.trigger(playbackManager, 'playerchange', [newPlayer, newTarget, previousPlayer]);

// From SyncPlay
Events.trigger(syncPlayManager, 'playerchange', [currentPlayer]);

interface PlayerChangePayload {
    newPlayer: Player | null;     // New active player
    newTarget: any;               // Playback target
    previousPlayer: Player;       // Previous player
}
```

**Subscribers:**
- `crossfadePreloadHandler.ts:176` - Handle crossfade on player switch
- `nowPlayingBar.ts:799` - Update controls for new player
- `itemDetails/index.ts:2201` - Update item actions
- `libraryMenu.js:852` - Update cast icon
- `remotecontrolautoplay.js:29` - Adjust auto-play settings
- `syncPlay/plugin.ts:37` - Handle SyncPlay state

---

## Playback Control Events

### `pause`

**Source:** Player Plugins
**When Fired:** User pauses playback

**Payload:** None

---

### `unpause`

**Source:** Player Plugins
**When Fired:** User resumes playback

**Payload:** None

---

### `statechange`

**Source:** Player Plugins
**When Fired:** Player state changes (loading, playing, paused, etc.)

**Payload:**
```typescript
interface PlayerStateChange {
    state: 'loading' | 'playing' | 'paused' | 'ended' | 'error';
    reason?: string;
}
```

---

### `stopped`

**Source:** Player Plugins
**When Fired:** Playback stopped completely (similar to `playbackstop` but from player)

**Payload:** None

---

## Repeat & Shuffle Events

### `repeatmodechange`

**Source:** `nowPlayingBar.ts` | Player Plugins
**When Fired:** User changes repeat mode

**Payload:**
```typescript
Events.trigger(player, 'repeatmodechange', [mode]);

type RepeatMode = 'RepeatNone' | 'RepeatAll' | 'RepeatOne';
```

**Subscribers:**
- `ReactNowPlayingBar.tsx:66` - Sync UI state
- `nowPlayingBar.ts:789` - Update repeat button

---

### `shufflequeuemodechange`

**Source:** Player Plugins
**When Fired:** User toggles shuffle

**Payload:**
```typescript
type ShuffleMode = 'Sorted' | 'Shuffle';
```

---

## Playlist Events

### `playlistitemadd`

**Source:** Player Plugins
**When Fired:** Item added to playlist/queue

**Payload:**
```typescript
interface PlaylistItemAddPayload {
    item: any;
    index: number;
}
```

---

### `playlistitemmove`

**Source:** Player Plugins
**When Fired:** Item reordered in playlist

**Payload:**
```typescript
interface PlaylistItemMovePayload {
    itemId: string;
    fromIndex: number;
    toIndex: number;
}
```

---

### `playlistitemremove`

**Source:** Player Plugins
**When Fired:** Item removed from playlist

**Payload:**
```typescript
interface PlaylistItemRemovePayload {
    itemId: string;
    index: number;
}
```

---

## Media Events

### `mediastreamschange`

**Source:** Player Plugins
**When Fired:** Audio/subtitle tracks change

**Payload:**
```typescript
interface MediaStreamsChangePayload {
    audioStreams: any[];
    subtitleStreams: any[];
}
```

---

### `mediastreamschange`

**Source:** Player Plugins
**When Fired:** Stream info updated (quality, codec, etc.)

---

### `fullscreenchange`

**Source:** Player Plugins | `playbackmanager.ts`
**When Fired:** Fullscreen mode toggled

**Payload:** None

---

### `itemstarted`

**Source:** Player Plugins
**When Fired:** New item begins (similar to `playbackstart`)

---

### `itemstopped`

**Source:** Player Plugins
**When Fired:** Item ends (similar to `playbackstop`)

---

## Error Events

### `error`

**Source:** Player Plugins
**When Fired:** Playback error occurs

**Payload:**
```typescript
interface PlayerError {
    code: string;
    message: string;
    fatal: boolean;
}
```

---

### `playbackerror`

**Source:** `playbackManager`
**When Fired:** Playback error handled by manager

**Payload:**
```typescript
interface PlaybackErrorPayload {
    error: Error;
    item: any;
    player: Player;
}
```

---

## SyncPlay Events

### `time-sync-server-update`

**Source:** `TimeSyncCore.js`
**When Fired:** Time sync with server updated

**Payload:**
```typescript
Events.trigger(timeSyncCore, 'time-sync-server-update', [timeOffset, ping]);

interface TimeSyncUpdate {
    timeOffset: number;  // Offset from server time
    ping: number;        // Round-trip time
}
```

---

### `playback-diff`

**Source:** `PlaybackCore.js`
**When Fired:** Playback difference calculated for sync

**Payload:**
```typescript
interface PlaybackDiff {
    diffMillis: number;  // Difference in milliseconds
}
```

---

## PlaybackManager Internal Events

### `playbackprogress`

**Source:** `playbackManager`
**When Fired:** Progress reported to server

**Payload:** Server response data

---

### `playbackcancelled`

**Source:** `playbackManager`
**When Fired:** Playback cancelled before starting

---

### `reportplayback`

**Source:** `playbackManager`
**When Fired:** Playback reported to server

---

### `pairing`

**Source:** `playbackManager`
**When Fired:** SyncPlay pairing started

---

### `paired`

**Source:** `playbackManager`
**When Fired:** SyncPlay pairing complete

---

### `pairerror`

**Source:** `playbackManager`
**When Fired:** SyncPlay pairing failed

---

## Event Helper Hooks

### useCustomEvent

**Location:** `src/hooks/useEventListener.ts`

```typescript
import { useCustomEvent } from 'hooks/useEventListener';

// Listen to playback events
useCustomEvent(playbackManager, 'playbackstart', (e: any, player: Player) => {
    console.log('Playback started', player);
});

// Cleanup automatically on unmount
```

### useCustomEvents

```typescript
// Listen to multiple events
useCustomEvents(
    playbackManager,
    {
        playbackstart: handleStart,
        playbackstop: handleStop,
        playerchange: handleChange,
    },
    [deps...]
);
```

### Events.on / Events.off Pattern

**Legacy pattern (still used):**

```typescript
// Subscribe
Events.on(playbackManager, 'playbackstart', handler);

// Unsubscribe (IMPORTANT for cleanup)
Events.off(playbackManager, 'playbackstart', handler);

// Handler signature
function handler(e: any, player: Player, data?: any) {
    // e: Event object
    // player: The player instance
    // data: Additional event data
}
```

---

## Common Event Patterns

### Tracking Active Playback

```typescript
useEffect(() => {
    const handleStart = () => setIsPlaying(true);
    const handleStop = () => setIsPlaying(false);
    
    Events.on(playbackManager, 'playbackstart', handleStart);
    Events.on(playbackManager, 'playbackstop', handleStop);
    
    return () => {
        Events.off(playbackManager, 'playbackstart', handleStart);
        Events.off(playbackManager, 'playbackstop', handleStop);
    };
}, []);
```

### Responding to Player Changes

```typescript
useEffect(() => {
    const handleChange = (e: any, newPlayer: Player) => {
        // Re-register for new player's events
        Events.on(newPlayer, 'timeupdate', handleTimeUpdate);
    };
    
    Events.on(playbackManager, 'playerchange', handleChange);
    
    return () => {
        Events.off(playbackManager, 'playerchange', handleChange);
    };
}, []);
```

### Tracking Progress

```typescript
useEffect(() => {
    const handleTimeUpdate = (e: any, state: TimeUpdatePayload) => {
        setProgress(state.percent);
        setCurrentTime(state.currentTime);
    };
    
    Events.on(playbackManager, 'timeupdate', handleTimeUpdate);
    
    return () => {
        Events.off(playbackManager, 'timeupdate', handleTimeUpdate);
    };
}, []);
```

---

## Event Flow Diagram

```
User Clicks Play
        ↓
player.play() starts
        ↓
[Player Plugin Events]
    'playbackstart' → 'timeupdate' → 'pause'/'unpause' → 'timeupdate' → ...
        ↓
playbackManager emits:
    'playbackstart' → [all subscribers notified]
        ↓
Crossfade Preload Handler triggers image preloading
Now Playing Bar updates UI
Queue Page updates queue position
        ↓
Track Near End
        ↓
Crossfade triggered (if enabled)
        ↓
playbackManager emits:
    'playerchange' (if switching players) OR
    'playbackstop' (for next track)
        ↓
New track starts cycle repeats
```

---

## Debugging Events

### Enable Event Logging

```typescript
import { logger } from 'utils/logger';

// Add temporary logging
Events.on(playbackManager, 'playbackstart', (e, player) => {
    logger.debug('playbackstart', { player: player.id });
});
```

### Event Monitor Endpoint

When running dev server, poll for errors:

```bash
curl http://localhost:5173/__error-monitor/api/errors
```

---

## Event Checklist for New Components

When creating a new component that needs playback state:

- [ ] Determine which events are needed
- [ ] Use `useCustomEvent` hook for clean subscription
- [ ] Always cleanup in `useEffect` return or `useCallback`
- [ ] Handle case where no player is active
- [ ] Update on `playerchange` if needed
- [ ] Document events used in component header comment
