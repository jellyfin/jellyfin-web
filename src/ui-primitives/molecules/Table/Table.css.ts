import { style } from '@vanilla-extract/css';
import { vars } from '../../../styles/tokens.css';

export const tableContainer = style({
    width: '100%',
    overflowX: 'auto'
});

export const tableStyles = style({
    width: '100%',
    borderCollapse: 'collapse',
    fontSize: vars.typography.fontSizeMd
});

export const tableHeader = style({
    textAlign: 'left',
    padding: vars.spacing.md,
    borderBottom: `1px solid ${vars.colors.divider}`,
    color: vars.colors.textSecondary,
    fontWeight: vars.typography.fontWeightMedium,
    fontSize: vars.typography.fontSizeSm,
    textTransform: 'uppercase',
    letterSpacing: '0.05em'
});

export const tableCell = style({
    padding: vars.spacing.md,
    borderBottom: `1px solid ${vars.colors.divider}`,
    color: vars.colors.text
});

export const tableRow = style({
    transition: `background-color ${vars.transitions.fast}`,
    ':hover': {
        backgroundColor: vars.colors.surfaceHover
    }
});
