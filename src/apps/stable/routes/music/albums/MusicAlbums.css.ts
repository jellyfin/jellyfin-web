import { style } from '@vanilla-extract/css';
import { vars } from 'styles/tokens.css.ts';

export const container = style({
    padding: vars.spacing['5']
});

export const header = style({
    padding: `${vars.spacing['5']} ${vars.spacing['5']}`,
    borderBottom: `1px solid ${vars.colors.divider}`
});

export const headerRow = style({
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: vars.spacing['5'],
    flexWrap: 'wrap'
});

export const buttonGroup = style({
    display: 'flex',
    alignItems: 'center',
    gap: vars.spacing['4']
});

export const buttonRow = style({
    display: 'flex',
    alignItems: 'center',
    gap: vars.spacing['2']
});

export const viewToggleGroup = style({
    display: 'flex',
    alignItems: 'center',
    gap: vars.spacing['2']
});

export const filterRow = style({
    padding: `${vars.spacing['2']} ${vars.spacing['5']}`,
    backgroundColor: vars.colors.surface,
    display: 'flex',
    gap: vars.spacing['2'],
    flexWrap: 'wrap'
});

export const filterChip = style({
    padding: `${vars.spacing['2']} ${vars.spacing['4']}`,
    borderRadius: '16px',
    border: `1px solid ${vars.colors.divider}`,
    fontSize: vars.typography['1'].fontSize
});

export const errorContainer = style({
    padding: vars.spacing['6'],
    textAlign: 'center'
});

export const gridContainer = style({
    padding: vars.spacing['5']
});

export const iconButtonGrid = style({
    display: 'grid',
    gridTemplateColumns: '1fr 1fr',
    gap: '2px'
});

export const iconButtonList = style({
    display: 'flex',
    flexDirection: 'column',
    gap: '2px'
});

export const gridIcon = style({
    width: '8px',
    height: '8px',
    backgroundColor: 'currentColor'
});

export const listIcon = style({
    width: '16px',
    height: '2px',
    backgroundColor: 'currentColor'
});

export const sortButtonContainer = style({
    position: 'relative'
});
