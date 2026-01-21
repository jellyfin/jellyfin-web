import { style } from '@vanilla-extract/css';
import { vars } from 'styles/tokens.css';

export const grid = style({
    display: 'grid',
    gridTemplateColumns: 'repeat(1, 1fr)',
    gap: vars.spacing.md,
    '@media': {
        '(min-width: 600px)': {
            gridTemplateColumns: 'repeat(2, 1fr)',
        },
        '(min-width: 960px)': {
            gridTemplateColumns: 'repeat(4, 1fr)',
        },
        '(min-width: 1280px)': {
            gridTemplateColumns: 'repeat(3, 1fr)',
        },
    },
});
