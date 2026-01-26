import { style } from '@vanilla-extract/css';
import { vars } from '../styles/tokens.css';

export const selectTrigger = style({
    display: 'inline-flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: vars.spacing.sm,
    padding: `${vars.spacing.sm} ${vars.spacing.md}`,
    fontSize: vars.typography.fontSizeMd,
    fontFamily: vars.typography.fontFamily,
    color: vars.colors.text,
    backgroundColor: vars.colors.surface,
    border: `1px solid ${vars.colors.divider}`,
    borderRadius: vars.borderRadius.md,
    cursor: 'pointer',
    outline: 'none',
    transition: `border-color ${vars.transitions.fast}, box-shadow ${vars.transitions.fast}`,
    ':focus': {
        borderColor: vars.colors.primary,
        boxShadow: `0 0 0 2px ${vars.colors.primary}33`
    },
    ':disabled': {
        opacity: 0.5,
        cursor: 'not-allowed'
    }
});

export const selectContent = style({
    overflow: 'hidden',
    backgroundColor: vars.colors.surface,
    borderRadius: vars.borderRadius.md,
    boxShadow: vars.shadows.lg,
    border: `1px solid ${vars.colors.divider}`,
    zIndex: vars.zIndex.dropdown,
    maxHeight: 'var(--radix-select-content-available-height)',
    minWidth: 'var(--radix-select-trigger-width)'
});

export const selectViewport = style({
    padding: vars.spacing.xs
});

export const selectItem = style({
    display: 'flex',
    alignItems: 'center',
    gap: vars.spacing.sm,
    padding: `${vars.spacing.sm} ${vars.spacing.md}`,
    fontSize: vars.typography.fontSizeMd,
    color: vars.colors.text,
    borderRadius: vars.borderRadius.sm,
    cursor: 'pointer',
    outline: 'none',
    transition: vars.transitions.fast,
    selectors: {
        '&[data-highlighted]': {
            backgroundColor: vars.colors.surfaceHover
        },
        '&[data-disabled]': {
            color: vars.colors.textMuted,
            cursor: 'not-allowed'
        }
    }
});

export const selectItemIndicator = style({
    width: vars.spacing.md,
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center'
});

export const selectLabel = style({
    padding: `${vars.spacing.xs} ${vars.spacing.md}`,
    fontSize: vars.typography.fontSizeSm,
    color: vars.colors.textSecondary,
    fontWeight: vars.typography.fontWeightMedium
});

export const selectSeparator = style({
    height: 1,
    backgroundColor: vars.colors.divider,
    margin: `${vars.spacing.xs} 0`
});

export const selectScrollButton = style({
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    height: vars.spacing.md,
    backgroundColor: vars.colors.surface,
    color: vars.colors.text,
    cursor: 'default'
});

export const selectInputStyles = style({
    display: 'block',
    width: '100%',
    padding: `${vars.spacing.sm} ${vars.spacing.md}`,
    fontSize: vars.typography.fontSizeMd,
    fontFamily: vars.typography.fontFamily,
    color: vars.colors.text,
    backgroundColor: vars.colors.surface,
    border: `1px solid ${vars.colors.divider}`,
    borderRadius: vars.borderRadius.md,
    cursor: 'pointer',
    outline: 'none',
    transition: `border-color ${vars.transitions.fast}, box-shadow ${vars.transitions.fast}`,
    ':focus': {
        borderColor: vars.colors.primary,
        boxShadow: `0 0 0 2px ${vars.colors.primary}33`
    }
});

export const selectInputContainer = style({
    marginBottom: vars.spacing.md
});

export const selectInputLabel = style({
    display: 'block',
    marginBottom: '6px',
    fontSize: vars.typography.fontSizeSm,
    color: vars.colors.textSecondary,
    fontWeight: vars.typography.fontWeightMedium
});

export const selectInputHelper = style({
    marginTop: '4px',
    fontSize: vars.typography.fontSizeSm,
    color: vars.colors.textMuted
});
