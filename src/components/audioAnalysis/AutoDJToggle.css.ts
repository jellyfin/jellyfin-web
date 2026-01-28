import { style } from '@vanilla-extract/css';
import { vars } from 'styles/tokens.css.ts';

export const controlContainer = style({
    display: 'flex',
    flexDirection: 'row',
    alignItems: 'center',
    gap: vars.spacing['2']
});

export const labelContainer = style({
    display: 'flex',
    alignItems: 'center',
    gap: `calc(${vars.spacing['2']} / 2)`
});

export const label = style({
    cursor: 'pointer'
});
