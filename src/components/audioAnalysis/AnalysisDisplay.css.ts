import { style } from '@vanilla-extract/css';
import { vars } from 'styles/tokens.css';

export const container = style({
    minWidth: '280px',
});

export const compactContainer = style({
    display: 'flex',
    gap: vars.spacing.xs,
    flexWrap: 'wrap',
    alignItems: 'center',
});

export const compactItem = style({
    display: 'flex',
    flexDirection: 'column',
    gap: vars.spacing.xs,
});

export const section = style({
    marginBottom: vars.spacing.md,
});

export const statsGrid = style({
    display: 'grid',
    gridTemplateColumns: '1fr 1fr',
    gap: vars.spacing.md,
});

export const statItem = style({
    display: 'flex',
    flexDirection: 'column',
    gap: vars.spacing.xs,
});

export const progressBar = style({
    height: '8px',
    borderRadius: '4px',
    backgroundColor: vars.colors.surface,
    overflow: 'hidden',
    marginTop: vars.spacing.xs,
});

export const progressBarFill = style({
    height: '100%',
    borderRadius: '4px',
    transition: vars.transitions.fast,
});

export const chip = style({
    display: 'flex',
    alignItems: 'center',
    gap: vars.spacing.xs,
});
