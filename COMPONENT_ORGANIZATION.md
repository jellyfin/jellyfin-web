# Component Organization Reference

Complete inventory of all UI Primitives organized by atomic design hierarchy.

## ATOMS (23 components)

Fundamental, indivisible UI elements.

### Layout & Structure

| Component | Path | Purpose | CSS | Stories |
|-----------|------|---------|-----|---------|
| **Box** | `atoms/Box/` | Flexible layout primitive (flex/grid) | `Box.css.ts` | ✓ |
| **Container** | `atoms/Container/` | Width-constrained layout wrapper | `Container.css.ts` | ✓ |
| **Grid** | `atoms/Grid/` | CSS Grid layout system | `Grid.css.ts` | ✓ |
| **Spacer** | `atoms/Spacer/` | Flexible spacing element | `Spacer.css.ts` | ✓ |
| **Divider** | `atoms/Divider/` | Visual separator (horizontal/vertical) | `Divider.css.ts` | ✓ |
| **Separator** | `atoms/Separator/` | Semantic separator | `Separator.css.ts` | ✓ |
| **Paper** | `atoms/Paper/` | Elevated card-like surface | `Paper.css.ts` | ✓ |
| **AspectRatio** | `atoms/AspectRatio/` | Maintains aspect ratio | (no CSS) | ✓ |

### Typography

| Component | Path | Purpose | CSS | Stories |
|-----------|------|---------|-----|---------|
| **Text** | `atoms/Text/` | Semantic text with variants | `Text.css.ts` | ✓ |
| **Heading** | (in Text) | Heading levels (h1-h6) | (in Text.css.ts) | ✓ |

### Input Controls

| Component | Path | Purpose | CSS | Stories |
|-----------|------|---------|-----|---------|
| **Button** | `atoms/Button/` | Interactive button (multiple variants) | `Button.css.ts` | ✓ |
| **Input** | `atoms/Input/` | Text input field | `Input.css.ts` | ✓ |
| **Checkbox** | `atoms/Checkbox/` | Binary checkbox control | `Checkbox.css.ts` | ✓ |
| **RadioGroup** | `atoms/RadioGroup/` | Mutually exclusive radio buttons | `RadioGroup.css.ts` | ✓ |
| **Slider** | `atoms/Slider/` | Range slider input | `Slider.css.ts` | ✓ |
| **Toggle** | `atoms/Toggle/` | Toggle button group | `Toggle.css.ts` | ✓ |
| **IconButton** | `atoms/IconButton/` | Icon-only button | `IconButton.css.ts` | ✓ |

### Data Display & Feedback

| Component | Path | Purpose | CSS | Stories |
|-----------|------|---------|-----|---------|
| **Progress** | `atoms/Progress/` | Linear progress indicator | `Progress.css.ts` | ✓ |
| **CircularProgress** | `atoms/CircularProgress/` | Circular progress indicator | `CircularProgress.css.ts` | ✓ |
| **Skeleton** | `atoms/Skeleton/` | Loading placeholder | `Skeleton.css.ts` | ✓ |
| **Avatar** | `atoms/Avatar/` | User avatar image | `Avatar.css.ts` | ✓ |
| **Chip** | `atoms/Chip/` | Small labeled container | `Chip.css.ts` | ✓ |
| **Alert** | `atoms/Alert/` | Alert/notification message | `Alert.css.ts` | ✓ |
| **Tooltip** | `atoms/Tooltip/` | Hover tooltip display | `Tooltip.css.ts` | ✓ |

---

## MOLECULES (17 components)

Compound components combining atoms.

### Form Components

| Component | Path | Purpose | CSS | Stories |
|-----------|------|---------|-----|---------|
| **FormControl** | `molecules/FormControl/` | Form field wrapper + Switch | `FormControl.css.ts` | ✓ |
| **Input** | (wrapped by FormControl) | Enhanced input in forms | - | - |
| **DatePicker** | `molecules/DatePicker/` | Date & date-range selection | `DatePicker.css.ts` | ✓ NEW |

### Selection Components

| Component | Path | Purpose | CSS | Stories |
|-----------|------|---------|-----|---------|
| **Select** | `molecules/Select/` | Dropdown select menu (Radix) | `Select.css.ts` | ✓ |
| **Menu** | `molecules/Menu/` | Dropdown menu (Radix) | `Menu.css.ts` | ✓ |
| **Popover** | `molecules/Popover/` | Floating popover panel | `Popover.css.ts` | ✓ |
| **Accordion** | `molecules/Accordion/` | Expandable accordion panels | `Accordion.css.ts` | ✓ |
| **Tabs** | `molecules/Tabs/` | Tabbed interface | `Tabs.css.ts` | ✓ |

### Layout & Display

| Component | Path | Purpose | CSS | Stories |
|-----------|------|---------|-----|---------|
| **List** | `molecules/List/` | List with items & subheaders | `List.css.ts` | ✓ |
| **ListItemButton** | `molecules/ListItemButton/` | Clickable list item | `ListItemButton.css.ts` | ✓ |
| **Table** | `molecules/Table/` | Semantic HTML table | `Table.css.ts` | ✓ |
| **DataTable** | `molecules/DataTable/` | Advanced data table | `DataTable.css.ts` | ✓ |
| **ScrollArea** | `molecules/ScrollArea/` | Custom scrollable area | `ScrollArea.css.ts` | ✓ |

### Dialog & Navigation

| Component | Path | Purpose | CSS | Stories |
|-----------|------|---------|-----|---------|
| **Dialog** | `molecules/Dialog/` | Modal dialog window | `Dialog.css.ts` | ✓ |
| **Drawer** | `molecules/Drawer/` | Slide-out side panel | `Drawer.css.ts` | ✓ NEW |

### Media Controls

| Component | Path | Purpose | CSS | Stories |
|-----------|------|---------|-----|---------|
| **VolumeSlider** | `molecules/VolumeSlider/` | Volume control slider | `VolumeSlider.css.ts` | ✓ |
| **SeekSlider** | `molecules/SeekSlider/` | Audio seek/progress slider | `SeekSlider.css.ts` | ✓ NEW |

### Command Palette

| Component | Path | Purpose | CSS | Stories |
|-----------|------|---------|-----|---------|
| **Command** | `molecules/Command/` | Command palette interface | `Command.css.ts` | ✓ NEW |

---

## ORGANISMS (8+ components)

Complex components combining molecules and atoms.

### Card & Content

| Component | Path | Purpose | CSS | Stories |
|-----------|------|---------|-----|---------|
| **Card** | `organisms/Card/` | Card container with header/body/footer | `Card.css.ts` | ✓ |

### Calendar & Dates

| Component | Path | Purpose | CSS | Stories |
|-----------|------|---------|-----|---------|
| **Calendar** | `organisms/calendar/` | Interactive calendar widget | `Calendar.css.ts` | ✓ |

### Notifications

| Component | Path | Purpose | CSS | Stories |
|-----------|------|---------|-----|---------|
| **Toast** | `organisms/toast/` | Toast notification system | `Toast.css.ts` | ✓ |
| **ToastProvider** | (in toast/) | Context provider for toasts | (in Toast.css.ts) | - |

### Media & Playback

| Component | Path | Purpose | CSS | Stories |
|-----------|------|---------|-----|---------|
| **Waveform** | `organisms/seek/` | Audio waveform visualization | `Waveform.css.ts` | ✓ NEW |
| **Rotary** | `organisms/playback/` | Vinyl record spinner animation | (uses styles.css.ts) | ✓ NEW |
| **NowPlayingPage** | `organisms/playback/nowPlaying/` | Now playing UI page | `NowPlayingPage.css.ts` | - |
| **AlbumArt** | (in nowPlaying/) | Album artwork display | - | - |
| **MetadataDisplay** | (in nowPlaying/) | Track metadata display | - | - |
| **Backdrop** | (in nowPlaying/) | Blurred backdrop effect | - | - |

### Visualizers

| Component | Path | Purpose | CSS | Stories |
|-----------|------|---------|-----|---------|
| **ButterchurnViz** | `organisms/visualizers/` | Butterchurn music visualizer | `ButterchurnViz.css.ts` | - |
| **FrequencyAnalyzer** | `organisms/visualizers/` | Frequency analysis visualizer | `FrequencyAnalyzer.css.ts` | - |
| **WaveformCell** | `organisms/visualizers/` | Individual waveform cell | `WaveformCell.css.ts` | - |

---

## DEPRECATED (1 component)

Components being phased out.

| Component | Path | Status | Replacement | Story |
|-----------|------|--------|-------------|-------|
| **Seeker** | `deprecated/Seeker/` | Deprecated | SeekSlider | ✓ |

---

## STORYBOOK STORIES (48 files)

Visual documentation and interactive testing.

### Atoms Stories (23 files)
```
__stories__/atoms/
├── Alert.stories.tsx
├── AspectRatio.stories.tsx
├── Avatar.stories.tsx
├── Box.stories.tsx
├── Button.stories.tsx
├── Checkbox.stories.tsx
├── Chip.stories.tsx
├── CircularProgress.stories.tsx
├── Container.stories.tsx
├── Divider.stories.tsx
├── Grid.stories.tsx
├── IconButton.stories.tsx
├── Input.stories.tsx
├── Paper.stories.tsx
├── Progress.stories.tsx
├── RadioGroup.stories.tsx
├── Separator.stories.tsx
├── Skeleton.stories.tsx
├── Slider.stories.tsx
├── Spacer.stories.tsx
├── Switch.stories.tsx
├── Text.stories.tsx
└── Toggle.stories.tsx + Tooltip.stories.tsx
```

### Molecules Stories (17 files)
```
__stories__/molecules/
├── Accordion.stories.tsx
├── Command.stories.tsx          ✨ NEW
├── DataTable.stories.tsx
├── DatePicker.stories.tsx       ✨ NEW
├── Dialog.stories.tsx
├── Drawer.stories.tsx           ✨ NEW
├── FormControl.stories.tsx
├── List.stories.tsx
├── ListItemButton.stories.tsx
├── Menu.stories.tsx
├── Popover.stories.tsx
├── ScrollArea.stories.tsx
├── Seeker.stories.tsx
├── Select.stories.tsx
├── SeekSlider.stories.tsx       ✨ NEW
├── Table.stories.tsx
└── Tabs.stories.tsx + VolumeSlider.stories.tsx
```

### Organisms Stories (6+ files)
```
__stories__/organisms/
├── Calendar.stories.tsx
├── Card.stories.tsx
├── Rotary.stories.tsx           ✨ NEW
├── Toast.stories.tsx
├── Waveform.stories.tsx         ✨ NEW
└── Compound/SettingsForm.stories.tsx
```

---

## STATISTICS

| Category | Count | New | Stories |
|----------|-------|-----|---------|
| **Atoms** | 23 | - | 23 |
| **Molecules** | 17 | 4 | 17 |
| **Organisms** | 8+ | 2 | 6+ |
| **Deprecated** | 1 | - | - |
| **TOTAL** | 49 | 6 | 48+ |

---

## IMPORT EXAMPLES

### Import Single Component
```tsx
import { Button } from 'ui-primitives/Button';
// or
import { Button } from 'ui-primitives/atoms/Button';
// or
import { Button } from 'ui-primitives';
```

### Import Multiple Components by Category
```tsx
// Atoms
import { Button, Text, Box, Input } from 'ui-primitives';

// Molecules
import { Dialog, Select, Menu } from 'ui-primitives';

// Organisms
import { Card, Calendar, Toast } from 'ui-primitives';
```

### Import with Types
```tsx
import {
  type ButtonProps,
  type DialogProps,
  Button,
  Dialog
} from 'ui-primitives';
```

### Import Styles
```tsx
import { buttonStyles, buttonVariants } from 'ui-primitives/Button';
import { vars } from 'ui-primitives/styles/tokens.css';
```

---

## ORGANIZATION PRINCIPLES

### Atoms
- **Criteria**: Cannot be broken down further without losing meaning
- **Examples**: Button, Text, Input
- **Rule**: No atoms depend on other atoms in complex ways

### Molecules
- **Criteria**: Simple combination of atoms serving a single purpose
- **Examples**: Dialog, Select, Form
- **Rule**: Should have minimal complexity, serve one UI pattern

### Organisms
- **Criteria**: Complex components combining molecules and atoms
- **Examples**: Card with content, Calendar, Toast system
- **Rule**: Can have complex state and behavior

### Deprecated
- **Status**: Marked for removal in future versions
- **Action**: Use replacements, not deprecated components
- **Example**: Seeker → SeekSlider

---

**Last Updated**: January 26, 2026
**Version**: 1.0 (Complete Atomic Restructure)
