import { style } from '@vanilla-extract/css';
import { vars } from '../../../styles/tokens.css';

export const cardStyles = style({
    backgroundColor: vars.colors.surface,
    borderRadius: vars.borderRadius.lg,
    boxShadow: vars.shadows.md,
    overflow: 'hidden'
});

export const cardPadding = style({
    padding: vars.spacing['6']
});

export const cardHeader = style({
    padding: vars.spacing['6'],
    paddingBottom: 0
});

export const cardBody = style({
    padding: vars.spacing['6']
});

export const cardFooter = style({
    padding: vars.spacing['6'],
    paddingTop: 0,
    borderTop: `1px solid ${vars.colors.divider}`,
    display: 'flex',
    gap: vars.spacing['4']
});

export const cardInteractive = style({
    cursor: 'pointer',
    transition: `all ${vars.transitions.fast}`,
    ':hover': {
        backgroundColor: vars.colors.surfaceHover,
        transform: 'translateY(-2px)',
        boxShadow: vars.shadows.lg
    }
});
