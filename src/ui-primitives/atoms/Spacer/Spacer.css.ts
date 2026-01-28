import { styleVariants } from '@vanilla-extract/css';
import { vars } from 'styles/tokens.css.ts';

export const spacerSizes = styleVariants({
    xs: { height: vars.spacing['2'] },
    sm: { height: vars.spacing['4'] },
    md: { height: vars.spacing['5'] },
    lg: { height: vars.spacing['6'] },
    xl: { height: vars.spacing['7'] },
    xxl: { height: vars.spacing['8'] }
});
