import { style } from '@vanilla-extract/css';
import { vars } from './tokens.css.ts';

export const detailTable = style({
    borderCollapse: 'collapse',
    borderSpacing: 0,
    textAlign: 'left',
    width: '100%',
    margin: '0 auto'
});

export const detailTableHeaderCell = style({
    fontWeight: vars.typography.fontWeightBold,
    textAlign: 'left',
    verticalAlign: 'top',
    padding: vars.spacing['4']
});

export const detailTableBodyCell = style({
    borderSpacing: 0,
    padding: vars.spacing['4']
});
