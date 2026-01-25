import { style } from '@vanilla-extract/css';
import { vars } from 'styles/tokens.css';

export const listItemButtonStyles = style({
    display: 'flex',
    alignItems: 'center',
    gap: vars.spacing.sm,
    padding: `${vars.spacing.sm} ${vars.spacing.md}`,
    borderRadius: vars.borderRadius.md,
    fontFamily: vars.typography.fontFamily,
    fontSize: vars.typography.fontSizeMd,
    color: vars.colors.text,
    cursor: 'pointer',
    transition: `all ${vars.transitions.fast}`,
    border: 'none',
    backgroundColor: 'transparent',
    outline: 'none',
    width: '100%',
    textAlign: 'left',
    textDecoration: 'none',
    ':hover': {
        backgroundColor: vars.colors.surfaceHover
    },
    ':focus-visible': {
        boxShadow: `0 0 0 2px ${vars.colors.background}, 0 0 0 4px ${vars.colors.primary}`
    }
});

export const listItemButtonActive = style({
    backgroundColor: vars.colors.surface,
    color: vars.colors.primary
});

export const listSubheaderStyles = style({
    padding: `${vars.spacing.sm} ${vars.spacing.md}`,
    fontSize: vars.typography.fontSizeSm,
    fontWeight: vars.typography.fontWeightBold,
    color: vars.colors.textSecondary,
    textTransform: 'uppercase',
    letterSpacing: '0.5px',
    display: 'block'
});

export const listSubheaderSticky = style({
    position: 'sticky',
    top: 0,
    backgroundColor: vars.colors.background,
    zIndex: 1
});

