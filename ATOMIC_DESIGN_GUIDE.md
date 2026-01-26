# Atomic Design System Guide

## Overview

The Jellyfin Web UI Primitives library now follows the **Atomic Design Pattern**, organizing components into a hierarchical structure: Atoms → Molecules → Organisms.

This restructuring improves:
- **Discoverability**: Clear component categorization
- **Maintainability**: Related components grouped logically
- **Scalability**: Framework for adding new components
- **Documentation**: Organized Storybook with atomic structure

## Directory Structure

```
src/ui-primitives/
├── atoms/                 # 23 fundamental, reusable components
│   ├── Alert/
│   ├── Box/
│   ├── Button/
│   ├── Text/
│   ├── Input/
│   └── ... (18 more atoms)
│
├── molecules/             # 17 compound components (atoms + atoms)
│   ├── Accordion/
│   ├── Dialog/
│   ├── Select/
│   ├── Table/
│   ├── Menu/
│   ├── Popover/
│   └── ... (11 more molecules)
│
├── organisms/             # 8+ complex components (molecules + organisms)
│   ├── Card/
│   ├── calendar/
│   ├── toast/
│   ├── seek/
│   │   └── Waveform/
│   ├── playback/
│   │   ├── Rotary/
│   │   ├── nowPlaying/
│   │   └── visualizers/
│   └── ...
│
├── deprecated/            # Deprecated components (being phased out)
│   └── Seeker/
│
├── __stories__/           # Storybook documentation
│   ├── atoms/             # 23 stories
│   ├── molecules/         # 17 stories
│   └── organisms/         # 6+ stories
│
├── [Component].ts         # Root-level re-exports for backward compatibility
└── index.ts               # Main export file
```

## Component Categories

### Atoms (23 components)

Fundamental, indivisible building blocks that cannot be broken down further without losing meaning.

**Categories:**
- **Layout**: Box, Container, Grid, Spacer, Divider, Separator
- **Typography**: Text, Heading
- **Input**: Button, Input, Checkbox, RadioGroup, Slider, Toggle
- **Data Display**: Progress, CircularProgress, Skeleton, Avatar, Chip
- **Feedback**: Alert, Tooltip
- **Navigation**: IconButton
- **Structure**: Paper, AspectRatio

**Example:**
```tsx
import { Button } from 'ui-primitives/Button';  // ✓ Works (new path)
import { Button } from 'ui-primitives';          // ✓ Works (root import)

// Both work due to re-export strategy
```

### Molecules (17 components)

Relatively simple groups of atoms bonded together as functional units.

**Components:**
- **Form**: FormControl, Input, DatePicker
- **Selection**: Select, Menu, Popover, Accordion, Tabs
- **Layout**: List, ListItemButton, Table, DataTable, ScrollArea
- **Dialog**: Dialog, Drawer
- **Media**: VolumeSlider, SeekSlider, Command

### Organisms (8+ components)

Complex, relatively independent components composed from groups of molecules or atoms.

**Components:**
- **Card**: Card (styled container)
- **Calendar**: Calendar + DatePicker
- **Toast**: Toast notification system
- **Playback**: Rotary (vinyl), NowPlayingPage, Visualizers
- **Seek**: Waveform visualization

## Import Patterns

### ✓ Recommended (Atomic Organization)
```tsx
// Import from atomic categories
import { Button } from 'ui-primitives';
import { Dialog, DialogTitle } from 'ui-primitives';
import { Select, SelectItem } from 'ui-primitives';
import { Card, CardBody } from 'ui-primitives';
```

### ✓ Still Works (Backward Compatible)
```tsx
// Direct component imports (auto re-exported)
import { Button } from 'ui-primitives/Button';
import { Dialog } from 'ui-primitives/Dialog';
import { Card } from 'ui-primitives/Card';
```

### ✓ Advanced (From Subdirectories)
```tsx
// Direct imports from component directories
import { Button } from 'ui-primitives/atoms/Button';
import { Dialog } from 'ui-primitives/molecules/Dialog';
```

## Styling System

All components use **Vanilla Extract** (`@vanilla-extract/css`) for type-safe CSS.

### Design Tokens

Located at: `src/styles/tokens.css.ts`

Features:
- **Colors**: Semantic (primary, secondary, danger, etc.)
- **Typography**: Font sizes, weights, families
- **Spacing**: Standard spacing scale (xs, sm, md, lg, xl)
- **Border Radius**: Rounded values (sm, md, lg)
- **Shadows**: Elevation levels
- **Z-Index**: Layering system

### Using Tokens in Components

```tsx
import { vars } from 'ui-primitives/styles/tokens.css';

export function MyComponent() {
  return (
    <div style={{
      padding: vars.spacing.md,
      backgroundColor: vars.colors.surface,
      borderRadius: vars.borderRadius.lg,
      boxShadow: vars.shadows.md
    }}>
      Content
    </div>
  );
}
```

## Storybook Organization

Each component category has dedicated stories:

- **Atoms Stories**: `/src/ui-primitives/__stories__/atoms/` (23 files)
- **Molecules Stories**: `/src/ui-primitives/__stories__/molecules/` (17 files)
- **Organisms Stories**: `/src/ui-primitives/__stories__/organisms/` (6+ files)

### Running Storybook

```bash
npm run storybook
```

Stories provide:
- Visual documentation
- Interactive component preview
- Multiple story variants
- Auto-generated documentation (DocsPage)
- Accessibility checks

## Migration Guide for Developers

### For Existing Code

**No immediate action required.** The re-export strategy ensures backward compatibility. Old imports continue to work:

```tsx
// This still works
import { Button } from 'ui-primitives/Button';
```

### For New Components

**Use organized imports:**

```tsx
// ✓ Recommended for new code
import {
  Button,           // Atom
  Dialog,           // Molecule
  Card              // Organism
} from 'ui-primitives';
```

### For Large Refactors

When refactoring large sections, consider organizing imports by category:

```tsx
// Atoms
import { Box, Text, Button } from 'ui-primitives';

// Molecules
import { Dialog, Select, Menu } from 'ui-primitives';

// Organisms
import { Card, Calendar } from 'ui-primitives';
```

## Adding New Components

When adding a new UI component:

1. **Determine the category**: Is it an atom, molecule, or organism?
2. **Create the directory**:
   ```
   src/ui-primitives/[category]/[ComponentName]/
   ```
3. **Create files**:
   - `[ComponentName].tsx` - Component code
   - `[ComponentName].css.ts` - Vanilla Extract styles
   - `index.ts` - Exports
4. **Create a story**:
   - `src/ui-primitives/__stories__/[category]/[ComponentName].stories.tsx`
5. **Update exports**:
   - `src/ui-primitives/index.ts` - Add to appropriate section
   - `src/ui-primitives/[category]/[ComponentName].ts` - Root-level re-export (optional)

## Best Practices

### Component Design

1. **Use semantic tokens** - Never hardcode colors, spacing, etc.
2. **Keep atoms truly atomic** - Don't create atoms with complex logic
3. **Molecules are UI patterns** - Combine atoms in meaningful ways
4. **Organisms are pages/sections** - Can be complex with state

### Import Organization

```tsx
// Good: Grouped by category
import { Box, Text, Button } from 'ui-primitives';  // Atoms
import { Dialog, Select } from 'ui-primitives';     // Molecules

// Avoid: Mixed imports scattered throughout
import { Button } from 'ui-primitives/Button';
import { Box } from 'ui-primitives/Box';
import { Dialog } from 'ui-primitives/Dialog';
```

### Type Exports

All component types are re-exported at the root level:

```tsx
import { type ButtonProps, type DialogProps } from 'ui-primitives';
```

## Architecture Decisions

### Backward Compatibility

The re-export strategy (root-level `.ts` files) maintains backward compatibility while enabling the atomic structure. This allows:
- Gradual migration (no breaking changes)
- Mixed import styles in the same codebase
- Future flexibility

### Vanilla Extract CSS

Chosen for:
- Type-safe CSS-in-JS
- Zero runtime CSS
- IDE/TypeScript integration
- Component colocation

### Semantic Tokens

Enables:
- Consistent theming
- Easy theme switching (future)
- Design system scalability
- Accessibility improvements

## Troubleshooting

### Import Not Found

If you get a "Cannot find module" error:

1. **Check the component exists** in the correct category:
   ```bash
   ls src/ui-primitives/atoms/Button/     # Atom exists?
   ls src/ui-primitives/molecules/Dialog/ # Molecule exists?
   ```

2. **Verify re-export file exists**:
   ```bash
   ls src/ui-primitives/Button.ts  # Re-export exists?
   ```

3. **Check main index.ts export**:
   ```bash
   grep "Button" src/ui-primitives/index.ts
   ```

### Build Errors

Run type checking:
```bash
npm run build:check
```

This verifies all imports and types are correctly resolved.

## Related Documentation

- **Design System**: See `/src/styles/tokens.css.ts` for available design tokens
- **Component Stories**: Run `npm run storybook` for interactive documentation
- **Radix UI**: https://www.radix-ui.com (base component library)
- **Vanilla Extract**: https://vanilla-extract.style (CSS-in-JS solution)

## Future Improvements

Planned enhancements:
- [ ] Component usage analytics
- [ ] Automated deprecation warnings
- [ ] Design token browser in Storybook
- [ ] Component composition examples
- [ ] Performance profiling in Storybook

---

**Last Updated**: January 26, 2026
**Version**: 1.0 (Atomic Design Restructuring)
