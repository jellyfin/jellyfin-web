import { style, styleVariants } from '@vanilla-extract/css';
import { vars } from 'styles/tokens.css.ts';

export const toggleRoot = style({
    display: 'inline-flex',
    alignItems: 'center',
    justifyContent: 'center',
    padding: `${vars.spacing['2']} ${vars.spacing['5']}`,
    borderRadius: vars.borderRadius.md,
    fontSize: vars.typography['6'].fontSize,
    fontWeight: vars.typography.fontWeightMedium,
    lineHeight: 1,
    cursor: 'pointer',
    transition: vars.transitions.fast,
    border: 'none',
    outline: 'none',
    backgroundColor: 'transparent',
    color: vars.colors.text
});

export const toggleVariant = styleVariants({
    primary: {
        backgroundColor: vars.colors.surface,
        ':hover': {
            backgroundColor: vars.colors.surfaceHover
        }
    },
    secondary: {
        backgroundColor: vars.colors.surface,
        ':hover': {
            backgroundColor: vars.colors.surfaceHover
        }
    },
    outline: {
        border: `1px solid ${vars.colors.divider}`,
        backgroundColor: 'transparent',
        ':hover': {
            backgroundColor: vars.colors.surface
        }
    }
});

export const toggleSizes = styleVariants({
    sm: {
        padding: `2px ${vars.spacing['4']}`,
        fontSize: vars.typography['3'].fontSize
    },
    md: {
        padding: `${vars.spacing['2']} ${vars.spacing['5']}`,
        fontSize: vars.typography['6'].fontSize
    },
    lg: {
        padding: `${vars.spacing['4']} ${vars.spacing['6']}`,
        fontSize: vars.typography['7'].fontSize
    }
});

export const toggleGroupRoot = style({
    display: 'inline-flex',
    backgroundColor: vars.colors.surface,
    borderRadius: vars.borderRadius.md,
    overflow: 'hidden'
});

export const toggleGroupItem = style({
    flex: 1,
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    padding: `${vars.spacing['2']} ${vars.spacing['5']}`,
    fontSize: vars.typography['6'].fontSize,
    lineHeight: 1,
    cursor: 'pointer',
    transition: vars.transitions.fast,
    border: 'none',
    outline: 'none',
    backgroundColor: 'transparent',
    color: vars.colors.text,
    borderRight: `1px solid ${vars.colors.divider}`,
    ':last-child': {
        borderRight: 'none'
    },
    ':hover': {
        backgroundColor: vars.colors.surfaceHover
    },
    ':disabled': {
        opacity: 0.5,
        cursor: 'not-allowed'
    },
    selectors: {
        '&[data-state="on"]': {
            backgroundColor: vars.colors.primary,
            color: vars.colors.text
        }
    }
});
