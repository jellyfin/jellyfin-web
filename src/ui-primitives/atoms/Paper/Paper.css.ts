import { style, styleVariants } from '@vanilla-extract/css';
import { vars } from 'styles/tokens.css.ts';

export const paperStyles = style({
    backgroundColor: vars.colors.surface,
    borderRadius: vars.borderRadius.md,
    boxShadow: vars.shadows.md
});

export const paperElevation = styleVariants({
    none: {
        boxShadow: 'none'
    },
    sm: {
        boxShadow: vars.shadows.sm
    },
    md: {
        boxShadow: vars.shadows.md
    },
    lg: {
        boxShadow: vars.shadows.lg
    }
});
