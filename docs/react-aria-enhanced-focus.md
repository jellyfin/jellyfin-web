# React Aria Enhanced Focus Management Guide

## Overview

Jellyfin Web now includes React Aria enhanced focus management hooks that provide modern, accessible focus handling while maintaining compatibility with our existing design token system and Radix UI components.

## Quick Start

```typescript
import { useEnhancedFocus } from '../hooks/useEnhancedFocus';

const MyButton = ({ children }) => {
  const { isFocused, focusProps, focusRingStyles } = useEnhancedFocus({
    focusColor: 'primary',
    component: 'MyButton'
  });

  return (
    <button
      {...focusProps}
      style={{ ...focusRingStyles }}
      data-focused={isFocused}
    >
      {children}
    </button>
  );
};
```

## Available Hooks

### `useEnhancedFocus(options)`

Core hook for enhanced focus management with React Aria integration.

**Parameters:**

- `focusColor?: keyof typeof ariaTheme.colors` - Focus ring color (default: 'primary')
- `focusWidth?: string` - Focus ring width (default: '2px')
- `focusOffset?: string` - Focus ring offset (default: '2px')
- `trackFocusWithin?: boolean` - Enable focus-within tracking (default: false)
- `onFocus?: (isFocused: boolean) => void` - Custom focus handler
- `onBlur?: (isFocused: boolean) => void` - Custom blur handler
- `component?: string` - Component name for logging (default: 'Unknown')

**Returns:**

- `isFocused: boolean` - Current focus state
- `isFocusVisible: boolean` - Whether focus is from keyboard navigation
- `focusProps: React.HTMLAttributes<HTMLElement>` - Props to spread on element
- `focusRingStyles: React.CSSProperties` - Computed focus ring styles
- `isFocusWithin?: boolean` - Focus within state (if tracking enabled)
- `withinProps?: React.HTMLAttributes<HTMLElement>` - Container props (if tracking enabled)

### `useEnhancedButtonFocus(options)`

Specialized hook for button components with additional styling options.

**Additional Parameters:**

- `variant?: 'primary' | 'secondary' | 'ghost'` - Button variant (default: 'primary')
- `size?: 'sm' | 'md' | 'lg'` - Button size (default: 'md')

**Additional Returns:**

- `buttonStyles: React.CSSProperties` - Button-specific styles

### `useEnhancedInputFocus(options)`

Specialized hook for input components with focus management.

**Returns:**

- `inputStyles: React.CSSProperties` - Input-specific styles with transitions

### `useFocusTrap(containerRef)`

Hook for trapping focus within modals and dialogs.

**Parameters:**

- `containerRef: React.RefObject<HTMLElement>` - Container element reference

## Design Token Integration

### Available Colors

```typescript
type FocusColor =
  | "primary" // var(--color-primary)
  | "secondary" // var(--color-secondary)
  | "error" // var(--color-error)
  | "success" // var(--color-success)
  | "warning" // var(--color-warning)
  | "textPrimary" // var(--color-text)
  | "textSecondary" // var(--color-textSecondary)
  | "textMuted" // var(--color-textMuted)
  | "background" // var(--color-background)
  | "surface" // var(--color-surface)
  | "border"; // var(--color-border)
```

### Spacing and Border Radius

Focus rings automatically use design tokens:

- **Spacing**: 1-9 numeric scale (`spacing['2']` = 8px)
- **Border Radius**: `borderRadius.sm`, `borderRadius.md`, etc.
- **Z-Index**: `zIndex.tooltip` for proper layering

## Migration Guide

### From focusManager (Legacy)

**Before:**

```typescript
import focusManager from "../components/focusManager";

// Manual focus management
focusManager.focus(element);
const isFocusable = focusManager.isFocusable(element);
```

**After:**

```typescript
import { useEnhancedFocus } from '../hooks/useEnhancedFocus';

// Hook-based focus management
const { isFocused, focusProps, focusRingStyles } = useEnhancedFocus();

// Automatic focus handling and styling
<button {...focusProps} style={focusRingStyles}>
  Content
</button>
```

### From Radix UI Focus

**Before:**

```typescript
import { FocusRing } from '@radix-ui/react-focus-ring';

<FocusRing>
  <button>Content</button>
</FocusRing>
```

**After:**

```typescript
import { useEnhancedFocus } from '../hooks/useEnhancedFocus';

const MyButton = () => {
  const { focusProps, focusRingStyles } = useEnhancedFocus();

  return (
    <button
      {...focusProps}
      style={focusRingStyles}
    >
      Content
    </button>
  );
};
```

## Best Practices

### 1. Consistent Focus Indicators

```typescript
// ✅ Use design token colors
const { focusProps, focusRingStyles } = useEnhancedFocus({
  focusColor: "primary" // Uses var(--color-primary)
});

// ❌ Avoid hardcoded colors
const badStyles = { outline: "2px solid #007acc" };
```

### 2. Accessibility First

```typescript
// ✅ Track keyboard vs mouse focus
const { isFocusVisible } = useEnhancedFocus();

// Focus ring only shows for keyboard navigation
if (isFocusVisible) {
  // Apply visible focus indicators
}
```

### 3. Focus Management in Modals

```typescript
// ✅ Use focus trap for modals
const ModalContent = ({ children }) => {
  const containerRef = useRef<HTMLDivElement>(null);
  useFocusTrap(containerRef);

  return (
    <div ref={containerRef}>
      {children}
    </div>
  );
};
```

### 4. Container Focus Tracking

```typescript
// ✅ Track focus within containers
const Container = ({ children }) => {
  const { isFocusWithin, withinProps } = useEnhancedFocus({
    trackFocusWithin: true
  });

  return (
    <div
      {...withinProps}
      style={{ background: isFocusWithin ? 'var(--color-surfaceHover)' : 'transparent' }}
    >
      {children}
    </div>
  );
};
```

## Testing

### Unit Testing

```typescript
import { render, screen, fireEvent } from '@testing-library/react';
import { useEnhancedFocus } from '../useEnhancedFocus';

const TestComponent = () => {
  const { isFocused, focusProps } = useEnhancedFocus({
    component: 'TestComponent'
  });

  return (
    <button
      {...focusProps}
      data-focused={isFocused}
    >
      Test Button
    </button>
  );
};

// Test focus state
test('should track focus state', () => {
  render(<TestComponent />);

  const button = screen.getByRole('button');
  fireEvent.focus(button);

  expect(button).toHaveAttribute('data-focused', 'true');
});
```

### Integration Testing

```typescript
// Test keyboard navigation
test('should handle tab navigation', () => {
  render(<MyForm />);

  fireEvent.keyDown(document, { key: 'Tab' });

  // Verify focus moves to expected element
  expect(screen.getByLabelText('First Name')).toHaveFocus();
});
```

## Performance Considerations

### Bundle Size

React Aria hooks are tree-shakeable. Only used hooks are included:

```typescript
// ✅ Tree-shakable - only includes used hooks
import { useEnhancedFocus } from "../hooks/useEnhancedFocus";

// ❌ Avoid importing all of React Aria
import * as aria from "@react-aria/focus";
```

### Runtime Performance

- **Optimized**: React Aria hooks are optimized for performance
- **Minimal Re-renders**: State updates are batched
- **Native Focus Management**: Uses browser's native focus API

## Common Patterns

### Accessible Buttons

```typescript
const AccessibleButton = ({ children, variant = 'primary', size = 'md' }) => {
  const {
    isFocused,
    focusProps,
    focusRingStyles,
    buttonStyles
  } = useEnhancedButtonFocus({ variant, size });

  return (
    <button
      {...focusProps}
      style={{ ...buttonStyles, ...focusRingStyles }}
      data-focused={isFocused}
    >
      {children}
    </button>
  );
};
```

### Focus Management in Forms

```typescript
const FormField = ({ label, children }) => {
  const { isFocusWithin, withinProps } = useEnhancedFocus({
    trackFocusWithin: true,
    component: 'FormField'
  });

  return (
    <div
      {...withinProps}
      data-focus-within={isFocusWithin}
      style={{
        padding: 'var(--spacing-3)',
        border: isFocusWithin ? '1px solid var(--color-primary)' : '1px solid var(--color-border)',
        borderRadius: 'var(--borderRadius-sm)'
      }}
    >
      <label>{label}</label>
      {children}
    </div>
  );
};
```

### Custom Focus Handlers

```typescript
const TrackedInput = ({ onFocusChange, ...props }) => {
  const { focusProps } = useEnhancedFocus({
    onFocus: (isFocused) => {
      onFocusChange?.(isFocused);
      console.log(`Input ${isFocused ? 'focused' : 'blurred'}`);
    },
    component: 'TrackedInput'
  });

  return <input {...focusProps} {...props} />;
};
```

## Troubleshooting

### Focus Ring Not Visible

**Issue**: Focus ring styles not applying
**Solution**: Ensure keyboard navigation (Tab key) - focus rings only show for keyboard focus

```typescript
// Simulate keyboard navigation in tests
fireEvent.keyDown(document, { key: "Tab" });
fireEvent.focus(element);
```

### Focus State Not Updating

**Issue**: `isFocused` not changing
**Solution**: Use merged focus props correctly

```typescript
// ✅ Merge all focus props
const mergedProps = {
  ...ariaFocusProps,
  ...customFocusProps
};

// ❌ Missing props
<button {...ariaFocusProps} /> // Missing custom handlers
```

### TypeScript Errors

**Issue**: Type errors with focus props
**Solution**: Use proper typing for custom elements

```typescript
// ✅ Correct typing
const myRef = useRef<HTMLButtonElement>(null);

// ❌ Generic ref may cause issues
const myRef = useRef(null);
```

## Compatibility

### Browser Support

- ✅ Modern browsers (Chrome 90+, Firefox 88+, Safari 14+)
- ✅ Screen readers (NVDA, JAWS, VoiceOver)
- ⚠️ Legacy IE11 - falls back to basic focus

### Framework Integration

- ✅ React 18+ (current)
- ✅ Radix UI components (via compatibility layer)
- ✅ TanStack React Router focus management
- ✅ Vite development server

## Next Steps

1. **Component Migration**: Gradually migrate existing components to use enhanced hooks
2. **Performance Monitoring**: Track bundle size and runtime performance
3. **User Testing**: Validate with screen reader users
4. **Documentation Updates**: Update component library documentation

## Support

For questions or issues:

1. Check this guide for common patterns
2. Review test files for working examples
3. Consult React Aria documentation at https://react-spectrum.adobe.com/react-aria/
4. Create GitHub issues with reproduction steps
