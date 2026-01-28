import { style } from '@vanilla-extract/css';
import { vars } from 'styles/tokens.css.ts';

export const switchStyles = style({
    position: 'relative',
    width: '44px',
    height: '24px',
    backgroundColor: vars.colors.surfaceHover,
    borderRadius: '12px',
    cursor: 'pointer',
    transition: `background-color ${vars.transitions.fast}`,
    border: 'none',
    selectors: {
        '&[data-state="checked"]': {
            backgroundColor: vars.colors.primary
        },
        '&:disabled': {
            opacity: 0.5,
            cursor: 'not-allowed'
        }
    }
});

export const switchThumb = style({
    position: 'absolute',
    top: '2px',
    left: '2px',
    width: '20px',
    height: '20px',
    backgroundColor: vars.colors.text,
    borderRadius: '50%',
    transition: `transform ${vars.transitions.fast}`,
    boxShadow: vars.shadows.sm,
    selectors: {
        '&[data-state="checked"]': {
            transform: 'translateX(20px)'
        }
    }
});

export const formLabel = style({
    fontSize: vars.typography['6'].fontSize,
    fontWeight: vars.typography.fontWeightMedium,
    color: vars.colors.text
});

export const formHelperText = style({
    fontSize: vars.typography['3'].fontSize,
    color: vars.colors.textSecondary
});
