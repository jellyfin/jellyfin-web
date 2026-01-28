import { style } from '@vanilla-extract/css';
import { vars } from 'styles/tokens.css.ts';

export const container = style({
    display: 'flex',
    minHeight: '100vh'
});

export const header = style({
    position: 'sticky',
    top: 0,
    right: 0,
    left: 0,
    zIndex: vars.zIndex.sticky,
    backgroundColor: vars.colors.surface,
    borderBottom: `1px solid ${vars.colors.divider}`
});

export const main = style({
    width: '100%',
    flexGrow: 1,
    paddingTop: '64px',
    backgroundColor: vars.colors.background
});
