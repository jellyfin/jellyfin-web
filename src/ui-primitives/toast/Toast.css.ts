import { style, keyframes, styleVariants } from '@vanilla-extract/css';
import { vars } from '../../styles/tokens.css';

const scaleIn = keyframes({
    from: {
        transform: 'scale(0.95)',
        opacity: 0
    },
    to: {
        transform: 'scale(1)',
        opacity: 1
    }
});

const toastProgress = keyframes({
    from: {
        width: '100%'
    },
    to: {
        width: '0%'
    }
});

export const toastVariantStyles = styleVariants({
    default: {
        backgroundColor: vars.colors.surface,
        borderLeft: `4px solid ${vars.colors.primary}`
    },
    success: {
        backgroundColor: vars.colors.surface,
        borderLeft: `4px solid ${vars.colors.success}`
    },
    warning: {
        backgroundColor: vars.colors.surface,
        borderLeft: `4px solid ${vars.colors.warning}`
    },
    error: {
        backgroundColor: vars.colors.surface,
        borderLeft: `4px solid ${vars.colors.error}`
    },
    info: {
        backgroundColor: vars.colors.surface,
        borderLeft: `4px solid ${vars.colors.primary}`
    }
});

export const toastContainer = style({
    display: 'flex',
    alignItems: 'flex-start',
    gap: vars.spacing.sm,
    padding: vars.spacing.md,
    backgroundColor: vars.colors.surface,
    borderRadius: vars.borderRadius.lg,
    boxShadow: vars.shadows.lg,
    minWidth: 300,
    maxWidth: 400,
    position: 'relative',
    overflow: 'hidden',
    cursor: 'default',
    selectors: {
        '&[data-swipe="move"]': {
            transform: 'translateX(var(--radix-toast-swipe-move-x))'
        },
        '&[data-swipe="cancel"]': {
            transform: 'translateX(0)',
            transition: 'transform 200ms ease-out'
        },
        '&[data-swipe="end"]': {
            animationName: 'ease-out'
        }
    }
});

export const toastViewport = style({
    position: 'fixed',
    display: 'flex',
    flexDirection: 'column',
    gap: vars.spacing.sm,
    padding: vars.spacing.md,
    width: 380,
    maxHeight: 'calc(100vh - 24px)',
    overflow: 'auto',
    zIndex: vars.zIndex.toast,
    outline: 'none',
    selectors: {
        '&[data-state="open"]': {
            animationName: scaleIn,
            animationDuration: '200ms',
            animationTimingFunction: 'ease-out'
        },
        '&[data-state="closed"]': {
            animationName: 'fade-out',
            animationDuration: '150ms',
            animationTimingFunction: 'ease-in'
        }
    }
});

export const toastViewportPosition = styleVariants({
    'top-right': {
        top: 0,
        right: 0,
        flexDirection: 'column',
        alignItems: 'flex-end'
    },
    'top-left': {
        top: 0,
        left: 0,
        flexDirection: 'column',
        alignItems: 'flex-start'
    },
    'bottom-right': {
        bottom: 0,
        right: 0,
        flexDirection: 'column-reverse',
        alignItems: 'flex-end'
    },
    'bottom-left': {
        bottom: 0,
        left: 0,
        flexDirection: 'column-reverse',
        alignItems: 'flex-start'
    }
});

export const toastContent = style({
    display: 'flex',
    flexDirection: 'column',
    gap: vars.spacing.xs,
    flex: 1
});

export const toastTitle = style({
    fontWeight: vars.typography.fontWeightBold,
    fontSize: vars.typography.fontSizeMd,
    color: vars.colors.text
});

export const toastDescription = style({
    fontSize: vars.typography.fontSizeSm,
    color: vars.colors.textSecondary,
    lineHeight: vars.typography.lineHeightNormal
});

export const toastAction = style({
    display: 'inline-flex',
    alignItems: 'center',
    justifyContent: 'center',
    padding: `${vars.spacing.xs} ${vars.spacing.sm}`,
    fontSize: vars.typography.fontSizeSm,
    fontWeight: vars.typography.fontWeightMedium,
    borderRadius: vars.borderRadius.sm,
    border: 'none',
    cursor: 'pointer',
    transition: `all ${vars.transitions.fast}`,
    backgroundColor: vars.colors.primary,
    color: vars.colors.text,
    ':hover': {
        backgroundColor: vars.colors.primaryHover
    }
});

export const toastClose = style({
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
    }
});

export const toastIndicator = style({
    width: 20,
    height: 20,
    borderRadius: '50%',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    flexShrink: 0,
    marginTop: 2
});

export const toastProgressBar = style({
    position: 'absolute',
    bottom: 0,
    left: 0,
    height: 3,
    backgroundColor: vars.colors.primary,
    selectors: {
        '&[data-state="running"]': {
            animation: `${toastProgress} var(--toast-duration) ease-out forwards`
        }
    }
});

export const toastIcon = style({
    width: 24,
    height: 24,
    flexShrink: 0,
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center'
});

