import { style } from '@vanilla-extract/css';
import { vars } from 'styles/tokens.css';

export const overlay = style({
    backgroundColor: vars.colors.overlay,
    position: 'fixed',
    inset: 0,
    zIndex: vars.zIndex.modalBackdrop
});

export const content = style({
    backgroundColor: vars.colors.surface,
    borderRadius: vars.borderRadius.lg,
    boxShadow: vars.shadows.xl,
    position: 'fixed',
    top: '50%',
    left: '50%',
    transform: 'translate(-50%, -50%)',
    minWidth: '320px',
    maxWidth: '90vw',
    maxHeight: '85vh',
    overflow: 'auto',
    padding: vars.spacing.lg,
    zIndex: vars.zIndex.modal
});

export const title = style({
    margin: 0,
    marginBottom: vars.spacing.md,
    fontWeight: vars.typography.fontWeightBold,
    fontSize: vars.typography.fontSizeXl,
    color: vars.colors.text
});

export const footer = style({
    marginTop: vars.spacing.lg,
    display: 'flex',
    justifyContent: 'flex-end',
    gap: vars.spacing.sm
});
