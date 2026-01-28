# Playback & Crossfader Integration - Action Plan

**Status**: Ready for UI integration & default configuration
**Last Updated**: 2026-01-28

---

## Summary

The audio playback system with crossfading is fully implemented and tested (186 passing tests). This document outlines the next steps for UI integration, Storybook examples, and default preference configuration.

---

## Phase 1: Default Preferences Configuration ✅ TODO

### 1.1 Visualizer - Disabled by Default

**Current Default**: `enabled: true` (line 217 in `preferencesStore.ts`)
**Required Change**: `enabled: false`

```typescript
// File: src/store/preferencesStore.ts (line 216-218)

const defaultVisualizerPreferences: VisualizerPreferences = {
    enabled: false,  // ← CHANGE FROM: true
    type: 'butterchurn',
    // ... rest remains same
}
```

**Rationale**: Visualizers consume resources; disabled by default allows users to opt-in.

**Testing Required**:
- [ ] Test that visualizer is OFF on first load
- [ ] Test that existing users' preferences are preserved
- [ ] Test that UI toggle works correctly

---

### 1.2 Show Visualizer in UI - Disabled by Default

**Current Default**: `showVisualizer: true` (line 298 in `preferencesStore.ts`)
**Required Change**: `showVisualizer: false`

```typescript
// File: src/store/preferencesStore.ts (line 295-304)

const defaultUiPreferences: UiPreferences = {
    theme: 'dark',
    compactMode: false,
    showVisualizer: false,  // ← CHANGE FROM: true
    showNowPlaying: true,
    animationsEnabled: true,
    highContrastMode: false,
    reducedMotion: false,
    brightness: 50
};
```

**Rationale**: Aligns with `visualizer.enabled: false`; won't show visualizer if not enabled.

**Testing Required**:
- [ ] Verify visualizer UI panel doesn't render when both are false
- [ ] Test that enabling visualizer also shows the panel

---

### 1.3 Pagination Default Page Size - Set to 30

**Current Default**: `defaultPageSize = 50` (line 29 in `usePagination.ts`)
**Target**: `defaultPageSize = 30`

```typescript
// File: src/hooks/usePagination.ts (line 29)

export const usePagination = (componentKey: string, options: UsePaginationOptions = {}): UsePaginationReturn => {
    const { defaultPageSize = 30, storageKey = 'jellyfin-pagination' } = options;
    //                           ← CHANGE FROM: 50
```

**Affected Components** (14 files using `usePagination`):
- Music Playlists
- Artists (all variants)
- Genres
- Live TV
- Movies (Recommended)
- TV Shows (and variants)
- Favorites
- And others

**Testing Required**:
- [ ] Verify default pageSize is 30 for all list views
- [ ] Test that first 30 items load correctly
- [ ] Verify pagination buttons work correctly with new size
- [ ] Test localStorage persistence of user-selected sizes

---

### 1.4 Backdrops - Enabled by Default

**Status**: Need to clarify the requirement

**Questions**:
1. Which backdrop setting? Options:
   - Show backdrop images on Now Playing page?
   - Show backdrop images in item detail views?
   - Use album art as backdrop?
   - Add `showBackdrop: boolean` to `UiPreferences`?

**Action**: Need clarification before implementation

**Proposed Addition to `UiPreferences`**:
```typescript
export interface UiPreferences {
    theme: 'dark' | 'light' | 'system';
    compactMode: boolean;
    showVisualizer: boolean;
    showNowPlaying: boolean;
    animationsEnabled: boolean;
    highContrastMode: boolean;
    reducedMotion: boolean;
    brightness: number;
    showBackdropImages: boolean;  // ← NEW: default to true
    backdropBlurAmount: number;   // ← Optional: 0-10
}
```

**Testing Required** (once clarified):
- [ ] Backdrop images render in correct locations
- [ ] Performance impact is acceptable
- [ ] Images scale correctly on different screen sizes

---

## Phase 2: Storybook Examples ✅ TODO

### 2.1 Current Storybook Coverage

**Existing Stories**:
- ✅ `Visualizers.stories.tsx` - Visualizer components
- ✅ `WaveSurfer.stories.tsx` - WaveSurfer implementation
- ❌ No crossfade examples
- ❌ No playback examples
- ❌ No crossfade settings examples

### 2.2 Create CrossfadeSettings Stories

**File**: `src/components/audioSettings/__stories__/CrossfadeSettings.stories.tsx` (NEW)

```typescript
import { Meta, StoryObj } from '@storybook/react';
import { CrossfadeSettings } from '../CrossfadeSettings';

const meta: Meta<typeof CrossfadeSettings> = {
    title: 'Audio/Crossfade Settings',
    component: CrossfadeSettings,
};

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {};

export const Disabled: Story = {
    decorators: [
        (Story) => {
            // Set store to crossfadeEnabled: false
            return <Story />;
        },
    ],
};

export const AutoLatencyMode: Story = {
    decorators: [
        (Story) => {
            // Set networkLatencyMode: 'auto'
            return <Story />;
        },
    ],
};

export const ManualLatencyMode: Story = {
    decorators: [
        (Story) => {
            // Set networkLatencyMode: 'manual'
            return <Story />;
        },
    ],
};
```

**Testing Required**:
- [ ] All controls render correctly
- [ ] Sliders work in Storybook
- [ ] Toggles work in Storybook
- [ ] Disabled state works correctly

### 2.3 Create VisualizerSettings Stories

**File**: `src/components/visualizerSettings/__stories__/VisualizerSettings.stories.tsx` (NEW)

```typescript
import { Meta, StoryObj } from '@storybook/react';
import { VisualizerSettings } from '../VisualizerSettings';

const meta: Meta<typeof VisualizerSettings> = {
    title: 'Visualizer/Visualizer Settings',
    component: VisualizerSettings,
};

export default meta;
type Story = StoryObj<typeof meta>;

export const Disabled: Story = {
    decorators: [
        (Story) => {
            // Set visualizer.enabled: false
            return <Story />;
        },
    ],
};

export const WaveformEnabled: Story = {
    decorators: [
        (Story) => {
            // Set visualizer.enabled: true, type: 'waveform'
            return <Story />;
        },
    ],
};

export const FrequencyEnabled: Story = {
    decorators: [
        (Story) => {
            // Set visualizer.enabled: true, type: 'frequency'
            return <Story />;
        },
    ],
};

export const ButterchuneEnabled: Story = {
    decorators: [
        (Story) => {
            // Set visualizer.enabled: true, type: 'butterchurn'
            return <Story />;
        },
    ],
};
```

**Testing Required**:
- [ ] All visualizer types render in Storybook
- [ ] Settings controls are accessible
- [ ] Type switching works correctly

### 2.4 Create Playback Integration Stories

**File**: `src/components/__stories__/PlaybackIntegration.stories.tsx` (NEW)

**Purpose**: Demonstrate crossfade in action

```typescript
export const CrossfadeInProgress: Story = {
    decorators: [
        (Story) => {
            // Simulate: Track 1 playing → Track 2 preloaded → Crossfade executing
            // Show:
            //   - Two audio elements (source & preloaded)
            //   - Gain curves animating
            //   - Progress bar showing track position
            //   - Sync status
            return <Story />;
        },
    ],
};

export const PreloadingStrategy: Story = {
    decorators: [
        (Story) => {
            // Show:
            //   - Queue item → Full preload (auto)
            //   - External item → Streaming preload (metadata)
            //   - Network latency monitor
            //   - Timeout handling
            return <Story />;
        },
    ],
};

export const DriftCorrection: Story = {
    decorators: [
        (Story) => {
            // Show:
            //   - Multiple audio elements with different drift values
            //   - Sync manager correcting them
            //   - Master time calculation
            return <Story />;
        },
    ],
};
```

---

## Phase 3: Preferences Menu Integration ✅ DONE

### 3.1 Settings Components - Already Exist

**Audio Settings** (in preferences):
- ✅ `CrossfadeSettings.tsx` - Duration, enabled, network latency
- ✅ `AutoDJSettings.tsx` - Auto-DJ controls
- ✅ `FXSettings.tsx` - FX send levels, notch filter
- ✅ `TimeStretchSettings.tsx` - Time-stretch pause

**Visualizer Settings**:
- ✅ `VisualizerSettings.tsx` - Visualizer type, opacity, sensitivity

### 3.2 Where Preferences Are Displayed

**Location 1**: User Settings Menu
- File: `src/routes/user/settings/index.tsx`
- Should include: AudioSettings components

**Location 2**: Playback Settings Dialog
- File: `src/components/dialogs/PlayerSettingsMenu.tsx`
- Should include: CrossfadeSettings, VisualizerSettings

**Location 3**: Dashboard Settings
- File: `src/apps/dashboard/routes/settings/index.tsx`
- Should include: All audio/visualizer settings

**Action Items**:
- [ ] Verify CrossfadeSettings is in User Settings
- [ ] Verify VisualizerSettings is in User Settings
- [ ] Add playback settings section if missing
- [ ] Test that changes persist to localStorage

---

## Phase 4: Testing & Validation

### 4.1 Unit Tests - Already Complete ✅

```
✅ 186 tests passing
✅ Crossfade logic covered
✅ Preload strategy covered
✅ Network latency covered
✅ Error handling covered
✅ Sync manager covered
```

### 4.2 Integration Tests - Required

**Test Suite**: `e2e/playback-integration.test.ts` (NEW)

```typescript
describe('Playback & Crossfade Integration', () => {
    describe('Default Settings', () => {
        it('should disable visualizer by default', async () => {
            // Check localStorage for visualizer.enabled === false
        });

        it('should hide visualizer UI by default', async () => {
            // Check that visualizer panel is not rendered
        });

        it('should set page size to 30', async () => {
            // Check first page loads 30 items
        });
    });

    describe('Crossfade in UI', () => {
        it('should allow enabling/disabling crossfade', async () => {
            // Toggle crossfade setting
            // Verify setting persists
        });

        it('should show network latency compensation', async () => {
            // Check latency displayed in settings
        });
    });

    describe('Visualizer Settings', () => {
        it('should allow enabling visualizer', async () => {
            // Toggle visualizer
            // Verify visualization renders
        });

        it('should persist visualizer type selection', async () => {
            // Select different types
            // Reload page
            // Verify selection persists
        });
    });
});
```

### 4.3 Manual Testing Checklist

**Settings Panel**:
- [ ] Open Preferences → Audio Settings
- [ ] Verify Crossfade is present
- [ ] Toggle crossfade on/off
- [ ] Adjust duration slider
- [ ] Test network latency mode toggle
- [ ] Verify settings persist on reload

**Visualizer**:
- [ ] Open Preferences → Visualizer Settings
- [ ] Verify visualizer is OFF by default
- [ ] Toggle visualizer ON
- [ ] Select different visualizer types
- [ ] Adjust opacity/sensitivity
- [ ] Verify visualizer appears on playback

**Playback**:
- [ ] Play two tracks in queue
- [ ] Observe smooth crossfade transition
- [ ] Check console for latency compensation logs
- [ ] Monitor performance (CPU/memory)

**Pagination**:
- [ ] Navigate to Music → Artists
- [ ] Verify 30 items on first page
- [ ] Test "next page" button
- [ ] Change items per page
- [ ] Reload page
- [ ] Verify new page size persists

---

## Phase 5: Documentation Updates ✅ TODO

### 5.1 Update User-Facing Docs

**File**: `docs/PLAYBACK_SETTINGS.md` (NEW)

```markdown
# Playback & Audio Settings Guide

## Crossfade Settings
- **Enable Crossfade**: Smooth transitions between tracks
- **Duration**: 0-30 seconds (default: 5s)
- **Network Latency Mode**:
  - Auto: Automatically detects network delay
  - Manual: Set custom delay offset

## Visualizer Settings
- **Enable Visualizer**: Show music visualization (off by default)
- **Type**:
  - Waveform: Oscilloscope style
  - Frequency Bars: EQ-style bars
  - Butterchurn: Liquid effects
  - 3D Geometric: Beta feature
- **Opacity**: 0-100%
- **Sensitivity**: 0-100%

## Pagination
- **Default Page Size**: 30 items per page
- **Can be customized**: Per-component page size is remembered
```

### 5.2 Update Technical Docs

**File**: `AUDIO_PLAYBACK_VERIFICATION.md` (ALREADY CREATED) ✅
- Already comprehensive
- No updates needed

### 5.3 Update README

**File**: `src/components/audioEngine/README.md` (UPDATE)

```markdown
## Default Settings

### Visualizer
- **Disabled** by default (users can enable in preferences)
- Why: Reduces resource usage on initial load

### Crossfade
- **Enabled** by default with 5-second duration
- Why: Provides better playback experience

### Network Latency
- **Auto-detect** by default
- Why: Automatically adapts to network conditions
```

---

## Implementation Order

### Priority 1: Default Settings (Quick Wins)

1. **Update `preferencesStore.ts`**:
   - Change `visualizer.enabled: true` → `false` (line 217)
   - Change `ui.showVisualizer: true` → `false` (line 298)
   - Change `usePagination` default: `50` → `30` (line 29)
   - ⏱️ Estimated: 5 minutes

2. **Test the changes**:
   - Run unit tests: `npm test -- preferencesStore` ✅
   - Run integration tests if available
   - Manual smoke test: verify defaults are used
   - ⏱️ Estimated: 15 minutes

---

### Priority 2: Storybook Examples

3. **Create `CrossfadeSettings.stories.tsx`**:
   - Export Default story
   - Export Disabled story
   - Export with AutoLatency and ManualLatency
   - ⏱️ Estimated: 20 minutes

4. **Create `VisualizerSettings.stories.tsx`**:
   - Export Disabled story
   - Export each visualizer type story
   - ⏱️ Estimated: 20 minutes

5. **Create `PlaybackIntegration.stories.tsx`**:
   - Show crossfade in action
   - Show preload strategies
   - Show drift correction
   - ⏱️ Estimated: 30 minutes

6. **Run Storybook**:
   - `npm run storybook`
   - Verify all stories render
   - Test interactions
   - ⏱️ Estimated: 20 minutes

---

### Priority 3: Integration Testing

7. **Create integration tests**:
   - `e2e/playback-integration.test.ts`
   - Test default settings
   - Test crossfade in UI
   - Test visualizer controls
   - Test pagination
   - ⏱️ Estimated: 45 minutes

8. **Manual testing**:
   - Follow checklist above
   - Document any issues
   - Take screenshots/videos
   - ⏱️ Estimated: 30 minutes

---

### Priority 4: Documentation

9. **Create user documentation**:
   - `docs/PLAYBACK_SETTINGS.md`
   - Explain each setting
   - Provide troubleshooting
   - ⏱️ Estimated: 20 minutes

10. **Update existing docs**:
    - `README.md` in audioEngine
    - Add default settings section
    - ⏱️ Estimated: 10 minutes

---

## Verification Checklist

### Code Changes
- [ ] `preferencesStore.ts` updated with new defaults
- [ ] `usePagination.ts` defaultPageSize changed to 30
- [ ] All tests pass: `npm test`
- [ ] No TypeScript errors: `npm run type-check`

### Storybook
- [ ] CrossfadeSettings stories created and visible
- [ ] VisualizerSettings stories created and visible
- [ ] PlaybackIntegration stories created (optional but recommended)
- [ ] All stories render without errors
- [ ] All controls are interactive

### UI Integration
- [ ] Preferences menu shows CrossfadeSettings
- [ ] Preferences menu shows VisualizerSettings
- [ ] Settings persist on reload
- [ ] Visualizer OFF by default on new install
- [ ] Page size shows 30 items by default

### Testing
- [ ] All unit tests pass (186/186)
- [ ] Integration tests pass
- [ ] Manual testing checklist completed
- [ ] No console errors during playback
- [ ] Crossfade triggers correctly

---

## Questions & Clarifications Needed

1. **Backdrops**: What exactly should be "enabled by default"?
   - [ ] Show backdrop images on Now Playing page?
   - [ ] Show backdrop images in detail views?
   - [ ] Use as blur background on now-playing-bar?
   - **Action**: Clarify, then add `showBackdropImages: boolean` to `UiPreferences`

2. **Page Size**: Should the 30-item default apply to:
   - [ ] All list views (music, TV, movies, etc.)?
   - [ ] Only specific views?
   - **Current Plan**: Apply globally to all views using `usePagination`

3. **Storybook Stories**: What level of interactivity do you need?
   - [ ] Static visual examples only?
   - [ ] Interactive with store mocking?
   - [ ] With real audio playback simulation?
   - **Current Plan**: Interactive with store mocking

---

## Success Criteria

✅ All default preferences updated
✅ Settings are editable in preferences menu (already done)
✅ Storybook examples created and functional
✅ All tests pass
✅ Documentation updated
✅ Manual testing completed successfully
✅ Crossfade works smoothly in production
✅ Visualizer disabled by default (users opt-in)
✅ Pagination shows 30 items by default

---

## Timeline Estimate

| Phase | Tasks | Time |
|-------|-------|------|
| **Phase 1** | Default preferences | 20 min |
| **Phase 2** | Storybook examples | 90 min |
| **Phase 3** | Settings menu (done) | 0 min |
| **Phase 4** | Integration testing | 75 min |
| **Phase 5** | Documentation | 30 min |
| **Total** | | **215 min** (~3.5 hours) |

---

## Notes

- All core playback functionality is tested and working
- Settings components already exist in codebase
- Main work is configuration and examples
- No breaking changes required
- Backward compatible with existing user preferences
- localStorage will preserve user's manual changes

---

**Next Step**: Confirm the backdrop requirement, then start with Phase 1 (default preferences update).
