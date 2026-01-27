import { style } from '@vanilla-extract/css';
import { vars } from '../../../styles/tokens.css';

export const dataTableContainerStyles = style({
    display: 'flex',
    flexDirection: 'column',
    flex: 1,
    overflow: 'hidden',
    borderRadius: vars.borderRadius.md,
    border: `1px solid ${vars.colors.divider}`,
    backgroundColor: vars.colors.surface
});

export const dataTableStyles = style({
    width: '100%',
    borderCollapse: 'collapse',
    fontSize: vars.typography.fontSizeMd
});

export const dataTableHeaderStyles = style({
    backgroundColor: vars.colors.background,
    borderBottom: `1px solid ${vars.colors.divider}`
});

export const dataTableHeaderCellStyles = style({
    padding: `${vars.spacing.sm} ${vars.spacing.md}`,
    textAlign: 'left',
    fontWeight: vars.typography.fontWeightMedium,
    color: vars.colors.textSecondary,
    fontSize: vars.typography.fontSizeSm,
    textTransform: 'uppercase',
    letterSpacing: '0.5px',
    cursor: 'pointer',
    userSelect: 'none',
    position: 'relative',
    ':hover': {
        backgroundColor: vars.colors.surfaceHover
    }
});

export const dataTableHeaderCellPinnedStyles = style({
    zIndex: 1
});

export const dataTableHeaderCellPinnedLeftStyles = style({
    position: 'sticky',
    left: 0
});

export const dataTableHeaderCellPinnedRightStyles = style({
    position: 'sticky',
    right: 0
});

export const dataTableBodyStyles = style({
    backgroundColor: vars.colors.surface
});

export const dataTableRowStyles = style({
    borderBottom: `1px solid ${vars.colors.divider}`,
    ':last-child': {
        borderBottom: 'none'
    },
    ':hover': {
        backgroundColor: vars.colors.surfaceHover
    }
});

export const dataTableRowPinnedStyles = style({
    zIndex: 0
});

export const dataTableRowPinnedLeftStyles = style({
    position: 'sticky',
    left: 0
});

export const dataTableRowPinnedRightStyles = style({
    position: 'sticky',
    right: 0
});

export const dataTableCellStyles = style({
    padding: `${vars.spacing.sm} ${vars.spacing.md}`,
    color: vars.colors.text
});

export const dataTableCellPinnedStyles = style({
    zIndex: 0
});

export const dataTableCellPinnedLeftStyles = style({
    position: 'sticky',
    left: 0
});

export const dataTableCellPinnedRightStyles = style({
    position: 'sticky',
    right: 0
});

export const dataTableEmptyStyles = style({
    padding: vars.spacing.xl,
    textAlign: 'center',
    color: vars.colors.textSecondary
});

export const dataTableLoadingStyles = style({
    padding: vars.spacing.xl,
    textAlign: 'center',
    color: vars.colors.textSecondary
});

export const dataTablePaginationStyles = style({
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: vars.spacing.sm,
    borderTop: `1px solid ${vars.colors.divider}`,
    backgroundColor: vars.colors.background
});

export const dataTableToolbarStyles = style({
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: vars.spacing.sm,
    borderBottom: `1px solid ${vars.colors.divider}`,
    backgroundColor: vars.colors.background
});

export const dataTableResizerStyles = style({
    position: 'absolute',
    right: 0,
    top: 0,
    height: '100%',
    width: '4px',
    cursor: 'col-resize',
    userSelect: 'none',
    touchAction: 'none',
    backgroundColor: 'transparent',
    ':hover': {
        backgroundColor: vars.colors.primary
    }
});

export const dataTableResizerActiveStyles = style({
    backgroundColor: vars.colors.primary
});

export const dataTableActionsCellStyles = style({
    padding: vars.spacing.xs,
    textAlign: 'center',
    width: '1%',
    whiteSpace: 'nowrap'
});
