import { style } from '@vanilla-extract/css';
import { vars } from 'styles/tokens.css';

export const menuContent = style({
    minWidth: '240px',
    maxHeight: '400px',
    overflowY: 'auto'
});

export const header = style({
    padding: `${vars.spacing['4']} ${vars.spacing['5']}`
});

export const description = style({
    padding: `${vars.spacing['4']} ${vars.spacing['5']}`
});

export const iconSlot = style({
    width: '20px',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    color: vars.colors.textSecondary
});

export const itemContent = style({
    display: 'flex',
    flexDirection: 'column',
    gap: vars.spacing['2'],
    flex: 1
});

export const asideText = style({
    marginLeft: 'auto'
});

export const selectedItem = style({
    backgroundColor: `${vars.colors.primary}22`,
    color: vars.colors.primary
});

export const anchorTrigger = style({
    position: 'fixed',
    opacity: 0,
    pointerEvents: 'none'
});
