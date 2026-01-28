import { style } from '@vanilla-extract/css';
import { vars } from 'styles/tokens.css';

export const container = style({
    padding: vars.spacing['6']
});

export const headerRow = style({
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: vars.spacing['6'],
    flexWrap: 'wrap',
    gap: vars.spacing['5']
});

export const controlsContainer = style({
    display: 'flex',
    gap: vars.spacing['5'],
    alignItems: 'center'
});

export const sortControl = style({
    display: 'flex',
    alignItems: 'center',
    gap: vars.spacing['2'],
    padding: `${vars.spacing['2']} ${vars.spacing['4']}`,
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
    gap: vars.spacing['1']
});

export const paginationRow = style({
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: vars.spacing['5']
});

export const paginationControls = style({
    display: 'flex',
    gap: vars.spacing['4'],
    alignItems: 'center'
});
