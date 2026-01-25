import { style } from '@vanilla-extract/css';
import { vars } from '../styles/tokens.css';

export const tooltipContent = style({
    padding: vars.spacing.xs + ' ' + vars.spacing.sm,
    backgroundColor: vars.colors.surfaceHover,
    color: vars.colors.text,
    fontSize: vars.typography.fontSizeSm,
    borderRadius: vars.borderRadius.sm,
    whiteSpace: 'nowrap',
    zIndex: vars.zIndex.tooltip,
    boxShadow: vars.shadows.lg
});

