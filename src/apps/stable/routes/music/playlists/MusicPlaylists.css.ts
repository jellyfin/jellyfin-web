import { style } from '@vanilla-extract/css';
import { vars } from 'styles/tokens.css';

export const container = style({
    padding: vars.spacing.lg,
});

export const headerRow = style({
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: vars.spacing.lg,
    flexWrap: 'wrap',
    gap: vars.spacing.md,
});

export const headerControls = style({
    display: 'flex',
    gap: vars.spacing.xs,
    alignItems: 'center',
});

export const paginationRow = style({
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: vars.spacing.md,
});

export const paginationControls = style({
    display: 'flex',
    gap: vars.spacing.xs,
    alignItems: 'center',
});
