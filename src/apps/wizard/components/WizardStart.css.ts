import { style } from '@vanilla-extract/css';
import { vars } from 'styles/tokens.css.ts';

export const container = style({
    maxWidth: '600px',
    margin: '0 auto',
    marginTop: `calc(${vars.spacing['7'] as string} * 2)`,
    padding: vars.spacing['6']
});

export const title = style({
    marginBottom: vars.spacing['2']
});

export const helpText = style({
    marginBottom: vars.spacing['6']
});

export const formStack = style({
    display: 'flex',
    flexDirection: 'column',
    gap: vars.spacing['5']
});

export const submitButton = style({
    marginTop: vars.spacing['4']
});
