import { style } from '@vanilla-extract/css';
import { vars } from '../../../styles/tokens.css';

export const commandDialogOverlay = style({
    position: 'fixed',
    inset: 0,
    backgroundColor: vars.colors.overlay,
    zIndex: vars.zIndex.modalBackdrop,
    animation: 'fade-in 150ms ease'
});

export const commandContent = style({
    position: 'fixed',
    top: '50%',
    left: '50%',
    transform: 'translate(-50%, -50%)',
    width: '100%',
    maxWidth: 640,
    maxHeight: '85vh',
    margin: 'auto',
    backgroundColor: vars.colors.surface,
    borderRadius: vars.borderRadius.lg,
    boxShadow: vars.shadows.xl,
    overflow: 'hidden',
    zIndex: vars.zIndex.modal,
    animation: 'scale-in 150ms ease'
});

export const commandInline = style({
    position: 'relative',
    width: '100%',
    maxWidth: 640,
    backgroundColor: vars.colors.surface,
    borderRadius: vars.borderRadius.lg,
    border: `1px solid ${vars.colors.divider}`,
    overflow: 'hidden'
});

export const commandInputContainer = style({
    display: 'flex',
    alignItems: 'center',
    padding: vars.spacing.sm,
    borderBottom: `1px solid ${vars.colors.divider}`,
    gap: vars.spacing.sm
});

export const commandSearchIcon = style({
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    color: vars.colors.textMuted,
    flexShrink: 0
});

export const commandInput = style({
    flex: 1,
    border: 'none',
    background: 'transparent',
    fontSize: vars.typography.fontSizeMd,
    color: vars.colors.text,
    outline: 'none',
    '::placeholder': {
        color: vars.colors.textMuted
    }
});

export const commandKbd = style({
    display: 'inline-flex',
    alignItems: 'center',
    justifyContent: 'center',
    padding: `${vars.spacing.xs} ${vars.spacing.sm}`,
    fontSize: vars.typography.fontSizeSm,
    fontFamily: vars.typography.fontFamilyMono,
    backgroundColor: vars.colors.surfaceHover,
    borderRadius: vars.borderRadius.sm,
    color: vars.colors.textSecondary
});

export const commandList = style({
    maxHeight: 300,
    overflow: 'auto',
    padding: vars.spacing.xs
});

export const commandEmpty = style({
    padding: vars.spacing.lg,
    textAlign: 'center',
    color: vars.colors.textSecondary,
    fontSize: vars.typography.fontSizeMd
});

export const commandGroup = style({
    paddingBottom: vars.spacing.xs
});

export const commandGroupLabel = style({
    padding: `${vars.spacing.xs} ${vars.spacing.sm}`,
    fontSize: vars.typography.fontSizeSm,
    fontWeight: vars.typography.fontWeightMedium,
    color: vars.colors.textSecondary,
    textTransform: 'uppercase',
    letterSpacing: '0.5px'
});

export const commandItem = style({
    display: 'flex',
    alignItems: 'center',
    gap: vars.spacing.sm,
    padding: `${vars.spacing.sm} ${vars.spacing.md}`,
    borderRadius: vars.borderRadius.sm,
    fontSize: vars.typography.fontSizeMd,
    color: vars.colors.text,
    cursor: 'pointer',
    transition: `all ${vars.transitions.fast}`,
    outline: 'none',
    selectors: {
        '&[data-selected="true"]': {
            backgroundColor: vars.colors.primary,
            color: vars.colors.text
        },
        '&[data-disabled="true"]': {
            opacity: 0.5,
            cursor: 'not-allowed'
        }
    }
});

export const commandItemIndicator = style({
    width: vars.spacing.md,
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    flexShrink: 0
});

export const commandSeparator = style({
    height: 1,
    backgroundColor: vars.colors.divider,
    margin: `${vars.spacing.xs} 0`
});

export const commandShortcut = style({
    marginLeft: 'auto',
    paddingLeft: vars.spacing.lg,
    fontSize: vars.typography.fontSizeSm,
    color: vars.colors.textMuted
});

export const commandLoading = style({
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    padding: vars.spacing.lg,
    color: vars.colors.textSecondary
});
