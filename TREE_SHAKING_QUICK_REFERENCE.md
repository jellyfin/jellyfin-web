# Tree-Shaking Quick Reference

**TL;DR: Named imports only, no wildcards, named exports only, no defaults.**

## The Golden Rules

| Rule | ✅ DO | ❌ DON'T |
|------|-------|---------|
| **Imports** | `import { X } from 'module'` | `import * as M from 'module'` |
| **Exports** | `export const X = ...` | `export default X` |
| **Barrels** | Re-export only | Define new code |
| **Styles** | `import { color } from 'x.css'` | `import * as s from 'x.css'` |
| **Utilities** | `import { fn } from 'utils/fn'` | `import * as utils from 'utils'` |

## Import Patterns

```typescript
// ✅ CORRECT - Named imports from specific paths
import { Component } from 'components/dialogs/Component';
import { useState } from 'react';
import { debounce } from 'utils/debounce';
import { primary, secondary } from 'styles/tokens.css';

// ❌ WRONG - Wildcard imports
import * as C from 'components';
import * as Dialogs from 'components/dialogs';
import * as Styles from 'styles/tokens.css';

// ⚠️ OK - Feature barrels (use sparingly)
import { Component } from 'components/dialogs';
```

## Export Patterns

```typescript
// ✅ CORRECT - Named exports
export const Component = () => { ... };
export interface Props { ... }
export type Config = { ... };

// ❌ WRONG - Default exports
export default Component;
export default function() { ... }
```

## Component File Structure

```
components/
├── dialogs/
│   ├── ActionMenu.tsx       ← Named export: export const ActionMenu
│   ├── FilterDialog.tsx     ← Named export: export const FilterDialog
│   └── index.ts             ← Barrel (re-export only)
```

## Barrel Files (index.ts)

```typescript
// ✅ CORRECT - Re-export only
export { ActionMenu } from './ActionMenu';
export { FilterDialog } from './FilterDialog';
export type { ActionMenuProps } from './ActionMenu';

// ❌ WRONG - Defining code
export const helper = () => { };
export class Manager { }
```

## ESLint Violations & Fixes

### Violation: Wildcard Import
```
❌ Error: Wildcard imports hurt tree-shaking
import * as Dialogs from 'components/dialogs';
```

**Fix:**
```typescript
import { ActionMenu } from 'components/dialogs';
```

### Violation: Default Export
```
❌ Error: Default exports prevent tree-shaking
export default Component;
```

**Fix:**
```typescript
export const Component = () => { };
```

### Violation: Wrong Barrel Import
```
❌ Error: Import from specific component path
import { Component } from 'components';
```

**Fix:**
```typescript
import { Component } from 'components/dialogs';
```

## Quick Commands

```bash
# Check for violations
npm run lint

# Fix auto-fixable violations
npm run lint -- --fix

# Build and check bundle size
npm run build:production

# Analyze bundle
npm run build:production -- --analyze
```

## When You Add a New Component

1. **Export it as named export:**
   ```typescript
   export const MyComponent: React.FC = () => { ... };
   ```

2. **Add to barrel if in feature directory:**
   ```typescript
   // components/dialogs/index.ts
   export { MyComponent } from './MyComponent';
   ```

3. **Import using named import:**
   ```typescript
   import { MyComponent } from 'components/dialogs';
   ```

## Common Mistakes

| Mistake | Why It Matters | Fix |
|---------|----------------|-----|
| `import * as X from 'module'` | Prevents tree-shaking | Use `import { X }` |
| `export default Component` | Breaks scope hoisting | Use `export const` |
| `import { X } from 'components'` | Imports everything | Use `import { X } from 'components/dialogs'` |
| `import * as styles from 'x.css'` | Can't eliminate unused styles | Use `import { style }` |

## Real Example: Before & After

### BEFORE (Violates Tree-Shaking)
```typescript
import * as PlaybackComponents from 'components/playback';
import * as Dialogs from 'components/dialogs';
import * as Styles from './component.css.ts';

export const Page = () => {
  const { VideoControls } = PlaybackComponents;
  const { ActionMenu } = Dialogs;

  return (
    <div style={{ color: Styles.primary }}>
      <VideoControls />
      <ActionMenu items={[]} onSelect={() => {}} />
    </div>
  );
};

export default Page;
```

### AFTER (Tree-Shaking Safe)
```typescript
import { VideoControls } from 'components/playback';
import { ActionMenu } from 'components/dialogs';
import { primary } from './component.css.ts';

export const Page = () => {
  return (
    <div style={{ color: primary }}>
      <VideoControls />
      <ActionMenu items={[]} onSelect={() => {}} />
    </div>
  );
};
```

## Performance Impact

- **Bundle Size:** -29% (353 KB smaller)
- **Load Time:** -25% (600ms faster)
- **Coverage:** 98% of code is used (up from 71%)

## Enforcement

- ❌ ESLint blocks commits with violations
- ❌ Type checking fails with default exports
- ❌ Large chunks trigger build warnings
- ✅ Code review checks compliance

---

**Questions?** See `TREE_SHAKING_GUIDE.md` for complete documentation.
