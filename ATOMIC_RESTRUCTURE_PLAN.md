# Atomic Design Restructure Plan (Option A - Full Sprint)

**Status:** In Planning Phase
**Timeline:** 2-3 weeks
**Branch:** `music-visualizer` → merge to `master`
**Scope:** 56+ components, 42 stories, complete reorganization

---

## Executive Summary

Reorganize `src/ui-primitives/` from flat structure → atomic design hierarchy:
```
Current:  src/ui-primitives/*.tsx (48 files)
Target:   src/ui-primitives/atoms/, molecules/, organisms/
```

**Key Metrics:**
- 23 atoms (100% story coverage)
- 18 molecules (72% story coverage)
- 15+ organisms (27% story coverage)
- 3 deprecated components (mark for removal)
- 57 CSS files (maintain Vanilla Extract pattern)

---

## Target Directory Structure

```
src/ui-primitives/
├── atoms/                        # Foundational, reusable components
│   ├── Alert/
│   │   ├── Alert.tsx
│   │   ├── Alert.css.ts
│   │   └── index.ts
│   ├── Avatar/
│   ├── Box/
│   ├── Button/                   # HIGH PRIORITY
│   │   ├── Button.tsx
│   │   ├── Button.css.ts
│   │   └── index.ts
│   ├── Checkbox/
│   ├── Chip/
│   ├── CircularProgress/
│   ├── Container/
│   ├── Divider/
│   ├── Grid/
│   ├── IconButton/               # HIGH PRIORITY (icon standardization)
│   │   ├── IconButton.tsx
│   │   ├── IconButton.css.ts
│   │   └── index.ts
│   ├── Input/
│   ├── Paper/
│   ├── Progress/
│   ├── RadioGroup/
│   ├── Separator/
│   ├── Skeleton/
│   ├── Slider/
│   ├── Spacer/
│   ├── Text/
│   ├── Toggle/
│   ├── Tooltip/
│   └── AspectRatio/
│
├── molecules/                    # Compound components (2+ atoms)
│   ├── Accordion/
│   ├── Command/
│   ├── DataTable/
│   ├── DatePicker/               # ADD STORIES
│   ├── Dialog/
│   ├── Drawer/                   # ADD STORIES
│   ├── FormControl/
│   ├── List/
│   ├── ListItemButton/
│   ├── Menu/
│   ├── Popover/
│   ├── ScrollArea/
│   ├── Select/
│   ├── Seeker/                   # DEPRECATED - move to /deprecated/
│   ├── SeekSlider/               # ADD STORIES
│   ├── Table/
│   ├── Tabs/
│   └── VolumeSlider/
│
├── organisms/                    # Complex, feature-rich components
│   ├── Card/
│   ├── Calendar/
│   ├── Rotary/
│   ├── Toast/
│   ├── Waveform/
│   ├── AlbumArt/
│   ├── DiscImage/
│   ├── MetadataDisplay/
│   ├── Backdrop/
│   ├── WaveformCell/
│   ├── FrequencyAnalyzer/
│   ├── ButterchurnViz/
│   └── playback/                 # Complex audio/playback components
│       ├── NowPlayingPage/       # ADD STORIES
│       ├── AutoDJToggle/         # ADD STORIES
│       └── OSDOverlay/           # ADD STORIES
│
├── deprecated/                   # Components awaiting removal
│   ├── CrossfadeSeeker/
│   ├── CrossfadeWaveSurfer/
│   └── MobileCrossfadeSeeker/
│
├── seek/                         # Keep specialized subdirs
│   ├── Waveform/
│   └── index.ts
│
├── calendar/                     # Keep if not moved to atoms
│   └── index.ts
│
├── toast/                        # Keep specialized subdirs
│   ├── Toast.tsx
│   ├── ToastProvider.tsx
│   └── index.ts
│
├── __stories__/                  # REORGANIZE BY ATOMIC TIER
│   ├── atoms/
│   │   ├── Alert.stories.tsx
│   │   ├── Button.stories.tsx
│   │   └── ...
│   ├── molecules/
│   │   ├── Dialog.stories.tsx
│   │   └── ...
│   └── organisms/
│       ├── Card.stories.tsx
│       └── ...
│
├── styles/
│   ├── tokens.css.ts
│   └── index.ts
│
└── index.ts                      # REORGANIZE EXPORTS
    # Export atoms
    export { Alert, ... } from './atoms/...'
    # Export molecules
    export { Dialog, ... } from './molecules/...'
    # Export organisms
    export { Card, ... } from './organisms/...'
    # Warn about deprecated
    export { /* DEPRECATED */ ... } from './deprecated/...'
```

---

## Component Migration Matrix

### Phase 1: Atoms (23 components) - Week 1

| Component | Current File | Target Location | Stories | Priority | Special Notes |
|-----------|--------------|-----------------|---------|----------|---------------|
| Alert | Alert.tsx | atoms/Alert/ | ✅ | Medium | Vanilla Extract CSS |
| AspectRatio | AspectRatio.tsx | atoms/AspectRatio/ | ✅ | Low | Radix-based |
| Avatar | Avatar.tsx | atoms/Avatar/ | ✅ | Medium | Radix-based |
| Box | Box.tsx | atoms/Box/ | ✅ | High | Core layout primitive |
| Button | Button.tsx | atoms/Button/ | ✅ | **HIGHEST** | Icon migration needed |
| Checkbox | Checkbox.tsx | atoms/Checkbox/ | ✅ | Medium | Radix-based |
| Chip | Chip.tsx | atoms/Chip/ | ✅ | Low | Badge-like component |
| CircularProgress | CircularProgress.tsx | atoms/CircularProgress/ | ✅ | Low | Animation-heavy |
| Container | Container.tsx | atoms/Container/ | ✅ | High | Core layout primitive |
| Divider | Divider.tsx | atoms/Divider/ | ✅ | Low | Simple line component |
| Grid | Grid.tsx | atoms/Grid/ | ✅ | High | Core layout primitive |
| IconButton | IconButton.tsx | atoms/IconButton/ | ✅ | **HIGHEST** | **PRIORITY: Replace SVG icons with Radix Icons** |
| Input | Input.tsx | atoms/Input/ | ✅ | High | Form primitive |
| Paper | Paper.tsx | atoms/Paper/ | ✅ | High | Surface primitive |
| Progress | Progress.tsx | atoms/Progress/ | ✅ | Low | Linear progress |
| RadioGroup | RadioGroup.tsx | atoms/RadioGroup/ | ✅ | Medium | Radix-based |
| Separator | Separator.tsx | atoms/Separator/ | ✅ | Low | Visual divider |
| Skeleton | Skeleton.tsx | atoms/Skeleton/ | ✅ | Low | Loading state |
| Slider | Slider.tsx | atoms/Slider/ | ✅ | Medium | Radix-based |
| Spacer | Spacer.tsx | atoms/Spacer/ | ✅ | Low | Spacing utility |
| Text | Text.tsx | atoms/Text/ | ✅ | High | Typography primitive |
| Toggle | Toggle.tsx | atoms/Toggle/ | ✅ | Low | Radix-based |
| Tooltip | Tooltip.tsx | atoms/Tooltip/ | ✅ | Medium | Radix-based |

**Week 1 Deliverable:**
- [ ] Create `atoms/` directory structure
- [ ] Move all 23 atoms to atomic folders
- [ ] Update imports in moved files
- [ ] Update main `index.ts` exports
- [ ] Verify all stories still load
- [ ] Test components in existing app

---

### Phase 2: Molecules (18 components) - Week 1.5

| Component | Current File | Target Location | Stories | Priority | Special Notes |
|-----------|--------------|-----------------|---------|----------|---------------|
| Accordion | Accordion.tsx | molecules/Accordion/ | ✅ | Medium | Radix-based |
| Command | Command.tsx | molecules/Command/ | ✅ | Medium | Command palette |
| DataTable | DataTable.tsx | molecules/DataTable/ | ✅ | Medium | TanStack Table |
| DatePicker | DatePicker.tsx | molecules/DatePicker/ | ❌ | Medium | **ADD STORIES** |
| Dialog | Dialog.tsx | molecules/Dialog/ | ✅ | High | Radix modal |
| Drawer | Drawer.tsx | molecules/Drawer/ | ❌ | Medium | **ADD STORIES** |
| FormControl | FormControl.tsx | molecules/FormControl/ | ✅ | Medium | Form layout |
| List | List.tsx | molecules/List/ | ✅ | Low | List container |
| ListItemButton | ListItemButton.tsx | molecules/ListItemButton/ | ✅ | Low | List item action |
| Menu | Menu.tsx | molecules/Menu/ | ✅ | High | Radix dropdown |
| Popover | Popover.tsx | molecules/Popover/ | ✅ | Medium | Radix-based |
| ScrollArea | ScrollArea.tsx | molecules/ScrollArea/ | ✅ | Low | Radix scroll |
| Select | Select.tsx | molecules/Select/ | ✅ | High | Radix select |
| Table | Table.tsx | molecules/Table/ | ✅ | Medium | Semantic table |
| Tabs | Tabs.tsx | molecules/Tabs/ | ✅ | Medium | Radix tabs |
| VolumeSlider | VolumeSlider.tsx | molecules/VolumeSlider/ | ✅ | Low | Audio control |
| **DEPRECATED** |  |  |  |  |  |
| Seeker | Seeker.tsx | deprecated/Seeker/ | ⚠️ | — | **MARK DEPRECATED** |
| SeekSlider | SeekSlider.tsx | molecules/SeekSlider/ | ❌ | High | **ADD STORIES** |

**Week 1.5 Deliverable:**
- [ ] Create `molecules/` directory structure
- [ ] Move all 17 molecules to atomic folders
- [ ] Move deprecated `Seeker` to `/deprecated/`
- [ ] Update imports
- [ ] Update main `index.ts` exports
- [ ] Create stories for DatePicker, Drawer, SeekSlider
- [ ] Add deprecation warnings to deprecated components

---

### Phase 3: Organisms (15+ components) - Week 2

| Component | Current File | Target Location | Stories | Priority | Special Notes |
|-----------|--------------|-----------------|---------|----------|---------------|
| Card | Card.tsx | organisms/Card/ | ✅ | High | Surface container |
| Calendar | Calendar.tsx | organisms/Calendar/ | ✅ | Low | Calendar widget |
| Rotary | Rotary.tsx | organisms/Rotary/ | ✅ | Low | Visualization |
| Toast | Toast.tsx | organisms/Toast/ | ✅ | Medium | Notification system |
| Waveform | Waveform.tsx | organisms/Waveform/ | ✅ | Medium | WaveSurfer |
| AlbumArt | AlbumArt.tsx | organisms/AlbumArt/ | ✅ | Low | Image display |
| DiscImage | DiscImage.tsx | organisms/DiscImage/ | ✅ | Low | Framer Motion |
| MetadataDisplay | MetadataDisplay.tsx | organisms/MetadataDisplay/ | ✅ | Low | Info display |
| Backdrop | Backdrop.tsx | organisms/Backdrop/ | ✅ | Low | Background |
| WaveformCell | WaveformCell.tsx | organisms/WaveformCell/ | ✅ | Low | Table cell |
| FrequencyAnalyzer | FrequencyAnalyzer.tsx | organisms/FrequencyAnalyzer/ | ✅ | Low | Audio analysis |
| ButterchurnViz | ButterchurnViz.tsx | organisms/ButterchurnViz/ | ✅ | Low | Visualization |
| **PLAYBACK COMPONENTS** |  |  |  |  |  |
| NowPlayingPage | NowPlayingPage.tsx | organisms/playback/NowPlayingPage/ | ❌ | High | **ADD STORIES** |
| AutoDJToggle | AutoDJToggle.tsx | organisms/playback/AutoDJToggle/ | ❌ | Medium | **ADD STORIES** |
| OSDOverlay | OSDOverlay.tsx | organisms/playback/OSDOverlay/ | ❌ | Medium | **ADD STORIES** |
| **DEPRECATED** |  |  |  |  |  |
| CrossfadeSeeker | CrossfadeSeeker.tsx | deprecated/CrossfadeSeeker/ | — | — | **MARK DEPRECATED** |
| CrossfadeWaveSurfer | CrossfadeWaveSurfer.tsx | deprecated/CrossfadeWaveSurfer/ | — | — | **MARK DEPRECATED** |
| MobileCrossfadeSeeker | MobileCrossfadeSeeker.tsx | deprecated/MobileCrossfadeSeeker/ | — | — | **MARK DEPRECATED** |

**Week 2 Deliverable:**
- [ ] Create `organisms/` directory structure
- [ ] Create `organisms/playback/` subdirectory
- [ ] Move all 12 non-deprecated organisms to atomic folders
- [ ] Move 3 deprecated components to `/deprecated/`
- [ ] Update imports
- [ ] Update main `index.ts` exports
- [ ] Create stories for NowPlayingPage, AutoDJToggle, OSDOverlay
- [ ] Add deprecation warnings to deprecated components

---

### Phase 4: Stories Reorganization - Week 2

**Current Structure:**
```
src/ui-primitives/__stories__/
├── Alert.stories.tsx
├── Button.stories.tsx
├── ... (42 files, mixed organization)
```

**Target Structure:**
```
src/ui-primitives/__stories__/
├── atoms/
│   ├── Alert.stories.tsx
│   ├── Button.stories.tsx
│   └── ... (23 stories)
├── molecules/
│   ├── Dialog.stories.tsx
│   ├── DatePicker.stories.tsx (NEW)
│   └── ... (18 stories)
└── organisms/
    ├── Card.stories.tsx
    ├── NowPlayingPage.stories.tsx (NEW)
    └── ... (15 stories)
```

**Deliverable:**
- [ ] Reorganize __stories__/ into atoms/, molecules/, organisms/
- [ ] Create new stories for 4 components (DatePicker, Drawer, SeekSlider, NowPlayingPage, AutoDJToggle, OSDOverlay)
- [ ] Verify Storybook navigation follows atomic order
- [ ] Update Storybook config if needed

---

### Phase 5: Cleanup & Documentation - Week 3

**Tasks:**
- [ ] Remove deprecated components from main exports
- [ ] Create deprecation guide for users
- [ ] Update RADIX_UI_SETUP.md with new structure
- [ ] Create COMPONENT_ORGANIZATION.md documenting atomic design
- [ ] Audit all internal imports (components using other components)
- [ ] Run full test suite
- [ ] Update import paths in entire codebase (src/components/, src/hooks/, etc.)

**Deliverable:**
- [ ] All imports updated across entire codebase
- [ ] Zero broken imports
- [ ] Documentation complete
- [ ] Ready for merge to master

---

## Import Path Migration Reference

### Pattern Examples

**Button Component:**
```typescript
// Current
import { Button } from 'ui-primitives';
import Button from 'ui-primitives/Button.tsx';

// Target
import { Button } from 'ui-primitives/atoms/Button';
import { Button } from 'ui-primitives'; // Re-exported from main index.ts
```

**Multiple Atoms:**
```typescript
// Current
import { Button, Input, Checkbox } from 'ui-primitives';

// Target (still works via main index.ts)
import { Button, Input, Checkbox } from 'ui-primitives';

// But can also be explicit
import { Button } from 'ui-primitives/atoms/Button';
import { Input } from 'ui-primitives/atoms/Input';
```

**Molecules:**
```typescript
// Current
import { Dialog, Menu } from 'ui-primitives';

// Target
import { Dialog, Menu } from 'ui-primitives'; // Via main index
// or
import { Dialog } from 'ui-primitives/molecules/Dialog';
```

**Deprecated Components:**
```typescript
// Current
import { Seeker } from 'ui-primitives';

// Target (with warning)
import { Seeker } from 'ui-primitives/deprecated/Seeker';
// Triggers: "DEPRECATED: Seeker is no longer maintained.
// Use SeekSlider instead."
```

---

## Icon Standardization Integration

**Critical Path (happens during atoms phase):**

### Button.tsx
```typescript
// Current: May use custom SVG or Radix Icons inconsistently
// Target: Pure export, no icons (parent components add icons)
```

### IconButton.tsx (HIGH PRIORITY)
```typescript
// Current: Mixed custom SVG + some Radix Icons
import SomeCustomIcon from './icons/SomeIcon.svg';
import { SomeRadixIcon } from '@radix-ui/react-icons';

// Target: Parent component handles all icons
// IconButton just renders children (the icon)
import { PlusIcon } from '@radix-ui/react-icons';

export function MyComponent() {
  return (
    <IconButton>
      <PlusIcon />  // Icon passed in via children
    </IconButton>
  );
}
```

### IconButton.stories.tsx
```typescript
// Current: Custom SVG icons in stories
// Target: Use Radix Icons exclusively

import { PlusIcon, CheckIcon, TrashIcon } from '@radix-ui/react-icons';

export const Default = () => (
  <IconButton><PlusIcon /></IconButton>
);
```

---

## High-Risk Components (Require Extra Care)

| Component | Risk Level | Reason | Mitigation |
|-----------|-----------|--------|-----------|
| IconButton | 🔴 HIGH | Icon standardization + story updates | Phase 1 priority, double-check imports |
| Dialog | 🟡 MEDIUM | Radix primitive, widely used | Check all Dialog usage in app |
| Button | 🟡 MEDIUM | Widely used, may have icon issues | Phase 1 priority |
| NowPlayingPage | 🟡 MEDIUM | Store integration + complex | Create comprehensive stories |
| DataTable | 🟡 MEDIUM | TanStack dependency | Verify all table patterns still work |
| Toast | 🟡 MEDIUM | Provider pattern | Ensure ToastProvider still exports correctly |

---

## Execution Checklist

### Pre-Migration
- [ ] Current branch: `music-visualizer` is clean and committed
- [ ] Create new branch: `feat/atomic-restructure`
- [ ] Back up current src/ui-primitives/ structure (reference)
- [ ] Create this plan document (DONE)

### Week 1: Atoms Migration
- [ ] Create src/ui-primitives/atoms/ directory
- [ ] Move 23 atom components (with CSS, index.ts)
- [ ] Update imports in moved components
- [ ] Update main src/ui-primitives/index.ts
- [ ] Verify stories load in Storybook
- [ ] Run app, verify no broken imports
- [ ] Commit: "refactor(ui-primitives): restructure atoms to atomic design"

### Week 1.5: Molecules Migration
- [ ] Create src/ui-primitives/molecules/ directory
- [ ] Create src/ui-primitives/deprecated/ directory
- [ ] Move 17 molecule components
- [ ] Move 1 deprecated component (Seeker)
- [ ] Create 3 new story files
- [ ] Update main index.ts
- [ ] Verify imports across codebase
- [ ] Commit: "refactor(ui-primitives): restructure molecules to atomic design"

### Week 2: Organisms Migration
- [ ] Create src/ui-primitives/organisms/ directory
- [ ] Create src/ui-primitives/organisms/playback/ subdirectory
- [ ] Move 12 organism components
- [ ] Move 3 deprecated components
- [ ] Create 3 new story files (playback components)
- [ ] Update main index.ts
- [ ] Reorganize __stories__/ by tier
- [ ] Update Storybook navigation
- [ ] Commit: "refactor(ui-primitives): restructure organisms to atomic design"

### Week 3: Cleanup & Documentation
- [ ] Audit all imports across src/
- [ ] Update documentation
- [ ] Remove deprecated exports from main index
- [ ] Create migration guide for consuming code
- [ ] Final test pass
- [ ] Commit: "docs: add atomic design documentation"
- [ ] Merge feat/atomic-restructure → music-visualizer
- [ ] Merge music-visualizer → master (after approval)

---

## Risk Mitigation

**Import Breakage:**
- Maintain main `index.ts` re-exports (backward compatible)
- Run grep for all imports before and after
- Test app at each phase

**Story Breakage:**
- Storybook should auto-discover after reorganization
- May need .storybook/main.ts update if glob patterns change
- Test each tier after reorganization

**Circular Dependencies:**
- Atoms should never depend on molecules/organisms
- Molecules can depend on atoms only
- Organisms can depend on atoms + molecules
- Verify with dependency analyzer if available

---

## Success Criteria

✅ All 56 components migrated to atomic structure
✅ All 42 stories reorganized and loadable
✅ 6 new stories created (missing coverage)
✅ Zero broken imports in src/
✅ App runs without errors
✅ Storybook navigation follows atomic order
✅ Icon standardization path clear for next sprint
✅ Deprecated components clearly marked
✅ Documentation updated

---

## Next Steps

1. **Approval:** Confirm you want to proceed with this plan
2. **Branch Creation:** Start fresh branch from music-visualizer
3. **Phase 1 Kickoff:** Begin atoms migration
4. **Daily Commits:** One commit per phase for reviewability

Ready to begin Phase 1 (Atoms Migration)?

**Total Effort Estimate:**
- Phase 1 (Atoms): ~3-4 hours
- Phase 2 (Molecules): ~3-4 hours
- Phase 3 (Organisms): ~3-4 hours
- Phase 4 (Stories): ~2-3 hours
- Phase 5 (Cleanup): ~2-3 hours
- **Total: 13-18 hours (spans 2-3 weeks for review/testing)**
