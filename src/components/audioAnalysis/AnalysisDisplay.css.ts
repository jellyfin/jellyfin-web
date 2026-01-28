import { style } from '@vanilla-extract/css';
import { vars } from 'styles/tokens.css.ts';

export const container = style({
    minWidth: '280px'
});

export const compactContainer = style({
    display: 'flex',
    gap: vars.spacing['2'],
    flexWrap: 'wrap',
    alignItems: 'center'
});

export const compactItem = style({
    display: 'flex',
    flexDirection: 'column',
    gap: vars.spacing['2']
});

export const section = style({
    marginBottom: vars.spacing['5']
});

export const statsGrid = style({
    display: 'grid',
    gridTemplateColumns: '1fr 1fr',
    gap: vars.spacing['5']
});

export const statItem = style({
    display: 'flex',
    flexDirection: 'column',
    gap: vars.spacing['2']
});

export const progressBar = style({
    height: '8px',
    borderRadius: '4px',
    backgroundColor: vars.colors.surface,
    overflow: 'hidden',
    marginTop: vars.spacing['2']
});

export const progressBarFill = style({
    height: '100%',
    borderRadius: '4px',
    transition: vars.transitions.fast
});

export const chip = style({
    display: 'flex',
    alignItems: 'center',
    gap: vars.spacing['2']
});
