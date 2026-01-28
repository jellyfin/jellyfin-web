import { style, styleVariants } from '@vanilla-extract/css';
import { vars } from 'styles/tokens.css.ts';

export const menuContent = style({
    minWidth: 180,
    backgroundColor: vars.colors.surface,
    borderRadius: vars.borderRadius.md,
    boxShadow: vars.shadows.lg,
    padding: vars.spacing['2'],
    zIndex: vars.zIndex.dropdown,
    overflow: 'hidden'
});

export const menuItem = style({
    display: 'flex',
    alignItems: 'center',
    gap: vars.spacing['4'],
    padding: `${vars.spacing['4']} ${vars.spacing['5']}`,
    borderRadius: vars.borderRadius.sm,
    fontSize: vars.typography['6'].fontSize,
    color: vars.colors.text,
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

export const menuItemVariant = styleVariants({
    default: {},
    danger: {
        color: vars.colors.error,
        selectors: {
            '&[data-highlighted]': {
                backgroundColor: `${vars.colors.error}20`
            }
        }
    }
});

export const menuSeparator = style({
    height: 1,
    backgroundColor: vars.colors.divider,
    margin: `${vars.spacing['2']} 0`
});

export const menuLabel = style({
    padding: `${vars.spacing['2']} ${vars.spacing['5']}`,
    fontSize: vars.typography['3'].fontSize,
    color: vars.colors.textSecondary,
    fontWeight: vars.typography.fontWeightMedium
});

export const menuTrigger = style({
    display: 'inline-flex',
    alignItems: 'center',
    justifyContent: 'center'
});

export const menuArrow = style({
    fill: vars.colors.surface
});

export const menuRadioGroup = style({});

export const menuRadioItem = style({
    display: 'flex',
    alignItems: 'center',
    gap: vars.spacing['4'],
    padding: `${vars.spacing['4']} ${vars.spacing['5']}`,
    borderRadius: vars.borderRadius.sm,
    fontSize: vars.typography['6'].fontSize,
    color: vars.colors.text,
    cursor: 'pointer',
    outline: 'none',
    transition: vars.transitions.fast,
    selectors: {
        '&[data-highlighted]': {
            backgroundColor: vars.colors.surfaceHover
        },
        '&[data-state="checked"]': {
            fontWeight: vars.typography.fontWeightMedium
        }
    }
});

export const menuItemIndicator = style({
    width: vars.spacing['5'],
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center'
});

export const subMenuContent = style({
    minWidth: 180,
    backgroundColor: vars.colors.surface,
    borderRadius: vars.borderRadius.md,
    boxShadow: vars.shadows.lg,
    padding: vars.spacing['2'],
    zIndex: vars.zIndex.dropdown
});

export const subMenuTrigger = style({
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: vars.spacing['5']
});

export const subMenuTriggerIndicator = style({
    color: vars.colors.textSecondary
});

export const listItemDecorator = style({
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    width: '24px',
    height: '24px',
    flexShrink: 0
});
