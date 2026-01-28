import { style } from '@vanilla-extract/css';
import { vars } from 'styles/tokens.css.ts';

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
    padding: vars.spacing['6'],
    zIndex: vars.zIndex.modal,
    animation: 'scale-in 150ms ease'
});

export const dialogTitleStyles = style({
    margin: 0,
    fontWeight: vars.typography.fontWeightBold,
    fontSize: vars.typography['8'].fontSize,
    color: vars.colors.text
});

export const DialogDescription = style({
    margin: `${vars.spacing['4']} 0 ${vars.spacing['6']}`,
    color: vars.colors.textSecondary,
    fontSize: vars.typography['6'].fontSize
});

export const DialogClose = style({
    position: 'absolute',
    top: vars.spacing['5'],
    right: vars.spacing['5'],
    background: 'none',
    border: 'none',
    color: vars.colors.textMuted,
    cursor: 'pointer',
    padding: vars.spacing['2'],
    borderRadius: vars.borderRadius.sm,
    ':hover': {
        color: vars.colors.text,
        backgroundColor: vars.colors.surfaceHover
    }
});
