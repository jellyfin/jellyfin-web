import { style } from '@vanilla-extract/css';
import { vars } from '../../../../styles/tokens.css';

export const dialogOverlay = style({
    backgroundColor: vars.colors.overlay,
    position: 'fixed',
    inset: 0,
    animation: 'fade-in 150ms ease',
    zIndex: vars.zIndex.modalBackdrop
});

export const dialogContent = style({
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

export const dialogTitle = style({
    margin: 0,
    fontWeight: vars.typography.fontWeightBold,
    fontSize: vars.typography['7'].fontSize,
    color: vars.colors.text,
    marginBottom: vars.spacing['2']
});

export const dialogDescription = style({
    margin: `0 0 ${vars.spacing['6']}`,
    color: vars.colors.textSecondary,
    fontSize: vars.typography['3'].fontSize
});
