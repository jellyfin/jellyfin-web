import { style } from '@vanilla-extract/css';
import { vars } from 'styles/tokens.css';

export const container = style({
    maxWidth: '1000px',
    margin: '0 auto',
    marginTop: `calc(${vars.spacing['7'] as string} * 2)`,
    padding: vars.spacing['6']
});

export const header = style({
    marginBottom: vars.spacing['2']
});

export const helpText = style({
    marginBottom: `calc(${vars.spacing['7'] as string} * 2)`
});

export const grid = style({
    display: 'grid',
    gap: vars.spacing['6'],
    gridTemplateColumns: 'repeat(1, 1fr)',
    '@media': {
        '(min-width: 600px)': {
            gridTemplateColumns: 'repeat(2, 1fr)'
        },
        '(min-width: 960px)': {
            gridTemplateColumns: 'repeat(3, 1fr)'
        }
    }
});

export const buttonRow = style({
    marginTop: `calc(${vars.spacing['7'] as string} * 3)`,
    display: 'flex',
    justifyContent: 'flex-end'
});
