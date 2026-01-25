import { style, styleVariants } from '@vanilla-extract/css';
import { vars } from '../styles/tokens.css';

export const iconButtonStyles = style({
    display: 'inline-flex',
    alignItems: 'center',
    justifyContent: 'center',
    width: '36px',
    height: '36px',
    borderRadius: vars.borderRadius.md,
    border: 'none',
    backgroundColor: 'transparent',
    color: vars.colors.text,
    cursor: 'pointer',
    transition: `all ${vars.transitions.fast}`,
    ':focus-visible': {
        boxShadow: `0 0 0 2px ${vars.colors.background}, 0 0 0 4px ${vars.colors.primary}`
    }
});

export const iconButtonVariants = styleVariants({
    plain: {
        backgroundColor: 'transparent',
        ':hover': {
            backgroundColor: vars.colors.surface
        }
    },
    ghost: {
        backgroundColor: 'transparent',
        ':hover': {
            backgroundColor: vars.colors.surface
        }
    },
    soft: {
        backgroundColor: vars.colors.surfaceHover,
        ':hover': {
            backgroundColor: vars.colors.surface
        }
    },
    solid: {
        backgroundColor: vars.colors.primary,
        color: vars.colors.text,
        ':hover': {
            backgroundColor: vars.colors.primaryHover
        }
    },
    danger: {
        backgroundColor: 'transparent',
        color: vars.colors.error,
        ':hover': {
            backgroundColor: `${vars.colors.error}20`
        }
    }
});

export const iconButtonSizes = styleVariants({
    sm: {
        width: '28px',
        height: '28px'
    },
    md: {
        width: '36px',
        height: '36px'
    },
    lg: {
        width: '44px',
        height: '44px'
    }
});

export const iconButtonColors = styleVariants({
    primary: {
        color: vars.colors.primary
    },
    neutral: {
        color: vars.colors.textSecondary
    },
    danger: {
        color: vars.colors.error
    },
    warning: {
        color: vars.colors.warning
    },
    success: {
        color: vars.colors.success
    },
    info: {
        color: vars.colors.info
    }
});

