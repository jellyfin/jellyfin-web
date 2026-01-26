import { style } from '@vanilla-extract/css';
import { vars } from '../styles/tokens.css';

export const DialogOverlay = style({
    backgroundColor: vars.colors.overlay,
    position: 'fixed',
    inset: 0,
    animation: 'fade-in 150ms ease',
    zIndex: vars.zIndex.modalBackdrop
});

export const DialogContent = style({
    backgroundColor: vars.colors.surface,
    borderRadius: vars.borderRadius.lg,
    boxShadow: vars.shadows.xl,
    position: 'fixed',
    top: '50%',
    left: '50%',
    transform: 'translate(-50%, -50%)',
    maxWidth: '500px',
    width: '90%',
    maxHeight: '85vh',
    overflow: 'auto',
    padding: vars.spacing.lg,
    zIndex: vars.zIndex.modal,
    animation: 'scale-in 150ms ease'
});

export const dialogTitleStyles = style({
    margin: 0,
    fontWeight: vars.typography.fontWeightBold,
    fontSize: vars.typography.fontSizeXl,
    color: vars.colors.text
});

export const DialogDescription = style({
    margin: `${vars.spacing.sm} 0 ${vars.spacing.lg}`,
    color: vars.colors.textSecondary,
    fontSize: vars.typography.fontSizeMd
});

export const DialogClose = style({
    position: 'absolute',
    top: vars.spacing.md,
    right: vars.spacing.md,
    background: 'none',
    border: 'none',
    color: vars.colors.textMuted,
    cursor: 'pointer',
    padding: vars.spacing.xs,
    borderRadius: vars.borderRadius.sm,
    ':hover': {
        color: vars.colors.text,
        backgroundColor: vars.colors.surfaceHover
    }
});
