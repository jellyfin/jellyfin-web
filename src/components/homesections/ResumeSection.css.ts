import { style } from '@vanilla-extract/css';
import { vars } from 'styles/tokens.css';

export const container = style({
    marginBottom: `${vars.spacing.xl} * 2`
});

export const header = style({
    marginBottom: vars.spacing.md,
    paddingLeft: vars.spacing.sm
});
