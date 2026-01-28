import { style } from '@vanilla-extract/css';
import { vars } from 'styles/tokens.css.ts';

export const radioGroupRoot = style({
    display: 'flex',
    flexDirection: 'column',
    gap: vars.spacing['4']
});

export const radioGroupItem = style({
    display: 'flex',
    alignItems: 'center',
    gap: vars.spacing['4'],
    padding: `${vars.spacing['4']} ${vars.spacing['5']}`,
    borderRadius: vars.borderRadius.md,
    cursor: 'pointer',
    transition: vars.transitions.fast,
    outline: 'none',
    selectors: {
        '&[data-state="checked"]': {
            backgroundColor: vars.colors.surfaceHover
        },
        '&[data-disabled]': {
            opacity: 0.5,
            cursor: 'not-allowed'
        },
        '&[data-highlighted]:not([data-disabled])': {
            backgroundColor: vars.colors.surfaceHover
        }
    }
});

export const radioGroupIndicator = style({
    width: vars.spacing['5'],
    height: vars.spacing['5'],
    borderRadius: '50%',
    border: `2px solid ${vars.colors.primary}`,
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center'
});

export const radioGroupIndicatorInner = style({
    width: vars.spacing['2'],
    height: vars.spacing['2'],
    borderRadius: '50%',
    backgroundColor: vars.colors.primary,
    transform: 'scale(0)',
    transition: vars.transitions.fast,
    selectors: {
        '&[data-state="checked"]': {
            transform: 'scale(1)'
        }
    }
});

export const radioGroupLabel = style({
    fontSize: vars.typography['6'].fontSize,
    color: vars.colors.text,
    flex: 1
});

export const radioGroupItemIndicator = style({
    width: vars.spacing['5'],
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center'
});
