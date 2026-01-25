import { style } from '@vanilla-extract/css';
import { vars } from 'styles/tokens.css';

export const guideContainer = style({
    display: 'flex',
    flexDirection: 'column',
    height: 'calc(100vh - 200px)',
    border: `1px solid ${vars.colors.divider}`,
    borderRadius: vars.borderRadius.md,
    overflow: 'hidden',
    backgroundColor: vars.colors.surface
});

export const headerRow = style({
    display: 'flex',
    width: '100%'
});

export const headerCorner = style({
    width: 120,
    borderRight: `1px solid ${vars.colors.divider}`,
    backgroundColor: vars.colors.background
});

export const headerScroller = style({
    flex: 1,
    overflow: 'hidden'
});

export const gridBody = style({
    display: 'flex',
    flex: 1,
    overflow: 'hidden'
});

export const channelColumn = style({
    width: 120,
    flexShrink: 0,
    overflowY: 'auto',
    scrollbarWidth: 'none',
    msOverflowStyle: 'none'
});

export const programGrid = style({
    flex: 1,
    overflow: 'auto',
    position: 'relative'
});

export const gridContent = style({
    width: '100%',
    position: 'relative'
});

export const channelRow = style({
    display: 'flex',
    height: 80,
    width: '100%',
    position: 'relative'
});

export const loadingContainer = style({
    display: 'flex',
    justifyContent: 'center',
    padding: vars.spacing.lg
});
