import { style } from '@vanilla-extract/css';
import { vars } from 'styles/tokens.css';

export const container = style({
    maxWidth: '600px',
    margin: '0 auto',
    marginTop: `calc(${vars.spacing.xl as string} * 2)`,
    padding: vars.spacing.lg
});

export const title = style({
    marginBottom: vars.spacing.xs
});

export const helpText = style({
    marginBottom: vars.spacing.lg
});

export const formStack = style({
    display: 'flex',
    flexDirection: 'column',
    gap: vars.spacing.md
});

export const submitButton = style({
    marginTop: vars.spacing.sm
});
