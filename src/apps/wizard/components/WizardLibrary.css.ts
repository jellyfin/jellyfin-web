import { style } from '@vanilla-extract/css';
import { vars } from 'styles/tokens.css';

export const container = style({
    maxWidth: '1000px',
    margin: '0 auto',
    marginTop: vars.spacing.xl * 2,
    padding: vars.spacing.lg,
});

export const header = style({
    marginBottom: vars.spacing.xs,
});

export const helpText = style({
    marginBottom: vars.spacing.xl * 2,
});

export const grid = style({
    display: 'grid',
    gap: vars.spacing.lg,
    gridTemplateColumns: 'repeat(1, 1fr)',
    '@media': {
        '(min-width: 600px)': {
            gridTemplateColumns: 'repeat(2, 1fr)',
        },
        '(min-width: 960px)': {
            gridTemplateColumns: 'repeat(3, 1fr)',
        },
    },
});

export const buttonRow = style({
    marginTop: vars.spacing.xl * 3,
    display: 'flex',
    justifyContent: 'flex-end',
});
