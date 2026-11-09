import type { CSSProperties } from 'react';

/**
 * Hides an element visually while keeping it available to assistive technology. Usable as sx and as style.
 * The element is clipped instead of hidden with display: none, so it stays in the accessibility tree and
 * password managers still see it.
 */
export const VISUALLY_HIDDEN_STYLE = {
    position: 'absolute',
    // Absolute positioning already makes the element block-level, which separates its text from the text around
    // it in accessible names. Stated explicitly for tools that only read declared styles
    display: 'block',
    // Lengths with a unit, since sx would read the bare numbers as a fraction of the parent and as spacing units,
    // which turns the element into a box as large as its container that adds scrollable overflow
    width: '1px',
    height: '1px',
    padding: 0,
    margin: '-1px',
    overflow: 'hidden',
    // clip-path replaces the deprecated clip property
    clipPath: 'inset(50%)',
    whiteSpace: 'nowrap',
    border: 0
} as const satisfies CSSProperties;
