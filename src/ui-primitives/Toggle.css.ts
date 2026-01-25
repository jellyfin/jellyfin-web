import { style, styleVariants } from '@vanilla-extract/css';
import { vars } from '../styles/tokens.css';

export const toggleRoot = style({
    display: 'inline-flex',
    alignItems: 'center',
    justifyContent: 'center',
    padding: `${vars.spacing.xs} ${vars.spacing.md}`,
    borderRadius: vars.borderRadius.md,
    fontSize: vars.typography.fontSizeMd,
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
        padding: `2px ${vars.spacing.sm}`,
        fontSize: vars.typography.fontSizeSm
    },
    md: {
        padding: `${vars.spacing.xs} ${vars.spacing.md}`,
        fontSize: vars.typography.fontSizeMd
    },
    lg: {
        padding: `${vars.spacing.sm} ${vars.spacing.lg}`,
        fontSize: vars.typography.fontSizeLg
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
    padding: `${vars.spacing.xs} ${vars.spacing.md}`,
    fontSize: vars.typography.fontSizeMd,
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

