# Atomic Restructure - Implementation Guide

**Quick Reference for Phase 1-3 Execution**

---

## Phase 1: Atoms Migration (Week 1)

### Directory Creation
```bash
cd src/ui-primitives

# Create atom directories
mkdir -p atoms/{Alert,AspectRatio,Avatar,Box,Button,Checkbox,Chip,CircularProgress,Container,Divider,Grid,IconButton,Input,Paper,Progress,RadioGroup,Separator,Skeleton,Slider,Spacer,Text,Toggle,Tooltip}
```

### Component Files to Move

**From root to atoms/[ComponentName]/**

```
Alert.tsx → atoms/Alert/Alert.tsx
Alert.css.ts → atoms/Alert/Alert.css.ts
⬇️
Create: atoms/Alert/index.ts (exports)

---

AspectRatio.tsx → atoms/AspectRatio/
Avatar.tsx → atoms/Avatar/
Box.tsx → atoms/Box/
Button.tsx → atoms/Button/          ⭐ HIGH PRIORITY
Button.css.ts → atoms/Button/

Checkbox.tsx → atoms/Checkbox/
Chip.tsx → atoms/Chip/
CircularProgress.tsx → atoms/CircularProgress/

Container.tsx → atoms/Container/
Divider.tsx → atoms/Divider/

Grid.tsx → atoms/Grid/
IconButton.tsx → atoms/IconButton/  ⭐ HIGH PRIORITY (icon migration)
IconButton.css.ts → atoms/IconButton/

Input.tsx → atoms/Input/
Paper.tsx → atoms/Paper/
Progress.tsx → atoms/Progress/

RadioGroup.tsx → atoms/RadioGroup/
Separator.tsx → atoms/Separator/
Skeleton.tsx → atoms/Skeleton/

Slider.tsx → atoms/Slider/
Spacer.tsx → atoms/Spacer/

Text.tsx → atoms/Text/
Toggle.tsx → atoms/Toggle/
Tooltip.tsx → atoms/Tooltip/
```

### Create index.ts Files

**Template for atoms/[ComponentName]/index.ts:**
```typescript
// atoms/Button/index.ts
export { Button } from './Button';
export type { ButtonProps, ButtonVariants } from './Button';
export { buttonStyles } from './Button.css';
```

**Repeat for all 23 atoms**

### Update Main index.ts

**src/ui-primitives/index.ts:**
```typescript
// Re-export atoms
export { Alert, type AlertProps } from './atoms/Alert';
export { AspectRatio, type AspectRatioProps } from './atoms/AspectRatio';
export { Avatar, type AvatarProps } from './atoms/Avatar';
export { Box, type BoxProps } from './atoms/Box';
export { Button, type ButtonProps, type ButtonVariants } from './atoms/Button';
// ... (all 23 atoms)

// Keep molecules for now
export { Accordion, type AccordionProps } from './Accordion';
// ...
```

### Bash Script for Phase 1

```bash
#!/bin/bash
# phase1-move-atoms.sh

cd src/ui-primitives

# Create directories
mkdir -p atoms/{Alert,AspectRatio,Avatar,Box,Button,Checkbox,Chip,CircularProgress,Container,Divider,Grid,IconButton,Input,Paper,Progress,RadioGroup,Separator,Skeleton,Slider,Spacer,Text,Toggle,Tooltip}

# Move Alert
mv Alert.tsx atoms/Alert/
mv Alert.css.ts atoms/Alert/
echo "export { Alert } from './Alert';" > atoms/Alert/index.ts

# Move AspectRatio
mv AspectRatio.tsx atoms/AspectRatio/
mv AspectRatio.css.ts atoms/AspectRatio/
echo "export { AspectRatio } from './AspectRatio';" > atoms/AspectRatio/index.ts

# ... repeat for all 23 atoms (see full script below)

echo "Phase 1: Atoms migration complete!"
```

---

## Phase 2: Molecules Migration (Week 1.5)

### Directory Creation
```bash
cd src/ui-primitives

# Create molecule directories
mkdir -p molecules/{Accordion,Command,DataTable,DatePicker,Dialog,Drawer,FormControl,List,ListItemButton,Menu,Popover,ScrollArea,Select,SeekSlider,Table,Tabs,VolumeSlider}

# Create deprecated directory
mkdir -p deprecated/{Seeker,CrossfadeSeeker,CrossfadeWaveSurfer,MobileCrossfadeSeeker}
```

### Component Files to Move

**From root to molecules/[ComponentName]/**

```
Accordion.tsx → molecules/Accordion/
Accordion.css.ts → molecules/Accordion/

Command.tsx → molecules/Command/
Command.css.ts → molecules/Command/

DataTable.tsx → molecules/DataTable/
DataTable.css.ts → molecules/DataTable/

DatePicker.tsx → molecules/DatePicker/  ⭐ ADD STORIES
DatePicker.css.ts → molecules/DatePicker/

Dialog.tsx → molecules/Dialog/
Dialog.css.ts → molecules/Dialog/

Drawer.tsx → molecules/Drawer/  ⭐ ADD STORIES
Drawer.css.ts → molecules/Drawer/

FormControl.tsx → molecules/FormControl/
FormControl.css.ts → molecules/FormControl/

List.tsx → molecules/List/
ListItemButton.tsx → molecules/ListItemButton/

Menu.tsx → molecules/Menu/
Menu.css.ts → molecules/Menu/

Popover.tsx → molecules/Popover/
ScrollArea.tsx → molecules/ScrollArea/

Select.tsx → molecules/Select/
Select.css.ts → molecules/Select/

SeekSlider.tsx → molecules/SeekSlider/  ⭐ ADD STORIES
SeekSlider.css.ts → molecules/SeekSlider/

Table.tsx → molecules/Table/
Table.css.ts → molecules/Table/

Tabs.tsx → molecules/Tabs/
Tabs.css.ts → molecules/Tabs/

VolumeSlider.tsx → molecules/VolumeSlider/
VolumeSlider.css.ts → molecules/VolumeSlider/
```

### Deprecated Components

**From root to deprecated/[ComponentName]/**

```
Seeker.tsx → deprecated/Seeker/
Seeker.css.ts → deprecated/Seeker/

CrossfadeSeeker.tsx → deprecated/CrossfadeSeeker/
CrossfadeWaveSurfer.tsx → deprecated/CrossfadeWaveSurfer/
MobileCrossfadeSeeker.tsx → deprecated/MobileCrossfadeSeeker/
```

**Wrap deprecated components with warning:**

```typescript
// deprecated/Seeker/index.ts
export { Seeker } from './Seeker';

// At top of Seeker.tsx
console.warn(
  'DEPRECATED: Seeker component is no longer maintained. ' +
  'Use SeekSlider from molecules/SeekSlider instead. ' +
  'This component will be removed in v11.0.0'
);
```

### Update Main index.ts

Add molecules + deprecated:
```typescript
// Molecules
export { Accordion } from './molecules/Accordion';
export { Command } from './molecules/Command';
// ... (all 17 molecules)

// Deprecated (with notices)
export {
  /**
   * @deprecated Use SeekSlider instead
   */
  Seeker
} from './deprecated/Seeker';
// ... (other deprecated)
```

---

## Phase 3: Organisms Migration (Week 2)

### Directory Creation
```bash
cd src/ui-primitives

# Create organism directories
mkdir -p organisms/{Card,Calendar,Rotary,Toast,Waveform,AlbumArt,DiscImage,MetadataDisplay,Backdrop,WaveformCell,FrequencyAnalyzer,ButterchurnViz,playback}

# Create playback subdirectory
mkdir -p organisms/playback/{NowPlayingPage,AutoDJToggle,OSDOverlay}
```

### Component Files to Move

**From root to organisms/[ComponentName]/**

```
Card.tsx → organisms/Card/
Calendar.tsx → organisms/Calendar/
Rotary.tsx → organisms/Rotary/
Toast.tsx → organisms/Toast/
Toast.css.ts → organisms/Toast/

Waveform.tsx → organisms/Waveform/
AlbumArt.tsx → organisms/AlbumArt/
DiscImage.tsx → organisms/DiscImage/

MetadataDisplay.tsx → organisms/MetadataDisplay/
Backdrop.tsx → organisms/Backdrop/

WaveformCell.tsx → organisms/WaveformCell/
FrequencyAnalyzer.tsx → organisms/FrequencyAnalyzer/
ButterchurnViz.tsx → organisms/ButterchurnViz/
```

### Keep Specialized Subdirectories

Move but maintain structure:
```
seek/ → organisms/seek/       # Waveform.tsx already here
calendar/ → organisms/calendar/
toast/ → organisms/toast/     # Toast.tsx already here, consolidate
```

### Playback Components

**From root to organisms/playback/[ComponentName]/**

```
NowPlayingPage.tsx → organisms/playback/NowPlayingPage/  ⭐ ADD STORIES
AutoDJToggle.tsx → organisms/playback/AutoDJToggle/      ⭐ ADD STORIES
OSDOverlay.tsx → organisms/playback/OSDOverlay/          ⭐ ADD STORIES
```

### Deprecated Components (Move to deprecated/)

```
CrossfadeSeeker.tsx → deprecated/CrossfadeSeeker/        (move from organisms/ if already there)
CrossfadeWaveSurfer.tsx → deprecated/CrossfadeWaveSurfer/
MobileCrossfadeSeeker.tsx → deprecated/MobileCrossfadeSeeker/
```

### Update Main index.ts

```typescript
// Organisms
export { Card } from './organisms/Card';
export { Calendar } from './organisms/Calendar';
// ... (all organisms)

// Playback Components
export { NowPlayingPage } from './organisms/playback/NowPlayingPage';
export { AutoDJToggle } from './organisms/playback/AutoDJToggle';
export { OSDOverlay } from './organisms/playback/OSDOverlay';
```

---

## Phase 4: Stories Reorganization (Week 2)

### Reorganize __stories__ Directory

```bash
cd src/ui-primitives/__stories__

# Create structure
mkdir -p atoms molecules organisms

# Move atom stories
mv Alert.stories.tsx atoms/
mv AspectRatio.stories.tsx atoms/
# ... (23 atom stories)

# Move molecule stories
mv Accordion.stories.tsx molecules/
mv Command.stories.tsx molecules/
# ... (17 molecule stories)

# Move organism stories
mv Card.stories.tsx organisms/
mv Calendar.stories.tsx organisms/
# ... (15 organism stories)

# Note: Some files may not exist yet - will create in next step
```

### Create Missing Stories

**Files to create:**

1. `molecules/DatePicker.stories.tsx` - Copy from DatePicker.tsx example
2. `molecules/Drawer.stories.tsx` - Copy from Drawer.tsx example
3. `molecules/SeekSlider.stories.tsx` - Copy from SeekSlider.tsx example
4. `organisms/playback/NowPlayingPage.stories.tsx`
5. `organisms/playback/AutoDJToggle.stories.tsx`
6. `organisms/playback/OSDOverlay.stories.tsx`

**Template:**
```typescript
// atoms/Button.stories.tsx
import type { Meta, StoryObj } from '@storybook/react';
import { Button } from '../../atoms/Button';

const meta: Meta<typeof Button> = {
    title: 'Atoms/Button',
    component: Button,
    parameters: { layout: 'centered' }
};

export default meta;

type Story = StoryObj<typeof meta>;

export const Default: Story = {
    render: () => <Button>Click me</Button>
};

export const Primary: Story = {
    render: () => <Button variant="primary">Primary</Button>
};
```

---

## Phase 5: Import Path Updates (Week 3)

### Find All Import References

```bash
# Find all imports from ui-primitives
grep -r "from ['\"]ui-primitives" src/ --include="*.ts" --include="*.tsx"

# Find all imports of specific components
grep -r "from ['\"]ui-primitives/Button" src/ --include="*.ts" --include="*.tsx"
```

### Update Import Paths

**Pattern:**
```typescript
// Old
import Button from 'ui-primitives/Button';
import { Button } from 'ui-primitives';

// New (both still work via main index.ts re-export)
import { Button } from 'ui-primitives';

// But can also be explicit
import { Button } from 'ui-primitives/atoms/Button';
```

### Critical Files to Update

Check these high-usage imports:
- `src/components/**/*.tsx` - All component files
- `src/hooks/**/*.tsx` - Hooks using UI components
- `src/apps/**/*.tsx` - App-level components
- `src/store/**/*.ts` - Store if using components
- Any test files `**/*.test.tsx`

---

## Verification Checklist

### After Each Phase

**Phase 1 (Atoms):**
- [ ] `npm run build:check` passes
- [ ] Storybook loads without errors
- [ ] All 23 atom stories visible in Atoms section
- [ ] App builds: `npm run build:production`
- [ ] No console errors when running app

**Phase 2 (Molecules):**
- [ ] `npm run build:check` passes
- [ ] All 17 molecule stories visible
- [ ] New stories (DatePicker, Drawer, SeekSlider) load
- [ ] Deprecated component warnings appear in console (once per session)
- [ ] App still functions

**Phase 3 (Organisms):**
- [ ] `npm run build:check` passes
- [ ] All 12 organism stories visible
- [ ] Playback stories load
- [ ] New stories (NowPlayingPage, AutoDJToggle, OSDOverlay) render
- [ ] Complex components (Waveform, Visualizers) still function

**Phase 4 (Stories):**
- [ ] Storybook navigation shows atomic order
- [ ] All stories accessible via new paths
- [ ] No story import errors in console
- [ ] Design System section prominent

**Phase 5 (Final):**
- [ ] Zero import errors across entire codebase
- [ ] App runs without warnings
- [ ] All tests pass: `npm test`
- [ ] Build succeeds: `npm run build:production`
- [ ] Ready to merge to master

---

## Rollback Plan

If issues arise, these commands restore original state:

```bash
# If Phase 1 goes wrong, restore from git
git reset --hard HEAD
git clean -fd src/ui-primitives/

# Or restore specific files
git checkout src/ui-primitives/index.ts
```

---

## Git Commits Per Phase

**Phase 1:**
```bash
git add src/ui-primitives/atoms/
git add src/ui-primitives/index.ts
git commit -m "refactor(ui-primitives): reorganize atoms to atomic design structure"
```

**Phase 2:**
```bash
git commit -m "refactor(ui-primitives): reorganize molecules and deprecated components"
```

**Phase 3:**
```bash
git commit -m "refactor(ui-primitives): reorganize organisms to atomic design structure"
```

**Phase 4:**
```bash
git commit -m "refactor(storybook): reorganize stories to follow atomic design"
```

**Phase 5:**
```bash
git commit -m "docs: add atomic design documentation and update RADIX_UI_SETUP.md"
```

---

## Resources

- **Main Plan:** ATOMIC_RESTRUCTURE_PLAN.md
- **Radix Setup:** RADIX_UI_SETUP.md
- **Component Organization:** (create new after Phase 5)

---

## Success Metrics

After completing all phases:

✅ 56 components organized into atoms/molecules/organisms
✅ 6 new stories created
✅ Storybook navigation follows atomic design
✅ Zero broken imports
✅ App runs without console errors
✅ Build completes successfully
✅ All tests pass
✅ Documentation updated

Ready to start Phase 1! 🚀
