import { style } from '@vanilla-extract/css';
import { vars } from 'styles/tokens.css';

export const controlContainer = style({
    display: 'flex',
    flexDirection: 'row',
    alignItems: 'center',
    gap: vars.spacing.xs,
});

export const labelContainer = style({
    display: 'flex',
    alignItems: 'center',
    gap: vars.spacing.xs / 2,
});

export const label = style({
    cursor: 'pointer',
});
