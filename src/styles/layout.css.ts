import { style, styleVariants } from '@vanilla-extract/css';
import { vars } from './tokens.css';

export const flex = style({
    display: 'flex'
});

export const inlineFlex = style({
    display: 'inline-flex'
});

export const flexDirection = styleVariants({
    row: { flexDirection: 'row' },
    column: { flexDirection: 'column' }
});

export const flexGrow = style({
    flexGrow: 1
});

export const flexShrinkZero = style({
    flexShrink: 0
});

export const alignItems = styleVariants({
    center: { alignItems: 'center' },
    'flex-start': { alignItems: 'flex-start' },
    'flex-end': { alignItems: 'flex-end' },
    stretch: { alignItems: 'stretch' },
    baseline: { alignItems: 'baseline' }
});

export const justifyContent = styleVariants({
    center: { justifyContent: 'center' },
    'flex-start': { justifyContent: 'flex-start' },
    'flex-end': { justifyContent: 'flex-end' },
    'space-between': { justifyContent: 'space-between' },
    'space-around': { justifyContent: 'space-around' },
    'space-evenly': { justifyContent: 'space-evenly' }
});

export const flexWrap = styleVariants({
    wrap: { flexWrap: 'wrap' },
    nowrap: { flexWrap: 'nowrap' },
    'wrap-reverse': { flexWrap: 'wrap-reverse' }
});

export const alignSelf = styleVariants({
    'flex-end': { alignSelf: 'flex-end' },
    'flex-start': { alignSelf: 'flex-start' },
    center: { alignSelf: 'center' },
    stretch: { alignSelf: 'stretch' },
    baseline: { alignSelf: 'baseline' }
});

export const gap = styleVariants({
    xs: { gap: vars.spacing['2'] },
    sm: { gap: vars.spacing['4'] },
    md: { gap: vars.spacing['5'] },
    lg: { gap: vars.spacing['6'] },
    xl: { gap: vars.spacing['7'] },
    xxl: { gap: vars.spacing['8'] }
});

export const fullHeight = style({
    height: '100%'
});

export const fullWidth = style({
    width: '100%'
});

export const overflow = styleVariants({
    hidden: { overflow: 'hidden' },
    auto: { overflow: 'auto' },
    scroll: { overflow: 'scroll' },
    'overflow-x': { overflowX: 'auto', overflowY: 'hidden' },
    'overflow-y': { overflowY: 'auto', overflowX: 'hidden' }
});

export const scrollBehavior = styleVariants({
    smooth: { scrollBehavior: 'smooth' }
});

export const scrollX = style({
    overflowX: 'auto',
    overflowY: 'hidden',
    whiteSpace: 'nowrap'
});

export const scrollY = style({
    overflowY: 'auto',
    overflowX: 'hidden'
});

export const scrollYSmooth = style({
    overflowY: 'auto',
    overflowX: 'hidden',
    scrollBehavior: 'smooth'
});

export const hiddenScrollbar = style({
    msOverflowStyle: 'none',
    scrollbarWidth: 'none',
    selectors: {
        '&::-webkit-scrollbar': {
            height: 0,
            width: 0,
            display: 'none'
        }
    }
});

export const textAlign = styleVariants({
    left: { textAlign: 'left' },
    center: { textAlign: 'center' },
    right: { textAlign: 'right' }
});

export const whiteSpace = styleVariants({
    nowrap: { whiteSpace: 'nowrap' },
    pre: { whiteSpace: 'pre' },
    'pre-wrap': { whiteSpace: 'pre-wrap' }
});

export const position = styleVariants({
    relative: { position: 'relative' },
    absolute: { position: 'absolute' },
    fixed: { position: 'fixed' },
    sticky: { position: 'sticky' }
});

export const zIndex = styleVariants({
    dropdown: { zIndex: vars.zIndex.dropdown },
    sticky: { zIndex: vars.zIndex.sticky },
    fixed: { zIndex: vars.zIndex.fixed },
    modalBackdrop: { zIndex: vars.zIndex.modalBackdrop },
    modal: { zIndex: vars.zIndex.modal },
    popover: { zIndex: vars.zIndex.popover },
    tooltip: { zIndex: vars.zIndex.tooltip }
});

export const cursor = styleVariants({
    pointer: { cursor: 'pointer' },
    default: { cursor: 'default' },
    notAllowed: { cursor: 'not-allowed' },
    move: { cursor: 'move' }
});

export const userSelect = styleVariants({
    none: { userSelect: 'none' },
    text: { userSelect: 'text' },
    all: { userSelect: 'all' }
});

export const borderRadius = styleVariants({
    sm: { borderRadius: vars.borderRadius.sm },
    md: { borderRadius: vars.borderRadius.md },
    lg: { borderRadius: vars.borderRadius.lg },
    full: { borderRadius: vars.borderRadius.full }
});

export const boxShadow = styleVariants({
    sm: { boxShadow: vars.shadows.sm },
    md: { boxShadow: vars.shadows.md },
    lg: { boxShadow: vars.shadows.lg },
    xl: { boxShadow: vars.shadows.xl },
    none: { boxShadow: 'none' }
});

export const transition = styleVariants({
    fast: { transition: vars.transitions.fast },
    normal: { transition: vars.transitions.normal },
    slow: { transition: vars.transitions.slow }
});

export const opacity = styleVariants({
    0: { opacity: 0 },
    25: { opacity: 0.25 },
    50: { opacity: 0.5 },
    75: { opacity: 0.75 },
    100: { opacity: 1 }
});

export const display = styleVariants({
    block: { display: 'block' },
    inline: { display: 'inline' },
    'inline-block': { display: 'inline-block' },
    flex: { display: 'flex' },
    'inline-flex': { display: 'inline-flex' },
    grid: { display: 'grid' },
    none: { display: 'none' }
});

export const visibility = styleVariants({
    visible: { visibility: 'visible' },
    hidden: { visibility: 'hidden' },
    collapse: { visibility: 'collapse' }
});

export const pointerEvents = styleVariants({
    none: { pointerEvents: 'none' },
    auto: { pointerEvents: 'auto' },
    all: { pointerEvents: 'all' }
});

export const paddedLeft = style({
    paddingLeft: '3.3%',
    '@supports': {
        '(padding-left: max(0px, 0px))': {
            paddingLeft: 'max(env(safe-area-inset-left), 3.3%)'
        }
    }
});

export const paddedRight = style({
    paddingRight: '3.3%',
    '@supports': {
        '(padding-right: max(0px, 0px))': {
            paddingRight: 'max(env(safe-area-inset-right), 3.3%)'
        }
    }
});
