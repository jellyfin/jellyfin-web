import { style, styleVariants } from '@vanilla-extract/css';
import { vars } from '../styles/tokens.css';

export const buttonStyles = style({
    display: 'inline-flex',
    alignItems: 'center',
    justifyContent: 'center',
    gap: vars.spacing.sm,
    padding: `${vars.spacing.sm} ${vars.spacing.md}`,
    borderRadius: vars.borderRadius.md,
    fontFamily: vars.typography.fontFamily,
    fontSize: vars.typography.fontSizeMd,
    fontWeight: vars.typography.fontWeightMedium,
    lineHeight: vars.typography.lineHeightNormal,
    cursor: 'pointer',
    transition: `all ${vars.transitions.fast}`,
    border: 'none',
    outline: 'none',
    ':focus-visible': {
        boxShadow: `0 0 0 2px ${vars.colors.background}, 0 0 0 4px ${vars.colors.primary}`
    },
    ':disabled': {
        opacity: 0.5,
        cursor: 'not-allowed'
    }
});

export const buttonVariants = styleVariants({
    primary: {
        backgroundColor: vars.colors.primary,
        color: vars.colors.text,
        ':hover': {
            backgroundColor: vars.colors.primaryHover
        }
    },
    secondary: {
        backgroundColor: vars.colors.surface,
        color: vars.colors.text,
        border: `1px solid ${vars.colors.divider}`,
        ':hover': {
            backgroundColor: vars.colors.surfaceHover
        }
    },
    ghost: {
        backgroundColor: 'transparent',
        color: vars.colors.text,
        ':hover': {
            backgroundColor: vars.colors.surface
        }
    },
    danger: {
        backgroundColor: vars.colors.error,
        color: vars.colors.text,
        ':hover': {
            opacity: 0.9
        }
    },
    error: {
        backgroundColor: vars.colors.error,
        color: vars.colors.text,
        ':hover': {
            opacity: 0.9
        }
    },
    outlined: {
        backgroundColor: 'transparent',
        color: vars.colors.text,
        border: `1px solid ${vars.colors.divider}`,
        ':hover': {
            backgroundColor: vars.colors.surface
        }
    },
    plain: {
        backgroundColor: 'transparent',
        color: 'inherit',
        ':hover': {
            backgroundColor: vars.colors.surfaceHover
        }
    },
    soft: {
        backgroundColor: `${vars.colors.primary}22`,
        color: vars.colors.primary,
        ':hover': {
            backgroundColor: `${vars.colors.primary}33`
        }
    }
});

export const buttonSizes = styleVariants({
    sm: {
        padding: `${vars.spacing.xs} ${vars.spacing.sm}`,
        fontSize: vars.typography.fontSizeSm
    },
    md: {
        padding: `${vars.spacing.sm} ${vars.spacing.md}`,
        fontSize: vars.typography.fontSizeMd
    },
    lg: {
        padding: `${vars.spacing.md} ${vars.spacing.lg}`,
        fontSize: vars.typography.fontSizeLg
    }
});

export const buttonFullWidth = style({
    width: '100%'
});

