import { style } from '@vanilla-extract/css';
import { vars } from 'styles/tokens.css';

export const container = style({
    padding: vars.spacing.md
});

export const header = style({
    padding: `${vars.spacing.md} ${vars.spacing.md}`,
    borderBottom: `1px solid ${vars.colors.divider}`
});

export const headerRow = style({
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: vars.spacing.md,
    flexWrap: 'wrap'
});

export const buttonGroup = style({
    display: 'flex',
    alignItems: 'center',
    gap: vars.spacing.sm
});

export const buttonRow = style({
    display: 'flex',
    alignItems: 'center',
    gap: vars.spacing.xs
});

export const viewToggleGroup = style({
    display: 'flex',
    alignItems: 'center',
    gap: vars.spacing.xs
});

export const filterRow = style({
    padding: `${vars.spacing.xs} ${vars.spacing.md}`,
    backgroundColor: vars.colors.surface,
    display: 'flex',
    gap: vars.spacing.xs,
    flexWrap: 'wrap'
});

export const filterChip = style({
    padding: `${vars.spacing.xs} ${vars.spacing.sm}`,
    borderRadius: '16px',
    border: `1px solid ${vars.colors.divider}`,
    fontSize: vars.typography.fontSizeXs
});

export const errorContainer = style({
    padding: vars.spacing.lg,
    textAlign: 'center'
});

export const gridContainer = style({
    padding: vars.spacing.md
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
