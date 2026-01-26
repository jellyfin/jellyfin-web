# Radix UI + Icons + Vanilla CSS Integration Guide

## Overview

This project follows the finalized Radix UI setup guidelines with:
- **@radix-ui/themes** - Complete design system
- **@radix-ui/react-icons** - Standardized icon system (15×15 grid)
- **Vanilla CSS** - No CSS-in-JS, pure semantic tokens and utilities
- **Storybook** - Production-mirrored component catalog

## Setup Complete ✓

### Installed Packages
```
@radix-ui/themes@3.2.1      # Design system & theming
@radix-ui/react-icons@1.3.2 # Optimized icon library
@radix-ui/[primitives]      # Underlying UI primitives
```

### Key Files

#### Semantic Tokens
- **`src/styles/tokens.semantic.css`** - Application-level variables
  - Colors: `--text-1`, `--bg`, `--primary`, etc.
  - Spacing: `--s-1` through `--s-6`
  - Radii: `--r-xs`, `--r-sm`, `--r-md`, `--r-lg`, `--r-full`
  - Shadows: `--shadow-xs` through `--shadow-lg`

#### Component Patterns
- **`src/styles/components.css`** - Canonical UI patterns
  - `.iconButton` - Icon-only button (32×32)
  - `.button` - Button with optional icon
  - `.input` - Text input base
  - `.badge` - Inline badge/tag
  - Plus: dropdowns, checkboxes, separators, utilities

#### Theme Provider
- **`src/components/themeProvider/ThemeProvider.tsx`**
  - Wraps app with `<Theme>`
  - Maps Jellyfin theme → Radix appearance (light/dark)
  - Configuration: `accentColor="jade"`, `grayColor="sage"`

#### Storybook
- **`.storybook/preview.ts`**
  - Global appearance + accentColor toggles
  - Theme decorator mirrors production exactly
  - All semantic tokens available in stories

#### Icon Catalog
- **`src/stories/Icons.stories.tsx`**
  - Complete Radix Icons reference grid
  - Sizing demo (12px–24px)
  - Color demo (semantic tokens)
  - Button patterns with icons

---

## Usage Patterns

### 1. Icons (Direct Import)

Radix Icons are React components—no wrapper needed. Import and use directly:

```tsx
import { PlusIcon, ChevronDownIcon } from '@radix-ui/react-icons';

export function MyComponent() {
    return (
        <div>
            <button className="iconButton">
                <PlusIcon />
            </button>

            <a href="#" className="button">
                <ChevronDownIcon className="icon-md" />
                Open Menu
            </a>
        </div>
    );
}
```

**Icon inheritance rule**: Icons inherit `currentColor` by default. Use CSS classes or inline styles:

```css
.button {
    color: var(--primary);
}

button:hover {
    color: var(--primary-hover);
}
```

### 2. Sizing Icons

Use semantic utilities—never scale arbitrarily:

```tsx
<PlusIcon className="icon-sm" />  {/* 12px */}
<PlusIcon className="icon-md" />  {/* 15px (default) */}
<PlusIcon className="icon-lg" />  {/* 18px */}
<PlusIcon className="icon-xl" />  {/* 24px */}
```

Or inline:

```tsx
<PlusIcon style={{ width: '18px', height: '18px' }} />
```

### 3. Icon Buttons

Use the `.iconButton` class:

```tsx
<button className="iconButton">
    <TrashIcon />
</button>

<button className="iconButton primary">
    <CheckIcon />
</button>

<button className="iconButton ghost" title="More">
    <DotsVerticalIcon />
</button>

<button className="iconButton" disabled>
    <LockClosedIcon />
</button>
```

CSS is already defined in `components.css`:
- Base: 32×32, centered, focus ring
- `:hover` — subtle background change
- `.primary` — accent color
- `.ghost` — transparent until hover
- `:disabled` — reduced opacity

### 4. Buttons with Icons

Use the `.button` class with inline flex:

```tsx
<button className="button">
    <PlusIcon className="icon-md" />
    Add Item
</button>

<button className="button primary">
    <CheckIcon className="icon-md" />
    Save
</button>

<button className="button outline">
    <DownloadIcon className="icon-md" />
    Export
</button>
```

The gap is controlled by `.button { gap: var(--s-2); }`.

### 5. Semantic Tokens

All tokens are CSS variables scoped to `:root`. Use them everywhere:

```css
.card {
    background: var(--surface-1);
    border: 1px solid var(--border-1);
    border-radius: var(--r-md);
    padding: var(--s-3);
}

.text-primary {
    color: var(--primary);
}

button:focus-visible {
    outline: var(--focus-ring-width) solid var(--focus-ring);
    outline-offset: var(--focus-ring-offset);
}
```

### 6. State-Driven Icon Changes

Use Radix primitive attributes (`data-state`, `aria-expanded`, etc.):

```tsx
// Radix UI Select trigger
<select.Trigger>
    Menu <ChevronDownIcon />
</select.Trigger>
```

CSS (auto-rotate when open):

```css
.dropdownTrigger[data-state="open"] svg {
    transform: rotate(180deg);
    transition: transform 150ms ease;
}
```

---

## Theme Customization

### App Theme (Production)

Edit `src/components/themeProvider/ThemeProvider.tsx`:

```tsx
<Theme
    appearance={radixTheme}
    accentColor="jade"        // "blue", "cyan", "gold", "green", "jade", "orange", "pink", "plum", "purple", "red", "tomato", "violet"
    grayColor="sage"          // "mauve", "slate", "sage", "olive", "sand", "stone"
    radius="medium"           // "small", "medium", "large"
    scaling="100%"            // "90%", "95%", "100%", "105%", "110%"
>
```

### Storybook Theme (Development)

In Storybook, use the toolbar to switch appearance and accent color in real-time.

Default: `appearance="dark"`, `accentColor="jade"`

---

## Best Practices

### ✓ Do

- Use **semantic tokens** (`--text-1`, `--primary`, `--border-1`) for consistency
- Import icons **directly** from `@radix-ui/react-icons`
- Size icons with **utility classes** (`.icon-sm`, `.icon-md`, etc.)
- Use **state attributes** for dynamic styles (`[data-state]`, `[aria-expanded]`)
- Test components in **Storybook** with the appearance/color switcher
- Trust Radix primitives' built-in **a11y** (focus, ARIA, etc.)

### ✗ Don't

- Create custom icon wrappers (use the component directly)
- Scale icons with arbitrary pixel values or `transform: scale()`
- Mix CSS-in-JS with vanilla CSS
- Add custom colors outside semantic tokens
- Assume Radix themes override all styling (they provide defaults; you enhance)

---

## Icon Reference

See **Storybook** → **Design System/Icons** for the complete catalog:

1. **All Icons** – Full grid of all 100+ Radix Icons
2. **Common Icons** – Most-used subset (plus, check, chevron, etc.)
3. **Sizing Demo** – Visual reference for `icon-sm` to `icon-xl`
4. **Color Demo** – Tokens applied to icons
5. **Button Demos** – Icon button and button+icon patterns

---

## Troubleshooting

### Icons not appearing
- Ensure `import '@radix-ui/themes/styles.css';` is at the top of `src/index.tsx`
- Verify icon import: `import { PlusIcon } from '@radix-ui/react-icons';`
- Check browser DevTools for CSS load errors

### Colors not changing
- Verify theme appearance (`light` or `dark`) matches your intent
- Check that semantic tokens (`--text-1`, `--primary`) are defined in `tokens.semantic.css`
- Icons use `currentColor` by default; set `color` on parent or inline

### Focus rings not visible
- Ensure `.svg { display: block; }` is in global CSS
- Verify `--focus-ring-width` and `--focus-ring` are defined

### Storybook appearance toggle not working
- Refresh the page
- Clear Storybook cache: `rm -rf node_modules/.storybook`
- Check `.storybook/preview.ts` imports all style files

---

## Adding New Components

When adding new UI components:

1. **Export from `components.css`** – Add canonical `.componentName` class
2. **Use semantic tokens** – Colors, spacing, radii from `:root`
3. **Test in Storybook** – Create `.stories.tsx`, use appearance switcher
4. **Document patterns** – Update `RADIX_UI_SETUP.md` if new pattern

Example:

```css
/* components.css */
.modal {
    background: var(--surface-1);
    border-radius: var(--r-lg);
    box-shadow: var(--shadow-lg);
    padding: var(--s-4);
}

.modal-header {
    display: flex;
    justify-content: space-between;
    gap: var(--s-3);
    margin-bottom: var(--s-3);
}
```

```tsx
/* Modal.stories.tsx */
import { XIcon } from '@radix-ui/react-icons';

export const Default: Story = {
    render: () => (
        <div className="modal">
            <div className="modal-header">
                <h2>Modal Title</h2>
                <button className="iconButton" aria-label="Close">
                    <XIcon />
                </button>
            </div>
            <p>Modal content...</p>
        </div>
    )
};
```

---

## Resources

- [Radix UI Docs](https://www.radix-ui.com/)
- [Radix Icons](https://radix-ui.com/icons)
- [Radix Themes Design System](https://radix-ui.com/themes/docs/overview/getting-started)
- [Storybook Docs](https://storybook.js.org/docs/react/get-started/introduction)

---

**Last Updated:** January 2026
**Status:** Finalized setup complete
