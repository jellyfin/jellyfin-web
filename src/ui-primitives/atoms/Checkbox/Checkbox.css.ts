import { keyframes, style } from '@vanilla-extract/css';
import { vars } from '../../../styles/tokens.css';

export const checkAnimation = keyframes({
    '0%': { transform: 'scale(0)', opacity: 0 },
    '100%': { transform: 'scale(1)', opacity: 1 }
});

export const checkboxContainer = style({
    display: 'flex',
    alignItems: 'center',
    gap: '8px',
    cursor: 'pointer',
    padding: '4px 0'
});

export const checkboxInput = style({
    appearance: 'none',
    width: '18px',
    height: '18px',
    minWidth: '18px',
    border: `2px solid ${vars.colors.textSecondary}`,
    borderRadius: vars.borderRadius.sm,
    backgroundColor: 'transparent',
    cursor: 'pointer',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    position: 'relative',
    transition: `all ${vars.transitions.fast}`,
    ':checked': {
        backgroundColor: vars.colors.primary,
        borderColor: vars.colors.primary
    },
    ':focus': {
        outline: 'none',
        boxShadow: `0 0 0 2px ${vars.colors.primary}33`
    },
    '::after': {
        content: '""',
        width: '10px',
        height: '10px',
        backgroundColor: vars.colors.text,
        borderRadius: '2px',
        opacity: 0,
        transform: 'scale(0)',
        transition: `all ${vars.transitions.fast}`
    },
    selectors: {
        '&:checked::after': {
            opacity: 1,
            transform: 'scale(1)'
        }
    }
});

export const checkboxLabel = style({
    fontSize: vars.typography.fontSizeMd,
    color: vars.colors.text,
    cursor: 'pointer',
    userSelect: 'none'
});
