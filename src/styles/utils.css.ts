import { style, styleVariants } from '@vanilla-extract/css';
import { vars } from './tokens.css.ts';

export const hidden = style({ display: 'none' });
export const invisible = style({ visibility: 'hidden' });
export const visible = style({ visibility: 'visible' });

export const position = styleVariants({
    static: { position: 'static' },
    relative: { position: 'relative' },
    absolute: { position: 'absolute' },
    fixed: { position: 'fixed' },
    sticky: { position: 'sticky' }
});

export const fullHeight = style({ height: '100%' });
export const fullWidth = style({ width: '100%' });
export const minHeight = style({ minHeight: '100%' });
export const minWidth = style({ minWidth: '100%' });

export const overflow = styleVariants({
    hidden: { overflow: 'hidden' },
    auto: { overflow: 'auto' },
    scroll: { overflow: 'scroll' },
    'overflow-x': { overflowX: 'auto', overflowY: 'hidden' },
    'overflow-y': { overflowY: 'auto', overflowX: 'hidden' }
});

export const cursor = styleVariants({
    auto: { cursor: 'auto' },
    default: { cursor: 'default' },
    pointer: { cursor: 'pointer' },
    move: { cursor: 'move' },
    text: { cursor: 'text' },
    wait: { cursor: 'wait' },
    help: { cursor: 'help' },
    notAllowed: { cursor: 'not-allowed' }
});

export const userSelect = styleVariants({
    none: { userSelect: 'none' },
    text: { userSelect: 'text' },
    all: { userSelect: 'all' }
});

export const borderRadius = styleVariants({
    none: { borderRadius: vars.borderRadius.none },
    sm: { borderRadius: vars.borderRadius.sm },
    md: { borderRadius: vars.borderRadius.md },
    lg: { borderRadius: vars.borderRadius.lg },
    xl: { borderRadius: vars.borderRadius.xl },
    full: { borderRadius: vars.borderRadius.full }
});

export const textAlign = styleVariants({
    left: { textAlign: 'left' },
    center: { textAlign: 'center' },
    right: { textAlign: 'right' },
    justify: { textAlign: 'justify' }
});

export const whiteSpace = styleVariants({
    normal: { whiteSpace: 'normal' },
    nowrap: { whiteSpace: 'nowrap' },
    pre: { whiteSpace: 'pre' },
    preWrap: { whiteSpace: 'pre-wrap' }
});

export const wordBreak = styleVariants({
    normal: { wordBreak: 'normal' },
    breakAll: { wordBreak: 'break-all' },
    keepAll: { wordBreak: 'keep-all' }
});

export const opacity = styleVariants({
    0: { opacity: 0 },
    25: { opacity: 0.25 },
    50: { opacity: 0.5 },
    75: { opacity: 0.75 },
    100: { opacity: 1 }
});

export const transition = styleVariants({
    none: { transition: 'none' },
    fast: { transition: vars.transitions.fast },
    normal: { transition: vars.transitions.normal },
    slow: { transition: vars.transitions.slow }
});

export const boxShadow = styleVariants({
    none: { boxShadow: vars.shadows.none },
    sm: { boxShadow: vars.shadows.sm },
    md: { boxShadow: vars.shadows.md },
    lg: { boxShadow: vars.shadows.lg },
    xl: { boxShadow: vars.shadows.xl },
    inner: { boxShadow: vars.shadows.inner },
    outline: { boxShadow: vars.shadows.outline }
});
