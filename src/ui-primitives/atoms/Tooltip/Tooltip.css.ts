import { style } from '@vanilla-extract/css';
import { vars } from '../../../styles/tokens.css';

export const tooltipContent = style({
    padding: vars.spacing['2'] + ' ' + vars.spacing['4'],
    backgroundColor: vars.colors.surfaceHover,
    color: vars.colors.text,
    fontSize: vars.typography['3'].fontSize,
    borderRadius: vars.borderRadius.sm,
    whiteSpace: 'nowrap',
    zIndex: vars.zIndex.tooltip,
    boxShadow: vars.shadows.lg
});
