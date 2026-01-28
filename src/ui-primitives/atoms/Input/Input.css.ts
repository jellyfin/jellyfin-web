import { style } from '@vanilla-extract/css';
import { vars } from '../../../styles/tokens.css';

export const inputStyles = style({
    display: 'block',
    margin: 0,
    marginBottom: '0 !important',
    fontFamily: 'inherit',
    fontWeight: 'inherit',
    padding: '0.4em 0.25em',
    fontSize: vars.typography['3'].fontSize,
    boxSizing: 'border-box',
    outline: 'none !important',
    WebkitTapHighlightColor: 'rgba(0, 0, 0, 0)',
    width: '100%',
    backgroundColor: vars.colors.surface,
    border: `1px solid ${vars.colors.divider}`,
    borderRadius: vars.borderRadius.md,
    color: vars.colors.text,
    transition: `border-color ${vars.transitions.fast}, box-shadow ${vars.transitions.fast}`,
    selectors: {
        '&:focus': {
            borderColor: vars.colors.primary,
            boxShadow: `0 0 0 2px ${vars.colors.primary}33`
        },
        '&::placeholder': {
            color: vars.colors.textMuted
        }
    }
});

export const textareaStyles = style({
    display: 'block',
    margin: 0,
    marginBottom: '0 !important',
    fontFamily: vars.typography.fontFamilyMono,
    fontWeight: 'inherit',
    padding: '0.4em 0.25em',
    fontSize: vars.typography['3'].fontSize,
    boxSizing: 'border-box',
    outline: 'none !important',
    WebkitTapHighlightColor: 'rgba(0, 0, 0, 0)',
    width: '100%',
    backgroundColor: vars.colors.surface,
    border: `1px solid ${vars.colors.divider}`,
    borderRadius: vars.borderRadius.md,
    color: vars.colors.text,
    transition: `border-color ${vars.transitions.fast}, box-shadow ${vars.transitions.fast}`,
    minHeight: '100px',
    resize: 'vertical',
    selectors: {
        '&:focus': {
            borderColor: vars.colors.primary,
            boxShadow: `0 0 0 2px ${vars.colors.primary}33`
        },
        '&::placeholder': {
            color: vars.colors.textMuted
        }
    }
});

export const inputLabel = style({
    display: 'block',
    marginBottom: '0.25em',
    fontSize: vars.typography['3'].fontSize,
    color: vars.colors.textSecondary
});

export const inputContainer = style({
    marginBottom: '1em'
});

export const inputHelperText = style({
    display: 'block',
    marginTop: '0.25em',
    fontSize: vars.typography['3'].fontSize,
    color: vars.colors.textMuted
});

export const formGroup = style({
    display: 'flex',
    flexDirection: 'column',
    gap: vars.spacing['2']
});
