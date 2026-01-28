import { style } from '@vanilla-extract/css';
import { vars } from 'styles/tokens.css.ts';

export const container = style({
    marginBottom: `calc(${vars.spacing['7']} * 2)`
});

export const header = style({
    marginBottom: vars.spacing['5'],
    paddingLeft: vars.spacing['4']
});
