import { style } from '@vanilla-extract/css';
import { vars } from 'styles/tokens.css';

export const loadingContainer = style({
    display: 'flex',
    justifyContent: 'center',
    padding: `calc(${vars.spacing['7']} * 4)`
});

export const container = style({
    display: 'flex',
    flexDirection: 'column',
    gap: vars.spacing['6']
});
