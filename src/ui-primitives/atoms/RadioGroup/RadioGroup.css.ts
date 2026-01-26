import { style } from '@vanilla-extract/css';
import { vars } from 'styles/tokens.css';

export const radioGroupRoot = style({
    display: 'flex',
    flexDirection: 'column',
    gap: vars.spacing.sm
});

export const radioGroupItem = style({
    display: 'flex',
    alignItems: 'center',
    gap: vars.spacing.sm,
    padding: `${vars.spacing.sm} ${vars.spacing.md}`,
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
    width: vars.spacing.md,
    height: vars.spacing.md,
    borderRadius: '50%',
    border: `2px solid ${vars.colors.primary}`,
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center'
});

export const radioGroupIndicatorInner = style({
    width: vars.spacing.xs,
    height: vars.spacing.xs,
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
    fontSize: vars.typography.fontSizeMd,
    color: vars.colors.text,
    flex: 1
});

export const radioGroupItemIndicator = style({
    width: vars.spacing.md,
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center'
});
