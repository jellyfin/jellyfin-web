import { style } from '@vanilla-extract/css';
import { vars } from 'styles/tokens.css.ts';

export const tableContainer = style({
    width: '100%',
    height: 'calc(100vh - 280px)',
    overflow: 'hidden',
    backgroundColor: 'transparent'
});

export const headerRow = style({
    display: 'flex',
    alignItems: 'center',
    padding: `${vars.spacing['4']} ${vars.spacing['5']}`,
    borderBottom: `1px solid ${vars.colors.divider}`,
    backgroundColor: 'rgba(0,0,0,0.4)'
});

export const tableRow = style({
    display: 'flex',
    alignItems: 'center',
    padding: `${vars.spacing['4']} ${vars.spacing['5']}`,
    borderBottom: `1px solid ${vars.colors.divider}`,
    cursor: 'pointer',
    transition: vars.transitions.fast,
    selectors: {
        '&:hover': {
            backgroundColor: 'rgba(255, 255, 255, 0.05)'
        }
    }
});

export const rowDragging = style({
    backgroundColor: 'rgba(0, 164, 220, 0.15)'
});

export const dragHandle = style({
    cursor: 'grab'
});

export const scrollContainer = style({
    height: 'calc(100% - 48px)',
    overflow: 'auto',
    selectors: {
        '&::-webkit-scrollbar': {
            width: 8
        },
        '&::-webkit-scrollbar-track': {
            backgroundColor: 'transparent'
        },
        '&::-webkit-scrollbar-thumb': {
            backgroundColor: vars.colors.textMuted,
            borderRadius: vars.borderRadius.sm
        },
        '&::-webkit-scrollbar-thumb:hover': {
            backgroundColor: vars.colors.textSecondary
        }
    }
});

export const virtualList = style({
    position: 'relative'
});

export const virtualItem = style({
    position: 'absolute',
    top: 0,
    left: 0,
    width: '100%'
});

export const hideOnSmall = style({
    display: 'none',
    '@media': {
        'screen and (min-width: 768px)': {
            display: 'block'
        }
    }
});
