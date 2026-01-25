# Legacy Deprecation Guide

This document outlines deprecated patterns in the Jellyfin Web codebase and their migration paths.

## Table of Contents

1. [Library Menu Module](#library-menu-module)
2. [Direct DOM Manipulation](#direct-dom-manipulation)
3. [Console Statements](#console-statements)
4. [Legacy Class Components](#legacy-class-components)
5. [MUI Joy Imports](#mui-joy-imports)

---

## Library Menu Module

**File:** `src/scripts/libraryMenu.ts`

**Status:** Deprecated

**Description:** This module provides global menu state management and page title manipulation.

### Migration

| Old Pattern                            | New Pattern                                          |
| -------------------------------------- | ---------------------------------------------------- |
| `libraryMenu.setTitle(title)`          | React state + `document.title` or `<Head>` component |
| `libraryMenu.setTransparentMenu(bool)` | CSS classes or CSS custom properties                 |
| `libraryMenu.setTabs(...)`             | TanStack React Router tabs or custom tab components  |
| `libraryMenu.getTopParentId()`         | React Router `useParams()` or `useMatch()`           |

### Example

```typescript
// BEFORE (deprecated)
import libraryMenu from 'scripts/libraryMenu';
libraryMenu.setTitle(user.Name);

// AFTER (migrated)
import { useSetAtom } from 'jellyfin-ui-state';
import { pageTitleAtom } from 'store/pageTitle';

function UserProfile() {
    const setPageTitle = useSetAtom(pageTitleAtom);
    setPageTitle(user.Name);
    return <div>{user.Name}</div>;
}
```

---

## Direct DOM Manipulation

**Affected Files:**

- `src/apps/dashboard/routes/users/access.tsx`
- `src/apps/dashboard/routes/users/parentalcontrol.tsx`
- `src/apps/dashboard/routes/users/profile.tsx`

**Status:** Legacy pattern - needs migration

### Migration

| Old Pattern                                     | New Pattern                                    |
| ----------------------------------------------- | ---------------------------------------------- |
| `element.querySelector('.chkEnableAllFolders')` | React state + controlled inputs                |
| `element.querySelectorAll('.chkFolder')`        | `useQuery` for data, React state for selection |
| `element.addEventListener('change', callback)`  | `onChange` prop on form elements               |
| `element.classList.add/remove/toggle('hide')`   | Conditional rendering or CSS classes           |

### Example

```typescript
// BEFORE (deprecated)
const chkEnableAllFolders = page.querySelector('.chkEnableAllFolders') as HTMLInputElement;
chkEnableAllFolders.checked = user.Policy?.EnableAllFolders;

// AFTER (migrated)
<Checkbox
    checked={user.Policy?.EnableAllFolders ?? false}
    onChange={(e) => {
        user.Policy.EnableAllFolders = e.target.checked;
    }}
/>
```

---

## Console Statements

**Status:** Deprecated in favor of centralized logging

### Migration

| Old Pattern                     | New Pattern                               |
| ------------------------------- | ----------------------------------------- |
| `console.error('message', err)` | `logger.error('message', { error: err })` |
| `console.log('message')`        | `logger.info('message')`                  |
| `console.warn('message')`       | `logger.warn('message')`                  |

### Example

```typescript
// BEFORE (deprecated)
console.error("[UserEdit] failed to fetch user", err);

// AFTER (migrated)
import { logger } from "utils/logger";
logger.error("[UserEdit] failed to fetch user", { component: "UserEdit" }, err);
```

---

## Legacy Class Components

**Status:** Deprecated in favor of React functional components

### Migration

| Old Pattern                              | New Pattern                        |
| ---------------------------------------- | ---------------------------------- |
| `class UserForm extends React.Component` | `function UserForm()`              |
| `this.setState({ key: value })`          | `useState()` hook                  |
| `this.props.children`                    | `children` prop with proper typing |
| `componentDidMount()`                    | `useEffect(() => {...}, [])`       |

---

## MUI Joy Imports

**Status:** Being migrated to Radix UI + ui-primitives

### Migration

See `AGENTS.md` for the full migration pattern.

| Old Pattern                                    | New Pattern                                           |
| ---------------------------------------------- | ----------------------------------------------------- |
| `import Box from '@mui/joy/Box'`               | `import { Box } from 'ui-primitives/Box'`             |
| `import Typography from '@mui/joy/Typography'` | `import { Text, Heading } from 'ui-primitives/Text'`  |
| `import Card from '@mui/joy/Card'`             | `import { Card, CardBody } from 'ui-primitives/Card'` |

---

## Checking for Deprecated Code

Run these commands to find deprecated patterns:

```bash
# Find console statements
grep -r "console\.(error|log|warn)" src/apps/dashboard

# Find direct DOM manipulation
grep -r "querySelector\|addEventListener" src/apps/dashboard/routes

# Find class components
grep -r "extends React\.Component" src/apps/dashboard

# Find MUI imports
grep -r "@mui/joy\|@mui/material" src/apps/dashboard
```

---

## Deprecation Timeline

| Pattern                    | Deprecated | Removal Target |
| -------------------------- | ---------- | -------------- |
| `libraryMenu` module       | v10.12.0   | v11.0.0        |
| Direct DOM manipulation    | v10.12.0   | v11.0.0        |
| `console.error` statements | v10.12.0   | v10.13.0       |
| Class components           | v10.12.0   | v11.0.0        |
| MUI Joy imports            | v10.12.0   | v11.0.0        |

---

## Reporting Issues

If you encounter deprecated patterns not listed here, please open an issue or submit a PR to update this guide.
