import { style } from '@vanilla-extract/css';
import { vars } from 'styles/tokens.css.ts';

export const container = style({
    padding: vars.spacing['6']
});

export const headerRow = style({
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: vars.spacing['6'],
    flexWrap: 'wrap',
    gap: vars.spacing['5']
});

export const headerControls = style({
    display: 'flex',
    gap: vars.spacing['2'],
    alignItems: 'center'
});

export const paginationRow = style({
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: vars.spacing['5']
});

export const paginationControls = style({
    display: 'flex',
    gap: vars.spacing['2'],
    alignItems: 'center'
});
