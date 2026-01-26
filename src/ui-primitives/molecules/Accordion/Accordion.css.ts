import { style } from '@vanilla-extract/css';
import { vars } from '../styles/tokens.css';

export const accordionRoot = style({
    border: `1px solid ${vars.colors.divider}`,
    borderRadius: vars.borderRadius.md,
    overflow: 'hidden',
    marginBottom: vars.spacing.sm
});

export const accordionHeader = style({
    display: 'flex',
    alignItems: 'center',
    padding: `${vars.spacing.sm} ${vars.spacing.md}`,
    cursor: 'pointer',
    backgroundColor: vars.colors.surface,
    transition: `background-color ${vars.transitions.fast}`,
    ':hover': {
        backgroundColor: vars.colors.surfaceHover
    }
});

export const accordionContent = style({
    padding: vars.spacing.md,
    borderTop: `1px solid ${vars.colors.divider}`,
    backgroundColor: vars.colors.surface
});

export const accordionExpanded = style({
    backgroundColor: vars.colors.surfaceHover
});
