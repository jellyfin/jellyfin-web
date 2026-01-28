import { style } from '@vanilla-extract/css';
import { vars } from 'styles/tokens.css.ts';

export const listItemButtonStyles = style({
    display: 'flex',
    alignItems: 'center',
    gap: vars.spacing['4'],
    padding: `${vars.spacing['4']} ${vars.spacing['5']}`,
    borderRadius: vars.borderRadius.md,
    fontFamily: vars.typography.fontFamily,
    fontSize: vars.typography['6'].fontSize,
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
    padding: `${vars.spacing['4']} ${vars.spacing['5']}`,
    fontSize: vars.typography['3'].fontSize,
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
