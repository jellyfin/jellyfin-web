import { style, styleVariants } from '@vanilla-extract/css';
import { vars } from 'styles/tokens.css.ts';

export const buttonStyles = style({
    display: 'inline-flex',
    alignItems: 'center',
    justifyContent: 'center',
    gap: vars.spacing['4'],
    padding: `${vars.spacing['4']} ${vars.spacing['5']}`,
    borderRadius: vars.borderRadius.md,
    fontFamily: vars.typography.fontFamily,
    fontSize: vars.typography['6'].fontSize,
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
        padding: `${vars.spacing['2']} ${vars.spacing['4']}`,
        fontSize: vars.typography['3'].fontSize
    },
    md: {
        padding: `${vars.spacing['4']} ${vars.spacing['5']}`,
        fontSize: vars.typography['6'].fontSize
    },
    lg: {
        padding: `${vars.spacing['5']} ${vars.spacing['6']}`,
        fontSize: vars.typography['7'].fontSize
    }
});

export const buttonFullWidth = style({
    width: '100%'
});
