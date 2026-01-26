import { style, keyframes, styleVariants } from '@vanilla-extract/css';
import { vars } from '../styles/tokens.css';

const slideUpAndFade = keyframes({
    '0%': {
        opacity: 0,
        transform: 'translateY(2px) scale(0.96)'
    },
    '100%': {
        opacity: 1,
        transform: 'translateY(0) scale(1)'
    }
});

const slideDownAndFade = keyframes({
    '0%': {
        opacity: 0,
        transform: 'translateY(-2px) scale(0.96)'
    },
    '100%': {
        opacity: 1,
        transform: 'translateY(0) scale(1)'
    }
});

const slideLeftAndFade = keyframes({
    '0%': {
        opacity: 0,
        transform: 'translateX(2px) scale(0.96)'
    },
    '100%': {
        opacity: 1,
        transform: 'translateX(0) scale(1)'
    }
});

const slideRightAndFade = keyframes({
    '0%': {
        opacity: 0,
        transform: 'translateX(-2px) scale(0.96)'
    },
    '100%': {
        opacity: 1,
        transform: 'translateX(0) scale(1)'
    }
});

export const popoverContent = style({
    backgroundColor: vars.colors.surface,
    borderRadius: vars.borderRadius.lg,
    boxShadow: vars.shadows.xl,
    padding: vars.spacing.md,
    zIndex: vars.zIndex.dropdown,
    minWidth: 180,
    maxWidth: 'var(--radix-popover-content-available-width)',
    maxHeight: 'var(--radix-popover-content-available-height)',
    overflow: 'auto',
    selectors: {
        '&[data-state="open"][data-side="top"]': {
            animation: `${slideUpAndFade} 150ms ease-out`
        },
        '&[data-state="open"][data-side="bottom"]': {
            animation: `${slideDownAndFade} 150ms ease-out`
        },
        '&[data-state="open"][data-side="left"]': {
            animation: `${slideLeftAndFade} 150ms ease-out`
        },
        '&[data-state="open"][data-side="right"]': {
            animation: `${slideRightAndFade} 150ms ease-out`
        }
    }
});

export const popoverArrow = style({
    fill: vars.colors.surface,
    width: 'var(--radix-popover-arrow-width)',
    height: 'var(--radix-popover-arrow-height)'
});

export const popoverClose = style({
    position: 'absolute',
    top: vars.spacing.sm,
    right: vars.spacing.sm,
    background: 'none',
    border: 'none',
    color: vars.colors.textMuted,
    cursor: 'pointer',
    padding: vars.spacing.xs,
    borderRadius: vars.borderRadius.sm,
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    transition: `all ${vars.transitions.fast}`,
    ':hover': {
        color: vars.colors.text,
        backgroundColor: vars.colors.surfaceHover
    },
    ':focus-visible': {
        outline: `2px solid ${vars.colors.primary}`,
        outlineOffset: '2px'
    }
});

export const popoverHeader = style({
    marginBottom: vars.spacing.sm
});

export const popoverTitle = style({
    fontWeight: vars.typography.fontWeightBold,
    fontSize: vars.typography.fontSizeLg,
    color: vars.colors.text,
    margin: 0,
    paddingRight: vars.spacing.lg
});

export const popoverDescription = style({
    fontSize: vars.typography.fontSizeMd,
    color: vars.colors.textSecondary,
    margin: `${vars.spacing.xs} 0 0`
});

export const popoverFooter = style({
    marginTop: vars.spacing.md,
    paddingTop: vars.spacing.md,
    borderTop: `1px solid ${vars.colors.divider}`,
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'flex-end',
    gap: vars.spacing.sm
});

export const alignVariants = styleVariants({
    start: {},
    center: {},
    end: {}
});
