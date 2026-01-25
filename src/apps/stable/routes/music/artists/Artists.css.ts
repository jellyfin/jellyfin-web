import { style } from '@vanilla-extract/css';
import { vars } from 'styles/tokens.css';

export const container = style({
    padding: vars.spacing.lg
});

export const headerRow = style({
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: vars.spacing.lg,
    flexWrap: 'wrap',
    gap: vars.spacing.md
});

export const controlsContainer = style({
    display: 'flex',
    gap: vars.spacing.md,
    alignItems: 'center'
});

export const sortControl = style({
    display: 'flex',
    alignItems: 'center',
    gap: vars.spacing.xs,
    padding: `${vars.spacing.xs} ${vars.spacing.sm}`,
    backgroundColor: vars.colors.surface,
    borderRadius: vars.borderRadius.md,
    border: `1px solid ${vars.colors.divider}`,
    color: vars.colors.text,
    ':hover': {
        borderColor: vars.colors.primary
    }
});

export const sortSelect = style({
    background: 'transparent',
    border: 'none',
    color: 'inherit',
    padding: '4px 8px',
    font: 'inherit',
    cursor: 'pointer',
    ':focus': {
        outline: 'none'
    }
});

export const viewToggleGroup = style({
    display: 'flex',
    gap: '4px'
});

export const paginationRow = style({
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: vars.spacing.md
});

export const paginationControls = style({
    display: 'flex',
    gap: vars.spacing.sm,
    alignItems: 'center'
});
