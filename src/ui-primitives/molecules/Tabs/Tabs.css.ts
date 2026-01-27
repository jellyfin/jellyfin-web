import { style } from '@vanilla-extract/css';
import { vars } from '../../../styles/tokens.css';

export const tabsList = style({
    display: 'flex',
    gap: vars.spacing.xs,
    borderBottom: `1px solid ${vars.colors.divider}`,
    paddingBottom: vars.spacing.xs
});

export const tabTrigger = style({
    padding: `${vars.spacing.sm} ${vars.spacing.md}`,
    borderRadius: vars.borderRadius.md,
    border: 'none',
    backgroundColor: 'transparent',
    color: vars.colors.textSecondary,
    fontFamily: vars.typography.fontFamily,
    fontSize: vars.typography.fontSizeMd,
    fontWeight: vars.typography.fontWeightMedium,
    cursor: 'pointer',
    transition: `all ${vars.transitions.fast}`,
    display: 'flex',
    alignItems: 'center',
    gap: vars.spacing.sm,
    ':hover': {
        backgroundColor: vars.colors.surfaceHover,
        color: vars.colors.text
    },
    selectors: {
        '&[data-state="active"]': {
            backgroundColor: vars.colors.primary,
            color: vars.colors.text
        },
        '&:focus-visible': {
            outline: `2px solid ${vars.colors.primary}`,
            outlineOffset: '2px'
        }
    }
});

export const tabContent = style({
    padding: vars.spacing.md
});
