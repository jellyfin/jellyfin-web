# Zustand Migration Candidate Files

This document catalogs all files that should be migrated from the legacy Events-based state management to Zustand, organized by priority and category.

---

## Priority Matrix

| Priority | Files | Rationale |
|----------|-------|-----------|
| **P0** (Critical) | 4 | Core playback state, high usage |
| **P1** (High) | 12 | UI state, components, moderate usage |
| **P2** (Medium) | 18 | Settings, preferences, lower usage |
| **P3** (Low) | 23 | Legacy files, deprecated, minimal state |

---

## P0: Critical - Core Playback State

These files manage the core playback state that affects the entire application.

### 1. `src/components/playback/playbackmanager.ts`

**Current Pattern:**
```typescript
Events.on(this, 'playbackstart', (e: any, player: Player) => {
    useAudioStore.getState().setIsPlaying(true);
});
Events.on(this, 'timeupdate', (e: any, player: Player) => {
    useAudioStore.getState().setCurrentTime(time);
});
```

**Issues:**
- Events drive store updates (inverted control)
- 50+ lines of event bindings
- State drift between playbackManager and audioStore

**State to Migrate:**
- `currentPlayer` reference
- Queue management state
- Playback mode (repeat, shuffle)
- Stream info (bitrate, codec)

**New Store Structure:**
```typescript
interface PlaybackState {
    currentPlayer: Player | null;
    queue: Track[];
    queueIndex: number;
    repeatMode: RepeatMode;
    shuffleMode: ShuffleMode;
    streamInfo: StreamInfo | null;
    actions: {
        setCurrentPlayer: (player: Player | null) => void;
        setQueue: (queue: Track[], index: number) => void;
        nextTrack: () => void;
        prevTrack: () => void;
        setRepeatMode: (mode: RepeatMode) => void;
        setShuffleMode: (mode: ShuffleMode) => void;
    };
}
```

**Effort:** Medium | **Risk:** High | **Files Affected:** 30+

---

### 2. `src/components/nowPlayingBar/ReactNowPlayingBar.tsx`

**Current Pattern:**
```typescript
const [repeatMode, setRepeatMode] = useState<RepeatMode>("RepeatNone");
const [shuffleMode, setShuffleMode] = useState<ShuffleMode>("Sorted");

useEffect(() => {
    Events.on(playbackManager, "repeatmodechange", syncState);
    Events.on(playbackManager, "shufflequeuemodechange", syncState);
}, []);
```

**Issues:**
- Local state duplicates store state
- Event handlers with cleanup burden
- No single source of truth for repeat/shuffle

**State to Migrate:**
- `repeatMode`
- `shuffleMode`

**Effort:** Low | **Risk:** Low | **Files Affected:** 1

---

### 3. `src/components/nowPlayingBar/nowPlayingBar.ts`

**Current Pattern:**
```typescript
function bindToPlayer(player: Player | null): void {
    Events.on(player, 'playbackstart', onPlaybackStart);
    Events.on(player, 'playbackstop', onPlaybackStopped);
    Events.on(player, 'volumechange', onVolumeChanged);
    Events.on(player, 'timeupdate', onTimeUpdate);
}

function onPlaybackStart(this: Player): void {
    updatePlayerVolumeState(this.isMuted(), this.getVolume());
}
```

**Issues:**
- 9 event listeners per player
- No automatic cleanup (potential memory leaks)
- Direct DOM manipulation via jQuery patterns

**State to Migrate:**
- NowPlayingBar visibility
- Player-specific state (volume, muted)

**Effort:** High | **Risk:** High | **Files Affected:** 3

---

### 4. `src/components/audioEngine/crossfadePreloadHandler.ts`

**Current Pattern:**
```typescript
Events.on(playbackManager, 'playloadstart', onPlaybackStart);
Events.on(playbackManager, 'playbackstop', onPlaybackStop);
Events.on(playbackManager, 'playerchange', onPlayerChange);
```

**Issues:**
- Event-driven crossfade preloading
- Complex timeout management
- Race conditions between events

**State to Migrate:**
- Crossfade enabled/disabled
- Crossfade duration settings
- Preload status

**New Store:**
```typescript
interface CrossfadeState {
    enabled: boolean;
    duration: number;
    preloadStrategy: 'immediate' | 'fallback';
    preloadStatus: 'idle' | 'preloading' | 'complete';
}
```

**Effort:** Medium | **Risk:** Medium | **Files Affected:** 5

---

## P1: High Priority - UI State

Files that manage significant UI state used across multiple components.

### 5. `src/components/playback/volumeosd.js`

**Current Pattern:**
```typescript
Events.on(player, 'volumechange', onVolumeChanged);
Events.on(playbackManager, 'playerchange', () => { /* show/hide OSD */ });
```

**State to Migrate:**
- OSD visibility
- Volume slider value
- Mute state (already in audioStore)

**Effort:** Low | **Risk:** Low

---

### 6. `src/components/playback/brightnessosd.js`

**Current Pattern:**
```typescript
Events.on(player, 'playbackstop', hideOsd);
Events.on(playbackManager, 'playerchange', () => { /* show/hide OSD */ });
```

**State to Migrate:**
- OSD visibility
- Brightness value

**Effort:** Low | **Risk:** Low

---

### 7. `src/apps/stable/routes/lazyRoutes/QueuePage.tsx`

**Current Pattern:**
```typescript
Events.on(playbackManager, 'playlistitemremove', handlePlaylistChange);
Events.on(playbackManager, 'playlistitemadd', handlePlaylistChange);
Events.on(playbackManager, 'playbackstart', handlePlaybackStart);
Events.on(playbackManager, 'playbackstop', handlePlaybackStop);
```

**State to Migrate:**
- Queue items
- Current queue position
- Playlist modifications

**Effort:** Medium | **Risk:** Medium

---

### 8. `src/scripts/libraryMenu.js`

**Current Pattern:**
```typescript
Events.on(playbackManager, 'playbackstart', onPlaybackStart);
Events.on(playbackManager, 'playbackstop', onPlaybackStop);
Events.on(playbackManager, 'playerchange', updateCastIcon);
```

**State to Migrate:**
- Currently playing item info (for menu display)
- Cast icon state

**Effort:** Medium | **Risk:** Medium

---

### 9. `src/components/themeMediaPlayer.js`

**Current Pattern:**
```typescript
Events.on(playbackManager, 'playbackstart', (_e, player) => {
    // Get item from player and play theme
});
```

**State to Migrate:**
- Theme music state
- Background media state

**Effort:** Low | **Risk:** Low

---

### 10. `src/components/playerstats/playerstats.js`

**Current Pattern:**
```typescript
Events.on(player, 'timeupdate', localOnTimeUpdate);
```

**State to Migrate:**
- Playback statistics (bitrate, buffer, etc.)
- Stats visibility

**Effort:** Low | **Risk:** Low

---

### 11. `src/components/playback/playbackorientation.js`

**Current Pattern:**
```typescript
Events.on(playbackManager, 'playbackstart', (e, player) => {
    // Handle orientation
});
Events.on(playbackManager, 'playbackstop', (e, playbackStopInfo) => {
    // Reset orientation
});
```

**State to Migrate:**
- Device orientation lock state

**Effort:** Low | **Risk:** Low

---

### 12. `src/apps/experimental/components/AppToolbar/RemotePlayButton.tsx`

**Current Pattern:**
```typescript
Events.on(playbackManager, 'playerchange', updatePlayerInfo);
```

**State to Migrate:**
- Remote play device info

**Effort:** Low | **Risk:** Low

---

### 13. `src/components/playback/remotecontrolautoplay.js`

**Current Pattern:**
```typescript
Events.on(playbackManager, 'playerchange', (e, newPlayer, newTarget, oldPlayer) => {
    // Adjust auto-play settings
});
```

**State to Migrate:**
- Auto-play settings per player

**Effort:** Low | **Risk:** Low

---

### 14. `src/components/playback/playerSelectionMenu.ts`

**Current Pattern:**
```typescript
Events.on(playbackManager, 'pairing', () => { /* show pairing UI */ });
Events.on(playbackManager, 'paired', () => { /* hide pairing UI */ });
Events.on(playbackManager, 'pairerror', () => { /* show error */ });
```

**State to Migrate:**
- Pairing UI state
- Available players list
- Pairing errors

**Effort:** Medium | **Risk:** Medium

---

### 15. `src/controllers/lyrics.js`

**Current Pattern:**
```typescript
Events.on(player, 'timeupdate', onTimeUpdate);
Events.on(player, 'playbackstart', onPlaybackStart);
Events.on(player, 'playbackstop', onPlaybackStop);
Events.on(playbackManager, 'playerchange', onPlayerChange);
```

**State to Migrate:**
- Lyrics sync state
- Current lyric index
- Lyrics visibility

**Effort:** Medium | **Risk:** Medium

---

### 16. `src/elements/emby-itemscontainer/ItemsContainer.tsx`

**Current Pattern:**
```typescript
Events.on(playbackManager, 'playbackstop', onPlaybackStopped);
```

**State to Migrate:**
- Item playing state (for play indicator styling)

**Effort:** Low | **Risk:** Low

---

## P2: Medium Priority - Settings & Preferences

Settings that could benefit from reactive state with persistence.

### 17. `src/components/layoutManager.js`

**Current Pattern:**
```typescript
if (save) appSettings.set(SETTING_KEY, layoutValue);
return appSettings.get(SETTING_KEY);
```

**State to Migrate:**
- Layout mode (desktop/TV/mobile)
- Sidebar state

**New Store:**
```typescript
interface LayoutState {
    mode: 'desktop' | 'tv' | 'mobile';
    sidebarOpen: boolean;
    fullscreen: boolean;
}
```

**Effort:** Low | **Risk:** Low

---

### 18. `src/scripts/screensavermanager.js`

**Current Pattern:**
```typescript
Events.on(playbackManager, 'playbackstop', (_e, stopInfo) => {
    option = userSettings.get('screensaver', false);
    // Start screensaver timer
});
```

**State to Migrate:**
- Screensaver enabled
- Screensaver timeout
- Active screensaver type

**Effort:** Low | **Risk:** Low

---

### 19. `src/components/viewSettings/viewSettings.js`

**Current Pattern:**
```typescript
userSettings.set(settingsKey + '-' + elem.getAttribute('data-settingname'), value);
```

**State to Migrate:**
- View settings (grid/list)
- Image type preferences
- Sort options

**Effort:** Medium | **Risk:** Medium

---

### 20. `src/components/filtermenu/filtermenu.js`

**Current Pattern:**
```typescript
userSettings.setFilter(key, value);
```

**State to Migrate:**
- Active filters
- Filter panel visibility

**Effort:** Medium | **Risk:** Medium

---

### 21. `src/components/sortmenu/sortmenu.js`

**Current Pattern:**
```typescript
userSettings.setFilter(settingsKey + '-sortorder', value);
userSettings.setFilter(settingsKey + '-sortby', value);
```

**State to Migrate:**
- Sort order (asc/desc)
- Sort field
- Sort menu visibility

**Effort:** Low | **Risk:** Low

---

### 22. `src/components/homesections/homesections.js`

**Current Pattern:**
```typescript
let section = userSettings.get('homesection' + i) || getDefaultSection(i);
```

**State to Migrate:**
- Home section configuration
- Section visibility

**Effort:** Low | **Risk:** Low

---

### 23. `src/components/subtitlesettings/subtitlesettings.js`

**Current Pattern:**
```typescript
appSettings.set('subtitleburnin', value);
userSettings.setUserInfo(userId, apiClient).then(() => {
    const appearanceSettings = userSettings.getSubtitleAppearanceSettings();
});
```

**State to Migrate:**
- Subtitle appearance settings
- Burn-in settings

**Effort:** Medium | **Risk:** Medium

---

### 24. `src/components/subtitleeditor/subtitleeditor.js`

**Current Pattern:**
```typescript
const lastLanguage = userSettings.get('subtitleeditor-language');
userSettings.set('subtitleeditor-language', language);
```

**State to Migrate:**
- Editor state (current language, timing adjustments)

**Effort:** Low | **Risk:** Low

---

### 25. `src/components/guide/guide-settings.js`

**Current Pattern:**
```typescript
userSettings.set('guide-indicator-' + type, chkIndicator.checked);
userSettings.set('guide-colorcodedbackgrounds', value);
```

**State to Migrate:**
- Guide display settings
- Channel indicators

**Effort:** Medium | **Risk:** Medium

---

### 26. `src/components/guide/guide.js`

**Current Pattern:**
```typescript
EnableFavoriteSorting: userSettings.get('livetv-favoritechannelsattop') !== 'false'
```

**State to Migrate:**
- Guide filter state
- Channel sorting

**Effort:** Medium | **Risk:** Medium

---

### 27. `src/components/playlisteditor/playlisteditor.ts`

**Current Pattern:**
```typescript
userSettings.set('playlisteditor-lastplaylistid', playlistId);
defaultValue = userSettings.get('playlisteditor-lastplaylistid') || '';
```

**State to Migrate:**
- Editor state
- Recently edited playlists

**Effort:** Low | **Risk:** Low

---

### 28. `src/components/itemContextMenu.js`

**Current Pattern:**
```typescript
const sortValues = userSettings.getSortValuesLegacy(sortParentId);
```

**State to Migrate:**
- Menu visibility
- Context actions

**Effort:** Low | **Risk:** Low

---

### 29. `src/controllers/list.js`

**Current Pattern:**
```typescript
IsPlayed: userSettings.getFilter(basekey + '-filter-IsPlayed') === 'true',
showTitle: userSettings.get(basekey + '-showTitle'),
viewType: userSettings.get(basekey + '-viewType') || 'images'
```

**State to Migrate:**
- List view state (filters, sorting, view type)
- Column visibility

**Effort:** High | **Risk:** High

---

### 30. `src/controllers/itemDetails/index.ts`

**Current Pattern:**
```typescript
Events.on(playbackManager, 'playerchange', onPlayerChange);
```

**State to Migrate:**
- Item details playback state
- Related items state

**Effort:** Medium | **Risk:** Medium

---

### 31. `src/controllers/shows/tvrecommended.js`

**Current Pattern:**
```typescript
Events.on(playbackManager, 'playbackstop', onPlaybackStop);
switch (userSettings.get('landing-' + folderId)) {
```

**State to Migrate:**
- Landing page state

**Effort:** Low | **Risk:** Low

---

### 32. `src/controllers/movies/moviesrecommended.js`

**Current Pattern:**
```typescript
Events.on(playbackManager, 'playbackstop', onPlaybackStop);
```

**State to Migrate:**
- Recommendations state

**Effort:** Low | **Risk:** Low

---

### 33. `src/controllers/music/musicrecommended.js`

**Current Pattern:**
```typescript
switch (userSettings.get('landing-' + folderId)) {
```

**State to Migrate:**
- Music recommendations state

**Effort:** Low | **Risk:** Low

---

## P3: Low Priority - Legacy & Minimal State

Files with minimal state or in deprecated areas.

### 34. `src/scripts/autocast.js`

**Current Pattern:**
```typescript
localStorage.setItem('autocastPlayerId', currentPlayerInfo.id);
const playerId = localStorage.getItem('autocastPlayerId');
```

**State to Migrate:**
- Last autocast player

---

### 35. `src/utils/pwaInstall.js`

**Current Pattern:**
```typescript
sessionStorage.setItem('pwa-install-dismissed', 'true');
localStorage.setItem('pwa-installed-date', new Date().toISOString());
```

**State to Migrate:**
- PWA installation state

---

### 36. `src/RootAppRouter.tsx`

**Current Pattern:**
```typescript
const layoutMode = browser.tv ? LayoutMode.Tv : localStorage.getItem(LAYOUT_SETTING_KEY);
```

**State to Migrate:**
- Initial layout mode

---

### 37. `src/components/router/appRouter.js`

**Current Pattern:**
```typescript
const layoutMode = localStorage.getItem('layout');
```

**State to Migrate:**
- Router state

---

### 38-56. Controller Files (Music, Movies, Shows, etc.)

**Pattern:**
```typescript
view: userSettings.getSavedView(key) || 'Poster'
```

Multiple controller files that read view settings. These could benefit from a centralized `viewSettingsStore`.

---

## New Store Architecture

### Existing Stores

| Store | Location | Purpose |
|-------|----------|---------|
| `audioStore` | `src/store/audioStore.ts` | Audio playback state (volume, track, time) |

### Proposed New Stores

| Store | Purpose | Priority |
|-------|---------|----------|
| `playbackStore` | Queue, repeat/shuffle, player | P0 |
| `crossfadeStore` | Crossfade settings, preload status | P0 |
| `layoutStore` | Layout mode, sidebar, fullscreen | P2 |
| `settingsStore` | User preferences (cached) | P2 |
| `queueStore` | Queue management | P1 |
| `playerStore` | Active player state | P1 |
| `osdStore` | OSD visibility and state | P1 |

---

## Migration Pattern Examples

### Pattern 1: Simple Event → Zustand

**Before:**
```typescript
useEffect(() => {
    Events.on(playbackManager, 'playerchange', handleChange);
    return () => Events.off(playbackManager, 'playerchange', handleChange);
}, []);
```

**After:**
```typescript
const player = usePlaybackStore(state => state.currentPlayer);
useEffect(() => {
    if (player) handleChange(player);
}, [player]);
```

### Pattern 2: Settings → Zustand with Persistence

**Before:**
```typescript
appSettings.set('key', value);
const value = appSettings.get('key');
```

**After:**
```typescript
import { create } from 'zustand';
import { persist } from 'zustand/middleware';

interface SettingsState {
    key: string;
    setKey: (value: string) => void;
}

export const useSettingsStore = create<SettingsState>()(
    persist(
        (set) => ({ key: '', setKey: (value) => set({ key: value }) }),
        { name: 'jellyfin-settings' }
    )
);
```

### Pattern 3: Complex State → Zustand Actions

**Before:**
```typescript
function nextTrack() {
    Events.trigger(playbackManager, 'nexttrack');
    // Plus 50 lines of logic
}
```

**After:**
```typescript
interface QueueState {
    queue: Track[];
    currentIndex: number;
    nextTrack: () => void;
    prevTrack: () => void;
    setQueue: (queue: Track[]) => void;
}

export const useQueueStore = create<QueueState>((set, get) => ({
    queue: [],
    currentIndex: 0,
    nextTrack: () => {
        const { queue, currentIndex } = get();
        if (currentIndex < queue.length - 1) {
            set({ currentIndex: currentIndex + 1 });
            playbackManager.playTrack(queue[currentIndex + 1]);
        }
    },
    prevTrack: () => {
        const { queue, currentIndex } = get();
        if (currentIndex > 0) {
            set({ currentIndex: currentIndex - 1 });
            playbackManager.playTrack(queue[currentIndex - 1]);
        }
    },
    setQueue: (queue) => set({ queue, currentIndex: 0 }),
}));
```

---

## Effort Estimates

| Category | Files | Total Effort |
|----------|-------|--------------|
| P0 Critical | 4 | 2-3 weeks |
| P1 High | 13 | 3-4 weeks |
| P2 Medium | 18 | 4-6 weeks |
| P3 Low | 23 | 2-3 weeks |
| **Total** | **58** | **11-16 weeks** |

---

## Recommended Migration Order

1. **Phase 1 (Week 1-2):** `playbackStore` consolidation
   - Extract queue, repeat/shuffle, currentPlayer to Zustand
   - Update `ReactNowPlayingBar.tsx`
   - Update `QueuePage.tsx`

2. **Phase 2 (Week 3-4):** UI state cleanup
   - OSD stores
   - Layout store
   - Remove duplicate event handlers

3. **Phase 3 (Week 5-6):** Settings persistence
   - Create `settingsStore` with persistence
   - Migrate high-impact settings (view, layout)

4. **Phase 4 (Week 7+):** Legacy cleanup
   - Controller files
   - Deprecated patterns
   - Documentation updates

---

## Files Already Using Zustand (Reference)

| File | Usage |
|------|-------|
| `src/store/audioStore.ts` | Source of truth |
| `src/components/audioEngine/master.logic.ts` | Volume, muted, makeupGain |
| `src/components/playback/playbackmanager.ts` | Track, duration, isPlaying, time |
| `src/components/nowPlayingBar/ReactNowPlayingBar.tsx` | Track, isPlaying, time, volume, muted |
| `src/apps/stable/routes/lazyRoutes/NowPlayingPage.tsx` | Track, isPlaying, time, duration |
